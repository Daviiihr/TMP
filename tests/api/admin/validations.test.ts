import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/validations/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { MatchResultRepository } from "@/repositories/matchResult.repository";

const mocks = vi.hoisted(() => ({
  mockGetPendingResults: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/matchResult.repository", () => ({
  MatchResultRepository: class {
    getPendingResults = mocks.mockGetPendingResults;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/admin/validations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetPendingResults.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = () => ({}) as unknown as Request;

  it("should return 401 if not authorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = (await GET()) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 401 if not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "PLAYER" } as any);
    const res = (await GET()) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return pending validations", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    const mockValidations = [{ id: "1" }];
    mocks.mockGetPendingResults.mockResolvedValue(mockValidations);

    const res = (await GET()) as any;

    expect(mocks.mockGetPendingResults).toHaveBeenCalled();
    expect(res.body).toEqual({ validations: mockValidations });
  });

  it("should return 500 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockGetPendingResults.mockRejectedValue(new Error("crash"));

    const res = (await GET()) as any;

    expect(res.body).toEqual({ error: "crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
