import { Heart, Copy, Check } from "lucide-react";
import { useState } from "react";

export function SupportPage() {
  const [copied, setCopied] = useState(false);
  const icpAddress = "3df42c241ee03309ff9ebfb2dd0252b2611655321aa95a648c59b0bda884f25c";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icpAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8 p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
          Support CertPrep Academy
        </h1>
        <p className="text-muted-foreground font-body">
          Help us continue providing free certification exam training
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6">
        {/* Mission statement */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Our Mission
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CertPrep Academy is dedicated to making high-quality certification
                exam preparation accessible to everyone. We believe that financial
                barriers shouldn't stand between aspiring professionals and their
                career goals.
              </p>
            </div>
          </div>
        </div>

        {/* Donation section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Make a Donation
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            We accept donations in ICP (Internet Computer Protocol). Your support
            helps us maintain and improve our platform.
          </p>

          {/* ICP Address */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              ICP Address
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-foreground break-all bg-background px-3 py-2 rounded border border-border">
                {icpAddress}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• All donations are voluntary and greatly appreciated</p>
            <p>• No amount is too small</p>
            <p>• Your support directly funds server costs and development</p>
          </div>
        </div>

        {/* Thank you */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <p className="text-sm text-foreground text-center">
            Thank you for supporting CertPrep Academy! 💙
          </p>
        </div>
      </div>
    </div>
  );
}