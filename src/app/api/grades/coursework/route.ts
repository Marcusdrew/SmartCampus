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

    const { courseId, title, maxGrade } = await req.json();

    if (!courseId || !title || !maxGrade) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const scale = parseInt(maxGrade.toString(), 10);
    if (![10, 20, 30, 40, 50].includes(scale)) {
      return NextResponse.json({ error: "La note maximale doit être 10, 20, 30, 40, ou 50" }, { status: 400 });
    }

    const newCourseWork = await prisma.courseWork.create({
      data: {
        courseId,
        title,
        maxGrade: scale,
      }
    });

    return NextResponse.json({ success: true, coursework: newCourseWork });
  } catch (error: any) {
    console.error("Erreur création évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
