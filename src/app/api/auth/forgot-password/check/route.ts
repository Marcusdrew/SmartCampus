import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { matricule } = await req.json();
    if (!matricule) return NextResponse.json({ error: "Matricule requis." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { matricule } });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Utilisateur non trouvé ou inactif." }, { status: 404 });
    }

    if (!user.secretQuestion) {
      return NextResponse.json({ error: "Aucune question secrète configurée sur ce compte. Veuillez contacter l'administration." }, { status: 400 });
    }

    return NextResponse.json({ question: user.secretQuestion });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
