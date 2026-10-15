import nodemailer from "nodemailer";

const masterSmtpUser = process.env.SMTP_USER || "";
const masterSmtpPass = process.env.SMTP_PASS || "";
const ajayNotificationEmail = process.env.NOTIFICATION_TO || masterSmtpUser;

// Master Nodemailer transporter (used EXCLUSIVELY for Ajay's personal realm)
const ajayTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: masterSmtpUser,
    pass: masterSmtpPass,
  },
});

export interface NotificationPayload {
  name: string;
  email: string;
  contact?: string;
  message: string;
  ref?: string | null;
  userAgent?: string | null;
  photos?: string[];
  unlockedAlbum?: boolean;
}

export interface CustomSmtpCredentials {
  email: string;
  appPassword: string;
}

/**
 * Send an immediate alert email to Ajay when someone leaves a note on /ajay/story
 * STRICTLY restricted to Ajay's realm. Never called for other users.
 */
export async function sendAlertToAjay(payload: NotificationPayload) {
  if (!masterSmtpUser || !masterSmtpPass) {
    console.warn("Ajay master SMTP credentials not provided. Skipping email dispatch.");
    return false;
  }

  const hasPhotos = Boolean(payload.photos && payload.photos.length > 0);
  const subject = hasPhotos
    ? `📸 [Photo Exchange] New photo shared by ${payload.name || "a visitor"} on your Story!`
    : `✨ New Personal Note on your Story from ${payload.name || "a visitor"}`;
  
  const attachments: Array<{ filename: string; content: Buffer; contentType: string; cid: string }> = [];
  if (hasPhotos && payload.photos) {
    payload.photos.forEach((photo, idx) => {
      const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        attachments.push({
          filename: `photo_${idx + 1}.jpg`,
          content: Buffer.from(match[2], "base64"),
          contentType: match[1],
          cid: `shared_photo_${idx + 1}`,
        });
      }
    });
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">
        ${hasPhotos ? "📸 Mutual Photo Exchange Received" : "New Message from your Story Page"}
      </h2>
      <p style="font-size: 15px; color: #a1a1aa; line-height: 1.5;">
        ${hasPhotos
          ? `<strong>${escapeHtml(payload.name)}</strong> just shared a photo to unlock your private album.`
          : "Someone just took the time to read through your story and left you a private note."}
      </p>
      
      <div style="background: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>From:</strong> <span style="color: #38bdf8;">${escapeHtml(payload.name)}</span></p>
        <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(payload.email)}" style="color: #38bdf8; text-decoration: none;">${escapeHtml(payload.email)}</a></p>
        ${payload.contact ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Social / Contact Handle:</strong> <span style="color: #e2e8f0;">${escapeHtml(payload.contact)}</span></p>` : ""}
        ${payload.ref ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Referral Source:</strong> <span style="color: #f59e0b; background: #451a03; padding: 2px 6px; border-radius: 4px;">${escapeHtml(payload.ref)}</span></p>` : ""}
        ${hasPhotos ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Exchange Status:</strong> <span style="color: #34d399; font-weight: bold;">Unlocked Private Album</span></p>` : ""}
        <hr style="border: none; border-top: 1px solid #27272a; margin: 14px 0;" />
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Message / Note:</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #f4f4f5; white-space: pre-wrap;">${escapeHtml(payload.message || "No note provided.")}</p>
        
        ${attachments.length > 0 ? `
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #27272a;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #34d399; font-weight: bold;">Attached Photo(s):</p>
            <div style="text-align: center;">
              ${attachments.map((att) => `
                <img src="cid:${att.cid}" alt="Shared photo" style="max-width: 100%; max-height: 380px; border-radius: 8px; border: 1px solid #3f3f46; display: block; margin: 0 auto 10px auto;" />
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Sent via Deep Connection Story Engine</p>
    </div>
  `;

  try {
    await ajayTransporter.sendMail({
      from: `"Story Notification" <${masterSmtpUser}>`,
      to: ajayNotificationEmail,
      replyTo: payload.email,
      subject,
      html,
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType, cid: a.cid })),
    });
    return true;
  } catch (error) {
    console.error("Failed to send alert email to Ajay:", error);
    return false;
  }
}

/**
 * Send an automated confirmation email to visitor on /ajay/story
 */
export async function sendConfirmationToVisitor(toEmail: string, name: string, realmOwnerName: string = "Ajay") {
  if (!masterSmtpUser || !masterSmtpPass) return false;

  const subject = `Thanks for your note, ${name} — ${realmOwnerName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; color: #18181b; border-radius: 10px; border: 1px solid #e4e4e7;">
      <h3 style="margin-top: 0; color: #09090b; font-size: 18px;">Hey ${escapeHtml(name)},</h3>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
        Thanks for taking the time to read through my story and leaving a note. I know the online dating world can often feel noisy and impersonal, which is why I created this quiet space to connect more intentionally.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
        I've received your message directly in my personal inbox. I'll read through your note thoughtfully and reply back soon.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46; margin-bottom: 24px;">
        Wishing you a peaceful rest of your day!
      </p>
      <div style="border-top: 1px solid #f4f4f5; padding-top: 16px;">
        <p style="margin: 0; font-weight: 600; color: #18181b;">Warm regards,</p>
        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 14px;">${escapeHtml(realmOwnerName)}</p>
      </div>
    </div>
  `;

  try {
    await ajayTransporter.sendMail({
      from: `"${escapeHtml(realmOwnerName)}" <${masterSmtpUser}>`,
      to: toEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email to visitor:", error);
    return false;
  }
}

/**
 * Dispatch an alert email for a third-party realm using their OWN Google App Password.
 * NEVER touches Ajay's credentials.
 */
export async function sendCustomRealmAlert(options: {
  smtp: CustomSmtpCredentials;
  realmName: string;
  slug: string;
  name: string;
  email: string;
  contact?: string;
  message: string;
  ref?: string | null;
  userAgent?: string | null;
  photos?: string[];
  unlockedAlbum?: boolean;
}) {
  const { smtp, realmName, name, email, contact, message, ref, photos, unlockedAlbum } = options;
  if (!smtp.email || !smtp.appPassword) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtp.email,
      pass: smtp.appPassword,
    },
  });

  const hasPhotos = Boolean(photos && photos.length > 0);
  const subject = hasPhotos
    ? `📸 [Photo Exchange] New photo shared by ${name || "a visitor"} on your Story!`
    : `✨ New Personal Note on your Story from ${name || "a visitor"}`;

  const attachments: Array<{ filename: string; content: Buffer; contentType: string; cid: string }> = [];
  if (hasPhotos && photos) {
    photos.forEach((photo, idx) => {
      const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        attachments.push({
          filename: `photo_${idx + 1}.jpg`,
          content: Buffer.from(match[2], "base64"),
          contentType: match[1],
          cid: `shared_photo_${idx + 1}`,
        });
      }
    });
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">
        ${hasPhotos ? "📸 Mutual Photo Exchange Received" : "New Message from your Story Page"}
      </h2>
      <p style="font-size: 15px; color: #a1a1aa; line-height: 1.5;">
        ${hasPhotos
          ? `<strong>${escapeHtml(name)}</strong> just shared a photo to unlock your private album.`
          : "Someone just took the time to read through your story and left you a private note."}
      </p>
      
      <div style="background: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>From:</strong> <span style="color: #38bdf8;">${escapeHtml(name)}</span></p>
        <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #38bdf8; text-decoration: none;">${escapeHtml(email)}</a></p>
        ${contact ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Social / Contact Handle:</strong> <span style="color: #e2e8f0;">${escapeHtml(contact)}</span></p>` : ""}
        ${ref ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Referral Source:</strong> <span style="color: #f59e0b; background: #451a03; padding: 2px 6px; border-radius: 4px;">${escapeHtml(ref)}</span></p>` : ""}
        ${hasPhotos ? `<p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Exchange Status:</strong> <span style="color: #34d399; font-weight: bold;">Unlocked Private Album</span></p>` : ""}
        <hr style="border: none; border-top: 1px solid #27272a; margin: 14px 0;" />
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Message / Note:</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #f4f4f5; white-space: pre-wrap;">${escapeHtml(message || "No note provided.")}</p>
        
        ${attachments.length > 0 ? `
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #27272a;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #34d399; font-weight: bold;">Attached Photo(s):</p>
            <div style="text-align: center;">
              ${attachments.map((att) => `
                <img src="cid:${att.cid}" alt="Shared photo" style="max-width: 100%; max-height: 380px; border-radius: 8px; border: 1px solid #3f3f46; display: block; margin: 0 auto 10px auto;" />
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Sent via ${escapeHtml(realmName)}'s Story Realm</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${escapeHtml(realmName)}" <${smtp.email}>`,
      to: smtp.email,
      replyTo: email,
      subject,
      html,
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType, cid: a.cid })),
    });
    return true;
  } catch (error) {
    console.error(`Failed to send custom alert email for realm ${options.slug}:`, error);
    return false;
  }
}

/**
 * Dispatch confirmation email for a third-party realm using their OWN Google App Password.
 */
export async function sendCustomConfirmationToVisitor(options: {
  smtp: CustomSmtpCredentials;
  toEmail: string;
  visitorName: string;
  realmOwnerName: string;
}) {
  const { smtp, toEmail, visitorName, realmOwnerName } = options;
  if (!smtp.email || !smtp.appPassword) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtp.email,
      pass: smtp.appPassword,
    },
  });

  const subject = `Thanks for your note, ${visitorName} — ${realmOwnerName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; color: #18181b; border-radius: 10px; border: 1px solid #e4e4e7;">
      <h3 style="margin-top: 0; color: #09090b; font-size: 18px;">Hey ${escapeHtml(visitorName)},</h3>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
        Thanks for taking the time to read through my story and leaving a note. I know the online dating world can often feel noisy and impersonal, which is why I created this quiet space to connect more intentionally.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
        I've received your message directly in my personal inbox. I'll read through your note thoughtfully and reply back soon.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #3f3f46; margin-bottom: 24px;">
        Wishing you a peaceful rest of your day!
      </p>
      <div style="border-top: 1px solid #f4f4f5; padding-top: 16px;">
        <p style="margin: 0; font-weight: 600; color: #18181b;">Warm regards,</p>
        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 14px;">${escapeHtml(realmOwnerName)}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${escapeHtml(realmOwnerName)}" <${smtp.email}>`,
      to: toEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send custom confirmation email for ${realmOwnerName}:`, error);
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
