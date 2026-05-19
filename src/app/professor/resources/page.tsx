import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import UploadForm from "@/components/UploadForm";
import Link from "next/link";

export default async function ProfessorResourcesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const courses = await prisma.course.findMany({
    include: { promotion: true },
    orderBy: { name: 'asc' }
  });

  const myResources = await prisma.resource.findMany({
    where: { uploadedBy: session.user.id },
    include: { course: { include: { promotion: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#070402] text-white font-sans relative overflow-hidden pb-20">
      {/* Background Amber Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <nav className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#1a0f05]/80 border border-amber-900/30 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-between items-center h-20 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-black border border-amber-500/30 rounded-xl flex items-center justify-center group-hover:bg-amber-900/30 transition-colors">
               <span className="text-xl">🔙</span>
             </div>
             <span className="font-bold text-amber-200 group-hover:text-amber-400 transition-colors">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold tracking-widest text-amber-500 uppercase px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">Pédagogie</span>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 tracking-tight drop-shadow-lg">
                    Ressources & Horaires
                </h1>
                <p className="mt-2 text-amber-200/50">Déployez vos documents et planifications pour vos étudiants.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="bg-[#110602] border border-amber-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.1)] backdrop-blur-md relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="bg-amber-500/20 p-3 rounded-xl text-amber-400">📤</span> Uploader un fichier
                </h2>
                <div className="glass-form-container">
                    <UploadForm courses={courses} />
                </div>
             </div>
          </div>

          <div>
            <div className="bg-[#110602] border border-orange-900/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="px-8 py-6 border-b border-orange-900/50 bg-orange-950/20">
                <h3 className="text-xl font-bold text-orange-200 flex justify-between items-center">
                    <span>📚 Mes documents publiés</span>
                    <span className="text-sm px-3 py-1 bg-orange-500/20 rounded-full text-orange-300">{myResources.length} Fichiers</span>
                </h3>
              </div>
              
              <ul className="divide-y divide-orange-900/20 max-h-[500px] overflow-y-auto custom-scrollbar">
                {myResources.length === 0 ? (
                  <li className="px-8 py-10 text-center text-orange-500/50 italic">Vous n'avez pas encore partagé de ressources.</li>
                ) : (
                  myResources.map(res => (
                    <li key={res.id} className="p-6 hover:bg-orange-900/20 transition-colors flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-white text-lg group-hover:text-amber-300 transition-colors">{res.title}</p>
                        <p className="text-sm text-gray-400 mt-1">
                           <span className="text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md mr-2">{res.course.code}</span>
                           {res.course.name} • {res.course.promotion.name}
                        </p>
                      </div>
                      <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/10 group-hover:border-amber-500/50">
                        Ouvrir
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}
