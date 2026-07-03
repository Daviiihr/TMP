import { describe, it, expect, vi, beforeEach } from "vitest";
import proxy from "@/proxy";
import { NextRequest, NextResponse } from "next/server";

vi.mock("next/server", () => {
  return {
    NextResponse: {
      redirect: vi.fn(),
      next: vi.fn(),
    },
    NextRequest: vi.fn(),
  };
});

describe("Proxy (Middleware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (pathname: string, tokenValue?: string) => {
    const req = {
      nextUrl: {
        pathname,
        clone: vi.fn().mockReturnValue({ pathname: "" }),
      },
      cookies: {
        get: vi
          .fn()
          .mockReturnValue(tokenValue ? { value: tokenValue } : undefined),
      },
    } as unknown as NextRequest;
    return req;
  };

  it("should redirect to /login if accessing protected route without token", () => {
    const req = createMockRequest("/dashboard/overview");

    proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = vi.mocked(NextResponse.redirect).mock
      .calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/login");
  });

  it("should redirect to /dashboard if accessing auth route with token", () => {
    const req = createMockRequest("/login", "valid-token");

    proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = vi.mocked(NextResponse.redirect).mock
      .calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/dashboard");
  });

  it("should proceed if accessing protected route with token", () => {
    const req = createMockRequest("/dashboard", "valid-token");

    proxy(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("should proceed if accessing public route without token", () => {
    const req = createMockRequest("/public-page");

    proxy(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});
