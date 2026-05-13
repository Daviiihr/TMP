import { getPostgresPool } from "../src/lib/database";
import { TeamRepository } from "../src/repositories/team.repository";
import { TournamentRepository } from "../src/repositories/tournament.repository";
import { EnrollmentService } from "../src/services/enrollment.service";

async function runTests() {
  console.log("🚀 Starting Integration Tests...");
  const pool = getPostgresPool();
  const teamRepo = new TeamRepository();
  const tournamentRepo = new TournamentRepository();
  const enrollmentService = new EnrollmentService();

  try {
    // 1. Setup: Get an Admin and a Player
    const users = await pool.query("SELECT id FROM users LIMIT 2");
    if (users.rows.length < 2) {
      console.log("❌ Need at least 2 users in the database to test.");
      return;
    }
    const adminId = users.rows[0].id;
    const playerId = users.rows[1].id;

    // 2. Create a Individual Tournament
    console.log("\n--- Testing Individual Enrollment ---");
    const indTournResult = await pool.query(
      `INSERT INTO tournaments (name, game, region, max_players, type, status, organizer_id) 
       VALUES ('Indie Cup', 'Rocket League', '{"LATAM"}', 10, 'INDIVIDUAL', 'REGISTRATION', $1) 
       RETURNING id`,
      [adminId]
    );
    const indTournId = indTournResult.rows[0].id;
    
    try {
      await enrollmentService.enrollPlayerInTournament(playerId, indTournId);
      console.log("✅ Player enrolled in individual tournament: SUCCESS");
    } catch (e: any) {
      console.log("❌ Player enrolled in individual tournament: FAILED - " + e.message);
    }

    // 3. Create a Team Tournament (Size 5)
    console.log("\n--- Testing Team Enrollment ---");
    const teamTournResult = await pool.query(
      `INSERT INTO tournaments (name, game, region, max_players, type, min_players_per_team, max_players_per_team, status, organizer_id) 
       VALUES ('Pro League', 'LoL', '{"LATAM"}', 20, 'TEAM', 5, 5, 'REGISTRATION', $1) 
       RETURNING id`,
      [adminId]
    );
    const teamTournId = teamTournResult.rows[0].id;

    // 3.1 Create correct size team (5)
    const team5 = await teamRepo.create({ name: "Dream Team", captain_id: playerId, size: 5 });
    try {
      await enrollmentService.enrollTeamInTournament(team5.id, teamTournId);
      console.log("✅ Team (size 5) enrolled in tournament (size 5): SUCCESS");
    } catch (e: any) {
      console.log("❌ Team (size 5) enrolled in tournament (size 5): FAILED - " + e.message);
    }

    // 3.2 Create wrong size team (3)
    const team3 = await teamRepo.create({ name: "Small Team", captain_id: playerId, size: 3 });
    try {
      await enrollmentService.enrollTeamInTournament(team3.id, teamTournId);
      console.log("❌ Team (size 3) enrolled in tournament (size 5): SHOULD HAVE FAILED");
    } catch (e: any) {
      console.log("✅ Team (size 3) enrolled in tournament (size 5): FAILED AS EXPECTED - " + e.message);
    }

    // 4. Cross-type enrollment tests
    console.log("\n--- Testing Cross-Type Constraints ---");
    try {
      await enrollmentService.enrollPlayerInTournament(playerId, teamTournId);
      console.log("❌ Player enrolled in TEAM tournament: SHOULD HAVE FAILED");
    } catch (e: any) {
      console.log("✅ Player enrolled in TEAM tournament: FAILED AS EXPECTED - " + e.message);
    }

    try {
      await enrollmentService.enrollTeamInTournament(team5.id, indTournId);
      console.log("❌ Team enrolled in INDIVIDUAL tournament: SHOULD HAVE FAILED");
    } catch (e: any) {
      console.log("✅ Team enrolled in INDIVIDUAL tournament: FAILED AS EXPECTED - " + e.message);
    }

    console.log("\n✨ All tests completed!");
  } catch (error: any) {
    console.error("FATAL ERROR:", error);
  }
}

runTests();
