import nodemailer from "nodemailer";

let sharedTransport: nodemailer.Transporter | null = null;

function getMailTransport(): nodemailer.Transporter {
  if (!sharedTransport) {
    const login = process.env.SMTP_LOGIN || process.env.SMTP_EMAIL;
    const password = process.env.SMTP_PASSWORD;

    if (!password || !login) {
      console.error("Missing SMTP credentials (SMTP_LOGIN/SMTP_EMAIL or SMTP_PASSWORD).");
      throw new Error("Missing SMTP configuration.");
    }

    sharedTransport = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: login,
        pass: password,
      },
    });
  }
  return sharedTransport;
}

export async function sendMail({
  to,
  name,
  subject,
  body,
  from,
  replyTo,
}: {
  to: string;
  name: string;
  subject: string;
  body: string;
  from: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const transport = getMailTransport();
    const sendResult = await transport.sendMail({
      from: from,
      to,
      replyTo: replyTo || from,
      subject,
      html: body,
    });
    console.log(`[Brevo SMTP] Email sent to ${to}:`, sendResult.messageId);
    return { success: true, messageId: sendResult.messageId };
  } catch (error: any) {
    console.error(`[Brevo SMTP] Error sending email to ${to}:`, error);
    return { success: false, error: error.message || error };
  }
}

// export function compileWelcomeTemplate(name: string, url: string) {
//   const template = handlebars.compile(welcomeTemplate);
//   const htmlBody = template({
//     name: name,
//     url: url,
//   });
//   return htmlBody;
// }
