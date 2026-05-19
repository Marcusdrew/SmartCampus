import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import AIStatsClient from "@/components/AIStatsClient";

export default async function ProfessorStatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const confusions = await prisma.confusionReport.findMany({
    include: { course: { include: { promotion: true } }, student: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const emotions = await prisma.weeklyEmotionReport.findMany({
    include: { student: { include: { promotion: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const totalConfusions = confusions.length;
  const avgEmotion = emotions.length > 0 
    ? (emotions.reduce((acc, curr) => acc + curr.emotionLevel, 0) / emotions.length).toFixed(1)
    : "N/A";

  const difficultCourses = Object.entries(
    confusions.reduce((acc: any, curr) => {
      const name = curr.course.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020704] text-white font-sans relative overflow-hidden pb-20">
      {/* Background Emerald Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <nav className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#051a0f]/80 border border-emerald-900/30 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-between items-center h-20 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-black border border-emerald-500/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-900/30 transition-colors">
               <span className="text-xl">🔙</span>
             </div>
             <span className="font-bold text-emerald-200 group-hover:text-emerald-400 transition-colors">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold tracking-widest text-emerald-500 uppercase px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">Analyse IA</span>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 tracking-tight drop-shadow-lg">
                    Statistiques Pédagogiques
                </h1>
                <p className="mt-2 text-emerald-200/50">Surveillez l'état émotionnel et les confusions de vos étudiants.</p>
            </div>
            <AIStatsClient />
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-[#05110a] border border-emerald-900/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
             <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/70 mb-2">Santé Émotionnelle</h3>
             <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-extrabold text-white">{avgEmotion}</span>
                 <span className="text-gray-400 font-medium">/ 5</span>
             </div>
             <div className="mt-4 pt-4 border-t border-white/5 text-xs text-emerald-200/50">Basé sur {emotions.length} rapports</div>
          </div>

          <div className="bg-[#05110a] border border-teal-900/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-colors"></div>
             <h3 className="text-sm font-bold uppercase tracking-wider text-teal-500/70 mb-2">Alertes Confusion</h3>
             <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-extrabold text-white">{totalConfusions}</span>
             </div>
             <div className="mt-4 pt-4 border-t border-white/5 text-xs text-teal-200/50">Derniers signalements d'incompréhension</div>
          </div>

          <div className="bg-[#0b0511] border border-cyan-900/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
             <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-500/70 mb-4">Top Cours Difficiles</h3>
             <div className="space-y-3">
              {difficultCourses.length > 0 ? (
                difficultCourses.map(([course, count]: any, index) => (
                  <div key={course} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="font-medium text-gray-300 truncate w-3/4">{index + 1}. {course}</span>
                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full text-xs font-bold border border-cyan-500/30">{count}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-cyan-500/50 italic">Données insuffisantes</span>
              )}
             </div>
          </div>

        </div>

        {/* Détails Listes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          <div className="bg-[#05110a] border border-emerald-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="px-8 py-6 border-b border-emerald-900/50 bg-emerald-950/20">
              <h3 className="text-xl font-bold text-emerald-100">Dernières Incompréhensions</h3>
            </div>
            <div className="divide-y divide-emerald-900/20 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
              {confusions.length === 0 ? (
                <div className="p-8 text-center text-emerald-500/50 italic">Aucun signalement. Tout va bien !</div>
              ) : (
                confusions.map(conf => (
                  <div key={conf.id} className="p-6 hover:bg-emerald-900/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        {conf.type}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{new Date(conf.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-white text-lg mb-1">{conf.course.name}</p>
                    <p className="text-xs text-emerald-500 font-mono mb-3">{conf.course.promotion.name}</p>
                    <div className="text-sm text-emerald-100 italic bg-black/40 p-4 rounded-xl border border-emerald-500/10 relative">
                       <span className="absolute -top-3 -left-2 text-3xl opacity-20">"</span>
                      {conf.description}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#05110a] border border-teal-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="px-8 py-6 border-b border-teal-900/50 bg-teal-950/20">
              <h3 className="text-xl font-bold text-teal-100">Températures Émotionnelles</h3>
            </div>
            <div className="divide-y divide-teal-900/20 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
              {emotions.length === 0 ? (
                <div className="p-8 text-center text-teal-500/50">Aucune évaluation émotionnelle.</div>
              ) : (
                emotions.map(emo => (
                  <div key={emo.id} className="p-6 flex items-start gap-5 hover:bg-teal-900/10 transition-colors">
                    <div className={`flex items-center justify-center h-14 w-14 rounded-2xl text-3xl border shadow-lg shrink-0
                      ${emo.emotionLevel <= 2 ? 'bg-red-500/20 border-red-500/50 text-red-500' : emo.emotionLevel === 3 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'}`
                    }>
                      {emo.emotionLevel === 1 && "😫"}
                      {emo.emotionLevel === 2 && "🙁"}
                      {emo.emotionLevel === 3 && "😐"}
                      {emo.emotionLevel === 4 && "🙂"}
                      {emo.emotionLevel === 5 && "🤩"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                         <p className="font-bold text-white truncate text-lg">Promo: {emo.student?.promotion?.name || 'Inconnu'}</p>
                         <p className="text-xs font-mono text-teal-500 bg-teal-500/10 px-2 py-1 rounded-md">Semaine {emo.weekNumber}</p>
                      </div>
                      {emo.description && (
                        <p className="text-sm text-gray-400 mt-2 bg-black/30 p-3 rounded-xl border border-white/5">
                           "{emo.description}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
