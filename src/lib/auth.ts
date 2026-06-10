import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import * as bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "SmartCampus",
      credentials: {
        matricule: { label: "Matricule", type: "text", placeholder: "25/ULC/0001/26" },
        password: { label: "Mot de passe", type: "password" },
        isAdminPortal: { label: "isAdminPortal", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.matricule || !credentials?.password) {
          throw new Error("Veuillez renseigner votre matricule et votre mot de passe");
        }

        const matriculeUpper = credentials.matricule.toUpperCase();
        
        const user = await prisma.user.findUnique({
          where: {
            matricule: matriculeUpper
          }
        });

        if (!user) {
          throw new Error("Matricule introuvable. Avez-vous créé votre compte ?");
        }
        
        if (user.status !== "ACTIVE") {
          throw new Error("Votre compte n'est pas actif. Veuillez contacter l'administration.");
        }

        // Vérification de sécurité pour le portail administrateur
        const isAdmin = user.role === "ADMIN";
        const isLoggingViaAdminPortal = credentials.isAdminPortal === "true";

        if (isAdmin && !isLoggingViaAdminPortal) {
          throw new Error("Les comptes administrateurs doivent obligatoirement se connecter via le portail dédié.");
        }

        if (!isAdmin && isLoggingViaAdminPortal) {
          throw new Error("Accès refusé. Ce portail de connexion est réservé exclusivement aux administrateurs.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Mot de passe incorrect");
        }

        // On retourne les informations de l'utilisateur qui seront stockées dans le token
        return {
          id: user.id,
          matricule: user.matricule,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login", // Redirige vers /login en cas d'erreur
  },
  callbacks: {
    async jwt({ token, user }) {
      // Lors de la première connexion, on insère les attributs de user dans le token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.matricule = user.matricule;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          role: token.role as string,
          matricule: token.matricule as string,
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
        };
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "une-cle-secrete-en-dvpt-smartcampus" // En PROD, utiliser la variable d'environnement
};
