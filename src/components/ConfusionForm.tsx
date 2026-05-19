"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Course = { id: string; name: string; code: string };

export default function ConfusionForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    courseId: "",
    type: "Theorie",
    description: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/student/confusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de soumission");

      setStatus("success");
      setMessage("Signalement bien reçu par le professeur.");
      setFormData({ courseId: "", type: "Theorie", description: "" });
      
      setTimeout(() => setStatus("idle"), 5000);
      router.refresh();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between space-y-4">
      <div className="flex items-center gap-3 mb-2">
         <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl text-xl">❓</span>
         <div>
            <h3 className="text-xl font-bold text-white tracking-wide">Alerte Confusion</h3>
            <p className="text-xs text-gray-400">Ne restez pas bloqué sur un concept</p>
         </div>
      </div>
      
      {status === "success" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 text-center animate-in fade-in duration-500">
          <span className="text-4xl mb-3">📬</span>
          <p className="text-orange-300 font-bold">{message}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-5">
          {status === "error" && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          <div>
            <select
              name="courseId"
              required
              value={formData.courseId}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors"
            >
              <option value="" disabled className="text-gray-500">Sélectionnez le cours concerné...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-black/30 p-2 rounded-2xl flex border border-white/5">
            {["Theorie", "TP", "Exercice"].map(t => (
              <label key={t} className="flex-1 relative cursor-pointer group text-center">
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={formData.type === t}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`py-2 rounded-xl text-sm font-bold transition-all ${formData.type === t ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 group-hover:text-white'}`}>
                  {t}
                </div>
              </label>
            ))}
          </div>

          <div>
            <textarea
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Expliquez précisémment ce que vous n'avez pas compris..."
              className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-orange-500/50 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !formData.courseId}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {status === "loading" ? "Envoi..." : "Signaler au Professeur"}
          </button>
        </div>
      )}
    </form>
  );
}
