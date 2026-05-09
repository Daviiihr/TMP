import { allowedEmailDomains } from "./env";

export function getEmailDomain(email: string): string | null {
  const match = email.trim().toLowerCase().match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);

  return match?.[1] ?? null;
}

export function formatAllowedEmailDomains(): string {
  return allowedEmailDomains().map((domain) => `@${domain}`).join(", ");
}

export function isAllowedEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);

  if (!domain) {
    return false;
  }

  return allowedEmailDomains().includes(domain);
}
