"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourseEvaluationForm({ courses }: { courses: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    courseId: "",
    rating: "5",
    comment: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      setMsg("Veuillez sélectionner un cours.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/student/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de soumission");

      setStatus("success");
      setMsg("Votre évaluation a été enregistrée avec succès. Merci !");
      setFormData({ courseId: "", rating: "5", comment: "" });
      router.refresh();

      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setStatus("error");
      setMsg(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
           <span className="bg-fuchsia-500/20 text-fuchsia-400 p-2 rounded-lg text-lg">⭐</span> Évaluation des Cours
        </h3>
        <p className="text-fuchsia-200/50 text-sm">Aidez-nous à améliorer la qualité de l'enseignement en évaluant vos cours.</p>
      </div>

      {status === "success" && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]">{msg}</div>}
      {status === "error" && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">{msg}</div>}

      <div>
        <select 
          value={formData.courseId} 
          onChange={(e) => setFormData({...formData, courseId: e.target.value})}
          className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white focus:ring-2 focus:ring-fuchsia-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors"
        >
          <option value="" disabled className="text-gray-500">Sélectionnez le cours à évaluer...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-fuchsia-200/60 text-sm font-bold mb-4 text-center">Note (1 à 5 étoiles)</label>
        <div className="flex justify-center gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((star) => (
             <button
               key={star}
               type="button"
               onClick={() => setFormData({...formData, rating: star.toString()})}
               className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold transition-all text-2xl sm:text-3xl ${
                 parseInt(formData.rating) >= star 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-110" 
                  : "bg-black/40 text-white/20 border border-white/10 hover:bg-white/10"
               }`}
             >
               ★
             </button>
          ))}
        </div>
      </div>

      <div>
        <textarea 
          placeholder="Qu'avez-vous particulièrement apprécié ou qu'est-ce qui pourrait être amélioré ? (Optionnel)"
          value={formData.comment}
          onChange={(e) => setFormData({...formData, comment: e.target.value})}
          className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white placeholder-gray-500 focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-colors min-h-[120px] resize-none"
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={status === "loading" || !formData.courseId}
        className="w-full py-4 mt-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-fuchsia-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {status === "loading" ? "Envoi..." : "Soumettre mon évaluation"}
      </button>
    </form>
  );
}
