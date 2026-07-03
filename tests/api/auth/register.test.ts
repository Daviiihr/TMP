import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const mocks = vi.hoisted(() => ({
  mockValidator: { validateRegister: vi.fn() },
  mockRepo: { create: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createAuthValidator: vi.fn(() => mocks.mockValidator),
    createUserRepository: vi.fn(() => mocks.mockRepo),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

import { POST } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockValidator.validateRegister.mockReset();
    mocks.mockRepo.create.mockReset();
  });

  const createRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  it("should return 400 if validation fails", async () => {
    mocks.mockValidator.validateRegister.mockReturnValue({
      isValid: false,
      message: "Invalid format",
      status: 400,
    });

    const req = createRequest({ email: "bad" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Invalid format" });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should create user and return 201 if valid", async () => {
    mocks.mockValidator.validateRegister.mockReturnValue({ isValid: true });
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pass" as any);

    const mockUser = { id: "1", username: "testuser" };
    mocks.mockRepo.create.mockResolvedValue(mockUser);

    const req = createRequest({
      username: " testuser ",
      email: " Test@email.com ",
      password: "pwd",
      region: "SA",
      country: "Chile",
    });

    const res = (await POST(req)) as any;

    expect(bcrypt.hash).toHaveBeenCalledWith("pwd", 12);
    expect(mocks.mockRepo.create).toHaveBeenCalledWith({
      username: "testuser",
      email: "test@email.com",
      passwordHash: "hashed-pass",
      region: "SA",
      country: "Chile",
    });
    expect(res.body).toEqual({
      ok: true,
      message: "Cuenta creada exitosamente.",
      user: mockUser,
    });
    expect(res.init).toEqual({ status: 201 });
  });

  it("should return 409 if unique constraint is violated", async () => {
    mocks.mockValidator.validateRegister.mockReturnValue({ isValid: true });
    vi.mocked(bcrypt.hash).mockResolvedValue("hash" as any);

    const conflictError = new Error("duplicate");
    (conflictError as any).code = "23505";
    mocks.mockRepo.create.mockRejectedValue(conflictError);

    const req = createRequest({ username: "u", email: "e" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "El usuario o correo ya existe.",
    });
    expect(res.init).toEqual({ status: 409 });
  });

  it("should return 500 on unknown error", async () => {
    mocks.mockValidator.validateRegister.mockReturnValue({ isValid: true });
    vi.mocked(bcrypt.hash).mockResolvedValue("hash" as any);

    const unknownError = new Error("crash");
    mocks.mockRepo.create.mockRejectedValue(unknownError);

    const req = createRequest({ username: "u", email: "e" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "No se pudo crear la cuenta.",
      error: "crash",
    });
    expect(res.init).toEqual({ status: 500 });
  });
});
