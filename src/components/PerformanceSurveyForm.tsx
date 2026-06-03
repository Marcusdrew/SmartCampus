"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PerformanceSurveyForm() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [freeNotes, setFreeNotes] = useState("");
  
  // Storage for detailed QCM answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const FACTORS = [
    { id: "MENTAL", label: "Mental & Émotionnel", icon: "🧠" },
    { id: "PHYSIQUE", label: "Physique & Santé", icon: "🔋" },
    { id: "FINANCE", label: "Finances & Matériel", icon: "💰" },
    { id: "TEMPS", label: "Temps & Logistique", icon: "⏳" }
  ];

  const handleToggleFactor = (id: string) => {
    if (selectedFactors.includes(id)) {
      setSelectedFactors(selectedFactors.filter(f => f !== id));
    } else {
      if (selectedFactors.length >= 2) {
        const nouveau = [...selectedFactors];
        nouveau.shift(); 
        nouveau.push(id);
        setSelectedFactors(nouveau);
      } else {
        setSelectedFactors([...selectedFactors, id]);
      }
    }
  };

  const setAnswer = (key: string, value: string) => {
      setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (selectedFactors.length === 0) {
      setMessage({ type: "error", text: "Veuillez sélectionner au moins un domaine prioritaire." });
      return;
    }
    setMessage(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/student/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFactors,
          answers,
          freeNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
        setStep(1);
        setSelectedFactors([]);
        setAnswers({});
        setFreeNotes("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error || "Erreur de soumission." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur réseau." });
    }
    setLoading(false);
  };

  // Helper for rendering radio buttons
  const renderRadioGroup = (questionLabel: string, answerKey: string, options: {val: string, label: string}[], color: string) => {
      const isSelected = (val: string) => answers[answerKey] === val;
      const baseColor = color === "indigo" ? "border-indigo-900/50 hover:border-indigo-500/50" : 
                        color === "emerald" ? "border-emerald-900/50 hover:border-emerald-500/50" :
                        color === "amber" ? "border-amber-900/50 hover:border-amber-500/50" :
                        "border-fuchsia-900/50 hover:border-fuchsia-500/50";
      const activeColor = color === "indigo" ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" : 
                          color === "emerald" ? "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                          color === "amber" ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                          "bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]";

      return (
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-6">
             <label className="block text-white font-bold mb-4">{questionLabel}</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                 {options.map(opt => (
                     <button
                        type="button"
                        key={opt.val}
                        onClick={() => setAnswer(answerKey, opt.val)}
                        className={`p-3 rounded-xl border text-sm text-left transition-all duration-300 ${isSelected(opt.val) ? activeColor : `bg-black/50 text-gray-400 ${baseColor}`}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected(opt.val) ? 'border-white' : 'border-gray-600'}`}>
                              {isSelected(opt.val) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                           </div>
                           <span>{opt.label}</span>
                        </div>
                     </button>
                 ))}
             </div>
          </div>
      );
  };

  if (isSubmitted) {
    return (
      <div className="bg-[#0b0c15]/90 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
          ✓
        </div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight mb-2">
          Bilan Transmis avec Succès !
        </h2>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          Votre bilan a été enregistré en toute sécurité. Les informations ont été transmises confidentiellement à vos enseignants pour mieux vous soutenir.
        </p>

        {/* Récapitulatif et conseils personnalisés */}
        <div className="w-full max-w-lg bg-black/40 border border-white/5 p-6 rounded-2xl text-left space-y-4 mb-8">
           <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">📋 Résumé de votre soumission</h4>
           <p className="text-sm text-gray-300">Vos réponses ont bien été archivées dans notre baromètre social SmartCampus.</p>
           
           <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pt-2 border-t border-white/5">💡 Conseils personnalisés de réussite</h4>
           <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm rounded-xl">
                 <strong>Cerveau surchargé ?</strong> Prenez 5 minutes de respiration profonde (cohérence cardiaque) avant chaque cours. Cela réduit le cortisol et libère de l'espace de mémoire.
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl">
                 <strong>Sommeil & Énergie :</strong> Un sommeil de moins de 6h diminue vos facultés d'assimilation de 30%. Essayez de prioriser votre repos cette semaine, votre cerveau vous remerciera.
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-xl">
                 <strong>Gestion du temps :</strong> Testez la méthode <em>Pomodoro</em> (25 min d'étude focalisée, 5 min de pause). Cela évite l'épuisement lors de longues sessions de révision.
              </div>
           </div>
        </div>

        <button 
           onClick={() => setIsSubmitted(false)}
           className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
        >
           Fermer et retourner au suivi
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c15]/90 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-indigo-500/20">
         <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
               Bilan Personnel Détaillé
            </h2>
            <p className="text-sm text-indigo-200/60 mt-1">Étape {step} sur 2</p>
         </div>
         <div className="text-4xl">🔬</div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
          {message.text}
        </div>
      )}

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
           <h3 className="text-lg font-bold text-white mb-4">
              Sélectionnez 1 ou 2 facteurs dominants qui ont affecté votre semaine :
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {FACTORS.map(factor => {
                  const isSelected = selectedFactors.includes(factor.id);
                  return (
                      <button 
                        key={factor.id}
                        onClick={() => handleToggleFactor(factor.id)}
                        className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 text-left ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:bg-black/60'}`}
                      >
                         <span className="text-4xl">{factor.icon}</span>
                         <span className="font-bold text-lg">{factor.label}</span>
                      </button>
                  );
              })}
           </div>
           <div className="text-right">
              <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition-all">
                 Continuer l'évaluation ➡️
              </button>
           </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-500">
           <p className="text-sm text-gray-400 mb-6">Sélectionnez les affirmations qui correspondent le mieux à votre situation :</p>
           
           <div className="space-y-8 mb-8">
               {/* --- MENTAL --- */}
               {selectedFactors.includes("MENTAL") && (
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-4"><span className="text-2xl">🧠</span> État Mental & Émotionnel</h3>
                      
                      {renderRadioGroup("1.1. Niveau de stress global ces deux dernières semaines ?", "stressLevel", [
                          { val: "1", label: "1 - Très faible (Serein)" },
                          { val: "2", label: "2 - Faible" },
                          { val: "3", label: "3 - Modéré (Gérable)" },
                          { val: "4", label: "4 - Élevé" },
                          { val: "5", label: "5 - Très élevé (Oppressé)" }
                      ], "indigo")}

                      {renderRadioGroup("1.2. Atmosphère et situation dans votre environnement familial ?", "familyAtmosphere", [
                          { val: "Très paisible et soutenante", label: "Très paisible et soutenante" },
                          { val: "Calme avec quelques tensions occasionnelles", label: "Calme avec tensions" },
                          { val: "Souvent tendue", label: "Souvent tendue (Conflits)" },
                          { val: "Très instable", label: "Très instable (M'empêche d'étudier)" }
                      ], "indigo")}

                      {renderRadioGroup("1.3. Avez-vous ressenti une baisse de motivation ou envie d'abandonner ?", "motivationDrop", [
                          { val: "Rarement ou jamais", label: "Rarement ou jamais" },
                          { val: "De temps en temps", label: "De temps en temps" },
                          { val: "Très souvent", label: "Très souvent (Presque tous les jours)" }
                      ], "indigo")}
                   </div>
               )}

               {/* --- PHYSIQUE --- */}
               {selectedFactors.includes("PHYSIQUE") && (
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mb-4"><span className="text-2xl">🔋</span> État Physique & Santé</h3>
                      
                      {renderRadioGroup("2.1. Heures de sommeil en moyenne par nuit ?", "sleepHours", [
                          { val: "Moins de 4 heures", label: "Moins de 4 heures" },
                          { val: "Entre 4 et 6 heures", label: "Entre 4 et 6 heures" },
                          { val: "Entre 6 et 8 heures", label: "Entre 6 et 8 heures" },
                          { val: "Plus de 8 heures", label: "Plus de 8 heures" }
                      ], "emerald")}

                      {renderRadioGroup("2.2. Capacité à vous payer un repas à l'Université ?", "mealAffordability", [
                          { val: "Toujours", label: "Toujours (Repas régulier)" },
                          { val: "Souvent", label: "Souvent" },
                          { val: "Rarement", label: "Rarement (Je saute des repas)" },
                          { val: "Jamais", label: "Jamais (Je reste le ventre vide)" }
                      ], "emerald")}

                      {renderRadioGroup("2.3. Niveau d'énergie pendant les cours ?", "energyLevel", [
                          { val: "1", label: "1 - Très faible (Lutte pour ne pas dormir)" },
                          { val: "2", label: "2 - Faible" },
                          { val: "3", label: "3 - Moyen (Coups de fatigue)" },
                          { val: "4", label: "4 - Bon" },
                          { val: "5", label: "5 - Très bon" }
                      ], "emerald")}
                   </div>
               )}

               {/* --- FINANCE --- */}
               {selectedFactors.includes("FINANCE") && (
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-4"><span className="text-2xl">💰</span> Finances & Matériel</h3>
                      
                      {renderRadioGroup("3.1. Paiement des frais académiques (Minerval) ?", "tuitionStatus", [
                          { val: "Soldé ou garanti", label: "Soldé ou garanti" },
                          { val: "En cours, gérable", label: "En cours, gérable" },
                          { val: "Difficultés majeures", label: "Difficultés majeures, forte incertitude" }
                      ], "amber")}

                      {renderRadioGroup("3.2. Accès à un ordinateur et aux notes/PDF ?", "materialAccess", [
                          { val: "1", label: "1 - Pas du tout (Ni ordinateur, ni notes)" },
                          { val: "2", label: "2 - Rarement accès" },
                          { val: "3", label: "3 - Moyen (Emprunt / Téléphone)" },
                          { val: "4", label: "4 - Bon" },
                          { val: "5", label: "5 - Excellent (Propre ordinateur + notes)" }
                      ], "amber")}

                      {renderRadioGroup("3.3. Vos préoccupations financières perturbent-elles votre concentration ?", "financeDistraction", [
                          { val: "Jamais", label: "Jamais" },
                          { val: "Parfois", label: "Parfois" },
                          { val: "Constamment", label: "Constamment" }
                      ], "amber")}
                   </div>
               )}

               {/* --- TEMPS --- */}
               {selectedFactors.includes("TEMPS") && (
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2 mb-4"><span className="text-2xl">⏳</span> Temps & Logistique</h3>
                      
                      {renderRadioGroup("4.1. Temps de trajet pour arriver à l'Université ?", "commuteTime", [
                          { val: "Moins de 30 minutes", label: "Moins de 30 minutes" },
                          { val: "Entre 30 minutes et 1 heure", label: "De 30 min à 1 heure" },
                          { val: "Entre 1 heure et 2 heures", label: "De 1 heure à 2 heures" },
                          { val: "Plus de 2 heures", label: "Plus de 2 heures" }
                      ], "fuchsia")}

                      {renderRadioGroup("4.2. Mode de transport principal ?", "transportMode", [
                          { val: "Marche à pied", label: "Marche à pied" },
                          { val: "Bus / Taxi", label: "Transport en commun (Bus, Taxi)" },
                          { val: "Moto", label: "Moto (Wewa / Taxi-moto)" },
                          { val: "Véhicule personnel", label: "Véhicule personnel / Déposé" }
                      ], "fuchsia")}

                      {renderRadioGroup("4.3. Activité professionnelle en parallèle ?", "hasJob", [
                          { val: "Non", label: "Non (100% dédié aux études)" },
                          { val: "Oui, job ponctuel", label: "Oui, un petit job ponctuel" },
                          { val: "Oui, travail régulier", label: "Oui, travail/commerce exigeant" }
                      ], "fuchsia")}

                      {renderRadioGroup("4.4. Avez-vous suffisamment de temps libre pour étudier ?", "freeTime", [
                          { val: "1", label: "1 - Pas du tout" },
                          { val: "2", label: "2 - Insuffisant" },
                          { val: "3", label: "3 - Moyen" },
                          { val: "4", label: "4 - Suffisant" },
                          { val: "5", label: "5 - Tout à fait suffisant" }
                      ], "fuchsia")}
                   </div>
               )}

               <div className="bg-black/20 border border-white/10 p-6 rounded-2xl mt-8">
                   <h4 className="text-white font-bold mb-2 flex items-center gap-2">📝 Remarques Supplémentaires (Optionnel)</h4>
                   <textarea 
                      value={freeNotes}
                      onChange={(e) => setFreeNotes(e.target.value)}
                      placeholder="Commentaires libres sur votre situation..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none transition-colors"
                   ></textarea>
               </div>
           </div>

           <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                 ⬅️ Retour
              </button>
              <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50">
                 {loading ? "Enregistrement..." : "Terminer et Soumettre"}
              </button>
           </div>
        </form>
      )}
    </div>
  );
}
