"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/professor/ai-stats");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse.");
      }

      setRecommendations(data.recommendations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-sm border border-indigo-100 dark:border-indigo-800">
      <div className="flex justify-between items-center mb-6 border-b border-indigo-200 dark:border-indigo-800/50 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <span className="text-2xl">🧠</span> SmartCampus AI Insights
          </h2>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Analyse intelligente basée sur les feedbacks récents de vos étudiants.</p>
        </div>
        <button 
          onClick={fetchAIAnalysis} 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse en cours...
            </>
          ) : "Lancer l'Analyse IA"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 mb-4">
          ⚠️ {error}
        </div>
      )}

      {recommendations && !loading && (
        <div className="prose prose-indigo prose-sm sm:prose-base dark:prose-invert max-w-none bg-white/60 dark:bg-gray-800/60 p-6 rounded-xl border border-white/50 dark:border-gray-700/50 shadow-inner">
           <ReactMarkdown>{recommendations}</ReactMarkdown>
        </div>
      )}

      {!recommendations && !loading && !error && (
        <div className="text-center py-8 text-indigo-400 dark:text-indigo-500 italic">
          Cliquez sur "Lancer l'Analyse IA" pour générer un rapport pédagogique.
        </div>
      )}
    </div>
  );
}
