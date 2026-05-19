import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CourseForm from "@/components/CourseForm";
import CourseList from "@/components/CourseList";
import Link from "next/link";

export default async function CoursesAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["ADMIN", "DOYEN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const faculties = await prisma.faculty.findMany({
    include: { promotions: true },
    orderBy: { name: 'asc' }
  });

  const courses = await prisma.course.findMany({
    include: { 
      faculty: true, 
      promotion: true, 
      professor: {
        include: { professorProfile: true }
      } 
    },
    orderBy: { name: 'asc' }
  });

  const professors = await prisma.user.findMany({
    where: { role: "PROFESSOR" },
    include: { professorProfile: true }
  });

  return (
    <div className="min-h-screen bg-[#020207] text-white font-sans relative overflow-hidden pb-20">
      {/* Background Admin Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>

      <nav className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#0a0a1a]/80 border border-indigo-900/30 backdrop-blur-xl rounded-2xl shadow-2xl flex justify-between items-center h-20 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-black border border-indigo-500/30 rounded-xl flex items-center justify-center group-hover:bg-indigo-900/30 transition-colors">
               <span className="text-xl">🔙</span>
             </div>
             <span className="font-bold text-indigo-200 group-hover:text-indigo-400 transition-colors">Dashboard</span>
          </Link>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-400 tracking-tight drop-shadow-lg">
                    Catalogue des Cours
                </h1>
                <p className="mt-2 text-indigo-200/50">Gestion de tous les enseignements de l'Université.</p>
            </div>
        </header>

        <CourseList initialCourses={courses} faculties={faculties} professors={professors} />

      </main>
    </div>
  );
}
