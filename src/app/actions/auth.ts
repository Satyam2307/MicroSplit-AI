"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/squads" });
}

export async function signOutFromApp() {
  await signOut({ redirectTo: "/login" });
}
