import nodemailer from "nodemailer";
export async function sendMail({
  to,
  name,
  subject,
  body,
  from,
}: {
  to: string;
  name: string;
  subject: string;
  body: string;
  from: string;
}) {
  const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;

  // Check if environment variables are loaded
  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    console.error(
      "SMTP_EMAIL or SMTP_PASSWORD environment variables are not set."
    );
    throw new Error("Missing SMTP configuration.");
  }

  // const transport = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: SMTP_EMAIL,
  //     pass: SMTP_PASSWORD,
  //   },
  // });
  const transport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_LOGIN,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  try {
    const testResult = await transport.verify();
    console.log(testResult);
  } catch (error) {
    console.error({ error });
    return;
  }
  try {
    const sendResult = await transport.sendMail({
      from: from,
      to,
      subject,
      html: body,
    });
    console.log(sendResult);
  } catch (error) {
    console.log(error);
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
