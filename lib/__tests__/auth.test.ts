import { describe, it, expect, beforeEach } from "vitest";
import { saveSession, getToken, clearSession, setToken, getUser, isAuthenticated } from "../auth";

const mockUser = { id: "1", username: "tester", email: "t@test.com", level: 5 };

// Reset module-level token state before each test
beforeEach(async () => {
  clearSession();
});

describe("auth", () => {
  describe("saveSession / getToken", () => {
    it("stores the access token in memory", () => {
      saveSession("tok-abc", mockUser);
      expect(getToken()).toBe("tok-abc");
    });

    it("persists user to localStorage", () => {
      saveSession("tok-abc", mockUser);
      expect(getUser()).toEqual(mockUser);
    });

    it("sets the session cookie", () => {
      saveSession("tok-abc", mockUser);
      expect(document.cookie).toContain("ti_session=1");
    });
  });

  describe("setToken", () => {
    it("updates the in-memory token without touching localStorage", () => {
      setToken("tok-new");
      expect(getToken()).toBe("tok-new");
      expect(localStorage.getItem("ti_user")).toBeNull();
    });
  });

  describe("clearSession", () => {
    it("clears token, localStorage, and cookie", () => {
      saveSession("tok-abc", mockUser);
      clearSession();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("isAuthenticated", () => {
    it("returns false before saveSession", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true after saveSession", () => {
      saveSession("tok-abc", mockUser);
      expect(isAuthenticated()).toBe(true);
    });

    it("returns false after clearSession", () => {
      saveSession("tok-abc", mockUser);
      clearSession();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
