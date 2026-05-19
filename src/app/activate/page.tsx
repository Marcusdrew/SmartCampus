"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    matricule: "",
    email: "",
    password: "",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStatus("success");
    } catch (err: any) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-all">
          <div className="bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Compte Activé !</h3>
            <p className="text-green-700 dark:text-green-400 mb-4">
              Votre compte a été activé avec succès et votre mot de passe a été configuré.
            </p>
          </div>
          <Link href="/login" className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg">
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-all">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Activation du Compte
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Réservé aux Professeurs et Doyens
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status === "error" && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matricule fourni</label>
              <input type="text" name="matricule" required value={formData.matricule} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="ex: 25/ULC/PRF/001/26" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email institutionnel</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="nom.prenom@ulc.edu" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          </div>

          <div>
            <button type="submit" disabled={status === "loading"} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70">
              {status === "loading" ? "Activation en cours..." : "Activer mon compte"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 transition-colors">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
