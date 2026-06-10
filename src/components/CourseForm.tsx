"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Faculty = { id: string; name: string };
type Promotion = { id: string; name: string };
type FacultyWithPromotions = Faculty & { promotions: Promotion[] };
type Professor = { id: string; matricule: string; professorProfile: any };

export default function CourseForm({ faculties, professors }: { faculties: FacultyWithPromotions[], professors: Professor[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    semester: "1",
    facultyId: "",
    promotionId: "",
    professorId: "",
    credits: "0",
    maxGrade: "50",
  });

  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facId = e.target.value;
    setFormData({ ...formData, facultyId: facId, promotionId: "" });
    const fac = faculties.find((f) => f.id === facId);
    setAvailablePromotions(fac ? fac.promotions : []);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          semester: parseInt(formData.semester, 10)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      setMsg({ text: "Cours ajouté avec succès!", type: "success" });
      setFormData({ name: "", code: "", semester: "1", facultyId: "", promotionId: "", professorId: "", credits: "0", maxGrade: "50" });
      router.refresh();
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
      
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-bold text-center border ${msg.type === "error" ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Code du Cours (ex: INF101) *</label>
          <input type="text" name="code" required value={formData.code} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Nom du Cours *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Faculté *</label>
          <select name="facultyId" required value={formData.facultyId} onChange={handleFacultyChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors">
            <option value="" disabled className="text-gray-500">Choisir...</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Promotion *</label>
          <select name="promotionId" required value={formData.promotionId} onChange={handleChange} disabled={!formData.facultyId} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white disabled:opacity-50 transition-colors">
            <option value="" disabled className="text-gray-500">Choisir...</option>
            {availablePromotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Semestre *</label>
          <select name="semester" required value={formData.semester} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors">
            <option value="1">Semestre 1</option>
            <option value="2">Semestre 2</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Professeur Titulaire</label>
          <select name="professorId" value={formData.professorId} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors">
            <option value="">Aucun professeur défini</option>
            {professors.map(p => (
              <option key={p.id} value={p.id}>
                {p.professorProfile ? `${p.professorProfile.nom} ${p.professorProfile.prenom}` : p.matricule}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Crédits du Cours (Coeff)</label>
          <input type="number" name="credits" required min="0" value={formData.credits} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-indigo-200/60 mb-2">Pondération Globale (sur X points)</label>
          <input type="number" name="maxGrade" required min="1" value={formData.maxGrade} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-3.5 bg-black/40 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
        {loading ? "Création en cours..." : "Créer le cours"}
      </button>
    </form>
  );
}
