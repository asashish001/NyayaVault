"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { DemoBanner } from "@/components/DemoBanner";
import type { Role } from "@prisma/client";
import {
  Home, Folder, Upload, Search, FileText, Shield,
  Fingerprint, Scale, BarChart, Bot, Settings, Share2,
  Bell, ChevronDown
} from "lucide-react";
import logoImage from "../../public/logo.png";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/cases", label: "Cases", icon: Folder },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/search", label: "Search", icon: Search },
  { href: "/review", label: "IDP Review", icon: FileText },
  { href: "/custody", label: "Custody", icon: Shield },
  { href: "/integrity", label: "Integrity", icon: Fingerprint },
  { href: "/court-bundle", label: "Court bundle", icon: Scale },
  { href: "/audit", label: "Audit", icon: BarChart },
  { href: "/share", label: "Share", icon: Share2 },
];

import { NyayaVaultBackground } from "@/components/background/NyayaVaultBackground";

export function AppShell({
  children,
  user,
  floatingAssistant,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: Role };
  floatingAssistant?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Generate initials for avatar
  const initials = user.email.substring(0, 2).toUpperCase();
  const userName = user.name || "Kavya Mehra";

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-800">
      <NyayaVaultBackground />
      <DemoBanner />

      {/* Top App Bar (Full Width) */}
      <header className="fixed top-0 inset-x-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md">

        <div className="flex w-64 flex-col justify-center pl-6 gap-0.5 mt-1">
          <Image src={logoImage} alt="NyayaVault" width={240} height={80} className="w-[190px] h-auto drop-shadow-sm" unoptimized />
        </div>

        {/* Middle: Search */}
        <div className="flex-1 px-8">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cases, documents, FIR numbers, or OCR text..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-12 text-base font-bold text-black outline-none transition-all focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:font-normal placeholder:text-slate-400"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-black">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right: Profile Actions */}
        <div className="flex items-center gap-6 pr-6">
          <button className="relative text-black hover:text-slate-700 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-0 top-0 block h-2 w-2 rounded-full border-2 border-[#0F294D] bg-red-500"></span>
          </button>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-black border border-slate-300">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-base font-bold text-black">IO — {userName}</p>
              <p className="text-xs font-bold text-black">WS-2026-0001</p>
            </div>
            <button className="ml-1 text-black hover:text-slate-600 transition-colors">
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Subtle sign out / switch role */}
          <div className="border-l border-slate-200 pl-4 flex flex-col gap-1 items-start">
            <RoleSwitcher currentEmail={user.email} />
            <button onClick={logout} className="text-xs font-bold text-black hover:text-red-600 underline ml-1 transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed bottom-0 left-0 top-16 z-20 flex w-64 flex-col bg-white/80 backdrop-blur-md border-r border-slate-200">
        <nav className="flex-1 flex flex-col justify-between overflow-y-auto py-6 min-h-[500px]">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${active
                  ? "bg-[#0F294D] text-white"
                  : "text-slate-700 hover:bg-slate-200/50 hover:text-[#0F294D]"
                  }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <Link href="/admin" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F0F4F8] p-4 text-sm hover:bg-slate-200 transition-colors group">
            <Settings className="h-6 w-6 flex-shrink-0 text-[#0F294D] group-hover:rotate-90 transition-transform duration-300" />
            <div>
              <p className="font-semibold text-[#0F294D]">System Administration</p>
              <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-500 text-xs">
                Manage settings & roles
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 pt-16 min-h-screen relative overflow-hidden">
        {/* We move the fading building illustration to the PageHeader or wrap it here if it's on every page. 
            Since it appears on the dashboard and other pages, we will implement it in PageHeader for cleaner scoping. */}
        <div className="relative z-10 p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {floatingAssistant}
    </div>
  );
}
