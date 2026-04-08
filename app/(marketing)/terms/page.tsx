import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Leashly.",
  alternates: { canonical: "https://www.leashly.dev/terms" },
  robots: { index: true, follow: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-bright)]">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-12">
          <Link href="/" className="text-sm text-[var(--text-ghost)] hover:text-[var(--green)] transition-colors font-mono mb-8 block">
            ← leashly.dev
          </Link>
          <h1 className="font-mono text-3xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-sm text-[var(--text-ghost)] font-mono">Last updated: April 2025</p>
        </div>
        <div className="space-y-10">
          {[
            { title: "1. Acceptance",         body: "By using Leashly, you agree to these terms. If you don't agree, don't use the service." },
            { title: "2. What Leashly does",  body: "Leashly is a proxy service that sits between your application and LLM providers. It enforces spend caps, rate limits, and injection protection. We do not store your prompt content." },
            { title: "3. Your responsibilities", body: "You are responsible for maintaining the security of your Leashly API keys. You must not use Leashly for illegal purposes, to violate LLM providers' terms of service, or to generate harmful content." },
            { title: "4. Billing",            body: "Free plan is free forever with limits. Pro plan is $9 CAD/month billed monthly. You can cancel anytime. Refunds are issued at our discretion within 7 days of a charge." },
            { title: "5. Uptime",             body: "We aim for 99.9% uptime but do not guarantee it. We are not liable for losses caused by downtime." },
            { title: "6. Limitation of liability", body: "Leashly is provided 'as is'. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including unexpected LLM provider charges." },
            { title: "7. Termination",        body: "We may suspend or terminate accounts that violate these terms. You may delete your account at any time from Dashboard → Settings." },
            { title: "8. Contact",            body: "Questions? Email support@leashly.dev" },
          ].map(section => (
            <section key={section.title}>
              <h2 className="font-mono text-lg font-bold text-white mb-3">{section.title}</h2>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
