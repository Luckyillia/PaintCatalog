# Стайлинг-центр OSNOVA — каталог стоковой окраски

## Запуск
```
npm install
npm run dev
```

## Структура
- `src/data/vehicles.js` — все данные (категории, машины, характеристики, цвета).
  Сейчас это заглушки, замени их на реальные значения — компоненты трогать не нужно.
- `src/components/CarSilhouette.jsx` — заглушка вместо фото машины (просто залитый цветом силуэт).
  Когда появятся реальные фото, замени этот компонент на `<img src=... />`.
- `src/components/IngameShotPlaceholder.jsx` — заглушка под скриншот "как цвет выглядит в игре".
  Аналогично заменяется на `<img />`, когда появятся скрины.
- `src/pages/` — три экрана: Главная (категории) → Категория (сетка машин) → Машина (выбор цвета).

## Как добавить новую машину
Добавь объект в массив `vehicles` в `src/data/vehicles.js`:
```js
{
  slug: "unique-slug",
  category: "legkovoy", // один из categories.slug
  name: "Название",
  dealership: "...",
  priceDealer: 40000,
  priceMarket: 36000,
  specs: { maxSpeed: "...", accel100: "...", accelMax: "...", drive: "...", bodyType: "...", seats: 4, trunk: 5 },
  colors: [
    { id: "white", name: "Название цвета", hex: "#FFFFFF" },
  ],
}
```
