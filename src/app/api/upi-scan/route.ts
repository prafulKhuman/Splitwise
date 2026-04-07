import { NextRequest, NextResponse } from "next/server";
import { parseUpiText } from "@/lib/upi-parser";
import { autoCategory } from "@/lib/category-mapper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ocrText } = body;

    if (!ocrText || typeof ocrText !== "string") {
      return NextResponse.json({ error: "ocrText is required" }, { status: 400 });
    }

    const parsed = parseUpiText(ocrText);
    parsed.category = autoCategory(parsed.merchant);

    if (parsed.amount <= 0) {
      return NextResponse.json(
        { error: "Could not extract valid amount from the text", parsed },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
