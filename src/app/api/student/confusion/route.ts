import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Seul un étudiant peut soumettre ce rapport" }, { status: 403 });
    }

    const { courseId, type, description } = await req.json();

    if (!courseId || !type || !description) {
      return NextResponse.json({ error: "Tous les champs (cours, type, description) sont obligatoires" }, { status: 400 });
    }

    // Récupérer le studentId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Profil étudiant introuvable" }, { status: 404 });
    }

    // Calcul de la semaine courante
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000);
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const currentWeekNumber = Math.floor(diff / oneWeek) + 1;

    const report = await prisma.confusionReport.create({
      data: {
        studentId: studentProfile.id,
        courseId,
        type,
        description,
        weekNumber: currentWeekNumber,
      }
    });

    return NextResponse.json({ success: true, report });

  } catch (error: any) {
    console.error("Erreur ajout rapport confusion:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
