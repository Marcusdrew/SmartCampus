"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import CourseForm from "@/components/CourseForm";

type Faculty = { id: string; name: string };
type Promotion = { id: string; name: string };
type FacultyWithPromotions = Faculty & { promotions: Promotion[] };
type Professor = { id: string; matricule: string; professorProfile: any };

export default function CourseList({ initialCourses, faculties, professors }: { initialCourses: any[], faculties: FacultyWithPromotions[], professors: Professor[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", code: "", semester: "1", facultyId: "", promotionId: "", professorId: "" });
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Nouveaux Onglets Principaux
  const [mainTab, setMainTab] = useState<"MANAGE" | "STATS">("MANAGE");
  const [activeStatTab, setActiveStatTab] = useState<"PROF" | "FAC" | "PROM">("PROF");

  const getStats = () => {
    const totalCours = courses.length;
    const coursAssignes = courses.filter(c => c.professorId).length;
    
    // Par faculté
    const parFaculte = faculties.map(f => {
      const coursFac = courses.filter(c => c.facultyId === f.id);
      return { name: f.name, count: coursFac.length, courses: coursFac };
    }).filter(f => f.count > 0);

    // Par promotion
    const allPromotions = faculties.flatMap(f => f.promotions);
    const parPromotion = allPromotions.map(p => {
      const coursProm = courses.filter(c => c.promotionId === p.id);
      return { 
        name: p.name, 
        faculty: faculties.find(f => f.promotions.some(pro => pro.id === p.id))?.name,
        count: coursProm.length, 
        courses: coursProm 
      };
    }).filter(p => p.count > 0);

    // Par Professeur
    const parProf = professors.map(prof => {
      const coursProf = courses.filter(c => c.professorId === prof.id);
      const name = prof.professorProfile ? `${prof.professorProfile.nom} ${prof.professorProfile.prenom}` : prof.matricule;
      return { name, count: coursProf.length, courses: coursProf };
    }).filter(p => p.count > 0);

    return { totalCours, coursAssignes, parFaculte, parPromotion, parProf };
  };

  const stats = getStats();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le cours "${name}" ? (Cela supprimera aussi les horaires et ressources liées)`)) return;
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== id));
        router.refresh();
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    }
    setLoadingId(null);
  };

  const handleEditOpen = (course: any) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      semester: course.semester.toString(),
      facultyId: course.facultyId,
      promotionId: course.promotionId,
      professorId: course.professorId || "",
    });
    const fac = faculties.find(f => f.id === course.facultyId);
    setAvailablePromotions(fac ? fac.promotions : []);
  };

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facId = e.target.value;
    setFormData({ ...formData, facultyId: facId, promotionId: "" });
    const fac = faculties.find((f) => f.id === facId);
    setAvailablePromotions(fac ? fac.promotions : []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCourse.id, ...formData, semester: parseInt(formData.semester, 10) })
      });
      if (res.ok) {
        router.refresh(); 
        setEditingCourse(null);
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      
      {/* 🚀 GRANDS ONGLETS DE NAVIGATION PRINCIPALE */}
      <div className="flex space-x-6 border-b border-indigo-900/50 pb-1 w-max">
         <button onClick={() => setMainTab("MANAGE")} className={`pb-4 px-4 text-lg font-black transition-all ${mainTab === "MANAGE" ? "text-indigo-400 border-b-4 border-indigo-500" : "text-gray-500 hover:text-indigo-300"}`}>
            ⚙️ Création & Gestion
         </button>
         <button onClick={() => setMainTab("STATS")} className={`pb-4 px-4 text-lg font-black transition-all ${mainTab === "STATS" ? "text-indigo-400 border-b-4 border-indigo-500" : "text-gray-500 hover:text-indigo-300"}`}>
            📊 Statistiques & Rapports
         </button>
      </div>

      {mainTab === "MANAGE" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE: FORMULAIRE DE CRÉATION */}
          <div className="lg:col-span-4">
              <div className="bg-[#050511] border border-indigo-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(99,102,241,0.1)] backdrop-blur-md sticky top-32">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                   <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">📝</span> Créer un cours
                 </h2>
                 <div className="glass-form-container">
                    <CourseForm faculties={faculties} professors={professors} />
                 </div>
              </div>
          </div>

          {/* COLONNE DROITE: LISTE ET HORAIRES */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-[#050511] border border-indigo-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-indigo-900/50 bg-indigo-950/20">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">📋</span> Liste des Cours
                 </h3>
               </div>
               
               <div className="bg-indigo-950/10 p-6 border-b border-indigo-900/50">
                  <h4 className="text-lg font-bold text-indigo-200 mb-4 flex items-center gap-2">
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">🗓️</span> Importer les horaires (Zimbra)
                  </h4>
                  <UploadForm courses={courses} />
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-indigo-950/40 border-b border-indigo-900/50 text-indigo-200 text-sm uppercase tracking-wider">
                            <th className="px-6 py-5 font-bold">Détails du Cours</th>
                            <th className="px-6 py-5 font-bold">Faculté & Promotion</th>
                            <th className="px-6 py-5 font-bold">Titulaire</th>
                            <th className="px-6 py-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-900/20">
                        {courses.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-indigo-500/50">Aucun cours disponible.</td></tr>
                        ) : (
                             courses.map((course) => (
                                 <tr key={course.id} className="hover:bg-indigo-900/10 transition-colors group">
                                     <td className="px-6 py-5">
                                         <div className="font-bold text-white flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            {course.name}
                                         </div>
                                         <div className="text-xs text-indigo-400 font-mono mt-1 w-max px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-800">
                                            {course.code} • Semestre {course.semester}
                                         </div>
                                     </td>
                                     <td className="px-6 py-5 text-sm">
                                         <span className="text-gray-300 font-medium">{course.faculty?.name || "N/A"}</span>
                                         <span className="block text-indigo-400/70 text-xs mt-1 font-bold">{course.promotion?.name || "N/A"}</span>
                                     </td>
                                     <td className="px-6 py-5 text-sm">
                                         {course.professor ? (
                                           <span className="text-sm bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 w-max max-w-[200px] sm:max-w-none text-center sm:text-left break-words whitespace-normal leading-tight">
                                              👨‍🏫 Prof. {course.professor.professorProfile ? `${course.professor.professorProfile.nom} ${course.professor.professorProfile.prenom}` : course.professor.matricule}
                                           </span>
                                         ) : (
                                           <span className="text-sm text-gray-500 italic">Non assigné</span>
                                         )}
                                     </td>
                                     <td className="px-6 py-5 text-right space-x-3">
                                         <button disabled={loadingId === course.id} onClick={() => handleEditOpen(course)} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors">Éditer</button>
                                         <button disabled={loadingId === course.id} onClick={() => handleDelete(course.id, course.name)} className="text-red-500 hover:text-red-400 text-sm font-bold transition-colors">{loadingId === course.id ? "Suppression..." : "Supprimer"}</button>
                                     </td>
                                 </tr>
                             ))
                        )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === "STATS" && (
        <div className="bg-[#050511] border border-indigo-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
           <div className="p-8 bg-[#0a001a]">
             
             {/* En-tête des stats */}
             <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 rounded-3xl p-6 shadow-lg shadow-indigo-900/20 mb-8">
                <div>
                   <h4 className="text-indigo-200 text-sm font-black uppercase tracking-wider mb-1">Total Base de données</h4>
                   <div className="text-5xl font-black text-white">{stats.totalCours} <span className="text-xl text-indigo-400 font-medium">Cours</span></div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                   <div className="text-2xl font-bold text-white">{stats.coursAssignes}</div>
                   <div className="text-indigo-400 text-sm mt-1">Assignés à un professeur</div>
                </div>
             </div>

             {/* Navigation sous forme d'onglets pour Stats */}
             <div className="flex space-x-4 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <button onClick={() => setActiveStatTab("PROF")} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 min-w-[180px] hover:-translate-y-1 ${activeStatTab === "PROF" ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]" : "bg-black/30 border-white/10 text-gray-500 hover:bg-black/50"}`}>
                   <span className="text-3xl mb-3">👨‍🏫</span>
                   <span className="font-bold text-sm uppercase tracking-wide">Professeurs</span>
                </button>
                <button onClick={() => setActiveStatTab("FAC")} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 min-w-[180px] hover:-translate-y-1 ${activeStatTab === "FAC" ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]" : "bg-black/30 border-white/10 text-gray-500 hover:bg-black/50"}`}>
                   <span className="text-3xl mb-3">🏛️</span>
                   <span className="font-bold text-sm uppercase tracking-wide">Facultés</span>
                </button>
                <button onClick={() => setActiveStatTab("PROM")} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 min-w-[180px] hover:-translate-y-1 ${activeStatTab === "PROM" ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]" : "bg-black/30 border-white/10 text-gray-500 hover:bg-black/50"}`}>
                   <span className="text-3xl mb-3">🎓</span>
                   <span className="font-bold text-sm uppercase tracking-wide">Promotions</span>
                </button>
             </div>

             {/* Contenu Dynamique Stats */}
             <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-3xl p-6 min-h-[300px]">
               
               {activeStatTab === "PROF" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {stats.parProf.map((prof, idx) => (
                     <div key={idx} className="bg-black/40 border border-amber-900/30 rounded-2xl p-5 hover:border-amber-500/40 transition-colors">
                       <div className="flex justify-between items-start mb-4">
                         <span className="font-bold text-white leading-tight">{prof.name}</span>
                         <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg ml-2">{prof.count}</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {prof.courses.map(c => (
                             <span key={c.id} className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded-md">{c.name}</span>
                          ))}
                       </div>
                     </div>
                   ))}
                   {stats.parProf.length === 0 && <div className="col-span-full py-10 text-center text-indigo-500/50">Aucun cours assigné</div>}
                 </div>
               )}

               {activeStatTab === "FAC" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {stats.parFaculte.map((fac, idx) => (
                     <div key={idx} className="bg-black/40 border border-indigo-900/40 rounded-2xl p-5 hover:border-indigo-500/40 transition-colors flex items-center justify-between">
                         <span className="font-bold text-white">{fac.name}</span>
                         <span className="bg-indigo-600 text-white text-sm font-black px-3 py-1.5 rounded-xl">{fac.count}</span>
                     </div>
                   ))}
                 </div>
               )}

               {activeStatTab === "PROM" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {stats.parPromotion.map((prom, idx) => (
                     <div key={idx} className="bg-black/40 border border-blue-900/40 rounded-2xl p-5 hover:border-blue-500/40 transition-colors flex items-center justify-between">
                         <div>
                            <div className="font-bold text-white">{prom.name}</div>
                            <div className="text-xs text-blue-400/50 mt-1">{prom.faculty}</div>
                         </div>
                         <span className="bg-blue-600 text-white text-sm font-black px-3 py-1.5 rounded-xl">{prom.count}</span>
                     </div>
                   ))}
                 </div>
               )}

             </div>
           </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-[#090b14] border border-blue-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
            <h2 className="text-3xl font-bold text-white mb-6">Modifier le cours</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Code</label>
                  <input type="text" required value={formData.code} onChange={(e)=>setFormData({...formData, code: e.target.value})} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Nom</label>
                  <input type="text" required value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Faculté</label>
                  <select required value={formData.facultyId} onChange={handleFacultyChange} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900">
                    <option value="" disabled>Choisir...</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Promotion</label>
                  <select required value={formData.promotionId} onChange={(e)=>setFormData({...formData, promotionId: e.target.value})} disabled={!formData.facultyId} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 [&>option]:bg-gray-900">
                    <option value="" disabled>Choisir...</option>
                    {availablePromotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Semestre</label>
                  <select required value={formData.semester} onChange={(e)=>setFormData({...formData, semester: e.target.value})} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900">
                    <option value="1">Semestre 1</option>
                    <option value="2">Semestre 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-blue-200/60 text-sm font-bold mb-1">Professeur</label>
                  <select value={formData.professorId} onChange={(e)=>setFormData({...formData, professorId: e.target.value})} className="w-full bg-black/50 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900">
                    <option value="">(Non assigné)</option>
                    {professors.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.professorProfile ? `${p.professorProfile.nom} ${p.professorProfile.prenom}` : p.matricule}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={()=>setEditingCourse(null)} className="w-1/2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50">
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
