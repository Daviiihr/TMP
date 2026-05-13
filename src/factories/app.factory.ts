import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";
import { TeamRepository } from "@/repositories/team.repository";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { UserRepository } from "@/repositories/user.repository";
import { AuthService } from "@/services/auth.service";
import { AuthValidator } from "@/services/auth.validator";
import { EnrollmentService } from "@/services/enrollment.service";
import { TeamService } from "@/services/team.service";

export class AppFactory {
  createPostgresPool(): Pool {
    return getPostgresPool();
  }

  createUserRepository(): UserRepository {
    return new UserRepository(this.createPostgresPool());
  }

  createTeamRepository(): TeamRepository {
    return new TeamRepository(this.createPostgresPool());
  }

  createTournamentRepository(): TournamentRepository {
    return new TournamentRepository(this.createPostgresPool());
  }

  createAuthValidator(): AuthValidator {
    return new AuthValidator();
  }

  createAuthService(): AuthService {
    return new AuthService(this.createUserRepository());
  }

  createTeamService(): TeamService {
    return new TeamService(
      this.createTeamRepository(),
      this.createUserRepository(),
    );
  }

  createEnrollmentService(): EnrollmentService {
    return new EnrollmentService(
      this.createTeamRepository(),
      this.createTournamentRepository(),
      this.createPostgresPool(),
    );
  }
}

export const appFactory = new AppFactory();
