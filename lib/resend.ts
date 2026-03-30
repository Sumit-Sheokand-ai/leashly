import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM     = process.env.RESEND_FROM_EMAIL   ?? "Leashly <noreply@leashly.dev>";
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://leashly.dev";

/* ─────────────────────────────────────────────
   Shared layout wrapper
   Works across Gmail, Outlook, Apple Mail
───────────────────────────────────────────── */
function layout(content: string, preview: string = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <title>Leashly</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;background-color:#0d0d0d}
    .email-body{background-color:#0d0d0d}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;">
  <!-- Preview text (hidden) -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#0d0d0d;line-height:1px;max-width:0;opacity:0;">${preview}&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;</span>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0d0d0d;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="520" style="max-width:520px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td style="padding-bottom:28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background:#060606;border-radius:10px;padding:8px 10px;border:1px solid #1c1c1c;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
                      <span style="color:#00d972;">L</span>eashly
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111111;border-radius:14px;border:1px solid #1e1e1e;padding:36px 36px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#333333;">
                © 2025 Leashly ·
                <a href="${APP_URL}" style="color:#444444;text-decoration:none;">leashly.dev</a>
                ·
                <a href="${APP_URL}/dashboard/settings" style="color:#444444;text-decoration:none;">Manage notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* Reusable parts */
const divider = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr><td style="padding:20px 0;"><div style="height:1px;background:#1e1e1e;"></div></td></tr>
</table>`;

function ctaButton(label: string, href: string, color = "#00ff88", textColor = "#000000") {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:8px;background:${color};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:${textColor};text-decoration:none;border-radius:8px;">${label} →</a>
    </td>
  </tr>
</table>`;
}

function ghostButton(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="border-radius:8px;border:1px solid #00ff88;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:11px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#00ff88;text-decoration:none;border-radius:8px;">${label} →</a>
    </td>
  </tr>
</table>`;
}

function pill(text: string, bg: string, color: string) {
  return `<span style="display:inline-block;background:${bg};color:${color};font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;">${text}</span>`;
}

function statRow(label: string, value: string, valueColor = "#ffffff") {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#666666;">${label}</td>
          <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:600;color:${valueColor};">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/* ─────────────────────────────────────────────
   1. Welcome email
───────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Welcome to Leashly</h1>
    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">Your AI cost control proxy is ready. You're now protected from surprise bills.</p>

    <!-- Steps -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      ${[
        ["01", "Add your API key", "Paste your OpenAI, Anthropic, or Gemini key in the dashboard. It's encrypted at rest with AES-256."],
        ["02", "Copy your proxy key", "You'll get an <code style='font-family:monospace;color:#00ff88;'>lsh_xxx</code> key — this is what your app uses instead of the real key."],
        ["03", "Point your app at Leashly", "Change one env var: set <code style='font-family:monospace;color:#00ff88;'>baseURL</code> to <code style='font-family:monospace;color:#00ff88;'>https://leashly.dev/api/proxy</code>. That's it."],
      ].map(([num, title, desc]) => `
      <tr>
        <td style="padding-bottom:16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="padding-top:2px;">
                <span style="display:inline-block;width:24px;height:24px;background:#00ff88;color:#000;border-radius:50%;font-family:monospace;font-size:11px;font-weight:700;text-align:center;line-height:24px;">${num}</span>
              </td>
              <td>
                <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#e0e0e0;">${title}</p>
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#666666;line-height:1.5;">${desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}
    </table>

    ${ctaButton("Open your dashboard", `${APP_URL}/dashboard`)}

    ${divider}

    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;line-height:1.6;">
      Need help? Reply to this email or check out the
      <a href="${APP_URL}/docs" style="color:#666666;">docs</a>.
      We reply to every email.
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to Leashly — you're all set",
    html: layout(content, "Your AI cost control proxy is ready. Get started in 3 steps."),
  });
}

/* ─────────────────────────────────────────────
   2. Spend threshold alert
───────────────────────────────────────────── */
export async function sendSpendAlertEmail(to: string, opts: {
  threshold: number;
  currentSpend: number;
  period: string;
  topModel?: string;
}) {
  const pct = Math.round((opts.currentSpend / opts.threshold) * 100);
  const barWidth = Math.min(pct, 100);
  const barColor = pct >= 100 ? "#ff4444" : pct >= 80 ? "#ffaa00" : "#00ff88";

  const content = `
    <!-- Alert badge -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#ff4444;border-radius:6px;padding:4px 10px;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">⚠ SPEND ALERT</span>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
      ${pct >= 100 ? "Spend cap reached" : `${pct}% of your spend cap`}
    </h1>
    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">
      Your ${opts.period} AI spend has ${pct >= 100 ? "exceeded" : "reached"} the threshold you set.
    </p>

    <!-- Progress bar -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td>
          <div style="background:#1a1a1a;border-radius:4px;height:8px;overflow:hidden;">
            <div style="background:${barColor};height:8px;width:${barWidth}%;border-radius:4px;"></div>
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px;">
            <tr>
              <td style="font-family:monospace;font-size:12px;color:#888888;">$${opts.currentSpend.toFixed(4)} spent</td>
              <td align="right" style="font-family:monospace;font-size:12px;color:#555555;">$${opts.threshold.toFixed(2)} limit</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Stats -->
    ${statRow("Period", opts.period)}
    ${statRow("Current spend", `$${opts.currentSpend.toFixed(4)}`, "#ffaa00")}
    ${statRow("Threshold", `$${opts.threshold.toFixed(2)}`)}
    ${opts.topModel ? statRow("Top model", opts.topModel, "#00aaff") : ""}

    <div style="height:24px;"></div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-right:12px;">${ctaButton("View spend →", `${APP_URL}/dashboard`, "#ff4444", "#ffffff")}</td>
        <td>${ghostButton("Manage alerts", `${APP_URL}/dashboard/alerts`)}</td>
      </tr>
    </table>

    ${divider}
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      You set this alert at $${opts.threshold.toFixed(2)}. To change it, visit
      <a href="${APP_URL}/dashboard/alerts" style="color:#666666;">your alerts</a>.
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠ Leashly: ${pct >= 100 ? "Spend cap reached" : `${pct}% of spend cap used`} (${opts.period})`,
    html: layout(content, `Your AI spend has reached ${pct}% of your $${opts.threshold} threshold.`),
  });
}

/* ─────────────────────────────────────────────
   3. Rate limit exceeded alert
───────────────────────────────────────────── */
export async function sendRateLimitAlertEmail(to: string, opts: {
  hitCount: number;
  period: string;
  scope: string;
  model?: string;
}) {
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#00aaff22;border:1px solid #00aaff44;border-radius:6px;padding:4px 10px;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;color:#00aaff;letter-spacing:0.5px;">⚡ RATE LIMIT ALERT</span>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Rate limit hit ${opts.hitCount} time${opts.hitCount !== 1 ? "s" : ""}</h1>
    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">
      Your rate limit was exceeded ${opts.hitCount} time${opts.hitCount !== 1 ? "s" : ""} this ${opts.period}. Affected requests received a 429 response.
    </p>

    ${statRow("Hits this " + opts.period, String(opts.hitCount), "#00aaff")}
    ${statRow("Scope", opts.scope)}
    ${opts.model ? statRow("Model", opts.model, "#7c3aed") : ""}

    <div style="height:24px;"></div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-right:12px;">${ctaButton("View logs", `${APP_URL}/dashboard/logs`, "#00aaff", "#000000")}</td>
        <td>${ghostButton("Adjust rules", `${APP_URL}/dashboard/rules`)}</td>
      </tr>
    </table>

    ${divider}
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      Excessive rate limit hits might indicate a misconfigured client or abusive user.
      Check the <a href="${APP_URL}/dashboard/logs" style="color:#666666;">request logs</a> for details.
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ Leashly: Rate limit hit ${opts.hitCount}× this ${opts.period}`,
    html: layout(content, `Your rate limit was exceeded ${opts.hitCount} times this ${opts.period}.`),
  });
}

/* ─────────────────────────────────────────────
   4. Injection detected alert
───────────────────────────────────────────── */
export async function sendInjectionAlertEmail(to: string, opts: {
  count: number;
  period: string;
  topReason?: string;
  blocked: boolean;
}) {
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#ff444422;border:1px solid #ff444444;border-radius:6px;padding:4px 10px;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;color:#ff6666;letter-spacing:0.5px;">🛡 INJECTION DETECTED</span>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
      ${opts.count} injection attempt${opts.count !== 1 ? "s" : ""} detected
    </h1>
    <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">
      Leashly's injection filter flagged ${opts.count} suspicious request${opts.count !== 1 ? "s" : ""} this ${opts.period}.
      ${opts.blocked ? "They were <strong style='color:#00ff88;'>blocked</strong> before reaching the model." : "They were <strong style='color:#ffaa00;'>logged</strong> but allowed through."}
    </p>

    ${statRow("Detected this " + opts.period, String(opts.count), "#ff4444")}
    ${statRow("Action taken", opts.blocked ? "Blocked (403)" : "Logged only", opts.blocked ? "#00ff88" : "#ffaa00")}
    ${opts.topReason ? statRow("Common pattern", opts.topReason, "#ff6666") : ""}

    <div style="height:24px;"></div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding-right:12px;">${ctaButton("View flagged logs", `${APP_URL}/dashboard/logs?flagged=true`, "#ff4444", "#ffffff")}</td>
        <td>${ghostButton("Adjust filter", `${APP_URL}/dashboard/rules`)}</td>
      </tr>
    </table>

    ${divider}
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      Injection attempts can indicate bad actors testing your app.
      Consider tightening filter sensitivity in <a href="${APP_URL}/dashboard/rules" style="color:#666666;">Rules</a>.
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `🛡 Leashly: ${opts.count} injection attempt${opts.count !== 1 ? "s" : ""} detected`,
    html: layout(content, `${opts.count} prompt injection attempt${opts.count !== 1 ? "s" : ""} were ${opts.blocked ? "blocked" : "detected"} this ${opts.period}.`),
  });
}

/* ─────────────────────────────────────────────
   5. Weekly digest
───────────────────────────────────────────── */
export async function sendWeeklyDigestEmail(to: string, opts: {
  weekStart: string;
  weekEnd: string;
  totalRequests: number;
  totalSpend: number;
  flaggedCount: number;
  topModel: string;
  topProvider: string;
  spendChange: number; // percent change vs last week, e.g. +12 or -5
}) {
  const changeColor = opts.spendChange > 0 ? "#ff4444" : opts.spendChange < 0 ? "#00ff88" : "#888888";
  const changeLabel = opts.spendChange > 0 ? `↑ ${opts.spendChange}%` : opts.spendChange < 0 ? `↓ ${Math.abs(opts.spendChange)}%` : "→ no change";

  const content = `
    <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#555555;font-family:monospace;">WEEKLY DIGEST</p>
    <h1 style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Your week in AI</h1>
    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#555555;">${opts.weekStart} – ${opts.weekEnd}</p>

    <!-- Big spend number -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;margin-bottom:20px;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#555555;">Total spend this week</p>
          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;">$${opts.totalSpend.toFixed(4)}</p>
          <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${changeColor};">${changeLabel} vs last week</p>
        </td>
      </tr>
    </table>

    <!-- Stats grid -->
    ${statRow("Total requests", opts.totalRequests.toLocaleString())}
    ${statRow("Flagged requests", String(opts.flaggedCount), opts.flaggedCount > 0 ? "#ff4444" : "#00ff88")}
    ${statRow("Top model", opts.topModel, "#00aaff")}
    ${statRow("Top provider", opts.topProvider, "#7c3aed")}

    <div style="height:24px;"></div>

    ${ctaButton("View full dashboard", `${APP_URL}/dashboard`)}

    ${divider}
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      This digest is sent every Monday.
      <a href="${APP_URL}/dashboard/settings" style="color:#666666;">Turn it off</a> in notification settings.
    </p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Leashly weekly digest — $${opts.totalSpend.toFixed(4)} spent, ${opts.totalRequests.toLocaleString()} requests`,
    html: layout(content, `Your AI usage for ${opts.weekStart}–${opts.weekEnd}. $${opts.totalSpend.toFixed(4)} spent across ${opts.totalRequests.toLocaleString()} requests.`),
  });
}

/* ─────────────────────────────────────────────
   6. Password reset / magic link (passthrough)
   Supabase handles sending, but this is the
   custom template you register in Supabase
   → Authentication → Email Templates
───────────────────────────────────────────── */
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Reset your password</h1>
    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">
      We received a request to reset the password for your Leashly account. Click the button below to set a new password.
    </p>

    ${ctaButton("Reset password", resetLink)}

    ${divider}

    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#555555;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:6px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#555555;word-break:break-all;">${resetLink}</p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Leashly password",
    html: layout(content, "Reset your Leashly account password. This link expires in 1 hour."),
  });
}

/* ─────────────────────────────────────────────
   7. Email confirmation (for Supabase custom SMTP)
───────────────────────────────────────────── */
export async function sendConfirmationEmail(to: string, confirmLink: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Confirm your email</h1>
    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#888888;line-height:1.6;">
      Thanks for signing up for Leashly. Click the button below to confirm your email address and activate your account.
    </p>

    ${ctaButton("Confirm email address", confirmLink)}

    ${divider}

    <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#555555;">
      This link expires in 24 hours. If you didn't create a Leashly account, you can safely ignore this email.
    </p>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#444444;">
      If the button doesn't work, copy and paste this URL:
    </p>
    <p style="margin:6px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#555555;word-break:break-all;">${confirmLink}</p>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Confirm your Leashly email address",
    html: layout(content, "Confirm your email to activate your Leashly account."),
  });
}

/* ─────────────────────────────────────────────
   Generic alert (legacy fallback)
───────────────────────────────────────────── */
export async function sendAlertEmail(to: string, type: string, message: string) {
  if (type === "spend_threshold") {
    return sendSpendAlertEmail(to, { threshold: 0, currentSpend: 0, period: "day" });
  }
  if (type === "injection_detected") {
    return sendInjectionAlertEmail(to, { count: 1, period: "hour", blocked: true });
  }
  if (type === "rate_exceeded") {
    return sendRateLimitAlertEmail(to, { hitCount: 1, period: "hour", scope: "account" });
  }

  // Generic fallback
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
      <tr><td style="background:#ff444422;border:1px solid #ff444444;border-radius:6px;padding:4px 10px;">
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:700;color:#ff6666;letter-spacing:0.5px;">⚠ ALERT</span>
      </td></tr>
    </table>
    <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:800;color:#ffffff;">Alert triggered</h1>
    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#cccccc;line-height:1.6;">${message}</p>
    ${ghostButton("View dashboard", `${APP_URL}/dashboard/alerts`)}
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Leashly: Alert triggered",
    html: layout(content, message),
  });
}
