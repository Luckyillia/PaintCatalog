import { useEffect, useState } from "react";
import {
  adminFetchTagGroups,
  adminFetchTags,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup,
  createTag,
  updateTag,
  deleteTag,
} from "../../data/tags";
import { sanitizeSlug, hslToHex, GOLDEN_ANGLE } from "../../lib/textUtils";
import { Plus, Trash2, Loader2 } from "lucide-react";

function TagRow({ tag, groups, onChanged }) {
  const [label, setLabel] = useState(tag.label);
  const [color, setColor] = useState(tag.color);
  const [group, setGroup] = useState(tag.group);
  const [saving, setSaving] = useState(false);

  async function commit(patch) {
    setSaving(true);
    try {
      await updateTag(tag.id, patch);
      onChanged();
    } catch (err) {
      alert("Ошибка сохранения тега: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить тег «${tag.label}»?`)) return;
    try {
      await deleteTag(tag.id);
      onChanged();
    } catch (err) {
      alert("Ошибка удаления тега: " + err.message);
    }
  }

  return (
    <div className="flex items-center gap-2 border border-hair rounded-md bg-raised px-3 py-2 flex-wrap">
      <input
        type="color"
        value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#8b95a1"}
        onChange={(e) => setColor(e.target.value.toUpperCase())}
        onBlur={() => commit({ color })}
        className="w-8 h-8 rounded border border-hair bg-raised2 cursor-pointer shrink-0"
      />
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => commit({ label })}
        className="flex-1 min-w-[100px] bg-raised2 border border-hair rounded px-2 py-1.5 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
      />
      <select
        value={group}
        onChange={(e) => {
          setGroup(e.target.value);
          commit({ group: e.target.value });
        }}
        className="bg-raised2 border border-hair rounded px-2 py-1.5 font-body text-xs text-ink focus:outline-none focus:border-signal/50"
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label}
          </option>
        ))}
      </select>
      <span className="font-mono text-[10px] text-mute shrink-0">{tag.id}</span>
      {tag.editedBy && (
        <span className="font-mono text-[10px] text-mute shrink-0" title={tag.editedAt}>
          · {tag.editedBy}
        </span>
      )}
      {saving && <Loader2 size={13} className="animate-spin text-mute shrink-0" />}
      <button onClick={handleDelete} className="text-mute hover:text-amber transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function GroupBlock({ group, tags, allGroups, onChanged }) {
  const [titleDraft, setTitleDraft] = useState(group.label);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  async function handleTitleBlur() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === group.label) {
      setTitleDraft(group.label);
      return;
    }
    try {
      await updateTagGroup(group.id, { label: trimmed });
      onChanged();
    } catch (err) {
      alert("Ошибка сохранения названия группы: " + err.message);
      setTitleDraft(group.label);
    }
  }

  async function handleDeleteGroup() {
    if (tags.length > 0) {
      alert("Сначала удали или перенеси все теги из этой группы.");
      return;
    }
    if (!confirm(`Удалить группу «${group.label}»?`)) return;
    try {
      await deleteTagGroup(group.id);
      onChanged();
    } catch (err) {
      alert("Ошибка удаления группы: " + err.message);
    }
  }

  async function handleAddTag() {
    const label = newTagLabel.trim();
    if (!label) return;
    const id = sanitizeSlug(label, "");
    if (!id) return;
    setAddingTag(true);
    try {
      const color = hslToHex((tags.length * GOLDEN_ANGLE) % 360, 68, 58);
      await createTag({ id, label, group: group.id, color, sortOrder: tags.length });
      setNewTagLabel("");
      onChanged();
    } catch (err) {
      alert("Ошибка добавления тега: " + err.message);
    } finally {
      setAddingTag(false);
    }
  }

  return (
    <div className="border border-hair rounded-lg bg-panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
          className="font-display text-lg tracking-wide text-ink bg-transparent border-b border-transparent hover:border-hair focus:border-signal/50 focus:outline-none px-1 py-0.5 flex-1"
        />
        <span className="font-mono text-xs text-mute">id: {group.id}</span>
        <button onClick={handleDeleteGroup} className="text-mute hover:text-amber transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {tags.map((tag) => (
          <TagRow key={tag.id} tag={tag} groups={allGroups} onChanged={onChanged} />
        ))}
        {tags.length === 0 && <p className="font-body text-xs text-mute px-1">Тегов пока нет.</p>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={newTagLabel}
          onChange={(e) => setNewTagLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Название нового тега"
          className="flex-1 min-w-[160px] bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
        />
        <button
          onClick={handleAddTag}
          disabled={addingTag || !newTagLabel.trim()}
          className="flex items-center gap-1.5 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          Тег
        </button>
      </div>
    </div>
  );
}

function NewGroupForm({ onCreated, existingCount }) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const cleanId = sanitizeSlug(id || label, "");
    if (!cleanId || !label.trim()) return;
    setSaving(true);
    try {
      await createTagGroup({ id: cleanId, label: label.trim(), sortOrder: existingCount });
      setId("");
      setLabel("");
      onCreated();
    } catch (err) {
      alert("Ошибка создания группы: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-dashed border-hair rounded-lg p-5 flex flex-wrap items-end gap-3">
      <div className="flex-[2] min-w-[220px]">
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          Название группы
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Например: Марка"
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
          ID (латиницей, необязательно)
        </label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="brand"
          className="w-full bg-raised border border-hair rounded px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-signal/50"
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={saving || !label.trim()}
        className="flex items-center gap-1.5 rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50"
      >
        <Plus size={15} />
        Новая группа
      </button>
    </div>
  );
}

export default function TagsManager() {
  const [groups, setGroups] = useState(null);
  const [tags, setTags] = useState(null);
  const [error, setError] = useState("");

  function reload() {
    setError("");
    Promise.all([adminFetchTagGroups(), adminFetchTags()])
      .then(([g, t]) => {
        setGroups(g);
        setTags(t);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-ink mb-1">Теги и группы</h1>
      <p className="font-body text-xs text-mute mb-6">
        Изменения сразу видны в фильтрах на сайте и в форме машины.
      </p>

      {error && <p className="font-body text-sm text-amber mb-4">Ошибка загрузки: {error}</p>}

      {!groups && !error && (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      )}

      {groups && tags && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <GroupBlock
              key={group.id}
              group={group}
              tags={tags.filter((t) => t.group === group.id)}
              allGroups={groups}
              onChanged={reload}
            />
          ))}
          <NewGroupForm onCreated={reload} existingCount={groups.length} />
        </div>
      )}
    </div>
  );
}
