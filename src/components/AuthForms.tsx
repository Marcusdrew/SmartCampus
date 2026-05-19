"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForms({ faculties }: { faculties: any[] }) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // --- Login State ---
  const [loginMatricule, setLoginMatricule] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Register State ---
  const [regData, setRegData] = useState({ nom: "", postnom: "", prenom: "", facultyId: "", promotionId: "", password: "" });
  const [availablePromotions, setAvailablePromotions] = useState<any[]>([]);
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regMessage, setRegMessage] = useState("");
  const [generatedMatricule, setGeneratedMatricule] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError("");

    const result = await signIn("credentials", { redirect: false, matricule: loginMatricule, password: loginPassword });
    if (result?.error) {
      setLoginError(result.error);
      setIsLoginLoading(false);
    } else {
      setLoginMatricule("");
      setLoginPassword("");
      router.push("/dashboard");
    }
  };

  const handleRegFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facId = e.target.value;
    setRegData({ ...regData, facultyId: facId, promotionId: "" });
    const fac = faculties.find((f) => f.id === facId);
    setAvailablePromotions(fac ? fac.promotions : []);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatus("loading");
    setRegMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      setGeneratedMatricule(data.matricule);
      setRegStatus("success");
    } catch (err: any) {
      setRegMessage(err.message);
      setRegStatus("error");
    }
  };

  return (
    <div className="relative w-full max-w-md h-[650px] bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
      
      {/* Container global qui glisse (200% de largeur : 100% login, 100% register) */}
      <div 
        className="absolute top-0 left-0 w-[200%] h-full flex transition-transform duration-700 ease-[cubic-bezier(0.87,0,0.13,1)]"
        style={{ transform: isLogin ? "translateX(0)" : "translateX(-50%)" }}
      >
        
        {/* --- SECTION LOGIN --- */}
        <div className="w-1/2 h-full p-8 sm:p-10 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Bon retour !</h2>
            <p className="text-white/70 mt-2 text-sm">Connectez-vous pour accéder à vos cours</p>
          </div>

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-5">
            {loginError && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">{loginError}</div>}
            
            <div>
              <input type="text" required value={loginMatricule} onChange={e => setLoginMatricule(e.target.value)} 
                     placeholder="Matricule (ex: 25/ULC/0001/26)" autoComplete="off"
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium" />
            </div>
            <div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} 
                       placeholder="Mot de passe" autoComplete="new-password"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium pr-12" />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-white/50 hover:text-white transition-colors text-xl"
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div className="text-right mt-2">
                 <Link href="/forgot-password" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">Mot de passe oublié ?</Link>
              </div>
            </div>

            <button type="submit" disabled={isLoginLoading} 
                    className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all">
              {isLoginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Pas encore de compte ?{" "}
              <button type="button" onClick={() => setIsLogin(false)} className="text-white font-bold hover:underline decoration-2 underline-offset-4">
                S'inscrire
              </button>
            </p>
          </div>
        </div>

        {/* --- SECTION REGISTER --- */}
        <div className="w-1/2 h-full p-8 sm:p-10 flex flex-col justify-center overflow-y-auto custom-scrollbar">
          {regStatus === "success" ? (
             <div className="text-center space-y-6">
               <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                 ✓
               </div>
               <h3 className="text-2xl font-bold text-white">Création réussie</h3>
               <p className="text-white/80">Votre matricule étudiant a été généré avec succès.</p>
               <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-2xl font-mono text-white text-center select-all">
                 {generatedMatricule}
               </div>
               <button onClick={() => setIsLogin(true)} className="w-full py-3.5 mt-4 bg-white text-black hover:bg-gray-100 rounded-xl font-bold transition-all">
                 Retour à la connexion
               </button>
             </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white tracking-tight">Nouveau ?</h2>
                <p className="text-white/70 mt-2 text-sm">Obtenez votre matricule étudiant ULC</p>
              </div>

              <form onSubmit={handleRegSubmit} className="space-y-4">
                {regStatus === "error" && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">{regMessage}</div>}
                
                <div className="flex gap-3">
                  <input type="text" required placeholder="Nom" value={regData.nom} onChange={e => setRegData({...regData, nom: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <input type="text" placeholder="Postnom" value={regData.postnom} onChange={e => setRegData({...regData, postnom: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <input type="text" required placeholder="Prénom" value={regData.prenom} onChange={e => setRegData({...regData, prenom: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 outline-none" />
                
                <select required value={regData.facultyId} onChange={handleRegFacultyChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white">
                  <option value="" disabled className="text-gray-500">Sélectionnez Faculté</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>

                <select required value={regData.promotionId} onChange={e => setRegData({...regData, promotionId: e.target.value})} disabled={!regData.facultyId} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none disabled:opacity-50 [&>option]:bg-gray-900 [&>option]:text-white">
                  <option value="" disabled>Sélectionnez Promotion</option>
                  {availablePromotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <input type="password" required placeholder="Mot de passe" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 outline-none" />

                <button type="submit" disabled={regStatus === "loading"} className="w-full py-3.5 bg-white hover:bg-gray-100 text-black rounded-xl font-bold shadow-lg transform hover:-translate-y-0.5 transition-all">
                  {regStatus === "loading" ? "Génération..." : "Créer mon matricule"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  Déjà inscrit ?{" "}
                  <button type="button" onClick={() => setIsLogin(true)} className="text-white font-bold hover:underline decoration-2 underline-offset-4">
                    Se connecter
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
