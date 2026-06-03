import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages requis" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API Gemini non configurée." }, { status: 500 });
    }

    // Récupérer le profil étudiant avec ses cours et sa faculté
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        promotion: {
          include: {
            courses: true
          }
        },
        faculty: true
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Profil étudiant introuvable" }, { status: 404 });
    }

    const coursesList = studentProfile.promotion?.courses
      .map(c => `[${c.code}] ${c.name}`)
      .join(", ") || "aucun cours";

    const systemMessage = `Tu es l'assistant d'apprentissage IA officiel de SmartCampus pour l'étudiant ${studentProfile.prenom} ${studentProfile.nom} qui est en Faculté de ${studentProfile.faculty?.name}, promotion ${studentProfile.promotion?.name}.
    
    Voici la liste officielle des cours suivis par cet étudiant dans son programme d'études :
    ${coursesList}
    
    Directives strictes :
    1. Tu es configuré pour être un tuteur académique ciblé. Tu dois UNIQUEMENT aider l'étudiant à comprendre, réviser et répondre à des questions académiques liées DIRECTEMENT à ces matières.
    2. Si l'étudiant pose une question en dehors de ce programme d'études (ex: culture générale hors-sujet, autres spécialités, questions de divertissement, etc.), tu dois REFUSER POLIMENT d'y répondre. Rappelle-lui de manière bienveillante que ton rôle est de le maintenir concentré sur ses matières de ${studentProfile.promotion?.name}.
    3. Exprime-toi en français, de façon claire, concise, encourageante et réactive.`;

    // Initialiser le SDK Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Préparer l'historique (les messages précédents)
    // On convertit le format {"role": "user"|"assistant", "content"} vers le format Gemini {"role": "user"|"model", "parts": [{"text"}]}
    const formattedHistory = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: systemMessage
    });

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const result = await chat.sendMessage(lastUserMessage);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Erreur Student AI:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
