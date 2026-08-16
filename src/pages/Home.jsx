import { categories } from "../data/vehicles";
import CategoryCard from "../components/CategoryCard";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <section className="mb-12 border border-hair rounded-lg bg-panel bg-shutter px-6 py-6 text-center">
        <img
          src="/images/logo.png"
          alt="OSNOVA"
          className="h-36 sm:h-36 w-auto mx-auto mb-4"
        />
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink mt-1">
          Стоковые цвета транспорта
        </h1>
        <p className="font-body text-mute mt-4 max-w-xl mx-auto">
          Выбери категорию транспорта, затем конкретную машину — увидишь все
          заводские варианты окраски с точными hex-кодами.
        </p>
      </section>

      <h2 className="font-display text-2xl tracking-wide text-ink mb-4">
        Категории
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </div>
  );
}