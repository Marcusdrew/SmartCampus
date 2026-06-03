import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/db";
import StudentDashboard from "@/components/StudentDashboard";
import ProfessorDashboard from "@/components/ProfessorDashboard";
import DoyenDashboard from "@/components/DoyenDashboard";
import SecuritySetupModal from "@/components/SecuritySetupModal";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const { role, matricule } = session.user;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { secretQuestion: true }
  });
  
  // Si l'utilisateur n'existe plus en DB (ex: changement SQLite -> Postgres)
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-[#070202] text-white flex flex-col items-center justify-center p-4 text-center">
         <h1 className="text-3xl font-bold text-red-500 mb-4">Session Expirée</h1>
         <p className="text-gray-400 mb-6">La base de données a été modifiée ou réinitialisée. Votre ancienne session n'est plus valide.</p>
         <LogoutButton />
      </div>
    );
  }

  const requireSecuritySetup = !dbUser.secretQuestion && role !== "ADMIN";

  // Data arrays
  let studentCourses: any[] = [];
  let studentProfileObj: any = null;
  let studentFaculties: any[] = [];
  let studentSurveys: any[] = [];
  
  let profCourses: any[] = [];
  let profConfusions: any[] = [];
  let profSurveys: any[] = [];

  let doyenFaculties: any[] = [];
  let doyenCoursesCount = 0;
  let doyenStudentsCount = 0;
  let doyenSurveys: any[] = [];
  
  let userName = "";
  let nameColor = "text-blue-400";

  if (role === "ADMIN") {
    userName = "Admin";
    nameColor = "text-red-400";
  } else if (role === "PROFESSOR" || role === "DOYEN") {
    nameColor = role === "PROFESSOR" ? "text-amber-400" : "text-purple-400";
    const profile = await prisma.professorProfile.findUnique({
      where: { userId: session.user.id }
    });
    userName = profile ? `${profile.prenom} ${profile.nom}` : (role === "PROFESSOR" ? "Professeur" : "Doyen");

    if (role === "PROFESSOR") {
      profCourses = await prisma.course.findMany({
        where: { professorId: session.user.id },
        include: { 
          promotion: {
            include: {
              students: {
                include: {
                  grades: true
                }
              }
            }
          },
          courseWorks: {
            include: {
              grades: true
            }
          }
        }
      });
      const courseIds = profCourses.map((c: any) => c.id);

      profConfusions = await prisma.confusionReport.findMany({
        where: { courseId: { in: courseIds } },
        include: { course: { include: { promotion: true } } }
      });

      profSurveys = await prisma.performanceSurvey.findMany({
        where: { student: { promotion: { courses: { some: { professorId: session.user.id } } } } },
        include: { student: { include: { promotion: true } } }
      });
    } else if (role === "DOYEN") {
      const doyenProfile = await prisma.user.findUnique({
         where: { id: session.user.id },
         select: { managedFacultyId: true }
      });
      
      const facultyFilter = doyenProfile?.managedFacultyId ? { id: doyenProfile.managedFacultyId } : {};

      doyenFaculties = await prisma.faculty.findMany({
        where: facultyFilter,
        include: { promotions: { include: { _count: { select: { students: true } } } } }
      });
      doyenCoursesCount = await prisma.course.count({ where: { facultyId: facultyFilter.id } });
      doyenStudentsCount = await prisma.studentProfile.count({ where: { facultyId: facultyFilter.id } });
      doyenSurveys = await prisma.performanceSurvey.findMany({
         where: { student: { facultyId: facultyFilter.id } },
         include: { student: { include: { promotion: true } } }
      });
    }

  } else if (role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    studentFaculties = await prisma.faculty.findMany({
      include: { promotions: true },
      orderBy: { name: 'asc' }
    });

    if (profile) {
      studentProfileObj = profile;
      userName = `${profile.prenom} ${profile.nom}`;
       studentCourses = await prisma.course.findMany({
        where: {
          promotionId: profile.promotionId,
          facultyId: profile.facultyId
        },
        include: {
          resources: { orderBy: { createdAt: 'desc' } },
          schedules: { orderBy: { createdAt: 'desc' } },
          professor: { include: { professorProfile: true } },
          courseWorks: {
            include: {
              grades: {
                where: { studentId: profile.id }
              }
            }
          }
        }
      });
      studentSurveys = await prisma.performanceSurvey.findMany({
        where: { studentId: profile.id },
        orderBy: { weekNumber: 'desc' }
      });
    }
  }

  if (!userName) userName = "Utilisateur";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative overflow-hidden pb-20">
      
      <SecuritySetupModal isVisible={requireSecuritySetup} />

      {/* Abstract Background Elements (Dynamic by Role) */}
      {role === "ADMIN" && (
        <>
          <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
        </>
      )}
      {role === "PROFESSOR" && (
        <>
          <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
        </>
      )}
      {role === "DOYEN" && (
        <>
          <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
        </>
      )}
      {role === "STUDENT" && (
        <>
          <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/40 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/30 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
        </>
      )}

      {/* Modern Floating Top Nav */}
      <div className="sticky top-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        <nav className="max-w-7xl mx-auto bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center h-20 px-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-xl">🎓</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                SmartCampus
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">{role}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </nav>
      </div>

      <main className="relative max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Welcome Glass Card */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md shadow-2xl p-10 mb-10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
              Ravi de vous revoir, <span className={nameColor}>{userName}</span>
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-lg text-gray-400">Matricule :</p>
              <div className="px-5 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-gray-300 shadow-inner">
                {matricule}
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION ADMIN --- */}
        {role === "ADMIN" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             <Link href="/admin/users" className="group relative flex flex-col justify-center bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-red-500/50 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.3)]">
               <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">👑</div>
               <h3 className="text-xl font-bold text-white mb-2">Utilisateurs</h3>
               <p className="text-sm text-gray-400 leading-relaxed">Contrôle complet des comptes, profs et étudiants.</p>
             </Link>
             <Link href="/admin/faculties" className="group relative flex flex-col justify-center bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-blue-400/50 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
               <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">🏛️</div>
               <h3 className="text-xl font-bold text-white mb-2">Facultés</h3>
               <p className="text-sm text-gray-400 leading-relaxed">Structure des facultés et promotions.</p>
             </Link>
             <Link href="/admin/courses" className="group relative flex flex-col justify-center bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-indigo-400/50 hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
               <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">📚</div>
               <h3 className="text-xl font-bold text-white mb-2">Cours</h3>
               <p className="text-sm text-gray-400 leading-relaxed">Création des cours et affectation aux professeurs.</p>
             </Link>
          </div>
        )}

        {/* --- SECTION PROFESSOR --- */}
        {role === "PROFESSOR" && (
           <ProfessorDashboard courses={profCourses} confusions={profConfusions} surveys={profSurveys} />
        )}

        {/* --- SECTION DOYEN --- */}
        {role === "DOYEN" && (
           <DoyenDashboard faculties={doyenFaculties} totalCourses={doyenCoursesCount} totalStudents={doyenStudentsCount} surveys={doyenSurveys} />
        )}

        {/* --- SECTION ÉTUDIANT --- */}
        {role === "STUDENT" && (
           <StudentDashboard 
             studentCourses={studentCourses} 
             profile={studentProfileObj} 
             faculties={studentFaculties}
             sessionUser={session.user}
             surveys={studentSurveys}
           />
        )}

      </main>
    </div>
  );
}
