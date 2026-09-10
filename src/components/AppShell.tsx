"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { DemoBanner } from "@/components/DemoBanner";
import type { Role } from "@prisma/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/upload", label: "Upload" },
  { href: "/search", label: "Search" },
  { href: "/review", label: "IDP Review" },
  { href: "/custody", label: "Custody" },
  { href: "/integrity", label: "Integrity" },
  { href: "/court-bundle", label: "Court bundle" },
  { href: "/audit", label: "Audit" },
  { href: "/assistant", label: "Case Assistant" },
  { href: "/admin", label: "Admin" },
  { href: "/share", label: "Share" },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DemoBanner />
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-serif text-3xl tracking-tight">NyayaVault</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RoleSwitcher currentEmail={user.email} />
            <div className="text-right text-xs">
              <p className="font-medium">{user.name}</p>
              <p className="text-slate-300">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="border-t border-white/10" aria-label="Primary">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-2">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium ${active ? "bg-white text-navy" : "text-slate-200 hover:bg-white/10"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
