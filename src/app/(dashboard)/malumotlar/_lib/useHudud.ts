"use client";

import { useEffect, useMemo, useState } from "react";
import { Store, uid } from "./storage";
import { nowIso } from "./seed";
import type { Country, District, HududState, Locality, Region, Territory } from "./types";

const KEY = "malumotlar_hududlar";

function seed(): HududState {
  const t = nowIso();
  const uz: Country = { id: uid("country"), createdAt: t, updatedAt: t, name: "O‘zbekiston", code: "UZ", territory: null };
  const tq: Region = { id: uid("region"), createdAt: t, updatedAt: t, countryId: uz.id, name: "Toshkent", territory: null };
  const yun: District = { id: uid("district"), createdAt: t, updatedAt: t, regionId: tq.id, name: "Yunusobod", territory: null };
  const m1: Locality = { id: uid("locality"), createdAt: t, updatedAt: t, districtId: yun.id, name: "2-daha", kind: "mahalla", territory: null };
  return {
    countries: [uz],
    regions: [tq],
    districts: [yun],
    localities: [m1],
  };
}

export function useHududStore() {
  const [state, setState] = useState<HududState>({ countries: [], regions: [], districts: [], localities: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = Store.read<HududState>(KEY, { countries: [], regions: [], districts: [], localities: [] });
    if (initial.countries.length === 0) {
      const s = seed();
      Store.write(KEY, s);
      setState(s);
    } else {
      setState(initial);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    Store.write(KEY, state);
  }, [ready, state]);

  const api = useMemo(() => {
    return {
      reset: () => {
        const s = seed();
        Store.write(KEY, s);
        setState(s);
      },

      // Countries
      addCountry: (name: string, code?: string, territory?: Territory | null) => {
        const t = nowIso();
        const c: Country = { id: uid("country"), createdAt: t, updatedAt: t, name, code, territory: territory ?? null };
        setState((p) => ({ ...p, countries: [c, ...p.countries] }));
        return c.id;
      },
      updateCountry: (id: string, patch: Partial<Country>) => {
        setState((p) => ({
          ...p,
          countries: p.countries.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x)),
        }));
      },
      removeCountry: (id: string) => {
        setState((p) => {
          const regions = p.regions.filter((r) => r.countryId !== id);
          const regionIds = new Set(regions.map((r) => r.id));
          const districts = p.districts.filter((d) => regionIds.has(d.regionId));
          const districtIds = new Set(districts.map((d) => d.id));
          const localities = p.localities.filter((l) => districtIds.has(l.districtId));
          return {
            countries: p.countries.filter((c) => c.id !== id),
            regions,
            districts,
            localities,
          };
        });
      },

      // Regions
      addRegion: (countryId: string, name: string, territory?: Territory | null) => {
        const t = nowIso();
        const r: Region = { id: uid("region"), createdAt: t, updatedAt: t, countryId, name, territory: territory ?? null };
        setState((p) => ({ ...p, regions: [r, ...p.regions] }));
        return r.id;
      },
      updateRegion: (id: string, patch: Partial<Region>) => {
        setState((p) => ({
          ...p,
          regions: p.regions.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x)),
        }));
      },
      removeRegion: (id: string) => {
        setState((p) => {
          const districts = p.districts.filter((d) => d.regionId !== id);
          const districtIds = new Set(districts.map((d) => d.id));
          const localities = p.localities.filter((l) => districtIds.has(l.districtId));
          return {
            ...p,
            regions: p.regions.filter((r) => r.id !== id),
            districts,
            localities,
          };
        });
      },

      // Districts
      addDistrict: (regionId: string, name: string, territory?: Territory | null) => {
        const t = nowIso();
        const d: District = { id: uid("district"), createdAt: t, updatedAt: t, regionId, name, territory: territory ?? null };
        setState((p) => ({ ...p, districts: [d, ...p.districts] }));
        return d.id;
      },
      updateDistrict: (id: string, patch: Partial<District>) => {
        setState((p) => ({
          ...p,
          districts: p.districts.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x)),
        }));
      },
      removeDistrict: (id: string) => {
        setState((p) => ({
          ...p,
          districts: p.districts.filter((d) => d.id !== id),
          localities: p.localities.filter((l) => l.districtId !== id),
        }));
      },

      // Localities
      addLocality: (districtId: string, name: string, kind: Locality["kind"], territory?: Territory | null) => {
        const t = nowIso();
        const l: Locality = { id: uid("locality"), createdAt: t, updatedAt: t, districtId, name, kind, territory: territory ?? null };
        setState((p) => ({ ...p, localities: [l, ...p.localities] }));
        return l.id;
      },
      updateLocality: (id: string, patch: Partial<Locality>) => {
        setState((p) => ({
          ...p,
          localities: p.localities.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x)),
        }));
      },
      removeLocality: (id: string) => {
        setState((p) => ({
          ...p,
          localities: p.localities.filter((l) => l.id !== id),
        }));
      },
    };
  }, [state, ready]);

  return { ready, state, api };
}
