"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  Activity,
  Shield,
  HeartPulse,
  Stethoscope,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const { login, switchUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const ok = await login(email, password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password. You can also click any Quick Demo Role below.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userId: string) => {
    setIsLoading(true);
    try {
      await switchUser(userId);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F6F8FA] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-navy/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-teal items-center justify-center text-white shadow-md ring-4 ring-teal/20 mb-2">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">VirusCare</h1>
          <p className="text-xs text-slate-500 font-medium">
            Better Coordination. Faster Recovery.
          </p>
        </div>

        {/* Card */}
        <Card className="border border-slate-200/80 shadow-elevated bg-white">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-base text-navy">Quarantine Facility Access</CardTitle>
            <CardDescription className="text-xs">
              Sign in with your authorized hospital credentials or select a verified demo persona
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@viruscare.health"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-[11px] text-teal hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-navy hover:bg-navy-700 text-white mt-2 shadow-sm"
              >
                {isLoading ? "Authenticating..." : "Sign In to Console"}
              </Button>
            </CardContent>
          </form>

          {/* Quick Demo Personas */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              1-Click Verified Demo Personas
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("11111111-1111-1111-1111-111111111111")}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white hover:border-navy hover:bg-slate-50 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-navy-50 text-navy">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Dr. Sarah Chen, MD</div>
                    <div className="text-[10px] text-slate-500">Administrator • Full Facility Clearance</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-teal font-mono">Sign in &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("22222222-2222-2222-2222-222222222222")}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-600 hover:bg-blue-50/30 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                    <HeartPulse className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Marcus Johnson, RN</div>
                    <div className="text-[10px] text-slate-500">Quarantine Nurse • Thermal Shift Lead</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-teal font-mono">Sign in &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("44444444-4444-4444-4444-444444444444")}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white hover:border-teal hover:bg-teal-50/30 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-teal-50 text-teal">
                    <Stethoscope className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Dr. Arjun Mehta, MD</div>
                    <div className="text-[10px] text-slate-500">Physician • Clinical Rounds Specialist</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-teal font-mono">Sign in &rarr;</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400">
          VirusCare SaaS • Protected by PostgreSQL Row Level Security (RLS)
        </p>
      </div>
    </div>
  );
}

