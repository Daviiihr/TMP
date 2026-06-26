import { getPostgresPool } from "@/lib/database";
import { AuthUser } from "@/lib/auth";
import { Pool } from "pg";

export interface UserRow extends AuthUser {
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
  avatar_url?: string;
  banner_url?: string;
  theme_color?: string;
  bio?: string;
  competitive_rank?: string;
  country?: string;
}

export class UserRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, email, password_hash, role, failed_login_attempts, locked_until, avatar_url, banner_url, theme_color, bio, competitive_rank, country 
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, email, password_hash, role, failed_login_attempts, locked_until, avatar_url, banner_url, theme_color, bio, competitive_rank, country 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async create(userData: { username: string; email: string; passwordHash: string; region: string; country: string }) {
    const result = await this.pool.query<{
      id: string;
      username: string;
      email: string;
      role: "PLAYER";
      region: string;
      country: string;
    }>(
      `INSERT INTO users (username, email, password_hash, region, country) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, role, region, country`,
      [userData.username, userData.email, userData.passwordHash, userData.region, userData.country]
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

  async updateProfile(id: string, profileData: { avatar_url?: string; banner_url?: string; theme_color?: string; bio?: string; competitive_rank?: string; country?: string }) {
    await this.pool.query(
      `UPDATE users SET 
        avatar_url = COALESCE($2, avatar_url),
        banner_url = COALESCE($3, banner_url),
        theme_color = COALESCE($4, theme_color),
        bio = COALESCE($5, bio),
        competitive_rank = COALESCE($6, competitive_rank),
        country = COALESCE($7, country)
       WHERE id = $1`,
      [
        id, 
        profileData.avatar_url || null, 
        profileData.banner_url || null, 
        profileData.theme_color || null, 
        profileData.bio || null, 
        profileData.competitive_rank || null,
        profileData.country || null
      ]
    );
  }
}
