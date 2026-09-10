import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { DemoBanner } from "@/components/DemoBanner";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <DemoBanner />
      <Suspense fallback={<p className="p-8 text-sm text-slate-600">Loading sign-in…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
