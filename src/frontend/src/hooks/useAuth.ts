import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMemo } from "react";

export type AuthProviderId =
  | "internet-identity"
  | "google"
  | "microsoft"
  | "facebook";

export function useAuth() {
  const internetIdentity = useInternetIdentity();

  const principal = internetIdentity.identity?.getPrincipal() ?? null;

  return useMemo(
    () => ({
      identity: internetIdentity.identity,
      principal,
      isAuthenticated: internetIdentity.isAuthenticated,
      loginStatus: internetIdentity.loginStatus,
      isInitializing: internetIdentity.isInitializing,
      isLoginIdle: internetIdentity.isLoginIdle,
      isLoggingIn: internetIdentity.isLoggingIn,
      isLoginSuccess: internetIdentity.isLoginSuccess,
      isLoginError: internetIdentity.isLoginError,
      loginError: internetIdentity.loginError,
      login: () => {
        internetIdentity.login();
      },
      logout: () => {
        internetIdentity.clear();
      },
      switchUser: () => {
        internetIdentity.clear();
      },
      provider: "internet-identity" as const,
    }),
    [internetIdentity, principal],
  );
}
