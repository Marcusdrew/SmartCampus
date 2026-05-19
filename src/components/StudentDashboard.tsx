"use client";

import { useState } from "react";
import PerformanceSurveyForm from "@/components/PerformanceSurveyForm";
import ConfusionForm from "@/components/ConfusionForm";
import CourseEvaluationForm from "@/components/CourseEvaluationForm";
import StudentAIClient from "@/components/StudentAIClient";

import { useRouter } from "next/navigation";

export default function StudentDashboard({ studentCourses, profile, faculties, sessionUser, surveys }: { studentCourses: any[], profile: any, faculties: any[], sessionUser: any, surveys: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"COURS" | "SUIVI" | "IA">("COURS");
  const [showClassModal, setShowClassModal] = useState(!profile); // Force setup si pas de profil

  // Formulaire d'inscription
  const [formData, setFormData] = useState({
      nom: profile?.nom || "",
      prenom: profile?.prenom || "",
      facultyId: profile?.facultyId || "",
      promotionId: profile?.promotionId || ""
  });
  const [availablePromotions, setAvailablePromotions] = useState<any[]>(
      faculties.find((f: any) => f.id === formData.facultyId)?.promotions || []
  );
  const [saving, setSaving] = useState(false);

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facId = e.target.value;
    setFormData({ ...formData, facultyId: facId, promotionId: "" });
    const fac = faculties.find((f: any) => f.id === facId);
    setAvailablePromotions(fac ? fac.promotions : []);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
          const res = await fetch("/api/student/promotion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });
          if (res.ok) {
              setShowClassModal(false);
              router.refresh();
          } else {
              alert("Erreur lors de l'enregistrement de votre classe.");
          }
      } catch (err) {
          alert("Erreur réseau.");
      }
      setSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2">
          <button 
            onClick={() => setActiveTab("COURS")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "COURS" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            📚 Mes Cours & Ressources
          </button>
          <button 
            onClick={() => setActiveTab("SUIVI")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "SUIVI" ? "bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            📊 Suivi & Évaluations
          </button>
          <button 
            onClick={() => setActiveTab("IA")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "IA" ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            🤖 Assistant IA
          </button>
        </div>
      </div>
      
      {profile && (
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-2xl flex items-center justify-center">🏫</div>
                <div>
                   <h3 className="text-white font-bold">Votre Classe actuelle</h3>
                   <p className="text-blue-300/80 text-sm">
                     {profile.faculty?.name || "Faculté non assignée"} • {profile.promotion?.name || "Promotion non assignée"}
                   </p>
                </div>
             </div>
             <button 
                onClick={() => setShowClassModal(true)}
                className="relative z-10 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all text-sm shadow-[0_0_15px_rgba(59,130,246,0.1)] whitespace-nowrap w-full sm:w-auto"
             >
                🔄 Mettre à jour l'année
             </button>
          </div>
      )}

      {/* Tab Panels */}
      <div className="relative animate-in fade-in duration-500 slide-in-from-bottom-4">
        
        {/* TAB 1: COURS */}
        {activeTab === "COURS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {studentCourses.length === 0 ? (
                <div className="col-span-full border border-dashed border-white/20 rounded-3xl p-12 text-center bg-white/5">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-white mb-2">Aucun cours disponible</h3>
                <p className="text-gray-400">Vous n'êtes inscrit à aucun cours pour ce semestre.</p>
                </div>
            ) : (
                studentCourses.map(course => (
                <div key={course.id} className="bg-[#110212]/80 border border-fuchsia-900/40 rounded-3xl p-6 lg:p-8 relative overflow-hidden group shadow-2xl backdrop-blur-md hover:-translate-y-1 transition-all">
                    <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-fuchsia-600/20 rounded-full blur-[80px] group-hover:bg-fuchsia-500/30 transition-colors pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                        <div>
                        <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 text-xs font-bold rounded-lg mb-3 inline-block font-mono tracking-wider shadow-[0_0_10px_rgba(217,70,239,0.3)]">{course.code}</span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">{course.name}</h3>
                        <p className="mt-2 text-sm text-fuchsia-200/60 font-medium">
                           Enseigné par : {course.professor ? (
                              <span className="text-fuchsia-300 font-bold">Prof. {course.professor.professorProfile ? `${course.professor.professorProfile.nom} ${course.professor.professorProfile.prenom}` : course.professor.matricule}</span>
                           ) : (
                              <span className="italic text-gray-500">Professeur non assigné</span>
                           )}
                        </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider"><span className="text-lg">📁</span> Ressources Pédagogiques</h4>
                        {course.resources.length === 0 ? (
                            <p className="text-sm italic text-gray-500 bg-black/20 p-3 rounded-xl border border-white/5 text-center">Aucune ressource publiée</p>
                        ) : (
                            <ul className="space-y-2">
                            {course.resources.map((res: any) => (
                                <li key={res.id}>
                                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl bg-gradient-to-r from-white/5 to-transparent hover:from-fuchsia-500/20 hover:to-transparent border border-white/10 hover:border-fuchsia-500/30 transition-all group/link">
                                    <span className="bg-fuchsia-500/20 p-2 rounded-lg text-fuchsia-400 mr-3 group-hover/link:scale-110 transition-transform shadow-[0_0_10px_rgba(217,70,239,0.3)]">📄</span>
                                    <span className="text-gray-200 font-medium group-hover/link:text-white transition-colors">{res.title}</span>
                                </a>
                                </li>
                            ))}
                            </ul>
                        )}
                        </div>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {/* TAB 2: SUIVI ET EVALUATIONS */}
        {activeTab === "SUIVI" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
               <PerformanceSurveyForm />
            </div>

            {surveys && surveys.length > 0 && (
                <div className="lg:col-span-2 bg-[#050B14]/80 border border-indigo-900/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl transition-all">
                  <h3 className="text-xl font-bold text-white mb-6">Mon Historique Factoriel</h3>
                  <div className="space-y-4">
                     {surveys.map((survey, idx) => {
                        let insight = null;
                        if (idx === 0) {
                            if (survey.selectedFactors.includes("PHYSIQUE")) insight = "💡 Saviez-vous qu'un sommeil insuffisant réduit la capacité d'apprentissage de 30% ? Reposez-vous !";
                            else if (survey.selectedFactors.includes("TEMPS")) insight = "💡 Astuce : La technique Pomodoro (25min travail, 5min pause) aide face à la surcharge.";
                            else if (survey.selectedFactors.includes("MENTAL")) insight = "💡 N'hésitez pas à parler de votre stress à un proche ou conseiller. Vous n'êtes pas seul(e).";
                            else if (survey.selectedFactors.includes("FINANCE")) insight = "💡 L'université est consciente des défis financiers. N'hésitez pas à consulter l'administration.";
                        }
                        
                        return (
                          <div key={survey.id} className="bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
                             {idx === 0 && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">LE PLUS RÉCENT</div>}
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                   <div className="text-indigo-400 font-bold mb-1">Semaine {survey.weekNumber}</div>
                                   <div className="text-xs text-gray-500">{new Date(survey.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   {survey.selectedFactors.map((f: string) => (
                                      <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 shadow-inner">
                                         {f === "MENTAL" ? "🧠 Mental" : f === "PHYSIQUE" ? "🔋 Physique" : f === "FINANCE" ? "💰 Finance" : "⏳ Temps"}
                                      </span>
                                   ))}
                                </div>
                             </div>
                             {insight && (
                                <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm p-3 rounded-xl flex items-start gap-2 shadow-inner transition-transform group-hover:scale-[1.01]">
                                   <span>{insight}</span>
                                </div>
                             )}
                          </div>
                        );
                     })}
                  </div>
                </div>
            )}
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl transition-all hover:border-orange-500/30">
               {studentCourses.length > 0 ? (
                 <ConfusionForm courses={studentCourses} />
               ) : (
                 <div className="text-center p-6 border border-dashed border-orange-500/30 rounded-2xl bg-orange-500/5">
                    <span className="text-4xl block mb-4">⚠️</span>
                    <p className="text-orange-200">Impossible de signaler une confusion sans cours.</p>
                 </div>
               )}
            </div>

            <div className="lg:col-span-2 bg-[#1a0520]/80 border border-fuchsia-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl transition-all hover:border-fuchsia-500/40">
               {studentCourses.length > 0 ? (
                 <CourseEvaluationForm courses={studentCourses} />
               ) : (
                 <p className="text-gray-500 text-center text-sm italic">Évaluations inaccessibles (aucun cours).</p>
               )}
            </div>
          </div>
        )}

        {/* TAB 3: IA */}
        {activeTab === "IA" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#050e1a]/80 border border-cyan-900/50 rounded-3xl p-8 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.1)] transition-all hover:border-cyan-500/40">
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                 <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">🤖</div>
                 <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">Assistant IA ULC</h2>
                    <p className="text-cyan-200/50 text-sm mt-1">Posez vos questions sur vos cours, demandez des explications...</p>
                 </div>
               </div>
               <StudentAIClient />
            </div>
          </div>
        )}

      </div>

      {/* Modale d'Auto-inscription / Passage de classe */}
      {showClassModal && (
         <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#050b14] border border-cyan-500/50 p-8 rounded-[2rem] shadow-[0_0_100px_rgba(6,182,212,0.2)]">
                <div className="mb-6 text-center">
                   <div className="w-16 h-16 mx-auto bg-cyan-500/20 rounded-2xl flex items-center justify-center text-3xl border border-cyan-500/30 mb-4">🎓</div>
                   <h2 className="text-2xl font-black text-white">{profile ? "Passage de classe" : "Bienvenue ! Complétez votre profil"}</h2>
                   <p className="text-sm text-cyan-200/70 mt-2">
                       {profile 
                         ? "Félicitations pour votre nouvelle année scolaire. Sélectionnez votre nouvelle promotion pour que nous puissions mettre à jour vos cours." 
                         : "Avant d'accéder à vos cours, veuillez indiquer votre nom, prénom et votre classe actuelle."}
                   </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-bold text-cyan-200/60 mb-1">Nom *</label>
                           <input type="text" required value={formData.nom} onChange={(e)=>setFormData({...formData, nom: e.target.value})} className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-cyan-200/60 mb-1">Prénom *</label>
                           <input type="text" required value={formData.prenom} onChange={(e)=>setFormData({...formData, prenom: e.target.value})} className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                       </div>
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-cyan-200/60 mb-1">Faculté/Département *</label>
                      <select required value={formData.facultyId} onChange={handleFacultyChange} className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 [&>option]:bg-gray-900">
                          <option value="" disabled>Sélectionner...</option>
                          {faculties.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                   </div>
                   
                   <div>
                      <label className="block text-sm font-bold text-cyan-200/60 mb-1">Classe / Promotion *</label>
                      <select required disabled={!formData.facultyId} value={formData.promotionId} onChange={(e)=>setFormData({...formData, promotionId: e.target.value})} className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 [&>option]:bg-gray-900">
                          <option value="" disabled>Sélectionner...</option>
                          {availablePromotions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>

                   <div className="flex gap-4 pt-4">
                      {profile && (
                          <button type="button" onClick={() => setShowClassModal(false)} className="w-1/3 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all">
                             Annuler
                          </button>
                      )}
                      <button type="submit" disabled={saving} className={`${profile ? 'w-2/3' : 'w-full'} py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50`}>
                          {saving ? "Sauvegarde..." : "Enregistrer et Démarrer"}
                      </button>
                   </div>
                </form>
            </div>
         </div>
      )}

    </div>
  );
}
