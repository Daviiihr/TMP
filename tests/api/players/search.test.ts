import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/players/search/route";
import { getSession } from "@/lib/session";
import { UserRepository } from "@/repositories/user.repository";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  mockSearchUsers: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  UserRepository: class {
    searchUsers = mocks.mockSearchUsers;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
  NextRequest: vi.fn(),
}));

describe("GET /api/players/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockSearchUsers.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = (url: string) => {
    return { url } as unknown as NextRequest;
  };

  it("should return 401 if not authorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = createRequest("http://localhost/api/players/search");

    const res = (await GET(req)) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return users matching query", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    const mockUsers = [
      { id: "1", username: "juan" },
      { id: "2", username: "pedro" },
    ];
    mocks.mockSearchUsers.mockResolvedValue(mockUsers);

    const req = createRequest("http://localhost/api/players/search?q=test");

    const res = (await GET(req)) as any;

    expect(mocks.mockSearchUsers).toHaveBeenCalledWith("test");
    expect(res.body).toEqual({
      users: [
        { id: "1", name: "juan" },
        { id: "2", name: "pedro" },
      ],
    });
    expect(res.init).toBeUndefined();
  });

  it("should handle error and return 500", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockSearchUsers.mockRejectedValue(new Error("DB crash"));

    const req = createRequest("http://localhost/api/players/search");

    const res = (await GET(req)) as any;

    expect(res.body).toEqual({ error: "DB crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
