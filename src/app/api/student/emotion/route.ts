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

    const { emotionLevel, description } = await req.json();

    if (!emotionLevel || emotionLevel < 1 || emotionLevel > 5) {
      return NextResponse.json({ error: "Le niveau d'émotion doit être entre 1 et 5" }, { status: 400 });
    }

    // Récupérer le studentId via le profil
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Profil étudiant introuvable" }, { status: 404 });
    }

    // Calcul approximatif de la semaine de l'année
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000);
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const currentWeekNumber = Math.floor(diff / oneWeek) + 1;

    // Vérifier si un rapport existe déjà pour cette semaine
    const existingReport = await prisma.weeklyEmotionReport.findFirst({
      where: {
        studentId: studentProfile.id,
        weekNumber: currentWeekNumber,
        // On pourrait ajouter une vérification par an si besoin
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: "Vous avez déjà soumis votre évaluation émotionnelle pour cette semaine." }, { status: 400 });
    }

    const report = await prisma.weeklyEmotionReport.create({
      data: {
        studentId: studentProfile.id,
        weekNumber: currentWeekNumber,
        emotionLevel: parseInt(emotionLevel.toString(), 10),
        description: description || null,
      }
    });

    return NextResponse.json({ success: true, report });

  } catch (error: any) {
    console.error("Erreur ajout rapport émotion:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
