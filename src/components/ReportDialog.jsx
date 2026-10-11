import { useEffect, useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { categories } from "../data/categories";
import { getColorHexes } from "../data/vehicles";

const inputCls =
  "w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink placeholder:text-mute focus:outline-none focus:border-signal/50";
const labelCls = "font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block";

// kind="color_error": vehicle + color обязательны.
// kind="new_vehicle": ничего не нужно, форма сама спросит название.
export default function ReportDialog({ kind, vehicle, color, onClose }) {
  const isColor = kind === "color_error";
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug || "");
  const [colorsText, setColorsText] = useState("");
  const [website, setWebsite] = useState(""); // ловушка для ботов, человек её не видит
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [openedAt] = useState(() => Date.now()); // когда открыли форму: быстрее человек не заполнит

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSend =
    status !== "sending" && message.trim().length >= 5 && (isColor || name.trim().length >= 2);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          vehicleSlug: isColor ? vehicle.slug : undefined,
          colorId: isColor ? color?.id : undefined,
          name: isColor ? undefined : name,
          category: isColor ? undefined : category,
          colors: isColor ? undefined : colorsText,
          message,
          contact,
          website,
          elapsedMs: Date.now() - openedAt,
        }),
      });
      const text = await res.text().catch(() => "");
      let json = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }
      if (!res.ok) throw new Error(json.error || `Ошибка сервера (${res.status})`);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  const title = isColor ? "Сообщить об ошибке в цвете" : "Предложить машину";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="w-full max-w-lg rounded-lg border border-hair bg-panel shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id="report-title" className="font-display text-xl tracking-wide text-ink">
              {title}
            </h2>
            {isColor && (
              <p className="font-body text-xs text-mute mt-1">
                {vehicle.name}, {color?.name}{" "}
                <span className="font-mono">{color ? getColorHexes(color).join(" / ") : ""}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="text-mute hover:text-signal transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {status === "done" ? (
          <div className="px-5 py-8 text-center">
            <span className="w-11 h-11 mx-auto rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal mb-3">
              <Check size={20} />
            </span>
            <p className="font-body text-sm text-ink">Спасибо! Сообщение ушло администраторам.</p>
            <p className="font-body text-xs text-mute mt-1">Проверим и поправим каталог, если всё подтвердится.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-md border border-hair bg-raised text-ink font-body text-sm px-4 py-2 hover:border-mute transition-colors"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4 flex flex-col gap-3">
            {!isColor && (
              <>
                <div>
                  <label className={labelCls} htmlFor="rp-name">Название машины</label>
                  <input
                    id="rp-name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    placeholder="Например: ЗАЗ 968"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="rp-category">Категория</label>
                  <select
                    id="rp-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputCls}
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="rp-colors">Цвета (если знаешь)</label>
                  <textarea
                    id="rp-colors"
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                    maxLength={600}
                    rows={3}
                    placeholder="Названия и hex, по одному на строку"
                    className={inputCls}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelCls} htmlFor="rp-message">
                {isColor ? "Что не так" : "Комментарий"}
              </label>
              <textarea
                id="rp-message"
                autoFocus={isColor}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={
                  isColor
                    ? "Например: в игре этот цвет другой, настоящий hex — #RRGGBB"
                    : "Где встречается эта машина, откуда данные о цветах"
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="rp-contact">Как с тобой связаться (необязательно)</label>
              <input
                id="rp-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={120}
                placeholder="VK, Discord или Telegram"
                className={inputCls}
              />
            </div>

            {/* ловушка: скрыта от людей и скринридеров, боты заполняют все поля */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
              <label htmlFor="rp-website">Сайт</label>
              <input
                id="rp-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {error && <p className="font-body text-xs text-amber">{error}</p>}

            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-hair bg-raised text-ink font-body text-sm px-4 py-2 hover:border-mute transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!canSend}
                className="flex items-center gap-2 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors disabled:opacity-50"
              >
                {status === "sending" && <Loader2 size={14} className="animate-spin" />}
                Отправить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
