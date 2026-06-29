"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SecuritySetupModal({ isVisible }: { isVisible: boolean }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const finalQuestion = question === "custom" ? customQuestion : question;
    if (!finalQuestion || !answer) {
        setError("Veuillez remplir tous les champs.");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch("/api/profile/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretQuestion: finalQuestion, secretAnswer: answer }),
      });

      if (res.ok) {
        window.location.reload(); // Recharger completement pour effacer la modale
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'enregistrement.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#050b14] border border-blue-500/50 p-8 rounded-[2rem] shadow-[0_0_100px_rgba(59,130,246,0.2)]">
        
        <div className="flex items-center gap-4 mb-6">
           <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl border border-blue-500/30">
               🛡️
           </div>
           <div>
               <h2 className="text-2xl font-black text-white">Sécurité du compte</h2>
               <p className="text-blue-300/70 text-sm mt-1">Étape requise pour protéger vos accès</p>
           </div>
        </div>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Pour vous garantir un moyen de récupérer votre mot de passe en toute autonomie en cas d'oubli, veuillez configurer une question secrète.
        </p>

        {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl font-bold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-blue-200/60 mb-2">Choisissez une question</label>
            <select 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900"
            >
              <option value="" disabled>Sélectionner...</option>
              <option value="Quel est le nom de jeune fille de votre mère ?">Quel est le nom de jeune fille de votre mère ?</option>
              <option value="Quel était le nom de votre premier animal de compagnie ?">Quel était le nom de votre premier animal de compagnie ?</option>
              <option value="Dans quelle ville se sont rencontrés vos parents ?">Dans quelle ville se sont rencontrés vos parents ?</option>
              <option value="Quel est le nom de votre professeur préféré à l'école primaire ?">Quel est le nom de votre professeur préféré à l'école primaire ?</option>
              <option value="custom">Autre (Écrire ma propre question...)</option>
            </select>
          </div>

          {question === "custom" && (
            <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-blue-900/10 border border-blue-900/40 rounded-xl">
               <label className="block text-sm font-bold text-blue-300/80 mb-2">Votre question personnalisée</label>
               <input 
                 type="text" 
                 required 
                 value={customQuestion} 
                 onChange={(e) => setCustomQuestion(e.target.value)} 
                 placeholder="Ex: Quel est le nom de mon film préféré ?"
                 className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" 
               />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-blue-200/60 mb-2">Votre réponse (Secrète)</label>
            <input 
              type="text" 
              required 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              placeholder="Saisissez votre réponse secrète..."
              autoComplete="off"
              className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" 
            />
            <p className="text-xs text-gray-500 mt-2 italic">Attention : Retenez bien l'orthographe exacte de votre réponse.</p>
          </div>

          <button 
             type="submit" 
             disabled={loading} 
             className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-lg transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
          >
             {loading ? "Enregistrement..." : "Protéger mon compte"}
          </button>
        </form>

      </div>
    </div>
  );
}
