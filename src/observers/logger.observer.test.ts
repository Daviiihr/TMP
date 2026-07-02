import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoggerObserver } from "./logger.observer";

describe("LoggerObserver", () => {
  let observer: LoggerObserver;

  beforeEach(() => {
    observer = new LoggerObserver();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should log tournament:statusChanged", async () => {
    await observer.update("tournament:statusChanged", {
      tournamentId: "t1",
      oldStatus: "DRAFT",
      newStatus: "REGISTRATION",
      userId: "u1",
    });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "Torneo t1 cambió de DRAFT → REGISTRATION (Usuario: u1)",
      ),
    );
  });

  it("should log enrollment:playerJoined", async () => {
    await observer.update("enrollment:playerJoined", {
      tournamentId: "t1",
      userId: "u1",
    });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Jugador u1 se inscribió al torneo t1"),
    );
  });

  it("should log enrollment:teamJoined", async () => {
    await observer.update("enrollment:teamJoined", {
      tournamentId: "t1",
      teamId: "team1",
    });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Equipo team1 se inscribió al torneo t1"),
    );
  });

  it("should log team:created", async () => {
    await observer.update("team:created", {
      teamId: "team1",
      name: "T1",
      captainId: "u1",
    });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Equipo "T1" (team1) creado por el capitán u1'),
    );
  });

  it("should log default events", async () => {
    // any cast to bypass type checking for unknown event
    await observer.update("unknown:event" as never, { foo: "bar" } as never);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("unknown:event"),
      { foo: "bar" },
    );
  });
});
