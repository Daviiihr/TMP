import { getPostgresPool } from "@/lib/database";
import { AuthUser } from "@/lib/auth";

export interface UserRow extends AuthUser {
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
}

export class UserRepository {
  private pool = getPostgresPool();

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, email, password_hash, role, failed_login_attempts, locked_until 
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, email, password_hash, role, failed_login_attempts, locked_until 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async create(userData: { username: string; email: string; passwordHash: string; region: string }) {
    const result = await this.pool.query<{
      id: string;
      username: string;
      email: string;
      role: "PLAYER";
      region: string;
    }>(
      `INSERT INTO users (username, email, password_hash, region) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role, region`,
      [userData.username, userData.email, userData.passwordHash, userData.region]
    );
    return result.rows[0];
  }

  async updateLoginAttempts(id: string, attempts: number, lockedUntil: Date | null) {
    await this.pool.query(
      `UPDATE users SET failed_login_attempts = $2, locked_until = $3 WHERE id = $1`,
      [id, attempts, lockedUntil]
    );
  }

  async resetLoginAttempts(id: string) {
    await this.pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [id]
    );
  }

  async updateRole(id: string, role: string) {
    await this.pool.query(
      `UPDATE users SET role = $2 WHERE id = $1`,
      [id, role]
    );
  }
}
