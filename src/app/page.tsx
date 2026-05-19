import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AuthForms from "@/components/AuthForms";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirection automatique si déjà connecté
  if (session?.user) {
    redirect("/dashboard");
  }

  // Récupération des données pour le formulaire d'inscription
  const faculties = await prisma.faculty.findMany({
    include: { promotions: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/80 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
      <div className="absolute top-[30%] left-[50%] w-[30%] h-[30%] bg-indigo-500 rounded-full mix-blend-screen filter blur-[180px] opacity-20"></div>

      {/* Main split layout container */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10 gap-16">
        
        {/* Left Side: Cinematic Branding Showcase */}
        <div className="w-full lg:w-[55%] text-center lg:text-left text-white space-y-8">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide text-white/90">Plateforme v2.0 - Actif</span>
          </div>
          
          <h1 className="text-6xl lg:text-7xl xl:text-[5rem] font-extrabold tracking-tighter leading-tight drop-shadow-2xl">
            SmartCampus <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">ULC</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
            Un écosystème d'apprentissage interconnecté. Retrouvez vos ressources, signalez vos incompréhensions et profitez d'un suivi épaulé par l'Intelligence Artificielle.
          </p>

          <div className="grid grid-cols-2 gap-5 pt-6 max-w-lg mx-auto lg:mx-0">
             <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                <div className="bg-blue-500/20 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400 text-2xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
                <h3 className="font-bold text-lg text-white">Centralisé</h3>
                <p className="text-sm text-gray-400 mt-1">Horaires, cours et ressources en un seul lieu.</p>
             </div>
             <div className="group bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                <div className="bg-purple-500/20 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 text-2xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
                <h3 className="font-bold text-lg text-white">Analyses IA</h3>
                <p className="text-sm text-gray-400 mt-1">Feedback étudiant compilé intelligemment.</p>
             </div>
          </div>
        </div>

        {/* Right Side: The Auth Component */}
        <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
          <AuthForms faculties={faculties} />
        </div>

      </div>
    </div>
  );
}
