import { appFactory } from "../src/factories/app.factory";
import { getPostgresPool } from "../src/lib/database";

async function runTests() {
  console.log("🚀 Starting Validation Tests...");
  const pool = getPostgresPool();
  const tournamentService = appFactory.createTournamentService();

  try {
    const users = await pool.query("SELECT id FROM users LIMIT 1");
    if (users.rows.length < 1) {
      console.log("❌ Need at least 1 user in the database to test.");
      return;
    }
    const adminId = users.rows[0].id;

    console.log("\n--- Testing Unique Tournament Name (RN09) ---");
    const uniqueName = `Test_Tournament_${Date.now()}`;
    
    // Create first tournament
    await tournamentService.createTournament({
      name: uniqueName,
      game: "LoL",
      regions: ["LATAM"],
      type: "INDIVIDUAL",
      eliminationMode: "SINGLE_ELIMINATION",
      maxPlayers: 10,
      playersPerTeam: null,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      registrationClosesAt: new Date(Date.now() + 43200000).toISOString(),
      organizerId: adminId
    });
    console.log("✅ First tournament created successfully.");

    // Try to create second tournament with the same name
    try {
      await tournamentService.createTournament({
        name: uniqueName,
        game: "Dota 2",
        regions: ["NA"],
        type: "INDIVIDUAL",
        eliminationMode: "SINGLE_ELIMINATION",
        maxPlayers: 10,
        playersPerTeam: null,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        registrationClosesAt: new Date(Date.now() + 43200000).toISOString(),
        organizerId: adminId
      });
      console.log("❌ Second tournament with same name created: SHOULD HAVE FAILED");
    } catch (e: any) {
      if (e.message.includes("Ya existe un torneo con ese nombre")) {
        console.log("✅ RN09 Passed: FAILED AS EXPECTED - " + e.message);
      } else {
        console.log("⚠️ RN09 Failed with unexpected error: " + e.message);
      }
    }

    console.log("\n--- Testing Minimum 4 Participants (RN18) ---");
    try {
      await tournamentService.createTournament({
        name: `Test_Tournament_${Date.now()}`,
        game: "LoL",
        regions: ["LATAM"],
        type: "INDIVIDUAL",
        eliminationMode: "SINGLE_ELIMINATION",
        maxPlayers: 3, // Less than 4
        playersPerTeam: null,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        registrationClosesAt: new Date(Date.now() + 43200000).toISOString(),
        organizerId: adminId
      });
      console.log("❌ Tournament with 3 participants created: SHOULD HAVE FAILED");
    } catch (e: any) {
      if (e.message.includes("El torneo debe permitir al menos 4 participantes")) {
        console.log("✅ RN18 Passed: FAILED AS EXPECTED - " + e.message);
      } else {
        console.log("⚠️ RN18 Failed with unexpected error: " + e.message);
      }
    }

  } catch (error) {
    console.error("FATAL ERROR:", error);
  } finally {
    await pool.end();
  }
}

runTests();
