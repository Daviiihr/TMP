function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function databaseUrl(): string {
  return requiredEnv("DATABASE_URL");
}

export function redisUrl(): string {
  return requiredEnv("REDIS_URL");
}

export function jwtAccessSecret(): string {
  return requiredEnv("JWT_ACCESS_SECRET");
}

export function jwtRefreshSecret(): string {
  return requiredEnv("JWT_REFRESH_SECRET");
}

export function allowedEmailDomains(): string[] {
  return requiredEnv("AUTH_ALLOWED_EMAIL_DOMAINS")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}
