"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCOUNTS = [
  { email: "io.mehra@nyayavault.demo", role: "IO (assigned WS-2026-0001)" },
  { email: "sho.kapoor@nyayavault.demo", role: "SHO" },
  { email: "forensic.nair@nyayavault.demo", role: "Forensic Expert" },
  { email: "pp.sharma@nyayavault.demo", role: "Prosecutor" },
  { email: "auditor.iyer@nyayavault.demo", role: "Judge / Auditor" },
  { email: "admin@nyayavault.demo", role: "Admin (no case bypass)" },
  { email: "io.unassigned@nyayavault.demo", role: "IO other case (deny demo)" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("io.mehra@nyayavault.demo");
  const [password, setPassword] = useState("demo1234!");
  const [otp, setOtp] = useState("");
  const [mfa, setMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp: mfa ? otp : undefined }),
    });
    const data = await response.json();
    setBusy(false);
    if (data.mfaRequired) {
      setMfa(true);
      return;
    }
    if (!response.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2">
      <div className="text-navy">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Ministry of Home Affairs theme · Demo</p>
        <h1 className="mt-2 font-serif text-4xl">NyayaVault</h1>
        <p className="mt-3 max-w-md text-slate-600">
          Court-ready evidence-document intelligence: encrypted off-chain storage, hash-chain
          integrity, chain of custody, and a cited case assistant. This prototype is not CCTNS,
          ICJS, or e-Courts.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          <li>
            Password for all demo accounts: <code>demo1234!</code>
          </li>
          <li>
            Demo OTP: <code>000000</code>
          </li>
          <li>Use the unassigned IO to show a denied, audited access attempt.</li>
        </ul>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Secure sign-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1">
              <Label htmlFor="email">Official demo ID</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mfa ? (
              <div className="space-y-1">
                <Label htmlFor="otp">MFA OTP (demo)</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  required
                />
              </div>
            ) : null}
            {error ? <p className="text-sm text-red-800">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : mfa ? "Verify OTP" : "Continue"}
            </Button>
          </form>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo accounts
            </p>
            <ul className="space-y-1 text-xs text-slate-600">
              {ACCOUNTS.map((item) => (
                <li key={item.email}>
                  <button
                    type="button"
                    className="text-left text-navy underline-offset-2 hover:underline"
                    onClick={() => {
                      setEmail(item.email);
                      setMfa(false);
                      setOtp("");
                    }}
                  >
                    {item.email}
                  </button>
                  <span className="text-slate-500"> — {item.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
