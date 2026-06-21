"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import AIStatsClient from "@/components/AIStatsClient";

interface ProfessorDashboardProps {
  courses: any[];
  confusions: any[];
  surveys: any[];
}

export default function ProfessorDashboard({ courses, confusions, surveys }: ProfessorDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"COURS" | "ANALYSES" | "GRADES" | "AI">("COURS");

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

  // Filtrage dynamique
  const filteredSurveys = surveys.filter((s) => {
    if (timeFilter === "ALL") return true;
    if (timeFilter === "WEEK") return selectedWeek === "" || s.weekNumber === Number(selectedWeek);
    if (timeFilter === "MONTH") return selectedMonth === "" || getMonthKey(s.createdAt) === selectedMonth;
    return true;
  });

  const filteredConfusions = confusions.filter((c) => {
    if (timeFilter === "ALL") return true;
    if (timeFilter === "WEEK") return selectedWeek === "" || c.weekNumber === Number(selectedWeek);
    if (timeFilter === "MONTH") return selectedMonth === "" || getMonthKey(c.createdAt) === selectedMonth;
    return true;
  });

  // KPI calculs
  const totalConfusions = filteredConfusions.length;

  // Calcul des facteurs de performance sur les enquêtes filtrées
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

  const getPercent = (count: number) => {
    if (totalFactors === 0) return 0;
    return Math.round((count / totalFactors) * 100);
  };

  // Liste d'étudiants en alerte non résolus
  const unresolvedSurveys = filteredSurveys.filter((s) => !s.resolved);

  // Estimation de la gravité d'une confusion
  const getConfusionSeverity = (desc: string) => {
    const lowercaseDesc = desc.toLowerCase();
    const highKeywords = ["rien compris", "perdu", "bloqué", "impossible", "panique", "aucune idée", "difficulté majeure", "bloque", "pas compris", "comprends rien"];
    if (highKeywords.some((keyword) => lowercaseDesc.includes(keyword))) {
      return { label: "Haute", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    const mediumKeywords = ["exercice", "tp", "comprends pas bien", "formule", "application", "détail", "explication"];
    if (mediumKeywords.some((keyword) => lowercaseDesc.includes(keyword))) {
      return { label: "Moyenne", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    }
    return { label: "Faible", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  };

  // --- CARNET DE NOTES STATE & LOGIQUE ---
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [selectedCourseWorkId, setSelectedCourseWorkId] = useState("");
  const [evaluationType, setEvaluationType] = useState<"Examen" | "TP" | "Interrogation">("TP");
  const [newWorkMaxGrade, setNewWorkMaxGrade] = useState("20");
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [addingWork, setAddingWork] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const courseWorks = selectedCourse?.courseWorks || [];
  const students = selectedCourse?.promotion?.students || [];

  const calculateAverage = (studentId: string) => {
    let totalObtained = 0;
    let totalMax = 0;

    courseWorks.forEach((work: any) => {
      const grade = work.grades?.find((g: any) => g.studentId === studentId);
      if (grade !== undefined && grade !== null) {
        totalObtained += grade.value;
        totalMax += work.maxGrade;
      }
    });

    if (totalMax === 0) return null;

    const courseMaxGrade = selectedCourse?.maxGrade || 50;
    return (totalObtained / totalMax) * courseMaxGrade;
  };

  const getAverageStatus = (value: number) => {
    const courseMaxGrade = selectedCourse?.maxGrade || 50;
    const half = courseMaxGrade / 2;
    if (value < half) return { label: "Échec", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (value === half) return { label: "Entraîné", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };

    let threshold = half + 1;
    if (courseMaxGrade === 10) threshold = 6;
    else if (courseMaxGrade === 20) threshold = 12;
    else if (courseMaxGrade === 30) threshold = 17;
    else if (courseMaxGrade === 40) threshold = 22;
    else if (courseMaxGrade === 50) threshold = 27;

    return value >= threshold 
      ? { label: "Validé", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
      : { label: "Entraîné", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  };

  const handleCreateCourseWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setAddingWork(true);

    let title: string = evaluationType;
    if (evaluationType === "TP" || evaluationType === "Interrogation") {
      const count = courseWorks.filter((w: any) =>
        w.title.toLowerCase().startsWith(evaluationType.toLowerCase())
      ).length;
      title = `${evaluationType} ${count + 1}`;
    }

    try {
      const res = await fetch("/api/grades/coursework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title,
          maxGrade: Number(newWorkMaxGrade),
        }),
      });

      if (res.ok) {
        setEvaluationType("TP");
        setNewWorkMaxGrade("20");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur de création.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setAddingWork(false);
    }
  };

  const handleSaveGrade = async (studentId: string, courseWorkId: string, value: string) => {
    if (value === "") return;
    const key = `${studentId}-${courseWorkId}`;
    setSavingGradeId(key);

    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          courseWorkId,
          value: Number(value),
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur d'enregistrement de la note.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setSavingGradeId(null);
    }
  };

  const getGradeStatus = (value: number, maxGrade: number) => {
    const half = maxGrade / 2;
    if (value < half) return { label: "Échec", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (value === half) return { label: "Entraîné", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };

    let threshold = half + 1;
    if (maxGrade === 10) threshold = 6;
    else if (maxGrade === 20) threshold = 12;
    else if (maxGrade === 30) threshold = 17;
    else if (maxGrade === 40) threshold = 22;
    else if (maxGrade === 50) threshold = 27;

    return value >= threshold 
      ? { label: "Validé", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
      : { label: "Entraîné", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveTab("COURS")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "COURS"
                ? "bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📚 Mes Cours
          </button>
          <button
            onClick={() => setActiveTab("ANALYSES")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "ANALYSES"
                ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📊 Analyses & Feedbacks
          </button>
          <button
            onClick={() => setActiveTab("GRADES")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "GRADES"
                ? "bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📝 Carnet de Notes
          </button>
          <button
            onClick={() => setActiveTab("AI")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "AI"
                ? "bg-teal-500/20 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🤖 IA d'Amélioration
          </button>
        </div>
      </div>

      <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
        {/* --- TAB: COURS --- */}
        {activeTab === "COURS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {courses.length === 0 ? (
              <div className="col-span-full border border-dashed border-white/20 rounded-3xl p-12 text-center bg-white/5">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-white mb-2">Aucun cours assigné</h3>
                <p className="text-gray-400">Demandez à l'administration de vous lier à vos cours.</p>
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-amber-900/10 border border-amber-900/40 rounded-3xl p-8 backdrop-blur-md shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider">
                      {course.code}
                    </span>
                    <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                      {course.credits} crédits
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">{course.name}</h3>
                  <div className="text-sm text-gray-400">
                    <p>Semestre {course.semester}</p>
                    <p className="mt-2 text-amber-200/50">Promotion : {course.promotion?.name || "N/A"}</p>
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

        {/* --- TAB: ANALYSES --- */}
        {activeTab === "ANALYSES" && (
          <div className="space-y-8">
            {/* BARRE DE FILTRES TEMPORELS */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Filtre Temporel des Bilans</h4>
                  <p className="text-xs text-gray-400">Affinez l'affichage des enquêtes sociales</p>
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
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-gray-900"
                >
                  <option value="ALL">Tout le semestre</option>
                  <option value="WEEK">Par Semaine</option>
                  <option value="MONTH">Par Mois</option>
                </select>

                {timeFilter === "WEEK" && (
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : "")}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-gray-900"
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
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 [&>option]:bg-gray-900 animate-in fade-in"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KPI 1 : Facteurs Collectés */}
              <div className="bg-[#05110a]/80 border border-emerald-900/50 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center flex flex-col justify-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/70 mb-2">
                  Données de l'enquête
                </h3>
                <span className="text-5xl font-extrabold text-white">{filteredSurveys.length}</span>
                <p className="text-emerald-200/50 text-xs mt-2">Bilan(s) soumis sur la période filtrée</p>
              </div>
              {/* KPI 2 : Confusions */}
              <div className="bg-[#11050a]/80 border border-rose-900/50 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center flex flex-col justify-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500/70 mb-2">
                  Alertes Confusion
                </h3>
                <span className="text-5xl font-extrabold text-white">{totalConfusions}</span>
                <p className="text-rose-200/50 text-xs mt-2">Points d'incompréhension signalés</p>
              </div>
            </div>

            {/* BAROMÈTRE VISUEL (GRAPHES CIRCULAIRES DE COULEURS) */}
            <div className="bg-black/40 border border-indigo-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  🧬
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Baromètre Factoriel Social</h3>
                  <p className="text-sm text-gray-400">Ce qui perturbe l'assimilation et la performance de vos étudiants.</p>
                </div>
              </div>

              {totalFactors === 0 ? (
                <p className="text-center text-gray-500 py-8 italic border border-dashed border-white/10 rounded-2xl">
                  Données insuffisantes sur cette période
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { id: "MENTAL", label: "Santé Mentale / Stress", icon: "🧠", strokeColor: "stroke-indigo-500" },
                    { id: "PHYSIQUE", label: "Fatigue Physique", icon: "🔋", strokeColor: "stroke-emerald-500" },
                    { id: "FINANCE", label: "Contraintes Financières", icon: "💰", strokeColor: "stroke-amber-500" },
                    { id: "TEMPS", label: "Logistique / Temps", icon: "⏳", strokeColor: "stroke-fuchsia-500" },
                  ].map((f) => {
                    const count = factorCounts[f.id] || 0;
                    const percent = getPercent(count);
                    const strokeDasharray = 2 * Math.PI * 40; // 251.2
                    const strokeDashoffset = strokeDasharray - (percent / 100) * strokeDasharray;

                    return (
                      <div
                        key={f.id}
                        className="relative flex flex-col items-center justify-center p-6 bg-black/50 border border-white/5 rounded-3xl group hover:-translate-y-1 hover:border-white/10 transition-all duration-300 shadow-inner"
                      >
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          {/* SVG circular progress ring */}
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="40" className="stroke-white/5 fill-none" strokeWidth="6" />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className={`${f.strokeColor} fill-none transition-all duration-1000`}
                              strokeWidth="6"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform">
                            {f.icon}
                          </span>
                        </div>

                        <div className="mt-4 text-center">
                          <span className="block font-black text-white text-lg">{percent}%</span>
                          <span className="block text-xs font-bold text-gray-400 mt-1">{f.label}</span>
                        </div>

                        {/* Tooltip visible on hover */}
                        <div className="absolute bottom-full mb-2 bg-gray-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 whitespace-nowrap">
                          {count} étudiant(s) affecté(s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ÉTUDIANTS NÉCESSITANT UNE ATTENTION (ALERTE ACTIVE AVEC BOUTON RÉSOLUTION) */}
            <div className="bg-[#1a0505]/80 border border-red-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl mt-8 relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-red-500/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex justify-center items-center text-2xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  🚨
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Suivi des Alertes Actives</h3>
                  <p className="text-sm text-red-200/60">
                    Étudiants en difficulté à contacter pour accompagnement pédagogique (seul le doyen peut résoudre).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10">
                {unresolvedSurveys.length === 0 ? (
                  <div className="p-8 text-center text-red-200/50 italic bg-black/20 rounded-2xl border border-red-950/20">
                    Aucune alerte active sur cette période. Tous les cas ont été résolus ! 🎉
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-red-900/50">
                        <th className="p-4 text-red-400/80 font-bold text-sm">Étudiant</th>
                        <th className="p-4 text-red-400/80 font-bold text-sm">Promotion</th>
                        <th className="p-4 text-red-400/80 font-bold text-sm text-right">Facteurs Signalés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unresolvedSurveys.map((survey) => (
                        <tr key={survey.id} className="border-b border-red-900/20 hover:bg-red-900/10 transition-colors">
                          <td className="p-4">
                            <div className="text-white font-bold">
                              {survey.student?.prenom} {survey.student?.nom}
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">{survey.student?.promotion?.name || "N/A"}</td>
                          <td className="p-4 text-right">
                            <div className="flex flex-wrap gap-2 justify-end">
                              {survey.selectedFactors.map((f: string) => (
                                <span
                                  key={f}
                                  className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-red-300 animate-pulse"
                                >
                                  {f === "MENTAL" ? "🧠 Mental" : f === "PHYSIQUE" ? "🔋 Physique" : f === "FINANCE" ? "💰 Finance" : "⏳ Temps"}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* REGISTRE DES CONFUSIONS ANONYME ET ESTIMATION DE GRAVITÉ */}
            <div className="bg-[#050B14]/80 border border-indigo-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl mt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>💬</span> Registre Anonyme des Incompréhensions
              </h3>

              <div className="divide-y divide-indigo-950/20 max-h-[500px] overflow-y-auto custom-scrollbar p-1 space-y-4">
                {filteredConfusions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic bg-black/20 rounded-2xl">
                    Aucun signalement de confusion sur cette période.
                  </div>
                ) : (
                  filteredConfusions.map((conf) => {
                    const severity = getConfusionSeverity(conf.description);
                    return (
                      <div key={conf.id} className="p-6 bg-black/30 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all flex flex-col gap-4 animate-in fade-in">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                              {conf.type}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${severity.color}`}>
                              Gravité : {severity.label}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">
                            S.{conf.weekNumber} • {new Date(conf.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="font-bold text-white text-lg">{conf.course?.name}</p>
                        <p className="text-xs text-indigo-400 font-mono">Classe : {conf.course?.promotion?.name || "N/A"}</p>
                        
                        <div className="text-sm text-gray-300 italic bg-black/40 p-4 rounded-xl border border-white/5 relative">
                          <span className="absolute -top-3 -left-2 text-3xl opacity-20">"</span>
                          {conf.description}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: CARNET DE NOTES (GRADE BOOK) --- */}
        {activeTab === "GRADES" && (
          <div className="bg-[#050511] border border-blue-900/50 rounded-3xl p-8 backdrop-blur-md shadow-xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">
                  Carnet de Notes Académique
                </h2>
                <p className="text-sm text-gray-400 mt-1">Gérez les pondérations d'examens et enregistrez les notes des étudiants.</p>
              </div>

              {/* Sélecteur de Cours */}
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedCourseWorkId("");
                  }}
                  className="w-full md:w-auto bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900"
                >
                  <option value="" disabled>Sélectionner le cours...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCourse ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne de Gauche : Créer / Sélectionner Évaluation */}
                <div className="space-y-6">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span>➕</span> Nouvelle Évaluation
                    </h3>
                    <form onSubmit={handleCreateCourseWork} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type d'évaluation</label>
                        <select
                          value={evaluationType}
                          onChange={(e) => setEvaluationType(e.target.value as any)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 [&>option]:bg-gray-900"
                        >
                          <option value="TP">TP</option>
                          <option value="Interrogation">Interrogation</option>
                          <option value="Examen">Examen</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note maximale (Barème)</label>
                        <select
                          value={newWorkMaxGrade}
                          onChange={(e) => setNewWorkMaxGrade(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 [&>option]:bg-gray-900"
                        >
                          <option value="10">sur 10 points</option>
                          <option value="20">sur 20 points</option>
                          <option value="30">sur 30 points</option>
                          <option value="40">sur 40 points</option>
                          <option value="50">sur 50 points</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={addingWork}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        {addingWork ? "Création..." : "Ajouter au Barème"}
                      </button>
                    </form>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                      <span>📝</span> Évaluations Existantes
                    </h3>
                    {courseWorks.length === 0 ? (
                      <p className="text-sm italic text-gray-500 text-center py-4">Aucun travail enregistré.</p>
                    ) : (
                      <div className="space-y-2">
                        {courseWorks.map((work: any) => (
                          <button
                            key={work.id}
                            onClick={() => setSelectedCourseWorkId(work.id)}
                            className={`w-full p-4 rounded-xl text-left border flex items-center justify-between transition-all ${
                              selectedCourseWorkId === work.id
                                ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 font-bold"
                                : "bg-black/30 border-white/5 text-gray-400 hover:bg-black/60 hover:text-white"
                            }`}
                          >
                            <span>{work.title}</span>
                            <span className="text-xs font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                              / {work.maxGrade} pts
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne de Droite (Tableau de saisie de notes) */}
                <div className="lg:col-span-2">
                  {selectedCourseWorkId ? (
                    (() => {
                      const activeWork = courseWorks.find((w: any) => w.id === selectedCourseWorkId);
                      return activeWork ? (
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-6">
                          <div className="flex justify-between items-center pb-4 border-b border-white/10">
                            <div>
                              <h3 className="text-xl font-bold text-white">{activeWork.title}</h3>
                              <p className="text-xs text-indigo-400 font-mono mt-1">Promotion : {selectedCourse.promotion?.name || "N/A"}</p>
                            </div>
                            <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-black text-sm">
                              Barème : {activeWork.maxGrade} points
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="p-3 text-xs font-bold text-gray-400 uppercase">Étudiant</th>
                                  <th className="p-3 text-xs font-bold text-gray-400 uppercase text-center">Moyenne Globale</th>
                                  <th className="p-3 text-xs font-bold text-gray-400 uppercase text-center w-1/4">Note / {activeWork.maxGrade}</th>
                                  <th className="p-3 text-xs font-bold text-gray-400 uppercase text-center">État</th>
                                  <th className="p-3 text-xs font-bold text-gray-400 uppercase text-right w-1/4">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {students.map((student: any) => {
                                  const savedGrade = activeWork.grades?.find((g: any) => g.studentId === student.id);
                                  const inputKey = `${student.id}-${activeWork.id}`;
                                  const inputValue = gradeInputs[inputKey] !== undefined 
                                    ? gradeInputs[inputKey] 
                                    : (savedGrade ? savedGrade.value.toString() : "");

                                  const status = savedGrade ? getGradeStatus(savedGrade.value, activeWork.maxGrade) : null;

                                  return (
                                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                      <td className="p-3">
                                        <div className="text-white font-bold">{student.prenom} {student.nom}</div>
                                      </td>
                                      <td className="p-3 text-center">
                                        {(() => {
                                          const avg = calculateAverage(student.id);
                                          if (avg === null) return <span className="text-gray-500 text-xs italic">N/A</span>;
                                          const avgStatus = getAverageStatus(avg);
                                          return (
                                            <div className="flex flex-col items-center gap-1">
                                              <span className="font-bold text-white">{avg.toFixed(1)} / {selectedCourse.maxGrade || 50}</span>
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${avgStatus.color}`}>
                                                {avgStatus.label}
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </td>
                                      <td className="p-3 text-center">
                                        <input
                                          type="number"
                                          step="0.5"
                                          min="0"
                                          max={activeWork.maxGrade}
                                          placeholder="--"
                                          value={inputValue}
                                          onChange={(e) =>
                                            setGradeInputs({ ...gradeInputs, [inputKey]: e.target.value })
                                          }
                                          className="w-20 bg-black/60 border border-white/10 rounded-lg text-center px-2 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                        />
                                      </td>
                                      <td className="p-3 text-center">
                                        {status ? (
                                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${status.color}`}>
                                            {status.label}
                                          </span>
                                        ) : (
                                          <span className="text-gray-600 text-xs italic">Non noté</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right">
                                        <button
                                          onClick={() => handleSaveGrade(student.id, activeWork.id, inputValue)}
                                          disabled={savingGradeId === inputKey || inputValue === ""}
                                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                          {savingGradeId === inputKey ? "Sauvegarde..." : (savedGrade ? "Modifier" : "Enregistrer")}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="h-full border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-500">
                      <span className="text-5xl block mb-4">📑</span>
                      <p className="text-gray-400 font-medium">Sélectionnez ou créez une évaluation dans la colonne de gauche pour enregistrer les notes.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center italic py-8">Veuillez sélectionner un cours pour gérer le carnet de notes.</p>
            )}
          </div>
        )}

        {/* --- TAB: AI --- */}
        {activeTab === "AI" && (
          <div className="bg-[#020b08]/90 border border-emerald-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                🤖
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">
                  Assistant Pédagogique IA
                </h2>
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
