import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

function ProviderButton({
  label,
  description,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border p-4 text-left transition-colors duration-200 ${
        disabled
          ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-70"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display font-semibold text-foreground">{label}</p>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function LoginPage() {
  const auth = useAuth();

  return (
    <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Optional account sign-in
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Save your progress, switch users, and keep studying anywhere.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Anonymous study still works. Sign in when you want cloud sync, profile editing, and cross-device history.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Choose a sign-in path</CardTitle>
              <CardDescription>
                Internet Identity is the current sign-in gateway for account sync and profile updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProviderButton
                label="Continue with Internet Identity"
                description="Primary ICP-native sign-in for syncing attempts and editing your profile."
                icon={<ShieldCheck className="size-4 text-primary" />}
                onClick={() => auth.login()}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm bg-muted/10">
            <CardHeader>
              <CardTitle className="font-display text-xl">Account status</CardTitle>
              <CardDescription>
                {auth.isAuthenticated
                  ? "You are signed in and can sync progress."
                  : "You are browsing anonymously."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {auth.isAuthenticated ? (
                <>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Principal
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-foreground">
                      {auth.principal?.toString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline">
                      <Link to="/account">Open account settings</Link>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => auth.switchUser()}
                    >
                      <LogOut className="size-4" />
                      Switch user
                    </Button>
                    <Button variant="ghost" onClick={() => auth.logout()}>
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="leading-relaxed text-muted-foreground">
                    Sign in to sync exam history and edit your profile. You can still continue anonymously.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/">
                      Continue anonymously
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
