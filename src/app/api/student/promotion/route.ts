import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { facultyId, promotionId, nom, prenom } = await req.json();

    if (!facultyId || !promotionId || !nom || !prenom) {
      return NextResponse.json({ error: "Veuillez remplir tous les champs." }, { status: 400 });
    }

    // Le student update ou créé son profil (upsert pour gérer la 1ere connexion)
    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        facultyId,
        promotionId,
        nom,
        prenom,
      },
      create: {
        userId: session.user.id,
        nom,
        prenom,
        facultyId,
        promotionId,
        academicYearStart: new Date().getFullYear(),
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Erreur màj profil étudiant:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
