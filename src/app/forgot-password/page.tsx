"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [matricule, setMatricule] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCheckMatricule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestion(data.question);
        setStep(2);
      } else {
        setError(data.error || "Utilisateur introuvable.");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, answer, newPassword }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Réponse incorrecte.");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050511] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full mix-blend-screen filter blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 rounded-full mix-blend-screen filter blur-[120px]"></div>

      <div className="w-full max-w-md bg-black/40 border border-blue-500/20 p-8 rounded-[2rem] shadow-2xl backdrop-blur-xl z-10">
        
        <div className="text-center mb-8">
           <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 text-3xl">
             🔐
           </div>
           <h1 className="text-2xl font-black text-white">Récupération</h1>
           <p className="text-gray-400 text-sm mt-2">Retrouvez l'accès à votre compte</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center font-bold animate-pulse">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center font-bold">Mot de passe réinitialisé ! Redirection...</div>}

        {!success && step === 1 && (
          <form onSubmit={handleCheckMatricule} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Votre Matricule</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: 25/ULC/0001/26"
                value={matricule} 
                onChange={(e) => setMatricule(e.target.value)} 
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button 
               type="submit" 
               disabled={loading}
               className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
               {loading ? "Vérification..." : "Suivant"}
            </button>
            <div className="text-center pt-4">
               <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">Retour à la connexion</Link>
            </div>
          </form>
        )}

        {!success && step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
               <p className="text-xs text-blue-300/70 font-bold uppercase mb-1">Votre question secrète :</p>
               <p className="text-white font-medium">{question}</p>
            </div>
            
            <div>
               <label className="block text-sm font-bold text-gray-300 mb-2">Votre Réponse</label>
               <input 
                 type="text" 
                 required 
                 placeholder="Saisissez votre réponse..."
                 value={answer} 
                 onChange={(e) => setAnswer(e.target.value)} 
                 className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
            </div>
            
            <div>
               <label className="block text-sm font-bold text-gray-300 mb-2">Nouveau Mot de Passe</label>
               <input 
                 type="password" 
                 required 
                 placeholder="Au moins 6 caractères"
                 value={newPassword} 
                 onChange={(e) => setNewPassword(e.target.value)} 
                 className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
            </div>

            <button 
               type="submit" 
               disabled={loading}
               className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
               {loading ? "Modification..." : "Réinitialiser mon mot de passe"}
            </button>
            <div className="text-center pt-2">
               <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Retour</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
