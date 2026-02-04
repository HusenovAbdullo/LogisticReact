"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { useLocale } from "@/shared/i18n/useLocale";
import { useI18n } from "@/shared/i18n/useI18n";
import {
  BurgerIcon,
  IconBox,
  IconGrid,
  IconTruck,
  IconUsers,
} from "@/shared/ui/icons";

type NavChild = { href: string; label: string };
type NavGroup = {
  key: string;
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  children?: NavChild[];
};

/** Agar sizning icons set'ingizda "database" yo'q bo'lsa, shu yerda minimal icon berib qo'ydim */
function IconDatabase({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3c4.97 0 9 1.57 9 3.5S16.97 10 12 10 3 8.43 3 6.5 7.03 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M21 6.5V12c0 1.93-4.03 3.5-9 3.5S3 13.93 3 12V6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M21 12v5.5c0 1.93-4.03 3.5-9 3.5S3 19.43 3 17.5V12"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const { locale } = useLocale();
  const { t } = useI18n(locale);

  // ⚠️ ROUTES ichida yo'qlar bo'lsa ham ishlashi uchun fallback string yo'llar berildi
  const MALUMOTLAR = {
    root: (ROUTES as any)?.malumotlar ?? "/malumotlar",
    adminlar: (ROUTES as any)?.malumotlarAdminlar ?? "/malumotlar/adminlar",
    xodimlar: (ROUTES as any)?.malumotlarXodimlar ?? "/malumotlar/xodimlar",
    foydalanuvchilar:
      (ROUTES as any)?.malumotlarFoydalanuvchilar ??
      "/malumotlar/foydalanuvchilar",
    magazinlar:
      (ROUTES as any)?.malumotlarMagazinlar ?? "/malumotlar/magazinlar",
    skladlar: (ROUTES as any)?.malumotlarSkladlar ?? "/malumotlar/skladlar",
    ofislar: (ROUTES as any)?.malumotlarOfislar ?? "/malumotlar/ofislar",
    hududlar: (ROUTES as any)?.malumotlarHududlar ?? "/malumotlar/hududlar",
    umumiy: (ROUTES as any)?.malumotlarUmumiy ?? "/malumotlar/umumiy",
  };

  const NAV: NavGroup[] = useMemo(() => {
    return [
      {
        key: "dashboard",
        href: ROUTES.dashboard,
        label: t("dashboard"),
        icon: IconGrid,
      },

      // ✅ Zakaz yaratish: alohida menu
      {
        key: "create-order",
        href: ROUTES.createOrder,
        label: t("create_order") ?? "Zakaz yaratish",
        icon: IconBox,
      },

      

      { key: "shipments", href: ROUTES.orders, label: t("shipments"), icon: IconBox },

      // ✅ YANGI: Ma'lumotlar (submenu bilan)
      {
        key: "malumotlar",
        href: MALUMOTLAR.root,
        label: t("Malumotlar") ?? "Ma'lumotlar",
        icon: IconDatabase,
        children: [
          { href: MALUMOTLAR.adminlar, label: t("Adminlar") ?? "Adminlar" },
          { href: MALUMOTLAR.xodimlar, label: t("Xodimlar") ?? "Xodimlar" },
          {
            href: MALUMOTLAR.foydalanuvchilar,
            label: t("Foydalanuvchilar") ?? "Foydalanuvchilar",
          },
          { href: MALUMOTLAR.magazinlar, label: t("Magazinlar") ?? "Magazinlar" },
          { href: MALUMOTLAR.skladlar, label: t("Skladlar") ?? "Skladlar" },
          { href: MALUMOTLAR.ofislar, label: t("Ofislar") ?? "Ofislar" },
          { href: MALUMOTLAR.hududlar, label: t("Hududlar") ?? "Hududlar" },
          { href: MALUMOTLAR.umumiy, label: t("Umumiy") ?? "Umumiy" },
        ],
      },
      { key: "delivery", href: ROUTES.warehouse, label: t("delivery"), icon: IconTruck },
      { key: "clients", href: ROUTES.couriers, label: t("clients"), icon: IconUsers },

      
    ];
  }, [t]);

  function getOpenKeyByPath(path: string) {
    const hit = NAV.find((n) => {
      if (path === n.href) return true;
      if (n.href !== "/" && path.startsWith(n.href + "/")) return true;
      return (n.children ?? []).some((c) => c.href === path);
    });
    return hit?.key ?? "dashboard";
  }

  const [openKey, setOpenKey] = useState<string>(() => getOpenKeyByPath(pathname));

  // ✅ locale/menu o'zgarsa ham openKey sinxron bo'lsin
  useEffect(() => {
    setOpenKey(getOpenKeyByPath(pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, NAV]);

  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const widthClass = collapsed ? "w-[112px]" : "w-[280px]";
  const expanded = !collapsed;

  function isActiveGroup(item: NavGroup) {
    if (pathname === item.href) return true;
    if (item.href !== "/" && pathname.startsWith(item.href + "/")) return true;
    return (item.children ?? []).some((c) => pathname === c.href);
  }

  function SidebarInner({ forceExpanded }: { forceExpanded?: boolean }) {
    const isExpanded = forceExpanded ?? expanded;

    return (
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">

        <div
          className={[
            "flex items-center gap-3 pt-6",
            collapsed ? "px-3" : "px-6",
          ].join(" ")}
        >
          <div className="flex min-w-0 flex-1 items-center">
            {!collapsed || forceExpanded ? (
              <div className="text-2xl font-extrabold tracking-tight">
                Next<span className="text-slate-400">Line</span>
              </div>
            ) : (
              <div className="text-2xl font-extrabold tracking-tight">NL</div>
            )}
          </div>

          <button
            onClick={() => {
              if (mobileOpen) return setMobileOpen(false);
              setCollapsed((v) => !v);
            }}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={t("toggle_sidebar")}
            title={t("toggle_sidebar")}
          >
            <BurgerIcon />
          </button>
        </div>

        <div
  className={[
    "mt-8 flex-1 overflow-y-auto overscroll-contain",
    collapsed ? "px-3" : "px-5",
  ].join(" ")}
>

          {isExpanded && (
            <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("menu")}
            </div>
          )}

          <div
            className={[
              "mt-3 rounded-3xl bg-slate-50 dark:bg-slate-950/40",
              collapsed ? "p-4" : "p-2",
            ].join(" ")}
          >
            {NAV.map((item) => {
              const Icon = item.icon;
              const activeGroup = isActiveGroup(item);
              const hasChildren = (item.children?.length ?? 0) > 0;
              const isOpen = openKey === item.key && isExpanded && hasChildren;

              return (
                <div key={item.key} className="mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => {
                      // collapsed holatda: doim group href ga o'tadi
                      if (!isExpanded) return router.push(item.href);

                      // expanded holatda:
                      if (!hasChildren) return router.push(item.href);

                      // children bo'lsa: dropdown toggle
                      setOpenKey((k) => (k === item.key ? "" : item.key));
                    }}
                    className={[
                      "w-full rounded-2xl transition",
                      isExpanded
                        ? "flex items-center gap-3 px-3 py-2.5 hover:bg-white dark:hover:bg-slate-900"
                        : "flex items-center justify-center py-3",
                      activeGroup ? "bg-white dark:bg-slate-900" : "",
                    ].join(" ")}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span
                      className={[
                        "grid place-items-center rounded-2xl transition",
                        isExpanded ? "h-10 w-10" : "h-16 w-16",
                        activeGroup
                          ? "bg-blue-600 text-white shadow-[0_14px_24px_rgba(37,99,235,0.25)]"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800",
                      ].join(" ")}
                    >
                      <Icon
                        className={
                          activeGroup
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }
                      />
                    </span>

                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.label}
                        </span>

                        {hasChildren ? (
                          <span
                            className={[
                              "text-xs transition",
                              isOpen ? "rotate-180 text-slate-500" : "text-slate-400",
                            ].join(" ")}
                          >
                            ▾
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>

                  {isExpanded && isOpen && (
                    <div className="mt-2 space-y-1 rounded-2xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                      {(item.children ?? []).map((c) => {
                        const activeChild = pathname === c.href;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={[
                              "block rounded-xl px-3 py-2 text-sm transition",
                              activeChild
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                            ].join(" ")}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        className={[
          "sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/70 bg-white sm:block dark:border-slate-800 dark:bg-slate-900",
          widthClass,
        ].join(" ")}
      >
        <SidebarInner />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
            aria-label="Close overlay"
          />
          <aside className="absolute left-0 top-0 h-full w-[84vw] max-w-[340px] border-r border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SidebarInner forceExpanded />
          </aside>
        </div>
      )}
    </>
  );
}
