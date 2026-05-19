import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

// GET: Lister tous les utilisateurs (Étudiants, Professeurs, Doyens)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role"); // Optionnel: filtrer par rôle

    let whereClause = {};
    if (roleFilter && roleFilter !== "ALL") {
      whereClause = { role: roleFilter };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        matricule: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        studentProfile: {
          include: { faculty: true, promotion: true }
        },
        professorProfile: true,
      },
      orderBy: { createdAt: "desc" }
    });

    const faculties = await prisma.faculty.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ users, faculties });
  } catch (error) {
    console.error("Erreur GET utilisateurs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Créer manuellement un Professeur ou un Doyen
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { matricule, email, role, password, managedFacultyId, nom, prenom } = await req.json();

    if (!matricule || !role || !password) {
      return NextResponse.json({ error: "Matricule, rôle et mot de passe requis." }, { status: 400 });
    }

    if (role === "DOYEN" && !managedFacultyId) {
      return NextResponse.json({ error: "Une faculté doit être assignée pour le rôle Doyen." }, { status: 400 });
    }

    // Vérifier si le matricule existe déjà
    const existing = await prisma.user.findUnique({ where: { matricule } });
    if (existing) {
      return NextResponse.json({ error: "Ce matricule existe déjà." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        matricule,
        email: email || null,
        role,
        password: hashedPassword,
        status: "ACTIVE",
        managedFacultyId: role === "DOYEN" ? managedFacultyId : null,
        professorProfile: role === "PROFESSOR" && nom ? {
          create: { nom, prenom: prenom || "", yearStart: new Date().getFullYear() }
        } : undefined
      }
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, matricule: newUser.matricule, role: newUser.role } });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT: Modifier un utilisateur (Changer le rôle ou le matricule)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id, role, matricule, email, status, password, managedFacultyId, nom, prenom } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de l'utilisateur requis." }, { status: 400 });
    }

    if (role === "DOYEN" && !managedFacultyId) {
      return NextResponse.json({ error: "Une faculté doit être assignée pour le rôle Doyen." }, { status: 400 });
    }

    const dataToUpdate: any = { 
       role, 
       matricule, 
       email, 
       status,
       managedFacultyId: role === "DOYEN" ? managedFacultyId : null
    };

    if (role === "PROFESSOR" && nom) {
       dataToUpdate.professorProfile = {
          upsert: {
             create: { nom, prenom: prenom || "", yearStart: new Date().getFullYear() },
             update: { nom, prenom: prenom || "" }
          }
       };
    }
    
    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, updatedUser });
  } catch (error) {
    console.error("Erreur màj utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

// DELETE: Supprimer un utilisateur
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de l'utilisateur requis." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    return NextResponse.json({ error: "Erreur ou utilisateur lié à des cours/ressources." }, { status: 500 });
  }
}
