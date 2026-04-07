import { UpiTransaction } from "./types";

const MONTH_NAMES = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
  apr: "04", april: "04", may: "05", jun: "06", june: "06",
  jul: "07", july: "07", aug: "08", august: "08", sep: "09", sept: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11", dec: "12", december: "12",
};

// ─── EXTRACT AMOUNT ────────────────────────────────────────
// PROVEN OCR behavior from Tesseract.js:
//   "₹200.00" → "3200.00" (₹ becomes digit 3, merges with 200)
//   "₹9,500"  → "29,500" or "9,500" 
//   The ₹ symbol is NEVER preserved — it always becomes a digit or symbol.
//
// Strategy:
// 1. Find the "amount line" — the line with a number before "Paid to" / "Sent to"
// 2. Strip the first character (the misread ₹) from that number
// 3. Fallback to explicit Rs/INR patterns

function extractAmount(text: string): number {
  // Step 1: Explicit ₹ (rare but possible)
  const m1 = text.match(/[₹]\s*([\d,]+(?:\.\d{1,2})?)/);
  if (m1) { const v = parseFloat(m1[1].replace(/,/g, "")); if (v > 0) return v; }

  // Step 2: Rs. / INR patterns
  const m2 = text.match(/Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (m2) { const v = parseFloat(m2[1].replace(/,/g, "")); if (v > 0) return v; }
  const m3 = text.match(/INR\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (m3) { const v = parseFloat(m3[1].replace(/,/g, "")); if (v > 0) return v; }

  // Step 3: THE KEY FIX — find the amount line and strip misread ₹
  // UPI screenshots always have the amount on its own line, typically:
  //   "3200.00\nPaid to" or "29,500\nPaid to" or "3200.00\n\nPaid to"
  // The first char/digit of that number is the misread ₹ symbol.
  //
  // Find a line that contains ONLY a number (with optional leading garbage char)
  // and appears before "Paid to" / "Sent to" / "Completed" / "Successful"
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if next non-empty line contains UPI context keywords
    const nextLines = lines.slice(i + 1, i + 4).join(" ").toLowerCase();
    const hasContext = /paid\s*to|sent\s*to|completed|successful|success|pay\s*again/.test(nextLines);

    // Match a line that looks like an amount: optional garbage + digits + optional .XX
    // e.g., "3200.00" or "29,500" or "%200.00" or "~1,500"
    const amountLineMatch = line.match(/^(.?)(\d[\d,]*(?:\.\d{1,2})?)$/);
    if (!amountLineMatch) continue;

    const prefix = amountLineMatch[1]; // The potential misread ₹ char
    const numberPart = amountLineMatch[2];
    const fullVal = parseFloat(numberPart.replace(/,/g, ""));

    if (fullVal <= 0) continue;

    // If prefix is empty or a known non-digit misread, use the number as-is
    if (!prefix || /[%FfEeZzTt~?&@€£=RrSs©®°#$^*!]/.test(prefix)) {
      return fullVal;
    }

    // If prefix is a DIGIT (₹ merged as digit, e.g., "3" + "200.00" = "3200.00")
    // AND this line appears before UPI context → strip the prefix digit
    if (/\d/.test(prefix) && hasContext) {
      // Strip the misread ₹ digit: "3200.00" → "200.00"
      const strippedVal = parseFloat(numberPart.slice(0).replace(/,/g, ""));
      // Wait — prefix is already separated. The full line is prefix + numberPart
      // So "3200.00" → prefix="3", numberPart="200.00" → use numberPart directly
      // But if prefix is part of the actual number... let's check:
      // If the line is "3200.00", regex captures prefix="3", numberPart="200.00"
      // That's exactly what we want! Return 200.00
      return strippedVal;
    }

    // If no context but it's the only number-like line, still use it
    if (hasContext) return fullVal;
  }

  // Step 4: Fallback — find any number with .00 decimal on its own line
  for (const line of lines) {
    const m = line.match(/^.?(\d[\d,]*\.\d{2})$/);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (val > 0) return val;
    }
  }

  // Step 5: Comma-formatted number anywhere
  const commaMatch = text.match(/(\d{1,3}(?:,\d{2,3})+)/);
  if (commaMatch) {
    const val = parseFloat(commaMatch[1].replace(/,/g, ""));
    if (val > 0) return val;
  }

  // Step 6: Last resort — any reasonable number not in dates
  const dateNums = extractDateNumbers(text);
  for (const m of text.matchAll(/(\d[\d,]*(?:\.\d{1,2})?)/g)) {
    const clean = m[1].replace(/,/g, "");
    const val = parseFloat(clean);
    if (val >= 10 && val < 10_00_000 && !dateNums.has(clean)) return val;
  }

  return 0;
}

// Collect all numbers that are part of dates, times, phone numbers, IDs
function extractDateNumbers(text: string): Set<string> {
  const nums = new Set<string>();

  // Date: "7 April 2026"
  const d1 = text.match(new RegExp(`(\\d{1,2})\\s+(?:${MONTH_NAMES})\\s+(\\d{4})`, "i"));
  if (d1) { nums.add(d1[1]); nums.add(d1[2]); }
  const d2 = text.match(new RegExp(`(?:${MONTH_NAMES})\\s+(\\d{1,2}),?\\s+(\\d{4})`, "i"));
  if (d2) { nums.add(d2[1]); nums.add(d2[2]); }
  // DD/MM/YYYY
  const d3 = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (d3) { nums.add(d3[1]); nums.add(d3[2]); nums.add(d3[3]); }
  // Time
  for (const m of text.matchAll(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:am|pm)?/gi)) {
    nums.add(m[1]); nums.add(m[2]); if (m[3]) nums.add(m[3]);
  }
  // Years
  for (const m of text.matchAll(/\b(20[2-3]\d)\b/g)) nums.add(m[1]);
  // Phone numbers
  for (const m of text.matchAll(/\+?\d[\d\s]{9,14}/g)) {
    for (const p of m[0].split(/\s+/)) { const c = p.replace(/\D/g, ""); if (c) nums.add(c); }
  }
  // Transaction IDs (12+ digits)
  for (const m of text.matchAll(/\b(\d{12,})\b/g)) nums.add(m[1]);

  return nums;
}

// ─── DATE ──────────────────────────────────────────────────
function normalizeDate(text: string): string {
  const m1 = text.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\s+(\\d{4})`, "i"));
  if (m1) {
    const mm = MONTH_MAP[m1[2].toLowerCase().slice(0, 3)] || "01";
    return `${m1[3]}-${mm}-${m1[1].padStart(2, "0")}`;
  }
  const m2 = text.match(new RegExp(`(${MONTH_NAMES})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, "i"));
  if (m2) {
    const mm = MONTH_MAP[m2[1].toLowerCase().slice(0, 3)] || "01";
    return `${m2[3]}-${mm}-${m2[2].padStart(2, "0")}`;
  }
  const m3 = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m3) return `${m3[3]}-${m3[2].padStart(2, "0")}-${m3[1].padStart(2, "0")}`;
  const m4 = text.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m4) return `${m4[1]}-${m4[2].padStart(2, "0")}-${m4[3].padStart(2, "0")}`;
  const m5 = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\b/);
  if (m5) return `20${m5[3]}-${m5[2].padStart(2, "0")}-${m5[1].padStart(2, "0")}`;
  return new Date().toISOString().split("T")[0];
}

// ─── TIME ──────────────────────────────────────────────────
function extractTime(text: string): string {
  const m = text.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i);
  return m?.[1]?.trim() || "";
}

// ─── TRANSACTION ID ────────────────────────────────────────
function extractTxnId(text: string): string {
  const patterns = [
    /UPI\s*transaction\s*ID\s*[:\s\n]*([A-Za-z0-9]{6,})/i,
    /Google\s*transaction\s*ID\s*[:\s\n]*([A-Za-z0-9]{6,})/i,
    /Transaction\s*ID\s*[:\s#\-]*([A-Za-z0-9]{6,})/i,
    /UTR\s*(?:No\.?)?[:\s#\-]*([A-Za-z0-9]{8,})/i,
    /UPI\s*Ref(?:erence)?\s*(?:No\.?)?[:\s#\-]*([A-Za-z0-9]{8,})/i,
    /Ref(?:erence)?\s*(?:No\.?|ID)\s*[:\s#\-]*([A-Za-z0-9]{8,})/i,
    /Txn\s*(?:ID|No\.?)\s*[:\s#\-]*([A-Za-z0-9]{6,})/i,
    /\b(\d{12,})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

// ─── MERCHANT ──────────────────────────────────────────────
function extractMerchant(text: string): string {
  const patterns = [
    /^To:\s*(.+?)$/mi,
    /Banking\s*name\s*[:\-]\s*(.+?)$/mi,
    /Paid\s+to\s*[:\-]?\s*\n\s*([A-Z][A-Za-z\s.]+)/im,
    /Paid\s+to\s*[:\-]?\s+([A-Z][A-Za-z\s.]+)/im,
    /Sent\s+to\s*[:\-]?\s*\n\s*([A-Z][A-Za-z\s.]+)/im,
    /Sent\s+to\s*[:\-]?\s+([A-Z][A-Za-z\s.]+)/im,
    /^To\s+([A-Z][a-zA-Z\s]+?)$/m,
    /Beneficiary\s*[:\-]\s*(.+?)(?:\n|$)/i,
    /Payee\s*[:\-]\s*(.+?)(?:\n|$)/i,
    /Receiver\s*[:\-]\s*(.+?)(?:\n|$)/i,
    /Merchant\s*[:\-]\s*(.+?)(?:\n|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      let cleaned = m[1]
        .replace(/[a-zA-Z0-9._\-]+@[a-zA-Z]{2,}/g, "")
        .replace(/\+?\d{10,13}/g, "")
        .replace(/Google\s*Pay|PhonePe|Paytm|BHIM/gi, "")
        .replace(/[•·|]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned) {
        cleaned = cleaned.split(" ").filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        return cleaned;
      }
    }
  }
  return "Unknown";
}

// ─── UPI APP ───────────────────────────────────────────────
const UPI_APP_PATTERNS: [RegExp, string][] = [
  [/G\s*Pay|Google\s*Pay|gpay|tez/i, "Google Pay"],
  [/PhonePe|phone\s*pe/i, "PhonePe"],
  [/Paytm|pay\s*tm/i, "Paytm"],
  [/BHIM\b/i, "BHIM"],
  [/Amazon\s*Pay/i, "Amazon Pay"],
  [/CRED\b/i, "CRED"],
  [/WhatsApp\s*Pay/i, "WhatsApp Pay"],
  [/Mobikwik/i, "MobiKwik"],
  [/YONO|SBI\b/i, "SBI YONO"],
  [/iMobile|ICICI/i, "ICICI iMobile"],
  [/HDFC/i, "HDFC Bank"],
  [/Axis/i, "Axis Bank"],
  [/Kotak/i, "Kotak Bank"],
  [/Union\s*Bank/i, "Union Bank"],
  [/PNB/i, "PNB"],
  [/Canara/i, "Canara Bank"],
];

const UPI_HANDLE_MAP: Record<string, string> = {
  oksbi: "Google Pay", okhdfcbank: "Google Pay", okicici: "Google Pay", okaxis: "Google Pay",
  ybl: "PhonePe", ibl: "PhonePe", axl: "PhonePe",
  paytm: "Paytm",
  apl: "Amazon Pay", yapl: "Amazon Pay",
  upi: "BHIM",
  waicici: "WhatsApp Pay", wahdfcbank: "WhatsApp Pay",
};

function detectUpiApp(text: string): string {
  for (const [p, name] of UPI_APP_PATTERNS) {
    if (p.test(text)) return name;
  }
  const upiIds = text.match(/[a-zA-Z0-9._\-]+@([a-zA-Z]{2,})/g) || [];
  for (const id of upiIds) {
    const handle = id.split("@")[1]?.toLowerCase();
    if (handle && UPI_HANDLE_MAP[handle]) return UPI_HANDLE_MAP[handle];
  }
  return "UPI";
}

// ─── MAIN PARSER ───────────────────────────────────────────

export function parseUpiText(text: string): UpiTransaction {
  const amount = extractAmount(text);
  const date = normalizeDate(text);
  const time = extractTime(text);
  const txnId = extractTxnId(text);
  const merchant = extractMerchant(text);
  const upiApp = detectUpiApp(text);
  const isSuccess = /completed|successful|success|paid|sent|done|approved/i.test(text);
  const hasUpiId = /[a-zA-Z0-9._\-]+@[a-zA-Z]{2,}/.test(text);

  let confidence = 0;
  if (amount > 0) confidence += 35;
  if (date !== new Date().toISOString().split("T")[0]) confidence += 15;
  if (time) confidence += 10;
  if (merchant !== "Unknown") confidence += 15;
  if (txnId) confidence += 10;
  if (upiApp !== "UPI") confidence += 5;
  if (hasUpiId) confidence += 5;
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
