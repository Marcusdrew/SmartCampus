import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["ADMIN", "DOYEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { name, code, semester, facultyId, promotionId, professorId, credits } = await req.json();

    if (!name || !code || !semester || !facultyId || !promotionId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    // Vérifier si le code existe déjà DANS LA MÊME PROMOTION
    const existing = await prisma.course.findUnique({ 
      where: { 
        code_promotionId: { code, promotionId } 
      } 
    });
    if (existing) {
      return NextResponse.json({ error: `Un cours avec le code ${code} existe déjà pour cette promotion.` }, { status: 400 });
    }

    // Vérifier si un cours avec le même nom existe déjà dans cette promotion
    const sameCourse = await prisma.course.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        promotionId
      }
    });

    if (sameCourse) {
      return NextResponse.json({ error: `Ce cours existe déjà dans cette promotion. Deux professeurs ne peuvent pas avoir le même cours simultanément.` }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        semester,
        facultyId,
        promotionId,
        professorId: professorId || null,
        credits: credits ? parseInt(credits.toString(), 10) : 0,
      }
    });

    return NextResponse.json({ success: true, course });

  } catch (error: any) {
    console.error("Erreur ajout cours:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
