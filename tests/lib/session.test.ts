import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "@/lib/session";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  jwtAccessSecret: vi.fn(() => "secret"),
}));

describe("Session Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if accessToken cookie is missing", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("should return null if jwt verification fails", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "invalid-token" }),
    } as any);

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("should return decoded user if jwt is valid", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-token" }),
    } as any);

    const mockUser = { id: "1", role: "ADMIN" };
    vi.mocked(jwt.verify).mockReturnValue(mockUser as any);

    const session = await getSession();
    expect(session).toEqual(mockUser);
    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "secret");
  });
});
