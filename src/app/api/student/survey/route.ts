import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Utilitaire pour obtenir le numéro de semaine courant
function getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil(( ( (date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { selectedFactors, mentalState, physicalState, financeState, timeState, freeNotes, answers } = await req.json();
    
    // Validation basique
    if (!selectedFactors || selectedFactors.length === 0) {
        return NextResponse.json({ error: "Veuillez sélectionner au moins un facteur." }, { status: 400 });
    }

    const currentDate = new Date();
    const weekNumber = getWeekNumber(currentDate);

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Profil étudiant introuvable." }, { status: 404 });
    }

    // Vérifier s'il a déjà soumis cette semaine
    const existing = await prisma.performanceSurvey.findFirst({
        where: {
            studentId: studentProfile.id,
            weekNumber: weekNumber
        }
    });

    if (existing) {
        return NextResponse.json({ error: "Vous avez déjà soumis votre bilan cette semaine." }, { status: 400 });
    }

    const survey = await prisma.performanceSurvey.create({
      data: {
        studentId: studentProfile.id,
        weekNumber,
        selectedFactors,
        mentalState: mentalState || null,
        physicalState: physicalState || null,
        financeState: financeState || null,
        timeState: timeState || null,
        freeNotes: freeNotes || null,
        answers: answers || null
      }
    });

    return NextResponse.json(survey);

  } catch (error: any) {
    console.error("Survey creation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
