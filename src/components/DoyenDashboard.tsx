"use client";

import { useState } from "react";

export default function DoyenDashboard({ faculties, totalCourses, totalStudents, surveys }: { faculties: any[], totalCourses: number, totalStudents: number, surveys: any[] }) {
  
  // Analyser les enquêtes de l'ensemble de la faculté gérée
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

  // Calcul du facteur dominant pour l'affichage KPI
  let dominantFactorName = "N/A";
  let dominantFactorVal = 0;
  for (const [key, val] of Object.entries(factorCounts)) {
      if (val > dominantFactorVal) {
          dominantFactorVal = val;
          dominantFactorName = key;
      }
  }

  const labelMap: Record<string, string> = {
      MENTAL: "Santé Mentale", PHYSIQUE: "Fatigue Corporelle", FINANCE: "Problèmes Financiers", TEMPS: "Charge de travail"
  };

  const getPercent = (count: number) => {
      if (totalFactors === 0) return 0;
      return Math.round((count / totalFactors) * 100);
  };

  return (
    <div className="space-y-10">
      
      {/* Global Academic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center transition-transform hover:-translate-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400/80 mb-2">Facultés</h3>
          <span className="text-5xl font-black text-white">{faculties.length}</span>
        </div>
        <div className="bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center transition-transform hover:-translate-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-400/80 mb-2">Cours Actifs</h3>
          <span className="text-5xl font-black text-white">{totalCourses}</span>
        </div>
        <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center transition-transform hover:-translate-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-2">Étudiants Inscrits</h3>
          <span className="text-5xl font-black text-white">{totalStudents}</span>
        </div>
        <div className="bg-pink-900/10 border border-pink-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center transition-transform hover:-translate-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-pink-400/80 mb-2">Alerte Majeure</h3>
          <span className="text-2xl font-black text-white mt-2 block">{labelMap[dominantFactorName] || "Aucune"}</span>
          <span className="text-sm text-pink-300 block mt-1">{dominantFactorVal > 0 ? `${getPercent(dominantFactorVal)}% des étudiants affectés` : "Tout va bien"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vue globale des Facultés */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="bg-purple-500/20 p-2 rounded-xl text-purple-400">🏛️</span> Aperçu des Facultés
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faculties.map(faculty => (
                <div key={faculty.id} className="bg-black/40 border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-4">{faculty.name}</h3>
                  <div className="space-y-2">
                    {faculty.promotions.map((promo: any) => (
                        <div key={promo.id} className="flex justify-between items-center text-sm bg-white/5 px-4 py-2 rounded-lg">
                          <span className="text-gray-300 font-medium">{promo.name}</span>
                          <span className="font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-md">
                            {(promo as any)._count?.students || 0} étudiants
                          </span>
                        </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Barrière des facteurs */}
          <div className="bg-[#0b0c15] border border-indigo-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
             <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px]"></div>
             
             <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
               <span className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">📊</span> Baromètre Social
             </h2>

             {totalFactors === 0 ? (
                <p className="text-center text-gray-500 py-8 italic bg-white/5 rounded-2xl">Aucune donnée cette semaine</p>
             ) : (
                <div className="space-y-6 relative z-10">
                    {[
                        { id: "MENTAL", label: "Santé Mentale", color: "bg-indigo-500" },
                        { id: "PHYSIQUE", label: "Fatigue Physique", color: "bg-emerald-500" },
                        { id: "FINANCE", label: "Finances", color: "bg-amber-500" },
                        { id: "TEMPS", label: "Charge de Travail", color: "bg-fuchsia-500" }
                    ].map(f => {
                        const count = factorCounts[f.id] || 0;
                        const percent = getPercent(count);
                        return (
                            <div key={f.id} className="space-y-1">
                               <div className="flex justify-between text-sm text-gray-300">
                                   <span className="font-bold">{f.label}</span>
                                   <span>{percent}%</span>
                               </div>
                               <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${percent}%` }}></div>
                               </div>
                            </div>
                        )
                    })}
                </div>
             )}
          </div>
      </div>

    </div>
  );
}
