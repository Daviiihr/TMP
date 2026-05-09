import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete({
    name: "accessToken",
    path: "/",
  });
  response.cookies.delete({
    name: "tmp_refresh_token",
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  // Also support GET for simplicity (e.g., from a link)
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete({
    name: "accessToken",
    path: "/",
  });
  response.cookies.delete({
    name: "tmp_refresh_token",
    path: "/",
  });
  return response;
}
