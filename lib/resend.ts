import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@leashly.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev";

export async function sendWelcomeEmail(to: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to Leashly",
    html: `
      <div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:32px;max-width:520px;margin:0 auto;border-radius:12px;">
        <h1 style="color:#00ff88;font-size:24px;margin-bottom:8px;">Welcome to Leashly</h1>
        <p style="color:#999999;margin-bottom:24px;">Your AI cost control proxy is ready.</p>
        <p style="color:#f0f0f0;margin-bottom:8px;">Get started in 2 steps:</p>
        <ol style="color:#999999;padding-left:20px;line-height:2;">
          <li>Add your OpenAI / Anthropic / Gemini API key in the dashboard</li>
          <li>Copy your proxy key and use it in your app</li>
        </ol>
        <a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:24px;background:#00ff88;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Open dashboard →
        </a>
        <p style="color:#444444;font-size:12px;margin-top:32px;">Leashly · Stop surprise AI bills</p>
      </div>
    `,
  });
}

export async function sendAlertEmail(to: string, type: string, message: string) {
  const subject =
    type === "spend_threshold"
      ? "Leashly: Spend threshold reached"
      : type === "injection_detected"
      ? "Leashly: Prompt injection detected"
      : "Leashly: Alert triggered";

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:32px;max-width:520px;margin:0 auto;border-radius:12px;">
        <h1 style="color:#ff4444;font-size:20px;margin-bottom:8px;">⚠ Alert</h1>
        <p style="color:#f0f0f0;margin-bottom:24px;">${message}</p>
        <a href="${APP_URL}/dashboard/alerts" style="display:inline-block;background:#1f1f1f;color:#00ff88;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #00ff88;">
          View in dashboard →
        </a>
        <p style="color:#444444;font-size:12px;margin-top:32px;">Leashly · Manage alerts in your dashboard</p>
      </div>
    `,
  });
}
