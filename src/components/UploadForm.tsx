"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Formulaire interactif pour le téléversement (Upload)
export default function UploadForm({ courses }: { courses: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: "resource",
    title: "",
    courseId: "",
    semester: "1",
  });
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Veuillez sélectionner un fichier.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const data = new FormData();
    data.append("file", file);
    data.append("type", formData.type);
    data.append("courseId", formData.courseId);
    if (formData.type === "resource") {
      data.append("title", formData.title);
    } else {
      data.append("semester", formData.semester);
    }

    try {
      const res = await fetch("/api/professor/upload", {
        method: "POST",
        body: data, 
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur lors de l'envoi");

      setStatus("success");
      setMessage("Fichier envoyé avec succès !");
      setFormData({ type: "resource", title: "", courseId: "", semester: "1" });
      setFile(null);
      
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      router.refresh();
      
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between space-y-6">
      
      {status === "success" && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">{message}</div>}
      {status === "error" && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl text-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">{message}</div>}

      <div className="bg-black/30 p-2 rounded-2xl flex border border-white/5 relative z-20">
        <label className="flex-1 relative cursor-pointer group text-center z-20">
          <input type="radio" name="type" value="resource" checked={formData.type === "resource"} onChange={handleChange} className="sr-only" />
          <div className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "resource" ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 group-hover:text-white'}`}>
            Document Pédagogique
          </div>
        </label>
        <label className="flex-1 relative cursor-pointer group text-center z-20">
          <input type="radio" name="type" value="schedule" checked={formData.type === "schedule"} onChange={handleChange} className="sr-only" />
          <div className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === "schedule" ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 group-hover:text-white'}`}>
            Emploi du temps
          </div>
        </label>
      </div>

      <div className="space-y-5">
          <div className="relative z-20">
            <select name="courseId" required value={formData.courseId} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors">
              <option value="" disabled className="text-gray-500">Sélectionnez le cours cible...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>[{c.code}] {c.name} {c.promotion ? `(${c.promotion.name})` : ""}</option>
              ))}
            </select>
          </div>

          {formData.type === "resource" ? (
            <div className="relative z-10">
              <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Titre explicite (ex: Chapitre 1 - Intro)" className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-colors" />
            </div>
          ) : (
            <div className="relative z-20">
              <select name="semester" value={formData.semester} onChange={handleChange} className="w-full rounded-2xl border border-white/10 px-5 py-4 bg-black/40 text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none [&>option]:bg-gray-900 [&>option]:text-white transition-colors">
                <option value="1">Semestre 1</option>
                <option value="2">Semestre 2</option>
              </select>
            </div>
          )}

          <div className="relative z-10">
            <input id="file-upload" type="file" required onChange={handleFileChange} className="w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/20 text-white focus:outline-none file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 transition-colors file:cursor-pointer p-0" />
          </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 mt-4 relative z-10"
      >
        {status === "loading" ? "Transmission Spatiale..." : "Publier le document"}
      </button>
    </form>
  );
}
