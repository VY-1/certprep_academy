import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useActor } from "@caffeineai/core-infrastructure";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, RefreshCw, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

function fromCandidOptText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return "";
}

function toCandidOptText(value: string): [] | [string] {
  const trimmed = value.trim();
  return trimmed ? [trimmed] : [];
}

export function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!auth.isAuthenticated || !actor) return;
      const profile = await actor.getMyProfile();
      if (cancelled || !profile) return;
      setUsername(fromCandidOptText((profile as { username?: unknown }).username));
      setFullName(fromCandidOptText((profile as { fullName?: unknown }).fullName));
      setEmail(fromCandidOptText((profile as { email?: unknown }).email));
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [actor, auth.isAuthenticated]);

  const handleSave = async () => {
    if (!actor || !auth.isAuthenticated) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await (actor as unknown as {
        updateMyProfile: (patch: {
          username: [] | [string];
          fullName: [] | [string];
          email: [] | [string];
        }) => Promise<unknown>;
      }).updateMyProfile({
        username: toCandidOptText(username),
        fullName: toCandidOptText(fullName),
        email: toCandidOptText(email),
      });
      setSaveMessage("Profile saved.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate({ to: "/" });
  };

  const handleSwitchUser = () => {
    auth.switchUser();
    navigate({ to: "/login" });
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Sign in required</CardTitle>
              <CardDescription>
                Account settings are available after you sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/login">
                  <ArrowLeft className="size-4" />
                  Go to login
                </Link>
              </Button>
              <Button asChild>
                <Link to="/">
                  Continue anonymously
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Account settings
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
            Your profile
          </h1>
          <p className="mt-3 text-muted-foreground">
            Edit the details that sync with your account. Logout and switch-user actions remain available here.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Profile details
            </CardTitle>
            <CardDescription>
              Username, full name, and email are optional and can be updated any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="studybuddy"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jordan Lee"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jordan@example.com"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving || isFetching}>
                {isSaving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save profile
              </Button>
              <Button variant="outline" onClick={handleSwitchUser}>
                <RefreshCw className="size-4" />
                Switch user
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>

            {saveMessage && (
              <p className="text-sm text-muted-foreground">{saveMessage}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
