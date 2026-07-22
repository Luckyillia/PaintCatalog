// Категории транспорта. image — путь к фото-заглушке категории,
// пока пусто — показывается плейсхолдер.
export const categories = [
  { slug: "legkovoy", name: "Легковой транспорт", image: "" },
  { slug: "gruzovoy", name: "Грузовой транспорт", image: "" },
  { slug: "obshestvenniy", name: "Общественный транспорт", image: "" },
  { slug: "moto", name: "Мототранспорт", image: "" },
  { slug: "konteynery", name: "Автомобили из контейнеров", image: "" },
  { slug: "sobytiya", name: "Автомобили из событий", image: "" },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug);
}