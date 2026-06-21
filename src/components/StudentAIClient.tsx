"use client";

export default function StudentAIClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 border border-cyan-500/10 rounded-2xl relative overflow-hidden group">
      {/* Background soft glow */}
      <div className="absolute inset-0 bg-cyan-500/5 opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"></div>
      
      {/* Animated robot icon wrapper */}
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse">
        <span className="text-5xl">🤖</span>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
        </span>
      </div>

      <div className="relative z-10 max-w-md space-y-4">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wider uppercase">
          🛠️ En Cours d'Amélioration
        </span>
        
        <h3 className="text-2xl font-black text-white tracking-tight">
          Assistant IA SmartCampus
        </h3>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          Nous retravaillons actuellement l'intelligence artificielle pour vous offrir un tuteur académique encore plus précis, performant et directement synchronisé avec les matières de votre semestre.
        </p>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Recherche Contextuelle
          </span>
          <span className="hidden sm:inline text-white/10">•</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Tutorat Ciblé
          </span>
          <span className="hidden sm:inline text-white/10">•</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            100% Hors-ligne Garanti
          </span>
        </div>
      </div>
    </div>
  );
}

