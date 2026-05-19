"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportCSVForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) throw new Error("Le fichier est vide ou manque de données.");

    const delimiter = lines[0].includes(";") ? ";" : ",";
    
    // Convertir les en-têtes en minuscules et retirer les espaces
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const nomIdx = headers.indexOf("nom");
    const prenomIdx = headers.indexOf("prenom") !== -1 ? headers.indexOf("prenom") : headers.indexOf("prénom");
    const postnomIdx = headers.indexOf("postnom");
    const emailIdx = headers.indexOf("email");

    if (nomIdx === -1 || prenomIdx === -1) {
      throw new Error("L'en-tête CSV doit contenir au moins: nom, prenom (et optionnellement postnom, email)");
    }

    const professors = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 2) {
            professors.push({
                nom: values[nomIdx],
                prenom: values[prenomIdx],
                postnom: postnomIdx !== -1 ? values[postnomIdx] : null,
                email: emailIdx !== -1 ? values[emailIdx] : null,
            });
        }
    }
    return professors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Veuillez sélectionner un fichier CSV.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setErrorsList([]);
    setCredentials([]);

    try {
      const text = await file.text();
      const professors = processCSV(text);

      if (professors.length === 0) {
        throw new Error("Aucun professeur trouvé dans le fichier.");
      }

      const res = await fetch("/api/admin/import-professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professors }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de serveur");
      }

      setStatus("success");
      setMessage(`${data.imported} professeurs importés et générés avec succès !`);
      if (data.credentials) setCredentials(data.credentials);
      if (data.errors && data.errors.length > 0) setErrorsList(data.errors);

      setFile(null);
      const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      router.refresh();
      
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-200 mt-1">
            Format requis (première ligne) : <code className="font-mono bg-black/40 px-2 py-1 rounded text-blue-300">nom, prenom, postnom, email</code>
          </p>
          <p className="text-xs text-blue-400 mt-2">Pensez à bien exporter votre tableau Excel en format <b>.CSV (séparateur: virgule)</b>. Les matricules et mots de passe sécurisés seront générés automatiquement.</p>
      </div>

      {status === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          {message}
          
          {credentials.length > 0 && (
            <div className="mt-4 bg-black/40 border border-emerald-500/30 rounded-xl overflow-x-auto p-2">
              <p className="text-emerald-300 mb-2 font-black text-xs uppercase tracking-widest pl-2 pt-1 mb-3">Identifiants Générés (Copiez-les !) :</p>
              <table className="w-full text-left text-xs text-white">
                <thead><tr className="border-b border-white/10 text-emerald-500"><th className="pb-2">Professeur</th><th className="pb-2">Matricule</th><th className="pb-2">Mot de Passe</th></tr></thead>
                <tbody>
                  {credentials.map((c, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="py-2">{c.nom} {c.prenom}</td>
                      <td className="py-2 font-mono text-cyan-300 select-all">{c.matricule}</td>
                      <td className="py-2 font-mono text-rose-300 select-all">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {errorsList.length > 0 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
              <p className="font-bold mb-2">Comptes ignorés (Déjà existants) :</p>
              <ul className="list-none space-y-1">
                {errorsList.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          {message}
        </div>
      )}

      <div>
        <input 
          id="csv-upload"
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          disabled={status === "loading"}
          className="w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/20 text-white focus:outline-none file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-colors file:cursor-pointer p-0 disabled:opacity-50" 
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || !file}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {status === "loading" ? "Analyse & Création en cours..." : "Lancer l'importation de masse (CSV)"}
      </button>
    </form>
  );
}
