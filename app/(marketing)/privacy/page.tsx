import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Leashly",
  description: "How Leashly collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-bright)]">
      <div className="max-w-3xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-sm text-[var(--text-ghost)] hover:text-[var(--green)] transition-colors font-mono mb-8 block">
            ← leashly.dev
          </Link>
          <h1 className="font-mono text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-[var(--text-ghost)] font-mono">Last updated: April 2025</p>
        </div>

        <div className="prose-leashly space-y-10">

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">1. Who we are</h2>
            <p className="text-[var(--text-dim)] leading-relaxed text-sm">
              Leashly ("we", "us", "our") is an AI cost-control proxy service operated by Sumit Sheokand.
              We are reachable at <a href="mailto:hello@leashly.dev" className="text-[var(--green)] hover:underline">hello@leashly.dev</a>.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">2. What we collect</h2>
            <div className="space-y-3 text-sm text-[var(--text-dim)] leading-relaxed">
              <p><span className="text-white font-medium">Account data:</span> Email address and password (hashed) when you register.</p>
              <p><span className="text-white font-medium">API keys:</span> Your LLM provider API keys are encrypted at rest using AES-256-CBC. We never log or expose them in any response.</p>
              <p><span className="text-white font-medium">Request metadata:</span> Token counts, costs, model names, latency, and flag status for each proxied request. We do NOT store prompt content or response content.</p>
              <p><span className="text-white font-medium">Billing data:</span> Payment is handled by Stripe. We store only your Stripe customer ID — no card numbers ever touch our servers.</p>
              <p><span className="text-white font-medium">Usage data:</span> Analytics about how you use the dashboard (page views, feature usage) via Google Analytics.</p>
              <p><span className="text-white font-medium">Cookies:</span> Session cookies for authentication and analytics cookies (Google Analytics). See Section 6.</p>
            </div>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">3. How we use your data</h2>
            <ul className="space-y-2 text-sm text-[var(--text-dim)] leading-relaxed list-none">
              {[
                "Provide and operate the Leashly proxy service",
                "Show you your usage analytics and cost breakdowns in the dashboard",
                "Send email alerts when you configure spend or rate limit notifications",
                "Process payments via Stripe",
                "Improve the service and fix bugs",
                "Respond to support requests",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--green)] shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">4. Data sharing</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-3">
              We do not sell your data. We share data only with:
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-dim)] leading-relaxed list-none">
              {[
                "Supabase — database hosting (your data is stored in their US servers)",
                "Stripe — payment processing",
                "Resend — transactional email delivery",
                "Vercel — hosting and deployment",
                "Google Analytics — anonymous usage analytics",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--text-ghost)] shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">5. Data retention</h2>
            <div className="space-y-2 text-sm text-[var(--text-dim)] leading-relaxed">
              <p>Free plan: Request logs retained for 7 days.</p>
              <p>Pro plan: Request logs retained for 90 days.</p>
              <p>Account data: Retained until you delete your account.</p>
              <p>You can delete your account and all associated data at any time from Dashboard → Settings → Danger Zone.</p>
            </div>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">6. Cookies</h2>
            <div className="space-y-3 text-sm text-[var(--text-dim)] leading-relaxed">
              <p><span className="text-white font-medium">Essential cookies:</span> Required for authentication and session management. Cannot be disabled.</p>
              <p><span className="text-white font-medium">Analytics cookies:</span> Google Analytics to understand how users interact with the product. You can opt out via our cookie banner or browser settings.</p>
              <p>We do not use advertising or tracking cookies.</p>
            </div>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">7. Your rights</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-3">
              Depending on your location, you may have the right to:
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-dim)] list-none">
              {[
                "Access the personal data we hold about you",
                "Request correction of inaccurate data",
                "Request deletion of your data",
                "Export your data in a portable format",
                "Opt out of analytics tracking",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--green)] shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed mt-3">
              To exercise any of these rights, email us at <a href="mailto:hello@leashly.dev" className="text-[var(--green)] hover:underline">hello@leashly.dev</a>.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">8. Security</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              We use AES-256-CBC encryption for API keys, bcrypt for passwords, HTTPS for all connections,
              Row Level Security on our database, and regular security audits. However, no system is 100%
              secure. If you discover a vulnerability, please email <a href="mailto:hello@leashly.dev" className="text-[var(--green)] hover:underline">hello@leashly.dev</a>.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">9. Changes to this policy</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              We may update this policy occasionally. We'll notify you by email or a notice on the dashboard
              for significant changes. Continued use of Leashly after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-white mb-3">10. Contact</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              Questions about this policy? Email us at{" "}
              <a href="mailto:hello@leashly.dev" className="text-[var(--green)] hover:underline">hello@leashly.dev</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
