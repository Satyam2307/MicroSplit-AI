"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGitHub() {
  await signIn("mock-github", {
    email: "alex@microsplit.demo",
    name: "Alex Rivera",
    role: "owner",
    redirectTo: "/squads",
  });
}

export async function signInWithDemo(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim() || "alex@microsplit.demo";
  const role = ((formData.get("role") as string) || "").trim() || "owner";
  await signIn("mock-github", {
    email,
    role,
    redirectTo: "/squads",
  });
}

export async function signOutFromApp() {
  await signOut({ redirectTo: "/login" });
}
