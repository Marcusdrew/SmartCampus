import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { surveyId } = await req.json();

    if (!surveyId) {
      return NextResponse.json({ error: "ID du bilan requis" }, { status: 400 });
    }

    const updatedSurvey = await prisma.performanceSurvey.update({
      where: { id: surveyId },
      data: {
        resolved: true,
      }
    });

    return NextResponse.json({ success: true, survey: updatedSurvey });
  } catch (error: any) {
    console.error("Erreur résolution alerte:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
