"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DoyenDashboardProps {
  faculties: any[];
  totalCourses: number;
  totalStudents: number;
  surveys: any[];
  confusions: any[];
}

export default function DoyenDashboard({
  faculties,
  totalCourses,
  totalStudents,
  surveys,
  confusions = [],
}: DoyenDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"CLIMAT" | "PROMOTIONS" | "NOTIFS">("CLIMAT");

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

  // Filtrage dynamique des confusions
  const filteredConfusions = confusions.filter((c) => {
    if (timeFilter === "ALL") return true;
    if (timeFilter === "WEEK") return selectedWeek === "" || c.weekNumber === Number(selectedWeek);
    if (timeFilter === "MONTH") return selectedMonth === "" || getMonthKey(c.createdAt) === selectedMonth;
    return true;
  });

  // Action pour résoudre une alerte de bien-être
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const handleResolveAlert = async (surveyId: string) => {
    setResolvingId(surveyId);
    try {
      const res = await fetch("/api/pedagogy/resolve-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setResolvingId(null);
    }
  };

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

  // --- LOGIQUE DE CLIMAT & MOYENNES ACADÉMIQUES ---

  const getStatusDetails = (status: "green" | "yellow" | "red") => {
    switch (status) {
      case "green":
        return {
          label: "Excellent / Stable",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: "🟢",
          dotColor: "bg-emerald-400",
        };
      case "yellow":
        return {
          label: "Instable / À surveiller",
          color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          icon: "🟡",
          dotColor: "bg-yellow-400",
        };
      case "red":
        return {
          label: "Critique / Alerte",
          color: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: "🔴",
          dotColor: "bg-red-400",
        };
    }
  };

  const getPromotionStats = (promo: any) => {
    // 1. Alerts (unresolved surveys for students in this promo)
    const promoSurveys = filteredSurveys.filter((s) => s.student?.promotionId === promo.id);
    const activeAlerts = promoSurveys.filter((s) => !s.resolved).length;
    const totalPromoStudents = promo.students?.length || promo._count?.students || 0;
    const alertPercent = totalPromoStudents > 0 ? (activeAlerts / totalPromoStudents) * 100 : 0;

    // 2. Academic average percentage across all grades in this promotion
    let obtained = 0;
    let max = 0;
    promo.courses?.forEach((course: any) => {
      course.courseWorks?.forEach((work: any) => {
        work.grades?.forEach((grade: any) => {
          obtained += grade.value;
          max += work.maxGrade;
        });
      });
    });

    const averagePercent = max > 0 ? (obtained / max) * 100 : 0;
    const hasGrades = max > 0;

    // Health rules:
    // Vert (Stable): < 10% d'alertes actives ET moyenne >= 60%
    // Rouge (Alerte): > 25% d'alertes actives OU moyenne < 50%
    // Jaune: Entre les deux
    let status: "green" | "yellow" | "red" = "green";
    if (alertPercent > 25 || (hasGrades && averagePercent < 50)) {
      status = "red";
    } else if (
      (alertPercent >= 10 && alertPercent <= 25) ||
      (hasGrades && averagePercent >= 50 && averagePercent < 60)
    ) {
      status = "yellow";
    }

    return {
      activeAlerts,
      alertPercent,
      averagePercent,
      hasGrades,
      status,
    };
  };

  const getFacultyStats = (faculty: any) => {
    const facultySurveys = filteredSurveys.filter((s) => s.student?.facultyId === faculty.id);
    const activeAlerts = facultySurveys.filter((s) => !s.resolved).length;

    let totalFacultyStudents = 0;
    let obtained = 0;
    let max = 0;

    faculty.promotions.forEach((promo: any) => {
      totalFacultyStudents += promo.students?.length || promo._count?.students || 0;
      promo.courses?.forEach((course: any) => {
        course.courseWorks?.forEach((work: any) => {
          work.grades?.forEach((grade: any) => {
            obtained += grade.value;
            max += work.maxGrade;
          });
        });
      });
    });

    const alertPercent = totalFacultyStudents > 0 ? (activeAlerts / totalFacultyStudents) * 100 : 0;
    const averagePercent = max > 0 ? (obtained / max) * 100 : 0;
    const hasGrades = max > 0;

    let status: "green" | "yellow" | "red" = "green";
    if (alertPercent > 25 || (hasGrades && averagePercent < 50)) {
      status = "red";
    } else if (
      (alertPercent >= 10 && alertPercent <= 25) ||
      (hasGrades && averagePercent >= 50 && averagePercent < 60)
    ) {
      status = "yellow";
    }

    return {
      activeAlerts,
      alertPercent,
      averagePercent,
      hasGrades,
      status,
    };
  };

  const mainFaculty = faculties[0];
  const facultyStats = mainFaculty
    ? getFacultyStats(mainFaculty)
    : { activeAlerts: 0, alertPercent: 0, averagePercent: 0, hasGrades: false, status: "green" as const };
  const facultyStatusDetails = getStatusDetails(facultyStats.status);

  // Estimation de la gravité d'une confusion
  const getConfusionSeverity = (desc: string) => {
    const lowercaseDesc = desc.toLowerCase();
    const highKeywords = [
      "rien compris",
      "perdu",
      "bloqué",
      "impossible",
      "panique",
      "aucune idée",
      "difficulté majeure",
      "bloque",
      "pas compris",
      "comprends rien",
    ];
    if (highKeywords.some((keyword) => lowercaseDesc.includes(keyword))) {
      return { label: "Haute", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    const mediumKeywords = ["exercice", "tp", "comprends pas bien", "formule", "application", "détail", "explication"];
    if (mediumKeywords.some((keyword) => lowercaseDesc.includes(keyword))) {
      return { label: "Moyenne", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    }
    return { label: "Faible", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
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

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveTab("CLIMAT")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "CLIMAT"
                ? "bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🌡️ Climat Global
          </button>
          <button
            onClick={() => setActiveTab("PROMOTIONS")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "PROMOTIONS"
                ? "bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🏛️ Promotions ({mainFaculty?.promotions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("NOTIFS")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "NOTIFS"
                ? "bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🔔 Notifications Directes
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="space-y-10">
        {activeTab === "CLIMAT" && (
          <>
            {/* Climat Santé Global Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🌡️</div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Climat Social & Académique - {mainFaculty?.name || "Faculté"}</h2>
                    <p className="text-sm text-gray-400 mt-1">Indicateur de santé globale basé sur la performance académique et le bien-être.</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-bold text-lg shadow-lg ${facultyStatusDetails.color}`}>
                  <span className="w-3 h-3 rounded-full bg-current animate-ping"></span>
                  <span>Climat : {facultyStatusDetails.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 relative z-10 border-t border-white/10 pt-6">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Taux d'Alertes Actives</span>
                    <span className="block text-3xl font-extrabold text-white mt-1">{facultyStats.alertPercent.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500 mt-1 block">({facultyStats.activeAlerts} bilans non résolus / {totalStudents} étudiants)</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/10`}>
                    🚨
                  </div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Moyenne Académique Globale</span>
                    <span className="block text-3xl font-extrabold text-white mt-1">
                      {facultyStats.hasGrades ? `${facultyStats.averagePercent.toFixed(1)}%` : "N/A"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">Sur la totalité des travaux notés de la faculté</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/10`}>
                    📖
                  </div>
                </div>
              </div>
            </div>

            {/* Global Academic KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-900/10 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center transition-transform hover:-translate-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400/80 mb-2">Cours Actifs</h3>
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

            {/* BAROMÈTRE FACTORIEL EN CERCLES (GRAPHES CIRCULAIRES) */}
            <div className="bg-[#0b0c15] border border-indigo-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px]"></div>

              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                <span className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">📊</span> Baromètre Social
              </h2>

              {totalFactors === 0 ? (
                <p className="text-center text-gray-500 py-8 italic bg-white/5 rounded-2xl relative z-10">
                  Aucune donnée sur cette période
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
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

                        <div className="absolute bottom-full mb-2 bg-gray-900 border border-white/10 text-white text-[10px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 whitespace-nowrap">
                          {count} rapports
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "PROMOTIONS" && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="bg-purple-500/20 p-2 rounded-xl text-purple-400">🏛️</span> Climat des Promotions & Effectifs
            </h2>

            <div className="space-y-8">
              {faculties.map((faculty) => (
                <div key={faculty.id} className="space-y-4">
                  <h3 className="text-xl font-extrabold text-white mb-2">{faculty.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {faculty.promotions.map((promo: any) => {
                      const stats = getPromotionStats(promo);
                      const promoStatusDetails = getStatusDetails(stats.status);

                      return (
                        <div
                          key={promo.id}
                          className="bg-black/40 border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all flex flex-col justify-between shadow-lg"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-lg font-black text-white">{promo.name}</span>
                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${promoStatusDetails.color}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${promoStatusDetails.dotColor}`}></span>
                                {promoStatusDetails.label}
                              </span>
                            </div>

                            <div className="space-y-3 mt-4 text-xs">
                              <div className="flex justify-between items-center text-gray-400">
                                <span>Effectif</span>
                                <span className="font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-md">
                                  {promo.students?.length || promo._count?.students || 0} étudiants
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400">
                                <span>Alertes Actives</span>
                                <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                                  {stats.activeAlerts} ({stats.alertPercent.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400">
                                <span>Moyenne Académique</span>
                                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  {stats.hasGrades ? `${stats.averagePercent.toFixed(1)}%` : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "NOTIFS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ALERTE BIEN-ÊTRE */}
            <div className="bg-[#1a0505]/80 border border-red-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-red-500/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  🚨
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Alertes Actives de Bien-être</h3>
                  <p className="text-sm text-red-200/60">
                    Étudiants de la faculté avec des bilans de performance critiques non résolus.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {(() => {
                  const unresolvedSurveys = filteredSurveys.filter((s) => !s.resolved);

                  if (unresolvedSurveys.length === 0) {
                    return (
                      <div className="p-8 text-center text-red-200/50 italic bg-black/20 rounded-2xl border border-red-950/20">
                        Aucune alerte active de bien-être. Tous les cas sont résolus ! 🎉
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {unresolvedSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          className="p-5 bg-black/40 border border-red-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-red-500/30 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="font-bold text-white text-base">
                              {survey.student?.prenom} {survey.student?.nom}
                            </div>
                            <div className="text-xs text-red-400 font-mono">
                              Classe : {survey.student?.promotion?.name || "N/A"}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {survey.selectedFactors.map((f: string) => (
                                <span
                                  key={f}
                                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-red-300"
                                >
                                  {f === "MENTAL"
                                    ? "🧠 Mental"
                                    : f === "PHYSIQUE"
                                    ? "🔋 Physique"
                                    : f === "FINANCE"
                                    ? "💰 Finance"
                                    : "⏳ Temps"}
                                </span>
                              ))}
                            </div>

                            {/* Detailed answers */}
                            {(survey.mentalState || survey.physicalState || survey.financeState || survey.timeState || survey.freeNotes) && (
                              <div className="mt-3 bg-black/30 border border-white/5 p-3.5 rounded-xl space-y-1.5 text-xs text-gray-300 max-w-md">
                                {survey.mentalState && <p><strong>Santé Mentale :</strong> {survey.mentalState}</p>}
                                {survey.physicalState && <p><strong>Fatigue :</strong> {survey.physicalState}</p>}
                                {survey.financeState && <p><strong>Finances :</strong> {survey.financeState}</p>}
                                {survey.timeState && <p><strong>Logistique/Temps :</strong> {survey.timeState}</p>}
                                {survey.freeNotes && <p className="italic text-red-300/80"><strong>Note :</strong> "{survey.freeNotes}"</p>}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleResolveAlert(survey.id)}
                            disabled={resolvingId === survey.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 self-end md:self-auto"
                          >
                            {resolvingId === survey.id ? "Traitement..." : "Marquer résolu"}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SIGNALEMENTS DE CONFUSION ACADÉMIQUE */}
            <div className="bg-[#050B14]/80 border border-indigo-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  💬
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Signalements de Confusion</h3>
                  <p className="text-sm text-indigo-200/60">Dernières incompréhensions pédagogiques (anonymes).</p>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 animate-in fade-in">
                {filteredConfusions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic bg-black/20 rounded-2xl">
                    Aucun signalement de confusion.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredConfusions.map((conf) => {
                      const severity = getConfusionSeverity(conf.description);
                      return (
                        <div
                          key={conf.id}
                          className="p-5 bg-black/40 border border-indigo-500/10 rounded-2xl flex flex-col gap-3 hover:border-indigo-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                {conf.type}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${severity.color}`}>
                                Gravité : {severity.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">
                              S.{conf.weekNumber} • {new Date(conf.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-white text-sm">{conf.course?.name}</p>
                            <p className="text-[10px] text-indigo-400 font-mono">
                              Classe : {conf.course?.promotion?.name || "N/A"}
                            </p>
                          </div>

                          <div className="text-xs text-gray-300 italic bg-black/40 p-3 rounded-xl border border-white/5">
                            {conf.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
