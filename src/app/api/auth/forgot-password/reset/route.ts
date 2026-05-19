import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { matricule, answer, newPassword } = await req.json();

    if (!matricule || !answer || !newPassword) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { matricule } });
    if (!user || !user.secretAnswer) {
      return NextResponse.json({ error: "Autorisation refusée." }, { status: 403 });
    }

    const normalizedAnswer = answer.trim().toLowerCase();
    const isValid = await bcrypt.compare(normalizedAnswer, user.secretAnswer);

    if (!isValid) {
      return NextResponse.json({ error: "Réponse incorrecte." }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
