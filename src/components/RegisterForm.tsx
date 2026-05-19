"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Promotion = { id: string; name: string };
type Faculty = { id: string; name: string; promotions: Promotion[] };

export default function RegisterForm({ faculties }: { faculties: Faculty[] }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    facultyId: "",
    promotionId: "",
    password: "",
  });
  
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [generatedMatricule, setGeneratedMatricule] = useState("");

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
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setGeneratedMatricule(data.matricule);
      setStatus("success");
    } catch (err: any) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 p-6 rounded-2xl">
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Inscription réussie !</h3>
          <p className="text-green-700 dark:text-green-400 mb-4">
            Votre compte étudiant a été créé. Veuillez copier et conserver votre matricule ci-dessous, il vous servira d'identifiant pour vous connecter.
          </p>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-dashed border-green-400 dark:border-green-600 cursor-copy group w-full font-mono text-2xl font-bold text-gray-900 dark:text-white" onClick={() => navigator.clipboard.writeText(generatedMatricule)} title="Cliquer pour copier">
            {generatedMatricule}
            <div className="text-xs text-gray-500 font-sans mt-2 group-hover:text-green-600 transition-colors">Cliquer pour copier</div>
          </div>
        </div>
        <Link href="/login" className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
          Aller à la page de connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {status === "error" && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
          <input type="text" name="nom" required value={formData.nom} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postnom</label>
          <input type="text" name="postnom" value={formData.postnom} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
        <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Faculté *</label>
        <select name="facultyId" required value={formData.facultyId} onChange={handleFacultyChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
          <option value="" disabled>Sélectionnez une faculté</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Promotion *</label>
        <select name="promotionId" required value={formData.promotionId} onChange={handleChange} disabled={!formData.facultyId} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50">
          <option value="" disabled>Sélectionnez d'abord une faculté</option>
          {availablePromotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe *</label>
        <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
      </div>
      
      <div className="pt-2">
        <button type="submit" disabled={status === "loading"} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70">
          {status === "loading" ? "Création en cours..." : "S'inscrire et générer mon matricule"}
        </button>
      </div>

      <div className="text-center text-sm mt-4">
        <span className="text-gray-600 dark:text-gray-400">Déjà inscrit ? </span>
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
          Se connecter
        </Link>
      </div>
    </form>
  );
}
