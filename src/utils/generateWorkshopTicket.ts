import sharp from "sharp";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import os from "os";

interface IGenerateTicketOptions {
  token: string;
  name?: string;
  workshopTitle?: string;
  qrTemplateImage?: string;
  date?: string;
  time?: string;
  location?: string;
}

/**
 * Escapes XML/SVG special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncates string to max length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (!str) return "";
  return str.length > maxLength ? str.substring(0, maxLength - 1) + "…" : str;
}

/**
 * Registers the bundled Inter font with fontconfig so librsvg can find it.
 * Creates a custom fonts.conf in /tmp and sets FONTCONFIG_FILE.
 */
function ensureFontsRegistered(): void {
  const fontsDir = path.join(process.cwd(), "src", "assets", "fonts");
  const tmpDir = path.join(os.tmpdir(), "tgn-fontconfig");
  const cacheDir = path.join(tmpDir, "cache");
  const confPath = path.join(tmpDir, "fonts.conf");

  // Only write once per cold start
  if (process.env.FONTCONFIG_FILE === confPath && fs.existsSync(confPath)) {
    return;
  }

  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  // Fontconfig configuration that includes system fonts + our bundled fonts
  const fontsConf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <!-- Include system defaults if available -->
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>

  <!-- Our bundled fonts directory -->
  <dir>${fontsDir}</dir>

  <!-- Writable cache directory -->
  <cachedir>${cacheDir}</cachedir>

  <!-- Map generic family names to Inter as fallback -->
  <alias>
    <family>sans-serif</family>
    <prefer><family>Inter</family></prefer>
  </alias>
  <alias>
    <family>sans</family>
    <prefer><family>Inter</family></prefer>
  </alias>
</fontconfig>`;

  fs.writeFileSync(confPath, fontsConf);
  process.env.FONTCONFIG_FILE = confPath;
}

/**
 * Composites attendee QR code and details onto the branded template image.
 * Template dimensions: 1080 x 1350 px.
 */
export async function generateWorkshopTicket(options: IGenerateTicketOptions): Promise<Buffer> {
  const {
    token,
    name = "Workshop Attendee",
    workshopTitle = "Workshop Program",
    qrTemplateImage,
  } = options;

  // Register bundled fonts with fontconfig BEFORE any SVG rendering
  ensureFontsRegistered();

  const baseUrl = (
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.baseUrl ||
    "https://dashboard.thegoodnews-me.com"
  ).replace(/\/$/, "");
  const checkInUrl = `${baseUrl}/api/workshop-checkin?token=${encodeURIComponent(token)}`;

  // Generate high quality QR code buffer
  const qrBuffer = await QRCode.toBuffer(checkInUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 380,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const cleanName = escapeXml(truncate(name, 35));
  const cleanWorkshop = escapeXml(truncate(workshopTitle, 45));
  const cleanToken = escapeXml(token);

  // SVG text overlay — fonts resolved via fontconfig (no @font-face needed)
  const textSvg = Buffer.from(`
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.08" />
        </filter>
      </defs>
      <style>
        .attendee-name { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 36px; fill: #0f172a; text-anchor: middle; }
        .workshop-name { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 24px; fill: #475569; text-anchor: middle; }
        .pass-badge { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 22px; fill: #e11d48; text-anchor: middle; letter-spacing: 3px; }
        .instruction { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 17px; fill: #64748b; text-anchor: middle; }
        .tagline { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 15px; fill: #e11d48; text-anchor: middle; letter-spacing: 2px; text-transform: uppercase; }
      </style>
      
      <!-- QR Card Container Frame with soft shadow -->
      <rect x="330" y="470" width="420" height="420" rx="32" fill="#ffffff" stroke="#f1f5f9" stroke-width="3" filter="url(#cardShadow)" />
      
      <!-- Text details below QR code -->
      <text x="540" y="945" class="tagline">Official Entry Pass</text>
      <text x="540" y="995" class="attendee-name">${cleanName}</text>
      <text x="540" y="1040" class="workshop-name">${cleanWorkshop}</text>
      <text x="540" y="1090" class="pass-badge">PASS CODE: ${cleanToken}</text>
      <text x="540" y="1130" class="instruction">Present this QR code at reception upon arrival</text>
    </svg>
  `);

  // Resolve template buffer (custom uploaded image or default template)
  const defaultTemplatePath = path.join(
    process.cwd(),
    "public",
    "images",
    "qr",
    "QR code template.png"
  );

  let templateBuffer: Buffer;

  if (
    qrTemplateImage &&
    (qrTemplateImage.startsWith("http://") || qrTemplateImage.startsWith("https://"))
  ) {
    try {
      const res = await fetch(qrTemplateImage);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        templateBuffer = await sharp(Buffer.from(arrayBuf))
          .resize(1080, 1350, { fit: "cover", position: "center" })
          .toBuffer();
      } else {
        templateBuffer = fs.readFileSync(defaultTemplatePath);
      }
    } catch {
      templateBuffer = fs.readFileSync(defaultTemplatePath);
    }
  } else if (qrTemplateImage && fs.existsSync(qrTemplateImage)) {
    templateBuffer = await sharp(qrTemplateImage)
      .resize(1080, 1350, { fit: "cover", position: "center" })
      .toBuffer();
  } else if (fs.existsSync(defaultTemplatePath)) {
    templateBuffer = fs.readFileSync(defaultTemplatePath);
  } else {
    // Solid background fallback
    templateBuffer = await sharp({
      create: {
        width: 1080,
        height: 1350,
        channels: 3,
        background: { r: 251, g: 243, b: 224 },
      },
    })
      .png()
      .toBuffer();
  }

  // Composite QR code and text overlay directly onto the template
  const finalImageBuffer = await sharp(templateBuffer)
    .composite([
      { input: textSvg, top: 0, left: 0 },
      { input: qrBuffer, top: 490, left: 350 },
    ])
    .png({ quality: 95, progressive: false })
    .toBuffer();

  return finalImageBuffer;
}
