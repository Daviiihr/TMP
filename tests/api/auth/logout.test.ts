import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/auth/logout/route";
import { NextResponse, NextRequest } from "next/server";

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: vi.fn(),
  },
  NextRequest: vi.fn(),
}));

describe("/api/auth/logout", () => {
  let mockCookies: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      delete: vi.fn(),
    };
    vi.mocked(NextResponse.redirect).mockReturnValue({
      cookies: mockCookies,
    } as any);
  });

  const createRequest = () => {
    return {
      url: "http://localhost:3000/api/auth/logout",
    } as unknown as NextRequest;
  };

  it("POST should delete cookies and redirect to home", async () => {
    const req = createRequest();
    await POST(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const url = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/");

    expect(mockCookies.delete).toHaveBeenCalledWith("accessToken");
    expect(mockCookies.delete).toHaveBeenCalledWith("tmp_refresh_token");
  });

  it("GET should delete cookies and redirect to home", async () => {
    const req = createRequest();
    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const url = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/");

    expect(mockCookies.delete).toHaveBeenCalledWith("accessToken");
    expect(mockCookies.delete).toHaveBeenCalledWith("tmp_refresh_token");
  });
});
