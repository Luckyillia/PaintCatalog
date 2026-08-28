import { Trash2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import { sanitizeSlug, normalizeHex } from "../../lib/textUtils";

export default function ColorRow({ color, onChange, onRemove }) {
  function set(field, val) {
    onChange({ ...color, [field]: val });
  }

  function handleNameChange(val) {
    const next = { ...color, name: val };
    if (!color.idManual) next.id = sanitizeSlug(val, "");
    onChange(next);
  }

  function handleIdChange(val) {
    onChange({ ...color, id: val, idManual: true });
  }

  function handleIdBlur() {
    onChange({ ...color, id: sanitizeSlug(color.id, "color") });
  }

  return (
    <div className="border border-hair rounded-md bg-raised p-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-[2] min-w-[180px]">
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Название цвета
          </label>
          <input
            value={color.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-raised2 border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            ID
          </label>
          <input
            value={color.id}
            onChange={(e) => handleIdChange(e.target.value)}
            onBlur={handleIdBlur}
            className="w-full bg-raised2 border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
        <label className="flex items-center gap-1.5 font-body text-xs text-mute pb-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={color.twoTone}
            onChange={(e) => set("twoTone", e.target.checked)}
          />
          Двухцветная
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 flex items-center gap-1 font-body text-xs text-mute hover:text-amber transition-colors pb-2"
        >
          <Trash2 size={13} />
          Удалить
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[140px]">
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Hex 1
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(color.hex1) ? color.hex1 : "#8fb6d9"}
              onChange={(e) => set("hex1", e.target.value.toUpperCase())}
              className="w-10 h-9 rounded border border-hair bg-raised2 cursor-pointer"
            />
            <input
              value={color.hex1}
              onChange={(e) => set("hex1", e.target.value)}
              onBlur={(e) => set("hex1", normalizeHex(e.target.value))}
              className="flex-1 bg-raised2 border border-hair rounded px-2 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
            />
          </div>
        </div>

        {color.twoTone && (
          <div className="min-w-[140px]">
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
              Hex 2
            </label>
            <div className="flex gap-1">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(color.hex2) ? color.hex2 : "#000000"}
                onChange={(e) => set("hex2", e.target.value.toUpperCase())}
                className="w-10 h-9 rounded border border-hair bg-raised2 cursor-pointer"
              />
              <input
                value={color.hex2}
                onChange={(e) => set("hex2", e.target.value)}
                onBlur={(e) => set("hex2", normalizeHex(e.target.value))}
                className="flex-1 bg-raised2 border border-hair rounded px-2 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-1.5 font-body text-xs text-mute pb-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={color.hasAccent}
            onChange={(e) => set("hasAccent", e.target.checked)}
          />
          Цвет вставок
        </label>

        {color.hasAccent && (
          <div className="min-w-[140px]">
            <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
              Hex вставок
            </label>
            <div className="flex gap-1">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(color.accentHex) ? color.accentHex : "#8fb6d9"}
                onChange={(e) => set("accentHex", e.target.value.toUpperCase())}
                className="w-10 h-9 rounded border border-hair bg-raised2 cursor-pointer"
              />
              <input
                value={color.accentHex}
                onChange={(e) => set("accentHex", e.target.value)}
                onBlur={(e) => set("accentHex", normalizeHex(e.target.value))}
                className="flex-1 bg-raised2 border border-hair rounded px-2 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
              />
            </div>
          </div>
        )}
      </div>

      <ImageUploadField
        label="Фото цвета в игре (необязательно)"
        value={color.image}
        onChange={(img) => set("image", img)}
        ratio="16:9"
      />
    </div>
  );
}
