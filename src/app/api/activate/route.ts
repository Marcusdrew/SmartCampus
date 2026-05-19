import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { matricule, email, password } = data;

    if (!matricule || !email || !password) {
      return NextResponse.json({ error: "Veuillez remplir le matricule, l'email et le nouveau mot de passe." }, { status: 400 });
    }

    // 1. Trouver le compte qui correspond au matricule et à l'email
    const user = await prisma.user.findFirst({
      where: {
        matricule,
        email,
        role: {
          in: ["PROFESSOR", "DOYEN"]
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Aucun compte correspondant trouvé pour ce matricule et cet e-mail. Veuillez vérifier auprès de l'administration." }, { status: 404 });
    }

    // (Optionnel) Vérifier si le compte est déjà actif ? 
    // Pour simplifier, on permet la mise à jour du mot de passe pour l'activation.

    // 2. Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Mettre à jour le mot de passe et s'assurer que le statut est ACTIVE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erreur lors de l'activation:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'activation." }, { status: 500 });
  }
}
