"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { DemoBanner } from "@/components/DemoBanner";
import type { Role } from "@prisma/client";
import {
  Home, Folder, Upload, Search, FileText, Shield,
  Fingerprint, Scale, BarChart, Bot, Settings, Share2,
  Bell, ChevronDown, AlertCircle, ShieldAlert, ArrowRightLeft, FileWarning
} from "lucide-react";
import logoImage from "../../public/logo.png";

const ALL_NAV = [
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

function getNavForRole(role: Role) {
  switch (role) {
    case "IO":
      return ALL_NAV.filter(n => ["/dashboard", "/cases", "/upload", "/search", "/review", "/custody", "/integrity", "/share"].includes(n.href));
    case "SHO":
      return ALL_NAV.filter(n => ["/dashboard", "/cases", "/upload", "/search", "/review", "/custody", "/integrity", "/audit", "/share"].includes(n.href));
    case "FORENSIC_EXPERT":
      return ALL_NAV.filter(n => ["/dashboard", "/cases", "/upload", "/review", "/custody", "/integrity"].includes(n.href));
    case "PROSECUTOR":
      return ALL_NAV.filter(n => ["/dashboard", "/cases", "/search", "/custody", "/integrity", "/court-bundle"].includes(n.href));
    case "JUDGE_AUDITOR":
      return ALL_NAV.filter(n => ["/cases", "/integrity", "/custody", "/audit", "/court-bundle"].includes(n.href));
    case "ADMIN":
      return ALL_NAV.filter(n => ["/audit"].includes(n.href));
    default:
      return [];
  }
}

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

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Generate initials for avatar
  const initials = user.email.substring(0, 2).toUpperCase();
  const userName = user.name || "Kavya Mehra";

  const roleDisplayMap: Record<Role, string> = {
    IO: "Investigating Officer",
    SHO: "Station House Officer",
    FORENSIC_EXPERT: "Forensic Expert",
    PROSECUTOR: "Prosecutor",
    JUDGE_AUDITOR: "Judge / Auditor",
    ADMIN: "System Admin",
  };

  const getIcon = (name: string, className: string) => {
    switch (name) {
      case "AlertCircle": return <AlertCircle className={className} />;
      case "ShieldAlert": return <ShieldAlert className={className} />;
      case "ArrowRightLeft": return <ArrowRightLeft className={className} />;
      case "FileWarning": return <FileWarning className={className} />;
      default: return <Bell className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-800">
      <NyayaVaultBackground clean={true} />
      <DemoBanner />

      {/* Top App Bar (Full Width) */}
      <header className="fixed top-0 inset-x-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md">

        <div className="flex w-64 flex-col justify-center pl-6 gap-0.5 mt-1">
          <Image src={logoImage} alt="NyayaVault" width={240} height={80} className="w-[190px] h-auto drop-shadow-sm" unoptimized />
        </div>

        {/* Middle: Search */}
        <div className="flex-1 px-8">
          <form 
            className="relative w-full max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value;
              if (q.trim()) {
                router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              type="text"
              placeholder="Search cases, documents, FIR numbers, or OCR text..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-base font-bold text-black outline-none transition-all focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:font-normal placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Right: Profile Actions */}
        <div className="flex items-center gap-6 pr-6">
          {/* Active Case Badge */}
          {user.role !== "ADMIN" && (
            <div className="hidden lg:flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-full shadow-sm">
              <Folder className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">WS-2026-0001</span>
            </div>
          )}

          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative text-black hover:text-slate-700 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-0 top-0 block h-2 w-2 rounded-full border-2 border-[#0F294D] bg-red-500"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#0F294D]">Notifications</h4>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {notifications.length} New
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-full bg-${notif.color}-50 flex items-center justify-center shrink-0 mt-1`}>
                            {getIcon(notif.icon, `h-4 w-4 text-${notif.color}-600`)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0F294D] mb-1">{notif.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-2 text-center">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full py-1">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-black border border-slate-300">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{roleDisplayMap[user.role] || user.role}</p>
              <p className="text-sm font-bold text-[#0F294D] leading-none">{userName}</p>
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
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto py-6">
          {getNavForRole(user.role).map((item) => {
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

        {user.role === "ADMIN" && (
          <div className="mt-auto p-4">
            <Link href="/admin" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F0F4F8] p-4 text-sm hover:bg-slate-200 transition-colors group">
              <Settings className="h-6 w-6 flex-shrink-0 text-[#0F294D] group-hover:rotate-90 transition-transform duration-300" />
              <div>
                <p className="font-semibold text-[#0F294D]">System Configuration</p>
                <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-500 text-xs">
                  Manage settings & users
                </div>
              </div>
            </Link>
          </div>
        )}
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
