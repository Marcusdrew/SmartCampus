import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Gérer mot de passe de 8 lettres aléatoires
function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pwd = "";
  for(let i=0; i<8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { professors } = await req.json();

    if (!Array.isArray(professors) || professors.length === 0) {
      return NextResponse.json({ error: "Le tableau de professeurs est invalide ou vide." }, { status: 400 });
    }

    let importedCount = 0;
    let errors: string[] = [];
    let generatedCredentials: any[] = [];

    const profCount = await prisma.user.count({ where: { role: "PROFESSOR" } });
    let currentId = profCount + 1;

    for (const prof of professors) {
      const { nom, prenom, postnom, email } = prof;

      if (!nom || !prenom) {
        errors.push(`Nom ou prénom manquant pour : ${JSON.stringify(prof)}`);
        continue;
      }

      const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/;
      if (!nameRegex.test(nom.trim()) || !nameRegex.test(prenom.trim())) {
        errors.push(`Le nom et prénom de ${nom} ${prenom} contiennent des chiffres ou caractères spéciaux inacceptables.`);
        continue;
      }

      if (email) {
        const existing = await prisma.user.findFirst({ where: { email } });
        if (existing) {
          errors.push(`L'email ${email} existe déjà.`);
          continue;
        }
      }

      const generatedMatricule = `26/ULC/PROF/${currentId.toString().padStart(3, '0')}/27`;
      const generatedPwd = generatePassword();
      const hashedPwd = await bcrypt.hash(generatedPwd, 10);

      try {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              matricule: generatedMatricule,
              email: email || null,
              password: hashedPwd,
              role: "PROFESSOR",
              status: "ACTIVE"
            }
          });

          await tx.professorProfile.create({
            data: {
              userId: user.id,
              nom,
              prenom,
              yearStart: new Date().getFullYear()
            }
          });
        });
        
        importedCount++;
        currentId++;
        generatedCredentials.push({ nom, prenom, matricule: generatedMatricule, password: generatedPwd });

      } catch (err: any) {
        errors.push(`Erreur lors de la création de ${nom} ${prenom} : ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      errors,
      credentials: generatedCredentials
    });

  } catch (error: any) {
    console.error("Erreur import CSV:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'import" }, { status: 500 });
  }
}
