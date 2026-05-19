"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown';

export default function AIStatsClient() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);
    setIsOpen(true);
    setData(null);
    try {
      const res = await fetch("/api/professor/ai-stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de génération");
      setData(json.recommendations);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <button 
         onClick={fetchAIInsights} 
         className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-t border-emerald-300/30 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-1 flex items-center gap-2 text-white/90">
         <span>✨</span> Générer Synthèse IA
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-[#091a13] border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col max-h-[90vh]">
             
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <span className="text-emerald-400">✨</span> Synthèse Intelligente (Groq)
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 rounded-2xl p-6 border border-emerald-900/50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-emerald-500/70">
                       <span className="text-4xl animate-spin mb-4">⚙️</span>
                       <p className="animate-pulse font-bold tracking-widest text-sm uppercase">Analyse en cours...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center">
                       {error}
                    </div>
                ) : data ? (
                    <div className="prose prose-invert prose-emerald max-w-none text-gray-300">
                       <ReactMarkdown>{data}</ReactMarkdown>
                    </div>
                ) : null}
             </div>
             
             <div className="mt-6 flex justify-end">
                <button onClick={() => setIsOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-colors">
                    Fermer
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
