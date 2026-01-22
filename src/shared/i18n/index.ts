// src/shared/i18n/index.ts
export type Locale = "uz" | "ru" | "en";

export async function loadDict(locale: Locale) {
  switch (locale) {
    case "ru":
      return (await import("./locales/ru.json")).default;
    case "en":
      return (await import("./locales/en.json")).default;
    case "uz":
    default:
      return (await import("./locales/uz.json")).default;
  }
}






//       placeholder="Search"        bo'lsa                  placeholder={t("topbar.search_placeholder")}


//       "Ob-havo"                   bo'lsa                  t("weather.title")