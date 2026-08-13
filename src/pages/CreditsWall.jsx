import { creditGroups } from "../data/credits";
import Breadcrumbs from "../components/Breadcrumbs";
import CreditCard from "../components/CreditCard";
import { Award } from "lucide-react";

export default function CreditsWall() {
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

      <div className="flex flex-col gap-10">
        {creditGroups.map((group) => (
          <div key={group.id}>
            <h2 className="font-display text-2xl tracking-wide text-ink mb-4 flex items-center gap-3">
              {group.title}
              <span className="flex-1 h-px bg-hair" />
              <span className="font-mono text-xs text-mute">
                {group.entries.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.entries.map((entry, i) => (
                <CreditCard key={`${group.id}-${i}`} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}