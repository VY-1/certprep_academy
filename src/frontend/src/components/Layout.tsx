import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, GraduationCap, History } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  /** If true, renders a focused exam layout with no nav distractions */
  examMode?: boolean;
}

export function Layout({ children, examMode = false }: LayoutProps) {
  const router = useRouterState();
  const isHome = router.location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            data-ocid="nav.home_link"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-semibold text-sm text-foreground tracking-tight">
                CertPrep Academy
              </span>
              {!examMode && (
                <span className="text-[10px] text-muted-foreground font-body tracking-wide">
                  Certification Exam Training
                </span>
              )}
            </div>
          </Link>

          {/* Nav */}
          {!examMode && (
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body transition-colors duration-200 ${
                  isHome
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                data-ocid="nav.exams_link"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Exams
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body transition-colors duration-200 ${
                  router.location.pathname === "/history"
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                data-ocid="nav.history_link"
              >
                <History className="w-3.5 h-3.5" />
                Study History
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      {!examMode && (
        <footer className="bg-card border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground font-body">
              © {new Date().getFullYear()} CertPrep Academy. All rights
              reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
