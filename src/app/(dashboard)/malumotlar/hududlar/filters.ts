import type { AdvancedFilterConfig } from "../_components/DataTable";
import type { Country, District, Locality, Region } from "../_lib/types";
import { optionsFromRows, optionsFromValues } from "../_lib/filterUtils";

export function getCountryAdvancedFilter(rows: Country[]): AdvancedFilterConfig<Country> {
  return {
    storageKey: "hududlar__countries__advancedFilter",
    title: "Davlatlar filtri",
    schema: [
      { key: "q", label: "Umumiy qidiruv", type: "text", get: (r) => `${r.name ?? ""} ${r.code ?? ""} ${r.id ?? ""}` },
      { key: "name", label: "Davlat", type: "text" },
      { key: "code", label: "Kod", type: "text" },
      { key: "hasTerritory", label: "Territoriya mavjud", type: "toggle", get: (r) => Boolean((r as any).territory) },
      { key: "createdAt", label: "Yaratilgan", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan", type: "dateRange" },
    ],
    initial: {},
  };
}

export function getRegionAdvancedFilter(rows: Region[], countries: Country[]): AdvancedFilterConfig<Region> {
  const countryOptions = optionsFromValues(
    countries.map((c) => c.id),
    Object.fromEntries(countries.map((c) => [c.id, c.name]))
  );

  return {
    storageKey: "hududlar__regions__advancedFilter",
    title: "Viloyatlar filtri",
    schema: [
      { key: "q", label: "Umumiy qidiruv", type: "text", get: (r) => `${r.name ?? ""} ${r.countryId ?? ""} ${r.id ?? ""}` },
      { key: "name", label: "Viloyat", type: "text" },
      { key: "countryId", label: "Davlat", type: "select", options: countryOptions },
      { key: "hasTerritory", label: "Territoriya mavjud", type: "toggle", get: (r) => Boolean((r as any).territory) },
      { key: "createdAt", label: "Yaratilgan", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan", type: "dateRange" },
    ],
    initial: {},
  };
}

export function getDistrictAdvancedFilter(rows: District[], regions: Region[]): AdvancedFilterConfig<District> {
  const regionOptions = optionsFromValues(
    regions.map((r) => r.id),
    Object.fromEntries(regions.map((r) => [r.id, r.name]))
  );

  return {
    storageKey: "hududlar__districts__advancedFilter",
    title: "Tumanlar filtri",
    schema: [
      { key: "q", label: "Umumiy qidiruv", type: "text", get: (r) => `${r.name ?? ""} ${r.regionId ?? ""} ${r.id ?? ""}` },
      { key: "name", label: "Tuman", type: "text" },
      { key: "regionId", label: "Viloyat", type: "select", options: regionOptions },
      { key: "hasTerritory", label: "Territoriya mavjud", type: "toggle", get: (r) => Boolean((r as any).territory) },
      { key: "createdAt", label: "Yaratilgan", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan", type: "dateRange" },
    ],
    initial: {},
  };
}

export function getLocalityAdvancedFilter(rows: Locality[], districts: District[]): AdvancedFilterConfig<Locality> {
  const districtOptions = optionsFromValues(
    districts.map((d) => d.id),
    Object.fromEntries(districts.map((d) => [d.id, d.name]))
  );
  const kindOptions = optionsFromRows(rows, (r) => r.kind ?? "", { city: "Shahar", village: "Qishloq", other: "Boshqa" });

  return {
    storageKey: "hududlar__localities__advancedFilter",
    title: "Mahallalar filtri",
    schema: [
      {
        key: "q",
        label: "Umumiy qidiruv",
        type: "text",
        get: (r) => `${r.name ?? ""} ${r.kind ?? ""} ${r.districtId ?? ""} ${r.id ?? ""}`,
      },
      { key: "name", label: "Nom", type: "text" },
      { key: "kind", label: "Turi", type: "select", options: kindOptions },
      { key: "districtId", label: "Tuman", type: "select", options: districtOptions },
      { key: "hasTerritory", label: "Territoriya mavjud", type: "toggle", get: (r) => Boolean((r as any).territory) },
      { key: "createdAt", label: "Yaratilgan", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan", type: "dateRange" },
    ],
    initial: {},
  };
}
