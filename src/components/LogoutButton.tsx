"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      Déconnexion
    </button>
  );
}
