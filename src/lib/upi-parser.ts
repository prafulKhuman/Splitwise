import { UpiTransaction } from "./types";

// ─── AMOUNT ────────────────────────────────────────────────
// Tesseract OCR commonly misreads ₹ symbol as: 2, %, F, f, e, z, Z, ~, ?, t, &, @, €, £
// On dark GPay screenshots: "₹9,500" → "29,500" or "%9,500" or "F9,500" or "e9,500"
// Strategy: match known misread chars before a number with comma formatting (Indian: 9,500 or 9,50,000)
const AMOUNT_PATTERNS = [
  // Exact ₹ symbol (if OCR reads it correctly)
  /[₹]\s*([\d,]+(?:\.\d{1,2})?)/,
  // OCR misreads of ₹: common substitutions before a comma-formatted number
  // "29,500" "F9,500" "%9,500" "e9,500" "f9,500" "z9,500" "t9,500" "~9,500"
  /[%FfEeZztT~?&@€£]\s?([\d]{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)/,
  // Rs.500 or Rs 9,500 or Rs. 1,200.50
  /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
  // INR 500 or INR1200
  /INR\s*([\d,]+(?:\.\d{1,2})?)/i,
  // "Paid 9,500" or "Sent 1,200" (amount after action word, no currency symbol)
  /(?:paid|sent|received|debited|credited|transferred)\s+(?:[₹%FfEeZztT~?&@€£Rs.INR]*\s*)?([\d,]+(?:\.\d{1,2})?)/i,
  // "Amount: 9,500" or "Total: 1200"
  /(?:amount|total|value)\s*(?:debited|credited|paid|received)?[:\-\s]*(?:[₹%FfEeZztT~Rs.INR]*\s*)?([\d,]+(?:\.\d{1,2})?)/i,
  // "debited by 500" or "credited with 1000"
  /(?:debited|credited)\s*(?:by|with|of|for)?\s*(?:[₹%Rs.INR]*\s*)?([\d,]+(?:\.\d{1,2})?)/i,
  // Standalone Indian comma-formatted number (1,000+ with proper Indian grouping)
  // This catches "9,500" or "1,50,000" even without currency symbol
  /\b(\d{1,2},\d{2},\d{3}(?:\.\d{1,2})?)\b/,  // Indian: 1,50,000
  /\b(\d{1,3},\d{3}(?:\.\d{1,2})?)\b/,          // Standard: 9,500 or 150,000
  // OCR might read "₹9,500" as "29,500" - a digit followed by comma number
  // We detect this when the number appears near "Pay again" or "Completed" or "Successful"
  /(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)\s*\n\s*(?:Pay again|Completed|Successful|Success|Paid|Done)/i,
  // Number before "Pay again" or status (GPay layout: amount is above "Pay again" button)
  /(?:^|\n)\s*[^\d]*?(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)\s*\n/m,
];

// ─── DATE ──────────────────────────────────────────────────
const MONTH_NAMES = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
  apr: "04", april: "04", may: "05", jun: "06", june: "06",
  jul: "07", july: "07", aug: "08", august: "08", sep: "09", sept: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11", dec: "12", december: "12",
};

// ─── TIME ──────────────────────────────────────────────────
const TIME_PATTERNS = [
  /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i,
  /(\d{1,2}:\d{2}(?::\d{2})?)/,
];

// ─── TRANSACTION ID ────────────────────────────────────────
const TXN_ID_PATTERNS = [
  /UPI\s*transaction\s*ID\s*[:\s\n]*([A-Za-z0-9]{6,})/i,
  /Google\s*transaction\s*ID\s*[:\s\n]*([A-Za-z0-9]{6,})/i,
  /Transaction\s*ID\s*[:\s#\-]*([A-Za-z0-9]{6,})/i,
  /UTR\s*(?:No\.?|Number)?[:\s#\-]*([A-Za-z0-9]{8,})/i,
  /UPI\s*(?:Ref(?:erence)?)\s*(?:No\.?|Number|ID)?[:\s#\-]*([A-Za-z0-9]{8,})/i,
  /Ref(?:erence)?\s*(?:No\.?|Number|ID)\s*[:\s#\-]*([A-Za-z0-9]{8,})/i,
  /Txn\s*(?:ID|No\.?)\s*[:\s#\-]*([A-Za-z0-9]{6,})/i,
  /Order\s*(?:ID|No\.?)\s*[:\s#\-]*([A-Za-z0-9]{6,})/i,
  /\b(\d{12,})\b/,
];

// ─── MERCHANT / RECEIVER ───────────────────────────────────
const MERCHANT_PATTERNS = [
  /^To:\s*(.+?)$/mi,
  /Paid\s+to\s*[:\n]\s*(.+?)(?:\n|$)/i,
  /Sent\s+to\s*[:\n]\s*(.+?)(?:\n|$)/i,
  /^To\s+([A-Z][a-zA-Z\s]+?)$/m,
  /Transferred\s+to\s*[:\n]\s*(.+?)(?:\n|$)/i,
  /Money\s+sent\s+to\s*[:\n]\s*(.+?)(?:\n|$)/i,
  /Beneficiary\s*[:\-]\s*(.+?)(?:\n|$)/i,
  /Payee\s*[:\-]\s*(.+?)(?:\n|$)/i,
  /Receiver\s*[:\-]\s*(.+?)(?:\n|$)/i,
  /Merchant\s*[:\-]\s*(.+?)(?:\n|$)/i,
];

// ─── UPI ID ────────────────────────────────────────────────
const UPI_ID_PATTERN = /([a-zA-Z0-9._\-]+@[a-zA-Z]{2,})/g;

// ─── UPI APP DETECTION ─────────────────────────────────────
const UPI_APP_PATTERNS: [RegExp, string][] = [
  [/G\s*Pay|Google\s*Pay|gpay|tez/i, "Google Pay"],
  [/PhonePe|phone\s*pe/i, "PhonePe"],
  [/Paytm|pay\s*tm/i, "Paytm"],
  [/BHIM\b/i, "BHIM"],
  [/Amazon\s*Pay/i, "Amazon Pay"],
  [/CRED\b/i, "CRED"],
  [/WhatsApp\s*Pay/i, "WhatsApp Pay"],
  [/Mobikwik/i, "MobiKwik"],
  [/Freecharge/i, "Freecharge"],
  [/Jupiter/i, "Jupiter"],
  [/Slice/i, "Slice"],
  [/YONO|SBI\b/i, "SBI YONO"],
  [/iMobile|ICICI/i, "ICICI iMobile"],
  [/HDFC/i, "HDFC Bank"],
  [/Axis/i, "Axis Bank"],
  [/Kotak/i, "Kotak Bank"],
  [/BOB\s*World|Bank\s*of\s*Baroda/i, "BOB World"],
  [/Union\s*Bank/i, "Union Bank"],
  [/PNB/i, "PNB"],
  [/Canara/i, "Canara Bank"],
  [/Indian\s*Bank/i, "Indian Bank"],
  [/IndusInd/i, "IndusInd Bank"],
  [/Federal\s*Bank/i, "Federal Bank"],
  [/Yes\s*Bank/i, "Yes Bank"],
  [/IDFC/i, "IDFC First"],
];

const UPI_HANDLE_MAP: Record<string, string> = {
  oksbi: "Google Pay", okhdfcbank: "Google Pay", okicici: "Google Pay", okaxis: "Google Pay",
  ybl: "PhonePe", ibl: "PhonePe", axl: "PhonePe",
  paytm: "Paytm",
  apl: "Amazon Pay", yapl: "Amazon Pay", rapl: "Amazon Pay",
  upi: "BHIM",
  jupiteraxis: "Jupiter",
  fam: "Slice",
  ikwik: "MobiKwik",
  waicici: "WhatsApp Pay", wahdfcbank: "WhatsApp Pay", waaxis: "WhatsApp Pay", wasbi: "WhatsApp Pay",
};

// ─── HELPERS ───────────────────────────────────────────────

function extractFirst(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      for (let i = 1; i < m.length; i++) {
        if (m[i]) return m[i].trim();
      }
    }
  }
  return "";
}

function extractAll(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  let m;
  while ((m = re.exec(text)) !== null) matches.push(m[1] || m[0]);
  return matches;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  return parseFloat(raw.replace(/,/g, "")) || 0;
}

// Smart amount extraction: tries all patterns, picks the most likely UPI amount
function extractAmount(text: string): number {
  const candidates: number[] = [];

  for (const p of AMOUNT_PATTERNS) {
    const m = text.match(p);
    if (m) {
      for (let i = 1; i < m.length; i++) {
        if (m[i]) {
          const val = parseAmount(m[i]);
          if (val > 0 && val < 10_00_000) candidates.push(val); // max 10 lakh sanity check
        }
      }
    }
  }

  if (candidates.length === 0) return 0;

  // If we have a comma-formatted number, prefer it (more likely to be the main amount)
  const commaNumbers = candidates.filter((n) => n >= 100);
  if (commaNumbers.length > 0) {
    // Return the largest reasonable amount (UPI main amount is usually the biggest number)
    return Math.max(...commaNumbers);
  }

  return candidates[0];
}

function normalizeDate(text: string): string {
  // "5 Apr 2026" or "05 April 2026" (GPay format)
  const m1 = text.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\s+(\\d{4})`, "i"));
  if (m1) {
    const mm = MONTH_MAP[m1[2].toLowerCase().slice(0, 3)] || "01";
    return `${m1[3]}-${mm}-${m1[1].padStart(2, "0")}`;
  }

  // "April 5, 2026" (US format)
  const m2 = text.match(new RegExp(`(${MONTH_NAMES})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, "i"));
  if (m2) {
    const mm = MONTH_MAP[m2[1].toLowerCase().slice(0, 3)] || "01";
    return `${m2[3]}-${mm}-${m2[2].padStart(2, "0")}`;
  }

  // DD/MM/YYYY
  const m3 = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m3) return `${m3[3]}-${m3[2].padStart(2, "0")}-${m3[1].padStart(2, "0")}`;

  // YYYY-MM-DD
  const m4 = text.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m4) return `${m4[1]}-${m4[2].padStart(2, "0")}-${m4[3].padStart(2, "0")}`;

  // DD/MM/YY
  const m5 = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/);
  if (m5) return `20${m5[3]}-${m5[2].padStart(2, "0")}-${m5[1].padStart(2, "0")}`;

  return new Date().toISOString().split("T")[0];
}

function detectUpiApp(text: string, upiIds: string[]): string {
  for (const [pattern, name] of UPI_APP_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  for (const id of upiIds) {
    const handle = id.split("@")[1]?.toLowerCase();
    if (handle && UPI_HANDLE_MAP[handle]) return UPI_HANDLE_MAP[handle];
  }
  return "UPI";
}

function cleanMerchant(raw: string): string {
  if (!raw) return "Unknown";
  let cleaned = raw
    .replace(/[a-zA-Z0-9._\-]+@[a-zA-Z]{2,}/g, "")
    .replace(/\+?\d{10,13}/g, "")
    .replace(/Google\s*Pay|PhonePe|Paytm|BHIM/gi, "")
    .replace(/[•·|]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned) {
    cleaned = cleaned.split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return cleaned || "Unknown";
}

// ─── MAIN PARSER ───────────────────────────────────────────

export function parseUpiText(text: string): UpiTransaction {
  const upiIds = extractAll(text, UPI_ID_PATTERN);

  // Smart amount extraction (handles OCR misreads)
  const amount = extractAmount(text);

  const date = normalizeDate(text);
  const time = extractFirst(text, TIME_PATTERNS);
  const txnId = extractFirst(text, TXN_ID_PATTERNS);

  const merchantRaw = extractFirst(text, MERCHANT_PATTERNS);
  const merchant = cleanMerchant(merchantRaw);

  const upiApp = detectUpiApp(text, upiIds);

  const isSuccess = /completed|successful|success|paid|sent|done|approved/i.test(text);

  // Confidence scoring
  let confidence = 0;
  if (amount > 0) confidence += 35;
  if (date !== new Date().toISOString().split("T")[0]) confidence += 15;
  if (time) confidence += 10;
  if (merchant !== "Unknown") confidence += 15;
  if (txnId) confidence += 10;
  if (upiApp !== "UPI") confidence += 5;
  if (upiIds.length > 0) confidence += 5;
  if (isSuccess) confidence += 5;

  return {
    amount,
    merchant,
    date,
    time,
    txnId,
    upiApp,
    category: "",
    confidence: Math.min(confidence, 100),
    rawText: text,
  };
}
