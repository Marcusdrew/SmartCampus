"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import AIStatsClient from "@/components/AIStatsClient"; // Optionnel, selon si vous l'avez créé ou non

interface ProfessorDashboardProps {
  courses: any[];
  confusions: any[];
  surveys: any[];
}

export default function ProfessorDashboard({ courses, confusions, surveys }: ProfessorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"COURS" | "ANALYSES" | "AI">("COURS");

  // KPI calculs
  const totalConfusions = confusions.reduce((sum, c) => sum + 1, 0);

  // Focus sur les enquêtes de performance
  // 1. Calculer les facteurs dominants
  const factorCounts: Record<string, number> = {
    MENTAL: 0,
    PHYSIQUE: 0,
    FINANCE: 0,
    TEMPS: 0
  };

  let totalFactors = 0;
  surveys.forEach(s => {
      s.selectedFactors.forEach((f: string) => {
          if (factorCounts[f] !== undefined) {
             factorCounts[f]++;
             totalFactors++;
          }
      });
  });

  const getPercent = (count: number) => {
      if (totalFactors === 0) return 0;
      return Math.round((count / totalFactors) * 100);
  };

  // 2. Extraire la dernière semaine pour isoler les "problèmes de la semaine courante"
  const weeks = Array.from(new Set(surveys.map(s => s.weekNumber))).sort((a, b) => b - a);
  const currentWeek = weeks.length > 0 ? weeks[0] : null;

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2">
          <button 
            onClick={() => setActiveTab("COURS")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "COURS" ? "bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            📚 Mes Cours Taught
          </button>
          <button 
            onClick={() => setActiveTab("ANALYSES")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "ANALYSES" ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            📊 Analyses & Feedbacks
          </button>
          <button 
            onClick={() => setActiveTab("AI")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "AI" ? "bg-teal-500/20 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            🤖 IA d'Amélioration
          </button>
        </div>
      </div>

      <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
        {activeTab === "COURS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {courses.length === 0 ? (
                <div className="col-span-full border border-dashed border-white/20 rounded-3xl p-12 text-center bg-white/5">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-white mb-2">Aucun cours assigné</h3>
                <p className="text-gray-400">Demandez à l'administration de vous lier à vos cours.</p>
                </div>
            ) : (
                courses.map(course => (
                  <div key={course.id} className="bg-amber-900/10 border border-amber-900/40 rounded-3xl p-8 backdrop-blur-md shadow-xl transition-all hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider">{course.code}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white mb-6">{course.name}</h3>
                      <div className="space-y-4">
                         <p className="text-sm text-gray-400">Semestre {course.semester}</p>
                      </div>
                  </div>
                ))
            )}
            {courses.length > 0 && (
              <div className="col-span-full mt-4">
                <div className="bg-[#050511] border border-blue-900/50 rounded-3xl p-8 backdrop-blur-md shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">📤 Téléverser des Ressources ou Horaires</h3>
                  <UploadForm courses={courses} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "ANALYSES" && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* KPI 1 : Facteurs Collectés */}
                  <div className="bg-[#05110a]/80 border border-emerald-900/50 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center flex flex-col justify-center">
                     <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/70 mb-2">Données de l'enquête</h3>
                     <span className="text-5xl font-extrabold text-white">{surveys.length}</span>
                     <p className="text-emerald-200/50 text-xs mt-2">Bilan(s) soumis par vos promotions</p>
                  </div>
                  {/* KPI 2 : Confusions */}
                  <div className="bg-[#11050a]/80 border border-rose-900/50 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center flex flex-col justify-center">
                     <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500/70 mb-2">Alertes Confusion</h3>
                     <span className="text-5xl font-extrabold text-white">{totalConfusions}</span>
                     <p className="text-rose-200/50 text-xs mt-2">Points d'incompréhension signalés</p>
                  </div>
              </div>

              {/* Les Facteurs Dominants */}
              <div className="bg-black/40 border border-indigo-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">🧬</div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Facteurs de Baisse de Performance</h3>
                        <p className="text-sm text-gray-400">Ce qui empêche vos étudiants d'être à 100%.</p>
                    </div>
                 </div>

                 {totalFactors === 0 ? (
                     <p className="text-center text-gray-500 py-8 italic border border-dashed border-white/10 rounded-2xl">Données insuffisantes</p>
                 ) : (
                     <div className="space-y-6">
                         {[
                            { id: "MENTAL", label: "Santé Mentale & Fatigue", color: "bg-indigo-500", light: "bg-indigo-500/20" },
                            { id: "PHYSIQUE", label: "Fatigue Physique", color: "bg-emerald-500", light: "bg-emerald-500/20" },
                            { id: "FINANCE", label: "Problèmes Financiers", color: "bg-amber-500", light: "bg-amber-500/20" },
                            { id: "TEMPS", label: "Charge de Travail / Temps", color: "bg-fuchsia-500", light: "bg-fuchsia-500/20" }
                         ].map(f => {
                             const percent = getPercent(factorCounts[f.id]);
                             return (
                                <div key={f.id} className="relative group">
                                    <div className="flex justify-between text-sm font-bold text-white mb-2">
                                        <span>{f.label}</span>
                                        <span>{percent}% ({factorCounts[f.id]})</span>
                                    </div>
                                    <div className={`w-full h-4 rounded-full ${f.light} overflow-hidden`}>
                                        <div className={`h-full ${f.color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                             )
                         })}
                     </div>
                 )}
              </div>

              {/* Étudiants Nécessitant une Attention ("Dans le rouge") */}
              {currentWeek !== null && (
                 <div className="bg-[#1a0505]/80 border border-red-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl mt-8 relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-red-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">🚨</div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Étudiants Nécessitant une Attention</h3>
                            <p className="text-sm text-red-200/60">Ceux qui ont signalé des difficultés cette semaine (S.{currentWeek}).</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-red-900/50">
                                    <th className="p-4 text-red-400/80 font-bold text-sm">Étudiant</th>
                                    <th className="p-4 text-red-400/80 font-bold text-sm">Promotion</th>
                                    <th className="p-4 text-red-400/80 font-bold text-sm">Facteurs Signalés</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveys
                                   .filter(s => s.weekNumber === currentWeek)
                                   .map(survey => (
                                     <tr key={survey.id} className="border-b border-red-900/20 hover:bg-red-900/10 transition-colors">
                                        <td className="p-4">
                                           <div className="text-white font-bold">{survey.student?.prenom} {survey.student?.nom}</div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">{survey.student?.promotion?.name || "N/A"}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {survey.selectedFactors.map((f: string) => (
                                                   <span key={f} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-red-300">
                                                      {f === "MENTAL" ? "🧠 Mental" : f === "PHYSIQUE" ? "🔋 Physique" : f === "FINANCE" ? "💰 Finance" : "⏳ Temps"}
                                                   </span>
                                                ))}
                                            </div>
                                        </td>
                                     </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
              )}

           </div>
        )}

        {activeTab === "AI" && (
            <div className="bg-[#020b08]/90 border border-emerald-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
               <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                 <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">🤖</div>
                 <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">Assistant Pédagogique IA</h2>
                    <p className="text-emerald-200/50 text-sm mt-1">Détecte les lacunes et propose des améliorations de vos cours</p>
                 </div>
               </div>
               <AIStatsClient />
            </div>
        )}
      </div>
    </div>
  );
}
