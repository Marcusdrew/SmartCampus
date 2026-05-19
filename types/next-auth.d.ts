import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extension de la définition de session pour inclure le rôle de l'utilisateur.
   */
  interface Session {
    user: {
      id: string;
      role: string;
      matricule: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    matricule: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extension du typage de JWT
   */
  interface JWT {
    id: string;
    role: string;
    matricule: string;
  }
}
