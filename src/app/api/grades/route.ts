import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { studentId, courseWorkId, value } = await req.json();

    if (!studentId || !courseWorkId || value === undefined) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const gradeValue = parseFloat(value.toString());

    // Récupérer le travail de cours pour valider la note maximale
    const coursework = await prisma.courseWork.findUnique({
      where: { id: courseWorkId }
    });

    if (!coursework) {
      return NextResponse.json({ error: "Travail de cours inexistant" }, { status: 404 });
    }

    if (gradeValue < 0 || gradeValue > coursework.maxGrade) {
      return NextResponse.json({ error: `La note doit être comprise entre 0 et ${coursework.maxGrade}` }, { status: 400 });
    }

    // Upsert de la note
    const grade = await prisma.grade.upsert({
      where: {
        studentId_courseWorkId: {
          studentId,
          courseWorkId
        }
      },
      update: {
        value: gradeValue
      },
      create: {
        studentId,
        courseWorkId,
        value: gradeValue
      }
    });

    return NextResponse.json({ success: true, grade });
  } catch (error: any) {
    console.error("Erreur enregistrement note:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
