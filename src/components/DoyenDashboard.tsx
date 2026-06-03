"use client";

import { useState } from "react";

interface DoyenDashboardProps {
  faculties: any[];
  totalCourses: number;
  totalStudents: number;
  surveys: any[];
}

export default function DoyenDashboard({ faculties, totalCourses, totalStudents, surveys }: DoyenDashboardProps) {
  // --- FILTRES TEMPORELS ---
  const [timeFilter, setTimeFilter] = useState<"ALL" | "WEEK" | "MONTH">("ALL");
  const [selectedWeek, setSelectedWeek] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<string | "">("");

  const getMonthKey = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", { month: "long", year: "numeric" });
  };

  // Listes d'options pour filtres
  const availableWeeks = Array.from(new Set(surveys.map((s) => s.weekNumber))).sort((a, b) => b - a);
  const availableMonths = Array.from(new Set(surveys.map((s) => getMonthKey(s.createdAt)))).sort();

  // Filtrage dynamique des enquêtes de la faculté
  const filteredSurveys = surveys.filter((s) => {
    if (timeFilter === "ALL") return true;
    if (timeFilter === "WEEK") return selectedWeek === "" || s.weekNumber === Number(selectedWeek);
    if (timeFilter === "MONTH") return selectedMonth === "" || getMonthKey(s.createdAt) === selectedMonth;
    return true;
  });

  // Analyser les enquêtes de l'ensemble de la faculté gérée
  const factorCounts: Record<string, number> = {
    MENTAL: 0,
    PHYSIQUE: 0,
    FINANCE: 0,
    TEMPS: 0,
  };

  let totalFactors = 0;
  filteredSurveys.forEach((s) => {
    s.selectedFactors.forEach((f: string) => {
      if (factorCounts[f] !== undefined) {
        factorCounts[f]++;
        totalFactors++;
      }
    });
  });

  // Calcul du facteur dominant pour l'affichage KPI
  let dominantFactorName = "Aucune";
  let dominantFactorVal = 0;
  for (const [key, val] of Object.entries(factorCounts)) {
    if (val > dominantFactorVal) {
      dominantFactorVal = val;
      dominantFactorName = key;
    }
  }

  const labelMap: Record<string, string> = {
    MENTAL: "Santé Mentale",
    PHYSIQUE: "Fatigue Corporelle",
    FINANCE: "Problèmes Financiers",
    TEMPS: "Charge de travail",
    Aucune: "Aucune alerte",
  };

  const getPercent = (count: number) => {
    if (totalFactors === 0) return 0;
    return Math.round((count / totalFactors) * 100);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* BARRE DE FILTRES TEMPORELS */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <h4 className="text-sm font-bold text-white">Baromètre Temporel de la Faculté</h4>
            <p className="text-xs text-gray-400">Filtrage des enquêtes de performance des promotions gérées</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={timeFilter}
            onChange={(e) => {
              setTimeFilter(e.target.value as any);
              setSelectedWeek("");
              setSelectedMonth("");
            }}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-900"
          >
            <option value="ALL">Tout le semestre</option>
            <option value="WEEK">Par Semaine</option>
            <option value="MONTH">Par Mois</option>
          </select>

          {timeFilter === "WEEK" && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : "")}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-900"
            >
              <option value="">Sélectionner une semaine...</option>
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  Semaine {w}
                </option>
              ))}
            </select>
          )}

          {timeFilter === "MONTH" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 [&>option]:bg-gray-900"
            >
              <option value="">Sélectionner un mois...</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Global Academic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <span className="text-2xl font-black text-white mt-2 block">{labelMap[dominantFactorName]}</span>
          <span className="text-sm text-pink-300 block mt-1">
            {dominantFactorVal > 0 ? `${getPercent(dominantFactorVal)}% des alertes` : "Aucun problème"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vue globale des Facultés */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
            <span className="bg-purple-500/20 p-2 rounded-xl text-purple-400">🏛️</span> Aperçu des Facultés &
            Effectifs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faculties.map((faculty) => (
              <div
                key={faculty.id}
                className="bg-black/40 border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors"
              >
                <h3 className="text-xl font-bold text-white mb-4">{faculty.name}</h3>
                <div className="space-y-2">
                  {faculty.promotions.map((promo: any) => (
                    <div key={promo.id} className="flex justify-between items-center text-sm bg-white/5 px-4 py-2 rounded-lg">
                      <span className="text-gray-300 font-medium">{promo.name}</span>
                      <span className="font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-md">
                        {promo._count?.students || 0} étudiants
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BAROMÈTRE FACTORIEL EN CERCLES (GRAPHES CIRCULAIRES) */}
        <div className="bg-[#0b0c15] border border-indigo-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden h-fit">
          <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px]"></div>

          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <span className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">📊</span> Baromètre Social
          </h2>

          {totalFactors === 0 ? (
            <p className="text-center text-gray-500 py-8 italic bg-white/5 rounded-2xl relative z-10">
              Aucune donnée sur cette période
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6 relative z-10">
              {[
                { id: "MENTAL", label: "Santé Mentale", icon: "🧠", strokeColor: "stroke-indigo-500" },
                { id: "PHYSIQUE", label: "Fatigue Corporelle", icon: "🔋", strokeColor: "stroke-emerald-500" },
                { id: "FINANCE", label: "Finances", icon: "💰", strokeColor: "stroke-amber-500" },
                { id: "TEMPS", label: "Charge de Travail", icon: "⏳", strokeColor: "stroke-fuchsia-500" },
              ].map((f) => {
                const count = factorCounts[f.id] || 0;
                const percent = getPercent(count);
                const strokeDasharray = 2 * Math.PI * 30; // 188.4
                const strokeDashoffset = strokeDasharray - (percent / 100) * strokeDasharray;

                return (
                  <div
                    key={f.id}
                    className="relative flex flex-col items-center justify-center p-4 bg-black/50 border border-white/5 rounded-2xl group hover:-translate-y-0.5 hover:border-white/10 transition-all duration-300"
                  >
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="30" className="stroke-white/5 fill-none" strokeWidth="4" />
                        <circle
                          cx="32"
                          cy="32"
                          r="30"
                          className={`${f.strokeColor} fill-none transition-all duration-1000`}
                          strokeWidth="4"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-2xl relative z-10 group-hover:scale-110 transition-transform">
                        {f.icon}
                      </span>
                    </div>

                    <div className="mt-3 text-center">
                      <span className="block font-black text-white text-base">{percent}%</span>
                      <span className="block text-[10px] font-bold text-gray-400 mt-0.5 leading-tight">{f.label}</span>
                    </div>

                    {/* Tooltip visible on hover */}
                    <div className="absolute bottom-full mb-2 bg-gray-900 border border-white/10 text-white text-[10px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 whitespace-nowrap">
                      {count} rapports
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
