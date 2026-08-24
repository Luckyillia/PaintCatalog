import { useEffect, useState } from "react";
import { fetchCreditGroups } from "../data/credits";
import Breadcrumbs from "../components/Breadcrumbs";
import CreditCard from "../components/CreditCard";
import { Award, Loader2 } from "lucide-react";

export default function CreditsWall() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchCreditGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs
        items={[{ label: "Главная", to: "/" }, { label: "Стена почёта" }]}
      />

      <section className="mb-12 border border-hair rounded-lg bg-panel bg-shutter px-8 py-12 text-center">
        <span className="w-12 h-12 mx-auto rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center text-signal mb-4">
          <Award size={22} strokeWidth={2} />
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
          Стена почёта
        </span>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-3">
          При поддержке
        </h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Каталог стоковой окраски существует благодаря людям, которые
          предоставили машины, фото и время на разработку.
        </p>
      </section>

      {error && (
        <p className="font-body text-sm text-amber mb-6">
          Не удалось загрузить стену почёта: {error}
        </p>
      )}

      {!error && !groups && (
        <div className="flex items-center gap-2 font-body text-sm text-mute">
          <Loader2 size={16} className="animate-spin" />
          Загружаю...
        </div>
      )}

      {groups && (
        <div className="flex flex-col gap-10">
          {groups
            .filter((group) => group.entries.length > 0)
            .map((group) => (
              <div key={group.id}>
                <h2 className="font-display text-2xl tracking-wide text-ink mb-4 flex items-center gap-3">
                  {group.title}
                  <span className="flex-1 h-px bg-hair" />
                  <span className="font-mono text-xs text-mute">
                    {group.entries.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.entries.map((entry) => (
                    <CreditCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}