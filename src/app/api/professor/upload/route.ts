import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// This route handles TWO things:
// 1. POST with JSON body -> handleUpload (client-side blob token generation)
// 2. POST with ?action=save -> Save DB record after client upload completes

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // --- ACTION: Save DB record after client upload ---
    if (action === "save") {
      const body = await req.json();
      const { type, title, courseId, semester, fileUrl } = body;

      if (!courseId || !type || !fileUrl) {
        return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
      }

      if (type === "schedule") {
        const schedule = await prisma.schedule.create({
          data: {
            courseId,
            fileUrl,
            semester: parseInt(semester || "1", 10),
          },
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
            fileUrl,
            uploadedBy: session.user.id,
          },
        });
        return NextResponse.json({ success: true, resource });
      }
    }

    // --- DEFAULT: Handle client-side blob upload token generation ---
    const body = (await req.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Authorize the upload
        return {
          allowedContentTypes: [
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            // Archives
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            // Images
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            // Text
            "text/plain",
            "text/csv",
            // Audio/Video
            "audio/mpeg",
            "video/mp4",
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // No-op: DB save is handled by the separate ?action=save call
        console.log("Blob upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Erreur d'upload:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}
