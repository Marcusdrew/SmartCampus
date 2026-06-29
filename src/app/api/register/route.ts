import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateStudentMatriculeString } from "@/lib/matricule";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nom, postnom, prenom, facultyId, promotionId, password } = data;

    if (!nom || !prenom || !facultyId || !promotionId || !password) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    }

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/;
    if (!nameRegex.test(nom.trim()) || !nameRegex.test(prenom.trim())) {
      return NextResponse.json({ error: "Les noms et prénoms ne doivent pas contenir de chiffres ou de caractères spéciaux." }, { status: 400 });
    }

    // Vérification de doublon d'inscription (Nom + Prénom ensemble)
    const existingStudent = await prisma.studentProfile.findFirst({
      where: {
        nom: { equals: nom.trim(), mode: 'insensitive' },
        prenom: { equals: prenom.trim(), mode: 'insensitive' }
      }
    });

    if (existingStudent) {
      return NextResponse.json({ error: `Un étudiant nommé '${prenom.trim()} ${nom.trim()}' est déjà inscrit dans le système.` }, { status: 400 });
    }

    // 1. Déterminer l'année académique courante (ex: 2025 pour 2025-2026)
    const currentYear = new Date().getFullYear();
    const yearStart = currentYear; 

    // 2. Trouver le dernier matricule étudiant généré pour cette année
    // On cherche les User ayant un rôle STUDENT créés cette année (basé sur le matricule)
    const startYearShort = String(yearStart).slice(-2);
    
    const lastUser = await prisma.user.findFirst({
      where: {
        role: "STUDENT",
        matricule: {
          startsWith: `${startYearShort}/ULC/`,
        }
      },
      orderBy: {
        matricule: 'desc',
      }
    });

    let nextCount = 1;
    if (lastUser) {
      // matricule: 25/ULC/0001/26 -> extract 0001
      const parts = lastUser.matricule.split("/");
      if (parts.length === 4) {
        nextCount = parseInt(parts[2], 10) + 1;
      }
    }

    // 3. Générer le nouveau matricule
    const generatedMatricule = generateStudentMatriculeString(yearStart, nextCount);

    // 4. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Créer l'utilisateur + profil en transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          matricule: generatedMatricule,
          password: hashedPassword,
          role: "STUDENT",
          status: "ACTIVE",
          studentProfile: {
            create: {
              nom,
              postnom: postnom || null,
              prenom,
              facultyId,
              promotionId,
              academicYearStart: yearStart
            }
          }
        }
      });
      return user;
    });

    return NextResponse.json({ 
      success: true, 
      matricule: newUser.matricule 
    });

  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'inscription." }, { status: 500 });
  }
}
