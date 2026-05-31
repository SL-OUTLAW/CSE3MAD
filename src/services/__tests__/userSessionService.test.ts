// Jest setup and import 1-10
/// <reference types="jest" />

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearUserSession,
  getUserSession,
  saveUserSession,
  type OfflineUserSession,
} from "../userSessionService";

// Mock AsyncStorage so tests do not use real device storage.
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("userSessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

// Unit Test 1: checks that saveUserSession stores session data.
  it("saves user session data to AsyncStorage", async () => { 
    const mockSession: OfflineUserSession = {
      uid: "test-user-123",
      email: "test00@gmail.com",
      teamId: "team-001",
      teamName: "Test 111",
      grade: "12",
      teamMembers: ["YM"],
      savedAt: "2026-05-29T13:12:07.174Z",
    };

    await saveUserSession(mockSession);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "offlineUserSession",
      JSON.stringify(mockSession),
    );
  });

// Unit Test 2: checks that getUserSession handles missing session data.
  it("returns null when no saved session exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const result = await getUserSession();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith("offlineUserSession");
    expect(result).toBeNull();
  });

// Integration Test: Save, load, clear session flow.
  it("saves, loads, and clears the user session", async () => {
    const mockSession: OfflineUserSession = {
      uid: "test-user-123",
      email: "test00@gmail.com",
      teamId: "team-001",
      teamName: "Test 111",
      grade: "12",
      teamMembers: ["YM"],
      savedAt: "2026-05-29T13:12:07.174Z",
    };

    await saveUserSession(mockSession);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockSession),
    );

    const loadedSession = await getUserSession();

    expect(loadedSession).toEqual(mockSession);

    await clearUserSession();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("offlineUserSession");

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const clearedSession = await getUserSession();

    expect(clearedSession).toBeNull();
  });
});