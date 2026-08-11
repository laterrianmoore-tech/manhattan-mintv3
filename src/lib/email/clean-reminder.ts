// Day-before reminder email for a scheduled clean.
//
// This is transactional, not marketing: it goes to someone who has a confirmed
// appointment tomorrow, so it carries no unsubscribe link and is not filtered
// through email_unsubscribes. It deliberately keeps its own shell rather than
// borrowing renderCampaignEmail's — that one ends in a marketing footer and an
// unsubscribe line, neither of which belongs on an appointment reminder.

const GREEN_DARK = "#1e4d38";
const GREEN = "#2d6a4f";
const GREEN_BRIGHT = "#1d9e75";
const INK = "#141414";
const BODY = "#4a4a44";
const CREAM = "#f4f1ea";
const CARD = "#faf8f4";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'DM Sans',Helvetica,Arial,sans-serif";

const MAILING_ADDRESS = "Manhattan Mint NYC LLC · 401 E 34th St, New York, NY 10016";
const PHONE_DISPLAY = "(914) 863-7902";
const PHONE_E164 = "+19148637902";

export type CleanReminder = {
  firstName: string;
  /** e.g. "Wednesday, August 12" */
  dateLabel: string;
  /** e.g. "11am-12pm" — the exact window when we have one */
  arrivalWindow?: string | null;
  /** e.g. "Midday" — the broad slot, used when there's no exact window */
  timeLabel?: string | null;
  /** e.g. "Monthly" — omitted for one-time cleans */
  frequencyLabel?: string | null;
  serviceLabel?: string | null;
  /** Whole dollars */
  total?: number | null;
  siteUrl: string;
};

function detailRow(label: string, value: string, last = false): string {
  return `
  <tr>
    <td style="padding:13px 0;${last ? "" : `border-bottom:1px solid #eeeae1;`}">
      <p style="margin:0;color:#9a9a92;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">${label}</p>
      <p style="margin:4px 0 0;color:${INK};font-family:${SANS};font-size:16px;line-height:1.45;">${value}</p>
    </td>
  </tr>`;
}

export function renderCleanReminderEmail(r: CleanReminder): { subject: string; html: string } {
  const window = r.arrivalWindow?.trim() || null;
  const timeValue = window
    ? `${window}${r.timeLabel ? ` <span style="color:#9a9a92;">(${r.timeLabel})</span>` : ""}`
    : r.timeLabel || "We'll confirm your arrival window";

  const subject = `Your clean is tomorrow — ${r.dateLabel}`;
  const preheader = window
    ? `Arrival window ${window}. Reply if anything has changed.`
    : `Reply if anything has changed.`;

  const rows = [
    detailRow("When", `${r.dateLabel}`),
    detailRow("Arrival window", timeValue),
    r.serviceLabel ? detailRow("Service", r.serviceLabel) : "",
    r.total != null
      ? detailRow(
          "Your rate",
          `$${r.total}${r.frequencyLabel ? ` <span style="color:#9a9a92;">· ${r.frequencyLabel} plan</span>` : ""}`,
          true,
        )
      : "",
  ]
    .filter(Boolean)
    .join("");

  const bodyHtml = `
  <p style="margin:0 0 14px;color:${GREEN_BRIGHT};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Reminder</p>
  <h2 style="margin:0 0 14px;color:${INK};font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;">Your clean is tomorrow</h2>
  <p style="margin:0 0 26px;color:${BODY};font-family:${SANS};font-size:16px;line-height:1.65;">Hi ${r.firstName} — a quick note that your${
    r.frequencyLabel ? ` ${r.frequencyLabel.toLowerCase()}` : ""
  } clean is on the schedule for ${r.dateLabel}. Nothing to do on your end; we just like you to know we're coming.</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;padding:6px 22px;background:${CARD};border-radius:12px;border-left:3px solid ${GREEN_BRIGHT};">
    ${rows}
  </table>

  <p style="margin:0 0 18px;color:${BODY};font-family:${SANS};font-size:15px;line-height:1.7;"><strong style="color:${INK};">Two things that help us:</strong> let us know how we're getting in if anything has changed, and clear any counters or floors you'd like cleaned properly. If there's a room you want us to focus on, tell us and we'll spend the time there.</p>

  <p style="margin:0 0 6px;color:${BODY};font-family:${SANS};font-size:15px;line-height:1.7;">Need to move the time or cancel? Reply to this email or text <a href="tel:${PHONE_E164}" style="color:${GREEN};font-weight:600;text-decoration:none;">${PHONE_DISPLAY}</a> and we'll sort it out.</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:36px 12px 48px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="padding:0 8px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <a href="${r.siteUrl}" style="text-decoration:none;">
                <span style="color:${GREEN_DARK};font-family:${SERIF};font-size:24px;letter-spacing:-.01em;">Manhattan&nbsp;Mint</span>
              </a>
            </td>
            <td align="right">
              <span style="color:#8a867c;font-family:${SANS};font-size:11px;letter-spacing:.14em;text-transform:uppercase;">NYC Residential Cleaning</span>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(30,50,40,.07);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:5px;background:${GREEN_DARK};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:42px 44px 36px;">
              ${bodyHtml}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:26px 8px 0;text-align:center;">
          <p style="margin:0 0 10px;">
            <a href="tel:${PHONE_E164}" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">${PHONE_DISPLAY}</a>
            <span style="color:#c9c4b8;">&nbsp;·&nbsp;</span>
            <a href="${r.siteUrl}" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">manhattanmintnyc.com</a>
          </p>
          <p style="margin:0 0 6px;color:#a39e92;font-family:${SANS};font-size:12px;">Questions? Just reply — a real person reads this inbox.</p>
          <p style="margin:0 0 6px;color:#b6b1a5;font-family:${SANS};font-size:11px;">${MAILING_ADDRESS}</p>
          <p style="margin:0;color:#b6b1a5;font-family:${SANS};font-size:11px;">You're getting this because you have a cleaning scheduled with us.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
