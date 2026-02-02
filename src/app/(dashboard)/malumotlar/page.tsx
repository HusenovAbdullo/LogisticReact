import Link from "next/link";

const items = [
  { href: "/malumotlar/adminlar", title: "Adminlar", desc: "Asosiy adminlar ro‘yxati" },
  { href: "/malumotlar/xodimlar", title: "Xodimlar", desc: "Xodimlar ro‘yxati" },
  { href: "/malumotlar/foydalanuvchilar", title: "Foydalanuvchilar", desc: "Sender va receiver" },
  { href: "/malumotlar/magazinlar", title: "Magazinlar", desc: "Magazinlar ma’lumotlari" },
  { href: "/malumotlar/skladlar", title: "Skladlar", desc: "Skladlar ma’lumotlari" },
  { href: "/malumotlar/ofislar", title: "Ofislar", desc: "Ofislar ma’lumotlari" },
  { href: "/malumotlar/hududlar", title: "Hududlar", desc: "Davlat → viloyat → tuman → mahalla" },
];

export default function Page() {
  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold text-slate-900">Ma’lumotlar</h1>
      <p className="mt-1 text-sm text-slate-500">
        Adminlar, xodimlar, foydalanuvchilar va boshqa ma’lumotlar bo‘limlari.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-slate-900">{it.title}</div>
            <div className="mt-1 text-sm text-slate-500">{it.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
