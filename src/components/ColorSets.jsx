import { useState } from "react";
import { Bookmark, Copy, Check, Trash2, FolderOpen } from "lucide-react";
import { getVehicle, getColorHexes } from "../data/vehicles";
import { swatchBackground } from "../lib/color";
import { encodeCompare } from "../lib/compare";
import { addSet, removeSet, readSets, writeSets, MAX_NAME } from "../lib/colorSets";

// Свои наборы цветов: сохранить текущее сравнение под названием, открыть позже
// или отправить ссылкой. Хранится в этом браузере.
export default function ColorSets({ refs, vehicles, onLoad }) {
  const [sets, setSets] = useState(readSets);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");

  function save() {
    const result = addSet(sets, name, refs);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setSets(result.sets);
    writeSets(result.sets);
    setName("");
    setMessage("Набор сохранён.");
  }

  function remove(id) {
    const next = removeSet(sets, id);
    setSets(next);
    writeSets(next);
  }

  async function copyLink(set) {
    const url = `${window.location.origin}/compare?c=${encodeCompare(set.items)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(set.id);
      setTimeout(() => setCopiedId((c) => (c === set.id ? "" : c)), 1500);
    } catch {
      // буфер обмена недоступен
    }
  }

  function swatchFor(item) {
    const color = getVehicle(vehicles, item.slug)?.colors?.find((c) => c.id === item.colorId);
    return color ? swatchBackground(getColorHexes(color)) : null;
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wide text-ink mb-2 flex items-center gap-2">
        <Bookmark size={20} className="text-signal" />
        Мои наборы
      </h2>
      <p className="font-body text-sm text-mute mb-4 max-w-xl">
        Сохрани подборку из сравнения под своим названием, например «цвета для моей фракции». Наборы лежат
        в этом браузере, а поделиться ими можно ссылкой.
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          maxLength={MAX_NAME}
          placeholder="Название набора"
          aria-label="Название набора"
          className="w-64 max-w-full bg-raised border border-hair rounded-md px-3 py-2 font-body text-sm text-ink placeholder:text-mute focus:outline-none focus:border-signal/50"
        />
        <button
          type="button"
          onClick={save}
          disabled={refs.length === 0 || !name.trim()}
          className="rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors disabled:opacity-50"
        >
          Сохранить текущее ({refs.length})
        </button>
      </div>
      {message && <p className="font-body text-xs text-mute mb-3">{message}</p>}
      {refs.length === 0 && (
        <p className="font-body text-xs text-mute mb-3">Сначала добавь цвета в сравнение, потом сохраняй набор.</p>
      )}

      {sets.length === 0 ? (
        <p className="font-body text-sm text-mute">Сохранённых наборов пока нет.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sets.map((set) => (
            <div key={set.id} className="flex items-center gap-3 rounded-lg border border-hair bg-panel px-4 py-3 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                {set.items.map((item) => {
                  const bg = swatchFor(item);
                  return (
                    <span
                      key={`${item.slug}:${item.colorId}`}
                      title={bg ? `${item.slug}: ${item.colorId}` : "Эту окраску удалили из каталога"}
                      className={`w-6 h-6 rounded border ${bg ? "border-hair" : "border-dashed border-mute"}`}
                      style={bg ? { background: bg } : undefined}
                    />
                  );
                })}
              </div>
              <span className="font-display text-base tracking-wide text-ink flex-1 min-w-[8rem] truncate">{set.name}</span>
              <button
                type="button"
                onClick={() => onLoad(set.items)}
                className="flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors"
              >
                <FolderOpen size={13} />
                Открыть
              </button>
              <button
                type="button"
                onClick={() => copyLink(set)}
                className="flex items-center gap-1.5 font-body text-xs text-mute hover:text-signal transition-colors"
              >
                {copiedId === set.id ? <Check size={13} className="text-signal" /> : <Copy size={13} />}
                {copiedId === set.id ? "Скопировано" : "Ссылка"}
              </button>
              <button
                type="button"
                onClick={() => remove(set.id)}
                aria-label={`Удалить набор ${set.name}`}
                className="text-mute hover:text-amber transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
