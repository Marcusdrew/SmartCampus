import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirection basée sur les rôles si on accède à des routes spécifiques (optionnel si on gère tout sur /dashboard)
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Si l'utilisateur est connecté et essaie d'accéder à la page d'accueil, on le redirige vers le dashboard
    if (path === "/" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Seuls les utilisateurs connectés ont un token
    },
  }
);

// On protège le dashboard et toutes les routes internes
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
