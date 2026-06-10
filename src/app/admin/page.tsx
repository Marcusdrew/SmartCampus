"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        matricule,
        password,
        isAdminPortal: "true"
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070202] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow red/amber for admin */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 rounded-full mix-blend-screen filter blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full mix-blend-screen filter blur-[120px]"></div>

      <div className="w-full max-w-md bg-black/40 border border-red-500/20 p-8 rounded-[2rem] shadow-2xl backdrop-blur-xl z-10 animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 text-3xl">
            🛡️
          </div>
          <h1 className="text-2xl font-black text-white">Portail Admin</h1>
          <p className="text-red-200/50 text-xs mt-2">Zone de connexion réservée aux administrateurs</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-red-200/60 uppercase tracking-wider mb-2">Matricule Administrateur</label>
            <input
              type="text"
              required
              placeholder="ex: ADMIN"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-red-200/60 uppercase tracking-wider mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 outline-none pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-white/50 hover:text-white transition-colors text-xl"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Accéder à l'Administration"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            ← Retour au portail étudiant/enseignant
          </a>
        </div>
      </div>
    </div>
  );
}
