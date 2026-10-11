import { useEffect, useMemo, useState } from "react";
import { Upload, Download, Loader2 } from "lucide-react";
import { categories } from "../../data/categories";
import { adminFetchVehicles, adminSaveVehicle, clearVehiclesCache } from "../../data/vehicles";
import { parseImport, mergeWithExisting, CSV_TEMPLATE } from "../../lib/vehicleImport";

const JSON_EXAMPLE = `[
  {
    "slug": "bmw-m5-f90",
    "category": "legkovoy",
    "name": "BMW M5 F90",
    "tags": ["brand-bmw"],
    "colors": [
      { "id": "white", "name": "Белый", "hex": "#FFFFFF" },
      { "id": "duo", "name": "Двухцветный", "hexes": ["#111111", "#222222"], "accentHex": "#FF0000" }
    ]
  }
]`;

const SLUGS = categories.map((c) => c.slug);

export default function VehicleImport() {
  const [text, setText] = useState("");
  const [existing, setExisting] = useState(null); // Map slug → машина
  const [loadError, setLoadError] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminFetchVehicles(true)
      .then((rows) => {
        if (!cancelled) setExisting(new Map(rows.map((v) => [v.slug, v])));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = useMemo(() => parseImport(text, SLUGS), [text]);
  const isExisting = (slug) => Boolean(existing?.has(slug));
  const toWrite = parsed.vehicles.filter((v) => overwrite || !isExisting(v.slug));
  const skipped = parsed.vehicles.length - toWrite.length;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    setText(await file.text());
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (toWrite.length === 0) return;
    const overwriteCount = toWrite.filter((v) => isExisting(v.slug)).length;
    const question =
      `Загрузить машин: ${toWrite.length}` +
      (overwriteCount > 0 ? ` (из них ${overwriteCount} перезапишут существующие)` : "") +
      "?";
    if (!confirm(question)) return;

    setRunning(true);
    setResult(null);
    const failed = [];
    let done = 0;
    // по одной машине за запрос: так журнал сохраняет «было / стало» для отката
    for (const vehicle of toWrite) {
      setProgress(`${done + 1} из ${toWrite.length}: ${vehicle.name}`);
      try {
        const old = existing?.get(vehicle.slug);
        await adminSaveVehicle(old ? mergeWithExisting(vehicle, old) : vehicle);
        done += 1;
      } catch (err) {
        failed.push(`${vehicle.name}: ${err.message}`);
      }
    }
    clearVehiclesCache();
    try {
      const fresh = await adminFetchVehicles(true);
      setExisting(new Map(fresh.map((v) => [v.slug, v])));
    } catch {
      // список обновится при следующем заходе
    }
    setProgress("");
    setResult({ done, failed });
    setRunning(false);
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-ink mb-1">Массовый импорт машин</h1>
      <p className="font-body text-xs text-mute mb-6 max-w-2xl">
        Вставь JSON или CSV (можно прямо из Excel, разделитель «;» или «,») либо выбери файл. Сначала
        покажем, что получится, и только потом запишем. Фото обложек и скриншотов цветов можно добавить
        позже в «Редактировать машины» — или указать ссылками.
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors">
          <Upload size={13} />
          Выбрать файл (.json, .csv, .txt)
          <input type="file" accept=".json,.csv,.txt,text/csv,application/json,text/plain" className="sr-only" onChange={handleFile} />
        </label>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-ink hover:border-signal/50 hover:text-signal transition-colors"
        >
          <Download size={13} />
          Шаблон CSV
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        rows={10}
        spellCheck={false}
        placeholder="Вставь сюда JSON или CSV…"
        className="w-full bg-raised border border-hair rounded-md px-3 py-2 font-mono text-xs text-ink placeholder:text-mute focus:outline-none focus:border-signal/50 mb-3"
      />

      <details className="mb-6 border border-hair rounded-md bg-panel">
        <summary className="cursor-pointer select-none px-4 py-2.5 font-body text-sm text-ink hover:text-signal transition-colors">
          Формат данных
        </summary>
        <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="font-body text-xs text-mute leading-relaxed">
            <b className="text-ink">CSV</b>: одна строка — один цвет. Колонки: <code className="font-mono">slug, category, name, tags,
            image, color_id, color_name, hex, hex2, accent, color_image</code>. Обязательны category, color_name, hex
            и name (или slug). Строки с одинаковым slug собираются в одну машину; теги через «|».
            Категории: <code className="font-mono">{SLUGS.join(", ")}</code>.
          </p>
          <pre className="font-mono text-[11px] text-ink bg-raised2 border border-hair rounded p-3 overflow-auto">{JSON_EXAMPLE}</pre>
        </div>
      </details>

      {loadError && <p className="font-body text-sm text-amber mb-4">Не удалось загрузить каталог для сверки: {loadError}</p>}

      {text.trim() && (
        <div className="border border-hair rounded-lg bg-panel p-5 mb-4">
          <h2 className="font-display text-lg tracking-wide text-ink mb-3">Что получилось</h2>

          {parsed.errors.length > 0 && (
            <div className="mb-4">
              <p className="font-body text-sm text-amber mb-1">Ошибок: {parsed.errors.length} (эти машины не попадут в импорт)</p>
              <ul className="list-disc pl-5 font-body text-xs text-amber flex flex-col gap-0.5 max-h-48 overflow-auto chip-scroll">
                {parsed.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.vehicles.length > 0 ? (
            <>
              <div className="flex flex-col gap-1 max-h-72 overflow-auto chip-scroll mb-3">
                {parsed.vehicles.map((v) => {
                  const exists = isExisting(v.slug);
                  const skip = exists && !overwrite;
                  return (
                    <div key={v.slug} className={`flex items-center justify-between gap-3 rounded border border-hair bg-raised px-3 py-2 ${skip ? "opacity-50" : ""}`}>
                      <span className="min-w-0">
                        <span className="block font-body text-sm text-ink truncate">{v.name}</span>
                        <span className="block font-mono text-[11px] text-mute truncate">
                          {v.slug} · {v.category} · цветов: {v.colors.length}
                        </span>
                      </span>
                      <span className={`font-mono text-[11px] shrink-0 ${exists ? "text-amber" : "text-signal"}`}>
                        {exists ? (overwrite ? "перезапишет" : "уже есть — пропуск") : "новая"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 font-body text-xs text-mute mb-4">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                Перезаписывать существующие машины (обложка, фото цветов и теги, которых нет в файле, сохранятся)
              </label>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={running || toWrite.length === 0 || existing === null}
                  className="flex items-center gap-2 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-5 py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50"
                >
                  {running && <Loader2 size={15} className="animate-spin" />}
                  Загрузить: {toWrite.length}
                </button>
                {skipped > 0 && <span className="font-body text-xs text-mute">Пропущено существующих: {skipped}</span>}
                {progress && <span className="font-body text-xs text-signal">{progress}</span>}
              </div>
            </>
          ) : (
            parsed.errors.length === 0 && <p className="font-body text-sm text-mute">Ничего не распознано.</p>
          )}
        </div>
      )}

      {result && (
        <div className="border border-hair rounded-lg bg-panel p-5">
          <p className="font-body text-sm text-signal">Загружено машин: {result.done}.</p>
          {result.failed.length > 0 && (
            <>
              <p className="font-body text-sm text-amber mt-2">Не удалось: {result.failed.length}</p>
              <ul className="list-disc pl-5 font-body text-xs text-amber mt-1">
                {result.failed.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
