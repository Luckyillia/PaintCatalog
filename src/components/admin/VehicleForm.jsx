import { useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { categories } from "../../data/categories";
import { useTagsContext } from "../../context/TagsContext";
import { adminSaveVehicle, clearVehiclesCache } from "../../data/vehicles";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { sanitizeSlug, nextUid } from "../../lib/textUtils";
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

// initial — существующая машина (режим редактирования) или null/undefined
// (режим создания). onSaved(vehicle) вызывается после успешной записи
// в Supabase.
export default function VehicleForm({ initial, onSaved }) {
  const isEdit = Boolean(initial);
  const { tags: allTags, tagGroups, loading: tagsLoading } = useTagsContext();

  const [category, setCategory] = useState(initial?.category || categories[0]?.slug || "");
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [mainImage, setMainImage] = useState({ url: initial?.image || "", blob: null });
  const [colors, setColors] = useState(
    initial?.colors?.length ? initial.colors.map(colorToRow) : [emptyColorRow()]
  );
  const [selectedTags, setSelectedTags] = useState(new Set(initial?.tags || []));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState(false);

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

  async function handleSave() {
    const cleanSlug = sanitizeSlug(slug, "");
    if (!cleanSlug) {
      setStatusError(true);
      setStatus("Укажи slug машины");
      return;
    }
    if (!name.trim()) {
      setStatusError(true);
      setStatus("Укажи название машины");
      return;
    }

    setSaving(true);
    setStatusError(false);
    setStatus("Сохраняю...");

    try {
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
          record.hexes = [row.hex1 || "#000000", row.hex2 || "#000000"];
        } else {
          record.hex = row.hex1 || "#000000";
        }
        if (row.hasAccent && row.accentHex) {
          record.accentHex = row.accentHex;
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
      setStatusError(true);
      setStatus("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-hair rounded-lg bg-panel p-5">
        <h2 className="font-display text-lg tracking-wide text-ink mb-4">Основное</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
              Категория
            </label>
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
          <ImageUploadField
            label="Фото карточки (обложка)"
            value={mainImage}
            onChange={setMainImage}
            ratio="4:3"
          />
        </div>
      </div>

      <div className="border border-hair rounded-lg bg-panel p-5">
        <h2 className="font-display text-lg tracking-wide text-ink mb-4">Цвета окраски</h2>
        <div className="flex flex-col gap-3 mb-3">
          {colors.map((c) => (
            <ColorRow
              key={c.uid}
              color={c}
              onChange={(next) => updateColor(c.uid, next)}
              onRemove={() => removeColor(c.uid)}
            />
          ))}
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
          Только выбор из уже существующих тегов. Добавить новый тег или группу — на странице
          «Теги и группы».
        </p>
        {tagsLoading && <p className="font-body text-xs text-mute">Загружаю теги...</p>}
        {!tagsLoading && tagGroups.length === 0 && (
          <p className="font-body text-xs text-mute">
            Тегов пока нет — добавь их на странице «Теги и группы».
          </p>
        )}
        <div className="flex flex-col gap-4">
          {tagGroups.map((group) => {
            const groupTags = allTags.filter((t) => t.group === group.id);
            if (groupTags.length === 0) return null;
            return (
              <div key={group.id}>
                <p className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-2">
                  {group.label}
                </p>
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
        {status && (
          <span className={`font-body text-sm ${statusError ? "text-amber" : "text-signal"}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
