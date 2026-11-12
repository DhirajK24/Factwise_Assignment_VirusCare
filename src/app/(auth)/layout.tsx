import React from "react";
import { AuthProvider } from "@/lib/auth/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider initialUser={null}>{children}</AuthProvider>;
}

