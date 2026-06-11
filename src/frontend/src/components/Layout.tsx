import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Check, Copy, GraduationCap, HandHeart, History, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LayoutProps {
  children: React.ReactNode;
  /** If true, renders a focused exam layout with no nav distractions */
  examMode?: boolean;
}

export function Layout({ children, examMode = false }: LayoutProps) {
  const router = useRouterState();
  const isHome = router.location.pathname === "/";
  const donationAddress =
    "3df42c241ee03309ff9ebfb2dd0252b2611655321aa95a648c59b0bda884f25c";
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrCodeUrl = useMemo(() => {
    const payload = encodeURIComponent(`icp:${donationAddress}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${payload}`;
  }, [donationAddress]);

  useEffect(() => {
    if (examMode) {
      return;
    }

    const popupSeenKey = "certprep_donation_popup_seen";
    const hasSeenPopup = sessionStorage.getItem(popupSeenKey);
    if (!hasSeenPopup) {
      setShowDonationPopup(true);
      sessionStorage.setItem(popupSeenKey, "1");
    }
  }, [examMode]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(donationAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy donation address", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Dialog open={showDonationPopup} onOpenChange={setShowDonationPopup}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Support CertPrep Academy</DialogTitle>
            <DialogDescription>
              A one-time donation helps keep exam prep free and accessible.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">ICP donation address</p>
              <code className="block rounded-md border bg-muted/40 p-3 text-xs leading-relaxed break-all">
                {donationAddress}
              </code>
              <Button onClick={handleCopyAddress} className="w-full sm:w-auto">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy Address"}
              </Button>
            </div>

            <div className="mx-auto rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <QrCode className="size-3.5" />
                Scan QR
              </div>
              <img
                src={qrCodeUrl}
                alt="QR code for ICP donation address"
                width={180}
                height={180}
                className="h-[180px] w-[180px] rounded-sm"
                loading="lazy"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDonationPopup(false)}>
              Maybe Later
            </Button>
            <Button asChild>
              <Link to="/support">Open Support Page</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Link
                to="/support"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body transition-colors duration-200 ${
                  router.location.pathname === "/support"
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                data-ocid="nav.support_link"
              >
                <HandHeart className="w-3.5 h-3.5" />
                Support
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
