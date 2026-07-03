import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  mockValidator: { validateLogin: vi.fn() },
  mockRepo: { findByEmail: vi.fn() },
  mockService: { verifyPassword: vi.fn(), createSession: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createAuthValidator: vi.fn(() => mocks.mockValidator),
    createUserRepository: vi.fn(() => mocks.mockRepo),
    createAuthService: vi.fn(() => mocks.mockService),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockValidator.validateLogin.mockReset();
    mocks.mockRepo.findByEmail.mockReset();
    mocks.mockService.verifyPassword.mockReset();
    mocks.mockService.createSession.mockReset();
  });

  const createRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  it("should return 400 if validation fails", async () => {
    mocks.mockValidator.validateLogin.mockReturnValue({
      isValid: false,
      message: "Invalid format",
      status: 400,
    });

    const req = createRequest({ email: "bad" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Invalid format" });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should return 401 if user not found", async () => {
    mocks.mockValidator.validateLogin.mockReturnValue({ isValid: true });
    mocks.mockRepo.findByEmail.mockResolvedValue(null);

    const req = createRequest({ email: "notfound@test.com", password: "pass" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Credenciales invalidas." });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 401 if password check fails", async () => {
    mocks.mockValidator.validateLogin.mockReturnValue({ isValid: true });
    const mockUser = { id: "1", email: "user@test.com" };
    mocks.mockRepo.findByEmail.mockResolvedValue(mockUser);
    mocks.mockService.verifyPassword.mockResolvedValue({
      ok: false,
      message: "Wrong pwd",
      status: 401,
    });

    const req = createRequest({ email: "user@test.com", password: "wrong" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Wrong pwd" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should create session if successful", async () => {
    mocks.mockValidator.validateLogin.mockReturnValue({ isValid: true });
    const mockUser = { id: "1", email: "user@test.com" };
    mocks.mockRepo.findByEmail.mockResolvedValue(mockUser);
    mocks.mockService.verifyPassword.mockResolvedValue({ ok: true });

    const mockResponse = { body: "success" };
    mocks.mockService.createSession.mockReturnValue(mockResponse);

    const req = createRequest({ email: "user@test.com", password: "pwd" });
    const res = await POST(req);

    expect(mocks.mockService.createSession).toHaveBeenCalledWith(mockUser);
    expect(res).toEqual(mockResponse);
  });

  it("should return 500 on unexpected error", async () => {
    mocks.mockValidator.validateLogin.mockImplementation(() => {
      throw new Error("Unexpected crash");
    });

    const req = createRequest({});
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "No se pudo iniciar sesion.",
      error: "Unexpected crash",
    });
    expect(res.init).toEqual({ status: 500 });
  });
});
