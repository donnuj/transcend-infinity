import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the game store and api before importing save module
vi.mock("../game/store", () => ({
  useGameStore: {
    getState: () => ({
      save: { wallet: {}, version: "1.0" },
      setCloudSynced: vi.fn(),
    }),
    setState: vi.fn(),
  },
}));

vi.mock("../api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { updateRevision, scheduleSave } from "../game/save";
import { api } from "../api";

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateRevision", () => {
  it("does not throw and accepts numeric revision", () => {
    expect(() => updateRevision(5)).not.toThrow();
    expect(() => updateRevision(0)).not.toThrow();
  });
});

describe("scheduleSave", () => {
  it("is callable without error", () => {
    vi.useFakeTimers();
    expect(() => scheduleSave(100)).not.toThrow();
    vi.useRealTimers();
  });

  it("calls uploadCloudSave after the delay", async () => {
    vi.useFakeTimers();
    mockApi.post.mockResolvedValue({ success: true, revision: 1 });
    scheduleSave(100);
    await vi.advanceTimersByTimeAsync(200);
    expect(mockApi.post).toHaveBeenCalledWith("/player/save", expect.any(Object));
    vi.useRealTimers();
  });
});
