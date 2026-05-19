import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "DOYEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, name, code, semester, facultyId, promotionId, professorId } = await req.json();

    if (!id || !name || !code || !semester || !facultyId || !promotionId) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name,
        code,
        semester,
        facultyId,
        promotionId,
        professorId: professorId || null
      }
    });

    return NextResponse.json({ success: true, updatedCourse });
  } catch (error) {
    console.error("Erreur màj cours:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "DOYEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de cours requis." }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression cours:", error);
    return NextResponse.json({ error: "Erreur serveur ou entité rattachée impossible à supprimer." }, { status: 500 });
  }
}
