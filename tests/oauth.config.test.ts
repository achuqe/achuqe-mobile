import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn(),
}));

async function loadOAuth() {
  vi.resetModules();
  return import("../constants/oauth");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("OAuth login URL configuration", () => {
  it("creates a sign-in URL with the app identifier and callback", async () => {
    vi.stubEnv("EXPO_PUBLIC_OAUTH_PORTAL_URL", "https://auth.example.test");
    vi.stubEnv("EXPO_PUBLIC_APP_ID", "achuqe-test-app");
    vi.stubEnv("EXPO_PUBLIC_API_BASE_URL", "https://api.example.test");

    const { getLoginUrl } = await loadOAuth();
    const url = new URL(getLoginUrl());

    expect(url.origin).toBe("https://auth.example.test");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("achuqe-test-app");
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(url.searchParams.get("redirectUri")).toBe("https://api.example.test/api/oauth/callback");
    expect(url.searchParams.get("state")).toBeTruthy();
  });

  it("stops before opening a broken registration flow when required configuration is absent", async () => {
    vi.stubEnv("EXPO_PUBLIC_OAUTH_PORTAL_URL", "");
    vi.stubEnv("EXPO_PUBLIC_APP_ID", "");

    const { getLoginUrl } = await loadOAuth();

    expect(() => getLoginUrl()).toThrow("რეგისტრაციის სერვისი ჯერ არ არის კონფიგურირებული");
  });
});
