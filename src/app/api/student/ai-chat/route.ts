import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API non configurée." }, { status: 500 });
    }

    const systemMessage = {
      role: "system",
      content: "Tu es un assistant IA universitaire bienveillant pour l'Université ULC. Tu aides les étudiants à comprendre leurs cours, à organiser leurs révisions et à répondre au mieux à leurs questions. Reste professionnel, encourageant, concis et parle en français."
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("Groq API Error:", errData);
      return NextResponse.json({ error: "Erreur du service IA" }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Désolé, je n'ai pas pu formuler de réponse.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Erreur Student AI:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
