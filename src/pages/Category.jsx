import { useParams, Link } from "react-router-dom";
import { getCategory, getVehiclesByCategory } from "../data/vehicles";
import Breadcrumbs from "../components/Breadcrumbs";
import VehicleCard from "../components/VehicleCard";

export default function Category() {
  const { slug } = useParams();
  const category = getCategory(slug);
  const vehicles = getVehiclesByCategory(slug);

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <p className="font-body text-mute">
          Такой категории нет.{" "}
          <Link to="/" className="text-signal">
            Вернуться на главную
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <Breadcrumbs
        items={[{ label: "Главная", to: "/" }, { label: category.name }]}
      />
      <h1 className="font-display text-3xl tracking-wide text-ink mb-6">
        {category.name}
      </h1>

      {vehicles.length === 0 ? (
        <p className="font-body text-mute">
          В этой категории пока нет машин с заполненными данными.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.slug} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
