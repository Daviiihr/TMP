import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/admin", "/tournaments"];
const authPrefixes = ["/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  // Si intenta acceder a una ruta protegida sin token
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si intenta acceder al login/register con token activo, lo mandamos al dashboard
  const isAuth = authPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isAuth && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/tournaments/:path*", "/login", "/register"],
};
