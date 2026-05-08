import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("accessToken");
  response.cookies.delete("tmp_refresh_token");
  return response;
}

export async function GET(request: NextRequest) {
  // Also support GET for simplicity (e.g., from a link)
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("accessToken");
  response.cookies.delete("tmp_refresh_token");
  return response;
}