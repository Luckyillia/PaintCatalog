import { useEffect, useRef, useState } from "react";
import {
  fetchCreditGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../data/credits";
import { getVehicle } from "../data/vehicles";
import { useVehiclesContext } from "../context/VehiclesContext";
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, X, Check } from "lucide-react";

// Тот же пароль/хэш, что у /vehicle-constructor (VITE_CONSTRUCTOR_PASSWORD_HASH
// в .env), но своя запись в sessionStorage — разблокировка одного
// конструктора не открывает другой.
const PASSWORD_HASH = import.meta.env.VITE_CONSTRUCTOR_PASSWORD_HASH;
const SESSION_KEY = "osnova-credits-constructor-unlocked";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const emptyEntryForm = {
  name: "",
  role: "",
  note: "",
  avatar: "",
  link: "",
  providerId: "",
  vehicleSlugsText: "",
};

function entryToForm(entry) {
  return {
    name: entry.name || "",
    role: entry.role || "",
    note: entry.note || "",
    avatar: entry.avatar || "",
    link: entry.link || "",
    providerId: entry.providerId || "",
    vehicleSlugsText: (entry.vehicleSlugs || []).join(", "),
  };
}

function formToEntryPatch(form, groupId, sortOrder) {
  return {
    groupId,
    name: form.name.trim(),
    role: form.role.trim(),
    note: form.note.trim(),
    avatar: form.avatar.trim(),
    link: form.link.trim(),
    providerId: form.providerId.trim(),
    vehicleSlugs: form.vehicleSlugsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    sortOrder,
  };
}

// Приводит произвольный ввод к тому же формату slug, что и остальной
// сайт (латиница, дефисы) — используется для "будущих" машин, которых
// ещё нет в реестре src/data/vehicles.
function sanitizeSlugInput(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Транслитерация для providerId — имя может быть на кириллице
// ("Астватсатур"), а providerId всегда должен быть латиницей в нижнем
// регистре (используется в URL /provider/:id).
const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};
function transliterateStr(str) {
  return (str || "")
    .toLowerCase()
    .split("")
    .map((c) => (TRANSLIT_MAP[c] !== undefined ? TRANSLIT_MAP[c] : c))
    .join("");
}
// Ник -> providerId: только строчные латинские буквы, цифры и дефисы.
function slugifyProviderId(value) {
  return transliterateStr(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Выбор машин для профиля владельца гаража: можно найти и выбрать уже
// существующую машину из реестра сайта (Supabase, через
// useVehiclesContext), а можно вписать slug машины, которой на сайте ещё
// нет — она появится жёлтым чипом с пометкой "ещё нет на сайте", а
// привязка подхватится сама, как только машину с таким же slug добавят.
function VehicleSlugsPicker({ value, onChange }) {
  const { vehicles } = useVehiclesContext();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const wrapRef = useRef(null);

  const selectedSlugs = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const suggestions = vehicles
    .filter((v) => !selectedSlugs.includes(v.slug))
    .filter(
      (v) =>
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q)
    )
    .slice(0, 8);

  function commitSlugs(nextSlugs) {
    onChange(nextSlugs.join(", "));
  }

  function addSlug(slug) {
    if (!slug || selectedSlugs.includes(slug)) return;
    commitSlugs([...selectedSlugs, slug]);
  }

  function removeSlug(slug) {
    commitSlugs(selectedSlugs.filter((s) => s !== slug));
  }

  function addCustom() {
    const clean = sanitizeSlugInput(customSlug);
    if (!clean) return;
    addSlug(clean);
    setCustomSlug("");
  }

  return (
    <div ref={wrapRef}>
      {/* выбранные машины */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedSlugs.length === 0 && (
          <span className="font-body text-xs text-mute">Машины не выбраны</span>
        )}
        {selectedSlugs.map((slug) => {
          const vehicle = getVehicle(vehicles, slug);
          return (
            <span
              key={slug}
              className={`flex items-center gap-1.5 font-mono text-[11px] pl-2 pr-1 py-1 rounded border ${
                vehicle
                  ? "border-signal/40 text-signal"
                  : "border-amber/50 text-amber"
              }`}
              title={vehicle ? vehicle.name : "Ещё нет на сайте — появится, когда добавишь машину с этим slug"}
            >
              {vehicle ? vehicle.name : `${slug} (скоро на сайте)`}
              <button
                type="button"
                onClick={() => removeSlug(slug)}
                className="hover:text-ink"
              >
                <X size={11} />
              </button>
            </span>
          );
        })}
      </div>

      {/* поиск по существующим машинам */}
      <div className="relative">
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Найти машину по названию или slug..."
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
        />
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-md border border-hair bg-raised shadow-lg z-30 p-1 chip-scroll">
            {suggestions.map((v) => (
              <button
                key={v.slug}
                type="button"
                onClick={() => {
                  addSlug(v.slug);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-raised2 transition-colors text-left"
              >
                <span className="font-body text-sm text-ink truncate">{v.name}</span>
                <span className="font-mono text-[10px] text-mute shrink-0 ml-2">{v.slug}</span>
              </button>
            ))}
          </div>
        )}
        {open && q && suggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-hair bg-raised shadow-lg z-30 p-3">
            <p className="font-body text-xs text-mute">
              Такой машины нет в реестре. Впиши её slug ниже — как "будущую".
            </p>
          </div>
        )}
      </div>

      {/* slug машины, которой ещё нет на сайте */}
      <div className="flex items-center gap-2 mt-2">
        <input
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="slug машины, которой ещё нет на сайте (например zaz-968)"
          className="flex-1 bg-raised border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customSlug.trim()}
          className="shrink-0 flex items-center gap-1 rounded-md border border-hair bg-raised2 text-ink font-body text-xs px-3 py-2 hover:border-signal/50 transition-colors disabled:opacity-40"
        >
          <Plus size={13} />
          Добавить
        </button>
      </div>
      <p className="font-body text-[11px] text-mute mt-1.5 leading-snug">
        Жёлтые чипы — машины, которых пока нет на сайте. Когда добавишь машину
        с точно таким же slug (через /vehicle-constructor), привязка сама
        подтянет её название и станет зелёной — ничего здесь менять не надо.
      </p>
    </div>
  );
}

function EntryForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  // Если providerId уже был задан (редактируем существующую запись) —
  // считаем его "ручным" и не трогаем автогенерацией. Для новой записи
  // providerId подставляется из имени, пока пользователь не впишет его
  // сам — тогда автогенерация выключается насовсем для этой формы.
  const [providerIdManual, setProviderIdManual] = useState(Boolean(initial.providerId));

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleNameChange(value) {
    setForm((f) => ({
      ...f,
      name: value,
      providerId: providerIdManual ? f.providerId : slugifyProviderId(value),
    }));
  }

  function handleProviderIdChange(value) {
    setProviderIdManual(true);
    set("providerId", value);
  }

  function handleProviderIdBlur() {
    set("providerId", slugifyProviderId(form.providerId));
  }

  return (
    <div className="border border-hair rounded-md bg-raised2 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Имя
          </label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Роль
          </label>
          <input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          Note (необязательно — перебивает автосписок машин)
        </label>
        <input
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Avatar URL
          </label>
          <input
            value={form.avatar}
            onChange={(e) => set("avatar", e.target.value)}
            className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Link (профиль)
          </label>
          <input
            value={form.link}
            onChange={(e) => set("link", e.target.value)}
            className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          />
        </div>
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          Provider ID (для страницы /provider/:id)
        </label>
        <input
          value={form.providerId}
          onChange={(e) => handleProviderIdChange(e.target.value)}
          onBlur={handleProviderIdBlur}
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
        />
        <p className="font-body text-[11px] text-mute mt-1">
          Подставляется из имени автоматически (только строчные латинские буквы и дефисы) — можно поправить вручную, оставь пустым, если страница профиля не нужна.
        </p>
      </div>

      <div>
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          Машины
        </label>
        <VehicleSlugsPicker
          value={form.vehicleSlugsText}
          onChange={(text) => set("vehicleSlugsText", text)}
        />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors disabled:opacity-50"
        >
          <Check size={15} />
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-md border border-hair bg-raised text-ink font-body text-sm px-4 py-2 hover:border-mute transition-colors"
        >
          <X size={15} />
          Отмена
        </button>
      </div>
    </div>
  );
}

function EntryRow({ entry, isFirst, isLast, onMove, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(form) {
    setSaving(true);
    try {
      const patch = formToEntryPatch(form, entry.groupId, entry.sortOrder);
      await updateEntry(entry.id, patch);
      setEditing(false);
      onChanged();
    } catch (err) {
      alert("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить запись «${entry.name}»?`)) return;
    try {
      await deleteEntry(entry.id);
      onChanged();
    } catch (err) {
      alert("Ошибка удаления: " + err.message);
    }
  }

  if (editing) {
    return (
      <EntryForm
        initial={entryToForm(entry)}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 border border-hair rounded-md bg-raised px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="text-mute hover:text-signal disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={isLast}
          className="text-mute hover:text-signal disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-sm tracking-wide text-ink truncate">
          {entry.name}
        </p>
        <p className="font-mono text-[11px] text-signal uppercase tracking-wide">
          {entry.role}
        </p>
        {entry.providerId && (
          <p className="font-mono text-[11px] text-mute mt-0.5">
            providerId: {entry.providerId} · машин: {entry.vehicleSlugs.length}
          </p>
        )}
      </div>

      <button
        onClick={() => setEditing(true)}
        className="shrink-0 flex items-center gap-1 font-body text-xs text-mute hover:text-signal transition-colors"
      >
        <Pencil size={13} />
        Изменить
      </button>
      <button
        onClick={handleDelete}
        className="shrink-0 flex items-center gap-1 font-body text-xs text-mute hover:text-amber transition-colors"
      >
        <Trash2 size={13} />
        Удалить
      </button>
    </div>
  );
}

function GroupBlock({ group, onChanged }) {
  const [addingEntry, setAddingEntry] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [titleDraft, setTitleDraft] = useState(group.title);
  const [savingTitle, setSavingTitle] = useState(false);

  async function handleTitleBlur() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === group.title) {
      setTitleDraft(group.title);
      return;
    }
    setSavingTitle(true);
    try {
      await updateGroup(group.id, { title: trimmed });
      onChanged();
    } catch (err) {
      alert("Ошибка сохранения названия блока: " + err.message);
      setTitleDraft(group.title);
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleAddEntry(form) {
    setSavingNew(true);
    try {
      const nextOrder =
        group.entries.length > 0
          ? Math.max(...group.entries.map((e) => e.sortOrder)) + 1
          : 0;
      await createEntry(formToEntryPatch(form, group.id, nextOrder));
      setAddingEntry(false);
      onChanged();
    } catch (err) {
      alert("Ошибка добавления: " + err.message);
    } finally {
      setSavingNew(false);
    }
  }

  async function handleDeleteGroup() {
    if (group.entries.length > 0) {
      alert("Сначала удали все записи из блока.");
      return;
    }
    if (!confirm(`Удалить блок «${group.title}»?`)) return;
    try {
      await deleteGroup(group.id);
      onChanged();
    } catch (err) {
      alert("Ошибка удаления блока: " + err.message);
    }
  }

  async function handleMove(entry, direction) {
    const sorted = [...group.entries].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((e) => e.id === entry.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    try {
      await Promise.all([
        updateEntry(entry.id, { ...entry, sortOrder: other.sortOrder }),
        updateEntry(other.id, { ...other, sortOrder: entry.sortOrder }),
      ]);
      onChanged();
    } catch (err) {
      alert("Ошибка сортировки: " + err.message);
    }
  }

  const sortedEntries = [...group.entries].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="border border-hair rounded-lg bg-panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
          disabled={savingTitle}
          className="font-display text-xl tracking-wide text-ink bg-transparent border-b border-transparent hover:border-hair focus:border-signal/50 focus:outline-none px-1 py-0.5 flex-1"
        />
        <span className="font-mono text-xs text-mute">id: {group.id}</span>
        <button
          onClick={handleDeleteGroup}
          className="text-mute hover:text-amber transition-colors"
          title="Удалить блок"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {sortedEntries.map((entry, i) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            isFirst={i === 0}
            isLast={i === sortedEntries.length - 1}
            onMove={(dir) => handleMove(entry, dir)}
            onChanged={onChanged}
          />
        ))}
        {sortedEntries.length === 0 && (
          <p className="font-body text-xs text-mute px-1">Пусто.</p>
        )}
      </div>

      {addingEntry ? (
        <EntryForm
          initial={emptyEntryForm}
          saving={savingNew}
          onSave={handleAddEntry}
          onCancel={() => setAddingEntry(false)}
        />
      ) : (
        <button
          onClick={() => setAddingEntry(true)}
          className="flex items-center gap-1.5 font-body text-sm text-signal hover:text-signal-bright transition-colors"
        >
          <Plus size={15} />
          Добавить запись
        </button>
      )}
    </div>
  );
}

function NewGroupForm({ onCreated }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (!cleanId || !title.trim()) return;
    setSaving(true);
    try {
      await createGroup({ id: cleanId, title: title.trim(), sortOrder: 999 });
      setId("");
      setTitle("");
      onCreated();
    } catch (err) {
      alert("Ошибка создания блока: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-dashed border-hair rounded-lg p-5 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[160px]">
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          ID блока (латиницей)
        </label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="thanks"
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
        />
      </div>
      <div className="flex-[2] min-w-[220px]">
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          Название блока
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Отдельная благодарность"
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={saving || !id.trim() || !title.trim()}
        className="flex items-center gap-1.5 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50"
      >
        <Plus size={15} />
        Новый блок
      </button>
    </div>
  );
}

export default function CreditsConstructor() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  const [groups, setGroups] = useState(null);
  const [loadError, setLoadError] = useState("");

  function reload() {
    fetchCreditGroups()
      .then(setGroups)
      .catch((err) => setLoadError(err.message));
  }

  useEffect(() => {
    document.title = "Конструктор стены почёта — OSNOVA";
  }, []);

  useEffect(() => {
    if (unlocked) reload();
  }, [unlocked]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!PASSWORD_HASH) {
      setAuthError(
        "Пароль не настроен: добавь VITE_CONSTRUCTOR_PASSWORD_HASH в .env"
      );
      return;
    }
    setChecking(true);
    setAuthError("");
    const hash = await sha256Hex(password);
    setChecking(false);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setAuthError("Неверный пароль");
      setPassword("");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm border border-hair bg-panel rounded-lg p-6"
        >
          <h1 className="font-display text-xl tracking-wide text-ink mb-1">
            Конструктор стены почёта
          </h1>
          <p className="font-body text-xs text-mute mb-5">
            Доступ только по паролю.
          </p>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-raised border border-hair rounded-md px-3 py-2.5 font-body text-sm text-ink focus:outline-none focus:border-signal/50 transition-colors mb-3"
          />
          {authError && (
            <p className="font-body text-xs text-amber mb-3">{authError}</p>
          )}
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "Проверяю..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink px-5 py-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-ink">
            Конструктор стены почёта
          </h1>
          <p className="font-body text-xs text-mute mt-1">
            Изменения сохраняются в Supabase сразу — публичная страница
            /credits подхватит их при следующей загрузке.
          </p>
        </div>

        {loadError && (
          <p className="font-body text-sm text-amber">
            Ошибка загрузки: {loadError}
          </p>
        )}

        {!groups && !loadError && (
          <p className="font-body text-sm text-mute">Загружаю...</p>
        )}

        {groups &&
          [...groups]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((group) => (
              <GroupBlock key={group.id} group={group} onChanged={reload} />
            ))}

        {groups && <NewGroupForm onCreated={reload} />}
      </div>
    </div>
  );
}
