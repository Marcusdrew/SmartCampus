import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ImportCSVForm from "@/components/ImportCSVForm";
import Link from "next/link";

export default async function FacultiesAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Récupérer les facultés et leurs promotions (avec compte d'étudiants)
  const faculties = await prisma.faculty.findMany({
    include: { 
      promotions: {
        include: {
          _count: { select: { students: true } }
        }
      } 
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-[#070202] text-white font-sans relative overflow-hidden pb-20">
      {/* Background Admin Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <nav className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#1a0505]/80 border border-blue-900/30 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-between items-center h-20 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-black border border-blue-500/30 rounded-xl flex items-center justify-center group-hover:bg-blue-900/30 transition-colors">
               <span className="text-xl">🔙</span>
             </div>
             <span className="font-bold text-blue-200 group-hover:text-blue-400 transition-colors">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold tracking-widest text-amber-500 uppercase px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">Super-Admin</span>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 tracking-tight drop-shadow-lg">
                    Architecture Académique
                </h1>
                <p className="mt-2 text-blue-200/50">Gestion de la structure des Facultés et Promotions de l'ULC.</p>
            </div>
        </header>


        {/* Grille des facultés */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {faculties.map((faculty) => (
            <div key={faculty.id} className="group relative bg-[#110202] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-900/10 hover:-translate-y-2">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-colors"></div>
              
              <h3 className="text-2xl font-bold text-white border-b border-white/10 pb-4 mb-6 flex items-center gap-3">
                <span className="text-3xl">🏛️</span>
                {faculty.name}
              </h3>
              
              <ul className="space-y-3">
                {faculty.promotions.length === 0 ? (
                  <li className="text-gray-500/70 text-sm italic bg-white/5 p-3 rounded-xl border border-white/5">Aucune promotion enregistrée</li>
                ) : (
                  faculty.promotions.map(promo => (
                    <li key={promo.id} className="text-gray-300 flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors group/item">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-3 group-hover/item:scale-150 transition-transform shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                        <span className="font-semibold tracking-wide group-hover/item:text-blue-300 transition-colors">{promo.name}</span>
                      </div>
                      <span className="text-xs font-bold font-mono px-3 py-1 bg-black/40 text-blue-300 rounded-lg border border-blue-500/20 group-hover/item:border-blue-500/50 transition-colors">
                        {(promo as any)._count?.students || 0} étudiant(s)
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
