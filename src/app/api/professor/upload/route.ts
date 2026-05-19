import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const formData = await req.formData();
    
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const courseId = formData.get("courseId") as string;
    const type = formData.get("type") as string; // 'resource' ou 'schedule'
    const semester = formData.get("semester") as string; // requis pour 'schedule'

    if (!file || !courseId || !type) {
      return NextResponse.json({ error: "Fichier, cours et type sont obligatoires." }, { status: 400 });
    }

    // Mettre en ligne le fichier sur Vercel Blob
    // Créer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`; // clean filename

    // Le dossier sera défini dans le nom de base du fichier Blob
    const uploadDir = type === "schedule" ? "schedules" : "resources";
    
    // Upload vers Vercel avec politique d'accès publique
    const blobResponse = await put(`${uploadDir}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false // Nous avons déjà un suffixe unique
    });

    const filePublicUrl = blobResponse.url;

    // Enregistrer en base de données
    if (type === "schedule") {
      const schedule = await prisma.schedule.create({
        data: {
          courseId,
          fileUrl: filePublicUrl,
          semester: parseInt(semester || "1", 10),
        }
      });
      return NextResponse.json({ success: true, schedule });
    } else {
      if (!title) {
        return NextResponse.json({ error: "Le titre est obligatoire pour une ressource." }, { status: 400 });
      }
      const resource = await prisma.resource.create({
        data: {
          title,
          courseId,
          fileUrl: filePublicUrl,
          uploadedBy: session.user.id
        }
      });
      return NextResponse.json({ success: true, resource });
    }

  } catch (error: any) {
    console.error("Erreur d'upload:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 });
  }
}
