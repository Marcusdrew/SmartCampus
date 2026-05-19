"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImportCSVForm from "@/components/ImportCSVForm";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Create / Edit User State
  const [formData, setFormData] = useState({ 
    matricule: "", email: "", role: "PROFESSOR", password: "", status: "ACTIVE", 
    managedFacultyId: "", nom: "", prenom: "" 
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMsg, setAlertMsg] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/users");
        if(res.ok) {
            const data = await res.json();
            setUsers(data.users);
            setFaculties(data.faculties);
        } else {
            router.push("/dashboard"); // Non autorisé
        }
    } catch(err) {
        console.error("Fetch users error", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ 
      matricule: "", email: "", role: "PROFESSOR", password: "", status: "ACTIVE", 
      managedFacultyId: faculties.length > 0 ? faculties[0].id : "",
      nom: "", prenom: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ 
      matricule: user.matricule, email: user.email || "", role: user.role, password: "", status: user.status, 
      managedFacultyId: user.managedFacultyId || (faculties.length > 0 ? faculties[0].id : ""),
      nom: user.studentProfile?.nom || user.professorProfile?.nom || "",
      prenom: user.studentProfile?.prenom || user.professorProfile?.prenom || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, matricule: string) => {
    if(!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${matricule} ? Cette action est irréversible.`)) return;
    
    try {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
        if(res.ok) fetchUsers();
        else alert("Erreur lors de la suppression. Il est peut-être lié à des cours/ressources.");
    } catch(err) {
        alert("Erreur système.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("loading");
    setAlertMsg("");

    const isEdit = !!editingUser;
    const url = "/api/admin/users";
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit ? { id: editingUser.id, ...formData } : formData;

    try {
        const res = await fetch(url, {
            method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        const data = await res.json();

        if(!res.ok) throw new Error(data.error || "Erreur lors de l'opération");
        
        setSubmitStatus("success");
        setAlertMsg(isEdit ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès");
        setTimeout(() => {
            setIsModalOpen(false);
            setSubmitStatus("idle");
            fetchUsers();
        }, 1500);
    } catch(err: any) {
        setSubmitStatus("error");
        setAlertMsg(err.message);
    }
  };

  // UI Theme pour Admin (Rouge Rubis / Or / Noir Extrême)
  return (
    <div className="min-h-screen bg-[#070202] text-white font-sans relative overflow-hidden pb-20">
      {/* Background Admin Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <nav className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#1a0505]/80 border border-red-900/30 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-between items-center h-20 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-black border border-red-500/30 rounded-xl flex items-center justify-center group-hover:bg-red-900/30 transition-colors">
               <span className="text-xl">🔙</span>
             </div>
             <span className="font-bold text-red-200 group-hover:text-red-400 transition-colors">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold tracking-widest text-amber-500 uppercase px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">Super-Admin</span>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-500 tracking-tight drop-shadow-lg mb-2">
                    Gestion globale
                </h1>
                <p className="text-red-200/50 mb-8">Base de données des comptes et accès privilégiés.</p>
                
                <button onClick={handleOpenCreate} className="px-6 py-4 w-full sm:w-auto bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-t border-red-400/30 rounded-2xl font-bold shadow-lg shadow-red-900/50 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                    <span className="text-2xl">👤➕</span> <span>Créer un compte manuel</span>
                </button>
            </div>

            <div className="flex-1 max-w-md bg-[#110202] border border-blue-900/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.1)] backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="bg-blue-500/20 p-2 rounded-lg text-blue-400">📥</span> Création en masse
                  </h2>
                  <ImportCSVForm />
                </div>
            </div>
        </div>

        {/* Tableau des utilisateurs (Neo-Brutalism / Premium Dark) */}
        <div className="bg-[#110202] border border-red-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-red-950/40 border-b border-red-900/50 text-red-200 text-sm uppercase tracking-wider">
                        <th className="px-6 py-5 font-bold">Matricule</th>
                        <th className="px-6 py-5 font-bold">Nom & Prénom</th>
                        <th className="px-6 py-5 font-bold">Rôle</th>
                        <th className="px-6 py-5 font-bold">Email</th>
                        <th className="px-6 py-5 font-bold">Statut</th>
                        <th className="px-6 py-5 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-red-900/20">
                    {isLoading ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-red-500 animate-pulse">Chargement de la base de données...</td></tr>
                    ) : users.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-red-500/50">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                         users.map((user) => {
                             let nomComplet = user.studentProfile 
                                ? `${user.studentProfile.nom} ${user.studentProfile.prenom}`
                                : user.professorProfile
                                ? `${user.professorProfile.nom} ${user.professorProfile.prenom}`
                                : "—";
                             
                             if (user.role === 'DOYEN' && user.managedFacultyId) {
                                 const facName = faculties.find(f => f.id === user.managedFacultyId)?.name;
                                 nomComplet = `(Doyen) ${facName || "Faculté Inconnue"}`;
                             }
                             
                             return (
                             <tr key={user.id} className="hover:bg-red-900/10 transition-colors group">
                                <td className="px-6 py-5 font-mono text-red-100 font-bold">{user.matricule}</td>
                                <td className="px-6 py-5 text-gray-300 font-medium">{nomComplet}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                                        user.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        user.role === 'DOYEN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        user.role === 'PROFESSOR' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-gray-400 text-sm">{user.email || '—'}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>
                                        • {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(user)} className="text-sky-400 hover:text-sky-300 font-bold transition-colors">Modifier</button>
                                    <button onClick={() => handleDelete(user.id, user.matricule)} className="text-rose-500 hover:text-rose-400 font-bold transition-colors">Supprimer</button>
                                </td>
                            </tr>
                             );
                        })
                    )}
                </tbody>
             </table>
           </div>
        </div>
      </main>

      {/* Modal Edition/Création */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="w-full max-w-lg bg-[#0e0202] border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                  <h2 className="text-3xl font-bold text-white mb-6">
                      {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                  </h2>
                  
                  {alertMsg && (
                      <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${submitStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {alertMsg}
                      </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                          <label className="block text-red-200/60 text-sm font-bold mb-2">Matricule</label>
                          <input type="text" required value={formData.matricule} onChange={(e)=>setFormData({...formData, matricule: e.target.value})} 
                                 className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                      </div>
                      <div>
                          <label className="block text-red-200/60 text-sm font-bold mb-2">Email (Optionnel)</label>
                          <input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} 
                                 className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                      </div>
                      <div className="flex gap-4">
                          <div className="w-1/2">
                              <label className="block text-red-200/60 text-sm font-bold mb-2">Nom</label>
                              <input type="text" value={formData.nom} onChange={(e)=>setFormData({...formData, nom: e.target.value})} 
                                     placeholder="Optionnel"
                                     className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                          </div>
                          <div className="w-1/2">
                              <label className="block text-red-200/60 text-sm font-bold mb-2">Prénom</label>
                              <input type="text" value={formData.prenom} onChange={(e)=>setFormData({...formData, prenom: e.target.value})} 
                                     placeholder="Optionnel"
                                     className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="w-1/2">
                              <label className="block text-red-200/60 text-sm font-bold mb-2">Rôle</label>
                              <select value={formData.role} onChange={(e)=>setFormData({...formData, role: e.target.value})} 
                                      className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors [&>option]:bg-gray-900 [&>option]:text-white">
                                  <option value="STUDENT">Étudiant</option>
                                  <option value="PROFESSOR">Professeur</option>
                                  <option value="DOYEN">Doyen</option>
                                  <option value="ADMIN">Administrateur</option>
                              </select>
                          </div>
                          <div className="w-1/2">
                              <label className="block text-red-200/60 text-sm font-bold mb-2">Statut</label>
                              <select value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})} 
                                      className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors [&>option]:bg-gray-900 [&>option]:text-white">
                                  <option value="ACTIVE">Actif</option>
                                  <option value="INACTIVE">Inactif</option>
                              </select>
                          </div>
                      </div>

                      {formData.role === "DOYEN" && (
                         <div className="animate-in fade-in slide-in-from-top-2">
                             <label className="block text-purple-300 text-sm font-bold mb-2">Faculté gérée (Admin du Doyen)</label>
                             <select value={formData.managedFacultyId} onChange={(e)=>setFormData({...formData, managedFacultyId: e.target.value})} required 
                                     className="w-full bg-purple-900/20 border border-purple-500/50 rounded-xl px-4 py-3 text-purple-100 focus:outline-none focus:border-purple-400 transition-colors [&>option]:bg-gray-900 [&>option]:text-white">
                                 {faculties.length === 0 && <option value="" disabled>Aucune faculté disponible</option>}
                                 {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                             </select>
                         </div>
                      )}
                      
                      <div>
                          <label className="block text-red-200/60 text-sm font-bold mb-2">
                             Mot de passe {editingUser ? "(Laisser vide pour ne pas modifier)" : "provisoire"}
                          </label>
                          <input type="password" required={!editingUser} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} 
                                 className="w-full bg-black/50 border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button type="button" onClick={()=>setIsModalOpen(false)} className="w-1/2 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all">
                              Annuler
                          </button>
                          <button type="submit" disabled={submitStatus === "loading" || submitStatus === "success"} className="w-1/2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50">
                              {submitStatus === "loading" ? "Traitement..." : "Enregistrer"}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
