import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { secretQuestion, secretAnswer } = await req.json();

    if (!secretQuestion || !secretAnswer) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    // Hash de la réponse secrète (on convertit en minuscules pour la tolérance à la casse lors de la vérification)
    const normalizedAnswer = secretAnswer.trim().toLowerCase();
    const hashedAnswer = await bcrypt.hash(normalizedAnswer, 10);
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé en base." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        secretQuestion,
        secretAnswer: hashedAnswer,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur Security Setup:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
