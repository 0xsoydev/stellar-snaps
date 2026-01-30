import { Resend } from 'resend';

// For development without a verified domain, use Resend's test address
// In production, set FROM_EMAIL to your verified domain (e.g., noreply@yourdomain.com)
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Lazily initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendMagicLinkParams {
  email: string;
  token: string;
  baseUrl: string;
}

export async function sendMagicLinkEmail({ email, token, baseUrl }: SendMagicLinkParams) {
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Sign in to Stellar Snaps',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #fe330a; font-size: 28px; margin: 0;">Stellar Snaps</h1>
            </div>
            
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Sign in to your account</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
              Click the button below to sign in to Stellar Snaps. This link expires in 15 minutes.
            </p>
            
            <a href="${magicLink}" style="display: block; background: #fe330a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 24px;">
              Sign In
            </a>
            
            <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
              If you didn't request this email, you can safely ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #fe330a; word-break: break-all;">${magicLink}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Sign in to Stellar Snaps\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
  });

  if (error) {
    console.error('[Email] Failed to send magic link:', error);
    throw new Error('Failed to send email');
  }

  return data;
}
