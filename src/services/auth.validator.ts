import { emailMatchesAllowedDomain } from "@/lib/auth";

export type RegisterInput = {
  username?: string;
  email?: string;
  password?: string;
  region?: string;
};

export type LoginInput = {
  email?: string;
  password?: string;
};

export class AuthValidator {
  private static VALID_REGIONS = new Set(["NA", "EU", "LATAM", "ASIA"]);

  validateRegister(data: RegisterInput): { isValid: boolean; message?: string; status?: number } {
    const { username, email, password, region } = data;
    const trimmedUsername = username?.trim();
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername.length > 40) {
      return { isValid: false, message: "El nombre de usuario debe tener entre 3 y 40 caracteres.", status: 400 };
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return { isValid: false, message: "Ingresa un correo valido.", status: 400 };
    }

    if (!emailMatchesAllowedDomain(trimmedEmail)) {
      return { isValid: false, message: "Dominio de correo no permitido.", status: 403 };
    }

    if (!password || password.length < 8) {
      return { isValid: false, message: "La contrasena debe tener al menos 8 caracteres.", status: 400 };
    }

    if (!region || !AuthValidator.VALID_REGIONS.has(region)) {
      return { isValid: false, message: "Selecciona una region valida.", status: 400 };
    }

    return { isValid: true };
  }

  validateLogin(data: LoginInput): { isValid: boolean; message?: string; status?: number } {
    const { email, password } = data;
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return { isValid: false, message: "Correo y contrasena son obligatorios.", status: 400 };
    }

    if (!emailMatchesAllowedDomain(trimmedEmail)) {
      return { isValid: false, message: "Dominio de correo no permitido.", status: 403 };
    }

    return { isValid: true };
  }
}
