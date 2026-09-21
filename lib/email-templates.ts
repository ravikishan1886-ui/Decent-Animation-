/**
 * Decent Animation - Reusable Transactional Email Templates
 * Dark cinematic Donghua theme with crimson & gold accents
 */

interface BaseTemplateOptions {
  title: string;
  preheader: string;
  bodyContent: string;
  ctaText?: string;
  ctaUrl?: string;
}

function getBaseLayout({
  title,
  preheader,
  bodyContent,
  ctaText,
  ctaUrl,
}: BaseTemplateOptions): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #08080d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="background-color: #08080d; color: #e2e8f0; margin: 0; padding: 20px 10px;">
  <!-- Preheader text for inbox preview -->
  <span style="display:none;font-size:1px;color:#08080d;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </span>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #101018; border: 1px solid #252536; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.7);">
    
    <!-- Top Crimson/Gold Accent Header Bar -->
    <tr>
      <td style="background: linear-gradient(90deg, #c92a2a 0%, #e03131 50%, #d4af37 100%); height: 4px;"></td>
    </tr>

    <!-- Brand Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; text-align: center; border-bottom: 1px solid #1a1a28;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <div style="display: inline-block; padding: 6px 14px; background-color: #1a1215; border: 1px solid #4a1d24; border-radius: 24px;">
                <span style="color: #f59e0b; font-size: 13px; font-weight: 800; letter-spacing: 2px;">DECENT ANIMATION</span>
              </div>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
                Premium Donghua Cultivation Streaming
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content Body -->
    <tr>
      <td style="padding: 32px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        ${bodyContent}

        ${
          ctaText && ctaUrl
            ? `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px;">
          <tr>
            <td align="center">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(90deg, #c92a2a 0%, #d4af37 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 30px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(201,42,42,0.4);">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>
        `
            : ''
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #0b0b12; border-top: 1px solid #1a1a28; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
        <p style="margin: 0 0 8px 0; color: #94a3b8; font-weight: 600;">Decent Animation Platform</p>
        <p style="margin: 0 0 12px 0;">
          Official Indian Donghua Portal • Fast Hindi Dubs &amp; 4K Ultra HD
        </p>
        <p style="margin: 0; font-size: 10px; color: #475569;">
          &copy; ${currentYear} Decent Animation. You received this transaction notification for your registered account.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Admin Alert: New User Created
 */
export function getNewUserAdminTemplate(data: {
  userName: string;
  userEmail: string;
  registeredAt: string;
  userId: string;
}) {
  const body = `
    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0; font-weight: 700;">
      New Cultivator Registered
    </h2>
    <p style="margin: 0 0 16px 0;">
      A new user has successfully registered on the Decent Animation platform:
    </p>
    <div style="background-color: #161622; border: 1px solid #262638; border-radius: 10px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #94a3b8;">Name:</strong> <span style="color: #ffffff;">${data.userName}</span></p>
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #94a3b8;">Email:</strong> <span style="color: #38bdf8;">${data.userEmail}</span></p>
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #94a3b8;">User ID:</strong> <span style="color: #e2e8f0; font-family: monospace;">${data.userId}</span></p>
      <p style="margin: 0; font-size: 13px;"><strong style="color: #94a3b8;">Date &amp; Time:</strong> <span style="color: #e2e8f0;">${data.registeredAt}</span></p>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
      Access your Admin Dashboard to manage users, rights licenses, or video catalogs.
    </p>
  `;

  return getBaseLayout({
    title: 'New User Registered - Decent Animation',
    preheader: `New user ${data.userName} (${data.userEmail}) joined Decent Animation`,
    bodyContent: body,
    ctaText: 'Open Admin Dashboard',
    ctaUrl: 'https://decentanimation.com/admin',
  });
}

/**
 * 2. Subscription Purchase Confirmation
 */
export function getSubscriptionSuccessTemplate(data: {
  userName: string;
  planName: string;
  amount: number;
  startDate: string;
  expiryDate: string;
  benefits?: string[];
  watchUrl?: string;
}) {
  const benefitsList = (data.benefits || [
    'Unrestricted 4K & Full HD 1080p Donghua Streaming',
    'Early Access to VIP episodes and weekly drops',
    '100% Ad-Free cultivation viewing experience',
    'Ultra-fast offline download allowance',
  ])
    .map(
      (b) =>
        `<li style="margin-bottom: 6px; color: #e2e8f0;"><span style="color: #10b981; font-weight: bold; margin-right: 6px;">✓</span>${b}</li>`
    )
    .join('');

  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
        Payment Verified &amp; Activated
      </span>
      <h2 style="color: #ffffff; font-size: 20px; margin: 12px 0 6px 0; font-weight: 800;">
        Welcome to VIP Cultivation, ${data.userName}!
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Your <strong>${data.planName}</strong> pass is now active.
      </p>
    </div>

    <!-- Details Card -->
    <div style="background-color: #161622; border: 1px solid #262638; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 8px; font-size: 12px; color: #94a3b8;">Plan Subscribed:</td>
          <td align="right" style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #f59e0b;">${data.planName}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 12px; color: #94a3b8;">Amount Paid:</td>
          <td align="right" style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">₹${data.amount}.00</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-size: 12px; color: #94a3b8;">Activation Date:</td>
          <td align="right" style="padding-bottom: 8px; font-size: 12px; color: #e2e8f0;">${data.startDate}</td>
        </tr>
        <tr>
          <td style="font-size: 12px; color: #94a3b8;">Valid Until:</td>
          <td align="right" style="font-size: 13px; font-weight: 700; color: #10b981;">${data.expiryDate}</td>
        </tr>
      </table>
    </div>

    <h4 style="color: #ffffff; font-size: 13px; margin: 18px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
      Your Unlocked VIP Privileges:
    </h4>
    <ul style="list-style-type: none; padding-left: 0; margin: 0 0 20px 0; font-size: 13px;">
      ${benefitsList}
    </ul>
  `;

  return getBaseLayout({
    title: 'Subscription Activated - Decent Animation',
    preheader: `Your ${data.planName} pass is active until ${data.expiryDate}`,
    bodyContent: body,
    ctaText: 'Start Watching VIP Episodes',
    ctaUrl: data.watchUrl || 'https://decentanimation.com/browse',
  });
}

/**
 * 3. Subscription Expiry Reminder (7, 3, or 1 day)
 */
export function getSubscriptionExpiryReminderTemplate(data: {
  userName: string;
  planName: string;
  daysRemaining: number;
  expiryDate: string;
  renewUrl?: string;
}) {
  const urgencyColor = data.daysRemaining === 1 ? '#ef4444' : '#f59e0b';
  const urgencyLabel =
    data.daysRemaining === 1
      ? 'Expires Tomorrow!'
      : `Expires in ${data.daysRemaining} Days`;

  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #451a03; color: ${urgencyColor}; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid ${urgencyColor};">
        ${urgencyLabel}
      </span>
      <h2 style="color: #ffffff; font-size: 19px; margin: 12px 0 6px 0; font-weight: 800;">
        Hello, ${data.userName}
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Your Decent Animation <strong>${data.planName}</strong> pass is scheduled to expire soon.
      </p>
    </div>

    <div style="background-color: #161622; border: 1px solid #262638; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #94a3b8;">Current Tier:</strong> <span style="color: #f59e0b; font-weight: bold;">${data.planName}</span></p>
      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #94a3b8;">Expiration Date:</strong> <span style="color: #ffffff;">${data.expiryDate}</span></p>
      <p style="margin: 0; font-size: 13px;"><strong style="color: #94a3b8;">Days Remaining:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${data.daysRemaining} Day(s)</span></p>
    </div>

    <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6;">
      Renew now to retain uninterrupted access to 4K streams, offline downloads, and newly released VIP Donghua episodes without interruptions.
    </p>
  `;

  return getBaseLayout({
    title: `Subscription Reminder: Expires in ${data.daysRemaining} Days - Decent Animation`,
    preheader: `Your ${data.planName} subscription expires on ${data.expiryDate}. Renew to keep VIP perks!`,
    bodyContent: body,
    ctaText: 'Renew Subscription',
    ctaUrl: data.renewUrl || 'https://decentanimation.com/subscription',
  });
}

/**
 * 4. Subscription Expired Notice
 */
export function getSubscriptionExpiredTemplate(data: {
  userName: string;
  planName: string;
  renewUrl?: string;
}) {
  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #450a0a; color: #f87171; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
        Pass Expired
      </span>
      <h2 style="color: #ffffff; font-size: 19px; margin: 12px 0 6px 0; font-weight: 800;">
        Your VIP Cultivation Pass Has Expired
      </h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Your <strong>${data.planName}</strong> access ended recently.
      </p>
    </div>

    <p style="font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
      Your account has transitioned to the standard Free tier. You can renew at any time to instantly unlock all latest VIP episodes, 4K resolution, and ad-free playback.
    </p>
  `;

  return getBaseLayout({
    title: 'Your Subscription Has Expired - Decent Animation',
    preheader: `Your Decent Animation VIP pass has expired. Reactivate anytime to resume VIP perks.`,
    bodyContent: body,
    ctaText: 'Reactivate VIP Pass',
    ctaUrl: data.renewUrl || 'https://decentanimation.com/subscription',
  });
}

/**
 * 5. Password Reset Confirmation
 */
export function getPasswordResetConfirmationTemplate(data: {
  userName?: string;
  userEmail: string;
  resetTime: string;
}) {
  const body = `
    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 12px 0; font-weight: 700;">
      Password Successfully Reset
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6;">
      Hello ${data.userName || 'Cultivator'}, this email confirms that your Decent Animation password was successfully updated on <strong>${data.resetTime}</strong>.
    </p>

    <div style="background-color: #161622; border: 1px solid #262638; border-radius: 10px; padding: 14px; margin: 16px 0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        <strong style="color: #ffffff;">Security Alert:</strong> If you did not make this change, please immediately contact our support team or initiate a new password reset.
      </p>
    </div>
  `;

  return getBaseLayout({
    title: 'Password Reset Confirmation - Decent Animation',
    preheader: 'Your Decent Animation account password was successfully updated.',
    bodyContent: body,
    ctaText: 'Sign In to Your Account',
    ctaUrl: 'https://decentanimation.com/login',
  });
}

/**
 * 6. New Video / Episode Content Notification
 */
export function getNewContentNotificationTemplate(data: {
  title: string;
  episodeNumber?: number;
  seriesName?: string;
  thumbnailUrl: string;
  description: string;
  watchUrl: string;
}) {
  const body = `
    <span style="display: inline-block; background-color: #1e1b4b; color: #a5b4fc; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
      ✨ New Episode Released
    </span>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px 0; font-weight: 800;">
      ${data.title}
    </h2>

    ${
      data.thumbnailUrl
        ? `
      <div style="margin: 16px 0; border-radius: 12px; overflow: hidden; border: 1px solid #2c2c40;">
        <img src="${data.thumbnailUrl}" alt="${data.title}" style="width: 100%; display: block; max-height: 280px; object-fit: cover;" />
      </div>
    `
        : ''
    }

    <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
      ${data.description}
    </p>

    <div style="background-color: #141420; border: 1px solid #232334; border-radius: 8px; padding: 12px; font-size: 12px; color: #94a3b8;">
      Series: <strong style="color: #ffffff;">${data.seriesName || 'Decent Animation Original'}</strong>
      ${data.episodeNumber ? ` • Episode: <strong style="color: #f59e0b;">#${data.episodeNumber}</strong>` : ''}
    </div>
  `;

  return getBaseLayout({
    title: `New Release: ${data.title} - Decent Animation`,
    preheader: `Watch the latest episode of ${data.seriesName || data.title} now on Decent Animation!`,
    bodyContent: body,
    ctaText: 'Watch Episode Now',
    ctaUrl: data.watchUrl,
  });
}
