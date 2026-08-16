import { getVehicle } from "./vehicles";

// Стена почёта. group — блок группировки (порядок = порядок вывода).
// avatar можно оставить пустым — тогда покажется плашка с инициалами.
// link — ссылка на профиль (ВК, телеграм, дискорд и т.д.), опционально.
// providerId + vehicleSlugs — только для группы "vehicles": если заполнены,
// карточка на стене почёта ведёт на внутреннюю страницу /provider/:id
// со списком предоставленных машин плиточками.
//
// note — необязательное поле. Если у записи есть vehicleSlugs и note НЕ
// указан вручную, список машин под именем подставляется автоматически
// (по названиям из src/data/vehicles/*). Если хочешь написать что-то своё
// вместо автосписка (например личную подпись) — просто впиши note, он
// будет иметь приоритет.
export const creditGroups = [
  {
    id: "founders",
    title: "Организация проекта",
    entries: [
      {
        name: "Aristarch_Sokirovskiy",
        role: "Идея и руководство",
        note: "",
        avatar: "https://sun9-45.vkuserphoto.ru/s/v1/ig2/eFW5IMcmC5TsTHw0q9-341esnohgM9A_yQGNhTXxAefP0Npye5GQ6PqsUIiuQssSsbob9IaL1i7hPA375Srz_yGv.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1830x1029&from=bu&u=OowcOTkpY5AzLnQbVX0-lbWqH7rgJfJTLvlpGd5Az_4&cs=1830x0",
        link: "https://vk.ru/kievskiy_hamann",
      },
    ],
  },
  {
    id: "vehicles",
    title: "Предоставили машины для подбора цветов",
    entries: [
      {
        name: "Bentley Production | MTA Province #6",
        role: "Владелец гаража",
        avatar: "https://sun9-80.vkuserphoto.ru/s/v1/ig2/VtpYhk9a2Kyq4llK-hT2MxS5LVH7Byf70SwKWqqB94X7ZGERf8pJys2fqUbW-ctzDjinBz_BOsUp8p4UjraEMj1j.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1920x1080&from=bu&u=1fM_6JblSbChlxv1eBT8diR4WqWcTUIRJdPa3nLxF3Y&cs=1920x0",
        link: "https://vk.ru/bentley.prod",
        providerId: "bentley-production",
        vehicleSlugs: ["porsche-911-993", "honda-nsx", "ferrari-348-gtb"],
      },
      {
        name: "Forward Auto Rent | Mta Province #6",
        role: "Владелец гаража",
        avatar: "https://sun9-10.vkuserphoto.ru/s/v1/ig2/L2kvApiOK3Mk0OErnSDzDS4A9F_Tui22KEYKqH2mXJA97542uov_FPA6FtTQWpCV1Q5Csj0UQB4apgf-PGeMWpWI.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,500x500&from=bu&u=ueqmHnc9p73HX2jisUlnUmCHWwxKlixIWidigR3nbmI&cs=500x0",
        link: "https://vk.ru/forwardautorent",
        providerId: "forward-auto-rent",
        vehicleSlugs: ["volkswagen-jetta", "jeep-grand-cherokee-zj", "bmw-m5-f90", "cadillac-escalade"],
      },
      {
        name: "Astvatsatur_Aesthetic",
        role: "Владелец гаража",
        avatar: "",
        link: "",
        providerId: "astvatsatur-aesthetic",
        // Mercedes E Class (w210) пока нет в каталоге — добавь slug сюда,
        // когда заведёшь для неё файл в src/data/vehicles/, и она сама
        // появится в автосписке.
        vehicleSlugs: ["chevrolet-tahoe-ltz", "audi-q7-2013", "lexus-lfa", "subaru-forester-sg-9"],
      },
    ],
  },
  {
    id: "media",
    title: "Скриншоты и фотоматериалы",
    entries: [
      {
        name: "Bentley Production | MTA Province #6",
        role: "Съёмка в игре",
        note: "",
        avatar: "https://sun9-80.vkuserphoto.ru/s/v1/ig2/VtpYhk9a2Kyq4llK-hT2MxS5LVH7Byf70SwKWqqB94X7ZGERf8pJys2fqUbW-ctzDjinBz_BOsUp8p4UjraEMj1j.jpg?quality=95&as=32x18,48x27,72x40,108x61,160x90,240x135,360x202,480x270,540x304,640x360,720x405,1080x607,1280x720,1440x810,1920x1080&from=bu&u=1fM_6JblSbChlxv1eBT8diR4WqWcTUIRJdPa3nLxF3Y&cs=1920x0",
        link: "https://vk.ru/bentley.prod",
      },
    ],
  },
  {
    id: "dev",
    title: "Разработка сайта",
    entries: [
      {
        name: "Polter_Sokirovskiy",
        role: "Dev / Разработчик",
        note: "",
        avatar: "https://sun9-81.vkuserphoto.ru/impg/DW4IDqvukChyc-WPXmzIot46En40R00idiUAXw/l5w5aIHioYc.jpg?quality=96&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360&sign=10ad7d7953daabb7b0e707fdfb7ebefd&u=I6EtahnrCRLlyd0MhT2raQt6ydhuyxX4s72EHGuUSoM&cs=200x200",
        link: "https://vk.ru/id523507300",
      },
      {
        name: "Claude",
        role: "AI-ассистент",
        note: "Компоненты, стена почёта, доводка UI",
        avatar: "",
        link: "",
      },
    ],
  },
  {
    id: "thanks",
    title: "Отдельная благодарность",
    entries: [
      // {
      //   name: "Имя Фамилия",
      //   role: "Тестирование, идеи",
      //   note: "",
      //   avatar: "",
      //   link: "",
      // },
    ],
  },
];

// Ищет запись по providerId среди всех групп (сейчас реально
// заполняется только в группе "vehicles", но функция общая).
export function getProviderById(id) {
  for (const group of creditGroups) {
    const entry = group.entries.find((e) => e.providerId === id);
    if (entry) return entry;
  }
  return null;
}

// Берёт названия машин записи по vehicleSlugs (через реестр машин).
// Слаги, для которых машина не найдена, тихо пропускаются.
export function getProviderVehicleNames(entry) {
  return (entry?.vehicleSlugs ?? [])
    .map((slug) => getVehicle(slug)?.name)
    .filter(Boolean);
}

// Текст-подпись под именем: ручной note (если указан) — иначе
// автосписок названий машин по vehicleSlugs — иначе пусто.
export function getProviderNote(entry) {
  if (entry?.note) return entry.note;
  const names = getProviderVehicleNames(entry);
  return names.length > 0 ? names.join(", ") : "";
}
