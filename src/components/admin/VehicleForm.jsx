import { useState } from "react";
import { Plus, Check, Loader2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { categories } from "../../data/categories";
import { useTagsContext } from "../../context/TagsContext";
import { adminSaveVehicle, adminFetchVehicles, clearVehiclesCache } from "../../data/vehicles";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { sanitizeSlug, nextUid, isValidHex } from "../../lib/textUtils";
import ImageUploadField from "./ImageUploadField";
import ColorRow from "./ColorRow";

function colorToRow(c) {
  return {
    uid: nextUid(),
    idManual: true,
    id: c.id,
    name: c.name,
    twoTone: Boolean(c.hexes),
    hex1: c.hexes ? c.hexes[0] : c.hex || "",
    hex2: c.hexes ? c.hexes[1] || "" : "",
    hasAccent: Boolean(c.accentHex),
    accentHex: c.accentHex || "",
    image: { url: c.image || "", blob: null },
  };
}

function emptyColorRow() {
  return {
    uid: nextUid(),
    idManual: false,
    id: "",
    name: "",
    twoTone: false,
    hex1: "#8FB6D9",
    hex2: "",
    hasAccent: false,
    accentHex: "",
    image: { url: "", blob: null },
  };
}

// Возвращает текст ошибки или "" если всё хорошо.
function validateColors(colors) {
  const ids = colors.map((c) => sanitizeSlug(c.id, "color"));

  // Фото цвета кладётся в Cloudinary под public_id = id цвета с overwrite,
  // поэтому одинаковые id (или "main" — обложка) затирают чужие фото.
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) return `ID цвета «${dup}» повторяется — у каждого цвета ID должен быть уникальным, иначе фото затрут друг друга.`;
  if (ids.includes("main")) return "ID «main» зарезервирован под обложку машины — переименуй цвет.";

  for (const c of colors) {
    const label = c.name.trim() || c.id;
    if (!isValidHex(c.hex1)) return `Цвет «${label}»: Hex 1 должен быть вида #RRGGBB.`;
    if (c.twoTone && !isValidHex(c.hex2)) return `Цвет «${label}»: Hex 2 должен быть вида #RRGGBB.`;
    if (c.hasAccent && !isValidHex(c.accentHex)) return `Цвет «${label}»: Hex вставок должен быть вида #RRGGBB.`;
  }
  return "";
}

// initial — существующая машина (режим редактирования) или null (создание).
// asCopy — initial используется как заготовка для НОВОЙ машины («Копировать»):
// имя получает пометку «(копия)», slug придумывается заново, всё остальное
// (цвета, теги, ссылки на фото) переносится.
export default function VehicleForm({ initial, asCopy = false, onSaved }) {
  const isEdit = Boolean(initial) && !asCopy;
  const { tags: allTags, tagGroups, loading: tagsLoading } = useTagsContext();

  const initialName = asCopy ? `${initial.name} (копия)` : initial?.name || "";
  const initialSlug = asCopy ? sanitizeSlug(initialName, "") : initial?.slug || "";

  const [category, setCategory] = useState(initial?.category || categories[0]?.slug || "");
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugManual, setSlugManual] = useState(isEdit);
  const [mainImage, setMainImage] = useState({ url: initial?.image || "", blob: null });
  const [colors, setColors] = useState(
    initial?.colors?.length ? initial.colors.map(colorToRow) : [emptyColorRow()]
  );
  const [selectedTags, setSelectedTags] = useState(new Set(initial?.tags || []));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState(false);

  // перетаскивание цветов: «armed» — строка, за ручку которой взялись
  const [armedUid, setArmedUid] = useState(null);
  const [dragUid, setDragUid] = useState(null);
  const [overUid, setOverUid] = useState(null);

  function fail(message) {
    setStatusError(true);
    setStatus(message);
  }

  function handleNameChange(val) {
    setName(val);
    if (!slugManual) setSlug(sanitizeSlug(val, ""));
  }

  function handleSlugChange(val) {
    setSlugManual(true);
    setSlug(val);
  }
  function handleSlugBlur() {
    setSlug(sanitizeSlug(slug, "vehicle"));
  }

  function toggleTag(id) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateColor(uid, next) {
    setColors((prev) => prev.map((c) => (c.uid === uid ? next : c)));
  }
  function removeColor(uid) {
    setColors((prev) => prev.filter((c) => c.uid !== uid));
  }
  function addColor() {
    setColors((prev) => [...prev, emptyColorRow()]);
  }

  // переносит цвет fromUid на место цвета toUid
  function moveColor(fromUid, toUid) {
    setColors((prev) => {
      const from = prev.findIndex((c) => c.uid === fromUid);
      const to = prev.findIndex((c) => c.uid === toUid);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function shiftColor(uid, dir) {
    setColors((prev) => {
      const i = prev.findIndex((c) => c.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function resetDrag() {
    setArmedUid(null);
    setDragUid(null);
    setOverUid(null);
  }

  async function handleSave() {
    const cleanSlug = sanitizeSlug(slug, "");
    if (!cleanSlug) return fail("Укажи slug машины");
    if (!name.trim()) return fail("Укажи название машины");
    if (colors.length === 0) return fail("Добавь хотя бы один цвет окраски");
    if (colors.some((c) => !c.name.trim())) return fail("У каждого цвета должно быть название");

    const colorsError = validateColors(colors);
    if (colorsError) return fail(colorsError);

    setSaving(true);
    setStatusError(false);

    try {
      // Новая машина не должна молча затереть существующую с тем же slug.
      if (!isEdit) {
        setStatus("Проверяю slug...");
        const existing = await adminFetchVehicles(true);
        if (existing.some((v) => v.slug === cleanSlug)) {
          return fail(`Машина со slug «${cleanSlug}» уже есть — выбери другой slug или отредактируй её в «Редактировать машины».`);
        }
      }

      setStatus("Сохраняю...");
      let mainUrl = mainImage.url || "";
      if (mainImage.blob) {
        setStatus("Загружаю обложку в Cloudinary...");
        mainUrl = await uploadToCloudinary(mainImage.blob, category, cleanSlug, "main");
      }

      const colorRecords = [];
      for (const row of colors) {
        const id = sanitizeSlug(row.id, "color");
        let imageUrl = row.image.url || "";
        if (row.image.blob) {
          setStatus(`Загружаю фото цвета "${row.name || id}"...`);
          imageUrl = await uploadToCloudinary(row.image.blob, category, cleanSlug, id);
        }
        const record = { id, name: row.name.trim(), image: imageUrl };
        if (row.twoTone) {
          record.hexes = [row.hex1.toUpperCase(), row.hex2.toUpperCase()];
        } else {
          record.hex = row.hex1.toUpperCase();
        }
        if (row.hasAccent && row.accentHex) {
          record.accentHex = row.accentHex.toUpperCase();
        }
        colorRecords.push(record);
      }

      const vehicle = {
        slug: cleanSlug,
        category,
        name: name.trim(),
        tags: Array.from(selectedTags),
        image: mainUrl,
        colors: colorRecords,
      };

      setStatus("Записываю в Supabase...");
      await adminSaveVehicle(vehicle);
      clearVehiclesCache();

      setStatusError(false);
      setStatus(isEdit ? "Сохранено." : "Опубликовано!");
      onSaved?.(vehicle);
    } catch (err) {
      fail("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {asCopy && (
        <p className="font-body text-xs text-amber border border-amber/40 rounded-md px-3 py-2">
          Это копия машины «{initial.name}»: цвета, теги и фото перенесены. Поменяй название и slug, при
          необходимости поправь цвета и нажми «Опубликовать».
        </p>
      )}

      <div className="border border-hair rounded-lg bg-panel p-5">
        <h2 className="font-display text-lg tracking-wide text-ink mb-4">Основное</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
              Название машины
            </label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
              Slug {isEdit && <span className="normal-case text-[10px]">(нельзя менять)</span>}
            </label>
            <input
              value={slug}
              disabled={isEdit}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={handleSlugBlur}
              className="w-full bg-raised border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <ImageUploadField label="Фото карточки (обложка)" value={mainImage} onChange={setMainImage} ratio="4:3" />
        </div>
      </div>

      <div className="border border-hair rounded-lg bg-panel p-5">
        <h2 className="font-display text-lg tracking-wide text-ink mb-1">Цвета окраски</h2>
        <p className="font-body text-xs text-mute mb-4">
          Порядок меняется перетаскиванием за ручку слева или кнопками ↑ ↓.
        </p>
        <div className="flex flex-col gap-3 mb-3">
          {colors.map((c, i) => (
            <div
              key={c.uid}
              draggable={armedUid === c.uid}
              onDragStart={(e) => {
                setDragUid(c.uid);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", c.uid);
              }}
              onDragOver={(e) => {
                if (!dragUid) return;
                e.preventDefault();
                setOverUid(c.uid);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragUid) moveColor(dragUid, c.uid);
                resetDrag();
              }}
              onDragEnd={resetDrag}
              className={`flex items-stretch gap-2 rounded-md transition-opacity ${
                dragUid === c.uid ? "opacity-40" : ""
              } ${overUid === c.uid && dragUid !== c.uid ? "ring-1 ring-signal/60" : ""}`}
            >
              <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 text-mute">
                <button
                  type="button"
                  onClick={() => shiftColor(c.uid, -1)}
                  disabled={i === 0}
                  aria-label="Выше"
                  className="hover:text-signal disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={14} />
                </button>
                <span
                  onPointerDown={() => setArmedUid(c.uid)}
                  onPointerUp={() => setArmedUid(null)}
                  title="Перетащить"
                  className="cursor-grab active:cursor-grabbing hover:text-signal touch-none"
                >
                  <GripVertical size={16} />
                </span>
                <button
                  type="button"
                  onClick={() => shiftColor(c.uid, 1)}
                  disabled={i === colors.length - 1}
                  aria-label="Ниже"
                  className="hover:text-signal disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <ColorRow
                  color={c}
                  onChange={(next) => updateColor(c.uid, next)}
                  onRemove={() => removeColor(c.uid)}
                />
              </div>
            </div>
          ))}
          {colors.length === 0 && (
            <p className="font-body text-xs text-amber">
              Нужен хотя бы один цвет — без него машину сохранить нельзя.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={addColor}
          className="flex items-center gap-1.5 font-body text-sm text-signal hover:text-signal-bright transition-colors"
        >
          <Plus size={15} />
          Добавить цвет
        </button>
      </div>

      <div className="border border-hair rounded-lg bg-panel p-5">
        <h2 className="font-display text-lg tracking-wide text-ink mb-4">Теги</h2>
        <p className="font-body text-xs text-mute mb-4">
          Только выбор из уже существующих тегов. Добавить новый тег или группу — на странице «Теги и группы».
        </p>
        {tagsLoading && <p className="font-body text-xs text-mute">Загружаю теги...</p>}
        {!tagsLoading && tagGroups.length === 0 && (
          <p className="font-body text-xs text-mute">Тегов пока нет — добавь их на странице «Теги и группы».</p>
        )}
        <div className="flex flex-col gap-4">
          {tagGroups.map((group) => {
            const groupTags = allTags.filter((t) => t.group === group.id);
            if (groupTags.length === 0) return null;
            return (
              <div key={group.id}>
                <p className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {groupTags.map((tag) => {
                    const active = selectedTags.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: tag.color,
                          background: active ? tag.color : "transparent",
                          color: active ? "#0a0c0f" : tag.color,
                        }}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-5 py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {isEdit ? "Сохранить изменения" : "Опубликовать"}
        </button>
        {status && <span className={`font-body text-sm ${statusError ? "text-amber" : "text-signal"}`}>{status}</span>}
      </div>
    </div>
  );
}
