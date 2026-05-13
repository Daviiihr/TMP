import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";
import { TeamRepository } from "@/repositories/team.repository";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { UserRepository } from "@/repositories/user.repository";
import { AuthService } from "@/services/auth.service";
import { AuthValidator } from "@/services/auth.validator";
import { EnrollmentService } from "@/services/enrollment.service";
import { TeamService } from "@/services/team.service";
import { TournamentService } from "@/services/tournament.service";
import { AppEventEmitter } from "@/observers/event-emitter";
import { LoggerObserver } from "@/observers/logger.observer";
import { CapacityObserver } from "@/observers/capacity.observer";

export class AppFactory {
  private eventEmitter: AppEventEmitter;

  constructor() {
    this.eventEmitter = new AppEventEmitter();
    this.registerObservers();
  }

  private registerObservers() {
    const logger = new LoggerObserver();
    
    // Register Logger to all events
    this.eventEmitter.on("tournament:statusChanged", logger);
    this.eventEmitter.on("enrollment:playerJoined", logger);
    this.eventEmitter.on("enrollment:teamJoined", logger);
    this.eventEmitter.on("team:created", logger);

    // Register CapacityObserver
    const capacityObserver = new CapacityObserver(
      this.createTournamentRepository(),
      this.createTournamentService()
    );
    
    this.eventEmitter.on("enrollment:playerJoined", capacityObserver);
    this.eventEmitter.on("enrollment:teamJoined", capacityObserver);
  }

  getEventEmitter(): AppEventEmitter {
    return this.eventEmitter;
  }
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
      this.eventEmitter
    );
  }

  createTournamentService(): TournamentService {
    return new TournamentService(
      this.createTournamentRepository(),
      this.createPostgresPool(),
      this.eventEmitter
    );
  }

  createEnrollmentService(): EnrollmentService {
    return new EnrollmentService(
      this.createTeamRepository(),
      this.createTournamentRepository(),
      this.createPostgresPool(),
      this.eventEmitter
    );
  }
}

export const appFactory = new AppFactory();
