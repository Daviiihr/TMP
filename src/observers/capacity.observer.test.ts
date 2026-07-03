import { describe, it, expect, vi, beforeEach } from "vitest";
import { CapacityObserver } from "./capacity.observer";

describe("CapacityObserver", () => {
  let observer: CapacityObserver;
  let tournamentRepoMock: {
    getById: ReturnType<typeof vi.fn>;
    getEnrollmentCount: ReturnType<typeof vi.fn>;
  };
  let tournamentServiceMock: { changeStatus: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tournamentRepoMock = {
      getById: vi.fn(),
      getEnrollmentCount: vi.fn(),
    };
    tournamentServiceMock = {
      changeStatus: vi.fn(),
    };
    observer = new CapacityObserver(
      tournamentRepoMock as never,
      tournamentServiceMock as never,
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should do nothing if tournament does not exist", async () => {
    tournamentRepoMock.getById.mockResolvedValue(null);
    await observer.update("enrollment:playerJoined", { tournamentId: "t1" });
    expect(tournamentRepoMock.getEnrollmentCount).not.toHaveBeenCalled();
  });

  it("should do nothing if capacity is not reached", async () => {
    tournamentRepoMock.getById.mockResolvedValue({
      id: "t1",
      max_players: 10,
      status: "REGISTRATION",
      organizer_id: "org1",
    });
    tournamentRepoMock.getEnrollmentCount.mockResolvedValue(5);
    await observer.update("enrollment:playerJoined", { tournamentId: "t1" });
    expect(tournamentServiceMock.changeStatus).not.toHaveBeenCalled();
  });

  it("should change status if capacity is reached and status is REGISTRATION", async () => {
    tournamentRepoMock.getById.mockResolvedValue({
      id: "t1",
      max_players: 10,
      status: "REGISTRATION",
      organizer_id: "org1",
    });
    tournamentRepoMock.getEnrollmentCount.mockResolvedValue(10);
    await observer.update("enrollment:playerJoined", { tournamentId: "t1" });
    expect(tournamentServiceMock.changeStatus).toHaveBeenCalledWith(
      "t1",
      "COMPLETED",
      "org1",
    );
  });

  it("should do nothing if capacity is reached but status is not REGISTRATION", async () => {
    tournamentRepoMock.getById.mockResolvedValue({
      id: "t1",
      max_players: 10,
      status: "COMPLETED",
      organizer_id: "org1",
    });
    tournamentRepoMock.getEnrollmentCount.mockResolvedValue(10);
    await observer.update("enrollment:playerJoined", { tournamentId: "t1" });
    expect(tournamentServiceMock.changeStatus).not.toHaveBeenCalled();
  });

  it("should catch errors", async () => {
    tournamentRepoMock.getById.mockRejectedValue(new Error("DB Error"));
    await observer.update("enrollment:playerJoined", { tournamentId: "t1" });
    expect(console.error).toHaveBeenCalled();
  });
});
