import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { courseId, rating, comment } = await req.json();

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Cours et note (1-5) requis." }, { status: 400 });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil étudiant introuvable" }, { status: 404 });
    }

    // @ts-ignore
    const existing = await prisma.courseEvaluation.findFirst({
        where: {
            studentId: profile.id,
            courseId: courseId
        }
    });

    if (existing) {
        return NextResponse.json({ error: "Vous avez déjà évalué ce cours." }, { status: 400 });
    }

    // @ts-ignore
    const evaluation = await prisma.courseEvaluation.create({
      data: {
        studentId: profile.id,
        courseId,
        rating: parseInt(rating, 10),
        comment: comment || null
      }
    });

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    console.error("Erreur save évaluation :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
