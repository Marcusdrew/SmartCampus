import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing during build or runtime.");
      return NextResponse.json({ recommendations: "L'assistant IA est temporairement indisponible (Clé API manquante)." });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user || !["PROFESSOR", "DOYEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer les confusions récentes
    const confusions = await prisma.confusionReport.findMany({
      include: {
        course: { select: { name: true, promotion: { select: { name: true } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    if (confusions.length === 0) {
      return NextResponse.json({ recommendations: "Aucun signalement de confusion récent pour générer une analyse." });
    }

    // Préparer un résumé brut pour l'IA
    const promptData = confusions.map(c =>
      `- Cours: ${c.course.name} (${c.course.promotion.name}) | Type: ${c.type} | Difficulté: "${c.description}"`
    ).join("\n");

    const prompt = `
      Tu es un expert en pédagogie universitaire et assistant virtuel pour les professeurs de la plateforme SmartCampus ULC.
      Voici une liste des 20 dernières difficultés signalées par les étudiants.
      
      Ton objectif :
      1. Identifier les cours ou concepts qui reviennent le plus souvent.
      2. Fournir un très bref résumé de la situation globale.
      3. Proposer 3 recommandations concrètes et actionnables pour les professeurs afin d'améliorer la compréhension des étudiants la semaine prochaine.

      Voici les confusions récentes :
      ${promptData}

      Réponds impérativement au format Markdown (listes à puces, texte en gras si nécessaire) et sois concis, direct et encourageant.
    `;

    // Utilisation de Gemini Flash 1.5
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const recommendations = result.response.text();

    return NextResponse.json({ success: true, recommendations });

  } catch (error: any) {
    console.error("Erreur génération IA:", error);
    return NextResponse.json({ error: "Erreur lors de la génération des recommandations IA." }, { status: 500 });
  }
}
