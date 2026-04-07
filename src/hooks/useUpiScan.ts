"use client";
import { useState, useCallback } from "react";
import { UpiTransaction } from "@/lib/types";
import { parseUpiText } from "@/lib/upi-parser";
import { autoCategory } from "@/lib/category-mapper";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

type ScanState = "idle" | "scanning" | "parsed" | "saving" | "saved" | "error";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Create multiple preprocessed versions for OCR
async function createOcrVariants(file: File): Promise<Blob[]> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const { width, height } = img;
  const variants: Blob[] = [];

  // --- Variant 1: Grayscale + contrast boost (works for light backgrounds) ---
  {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Mild contrast boost
      gray = ((gray - 128) * 1.5) + 128;
      gray = Math.max(0, Math.min(255, gray));
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    variants.push(blob);
  }

  // --- Variant 2: Invert + high contrast (works for dark backgrounds) ---
  {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;

    // Check if dark
    let totalBright = 0;
    for (let i = 0; i < d.length; i += 4) {
      totalBright += (d[i] + d[i + 1] + d[i + 2]) / 3;
    }
    const avgBright = totalBright / (d.length / 4);

    for (let i = 0; i < d.length; i += 4) {
      let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (avgBright < 128) gray = 255 - gray; // Invert dark images
      gray = ((gray - 128) * 2.0) + 128; // Strong contrast
      gray = Math.max(0, Math.min(255, gray));
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    variants.push(blob);
  }

  // --- Variant 3: 2x upscale (helps with small/low-res screenshots) ---
  if (width < 1000) {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width * scale, height * scale);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    variants.push(blob);
  }

  return variants;
}

export function useUpiScan() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [state, setState] = useState<ScanState>("idle");
  const [parsed, setParsed] = useState<UpiTransaction | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [rawOcr, setRawOcr] = useState("");

  const scanImage = useCallback(async (file: File) => {
    setState("scanning");
    setError("");
    setParsed(null);
    setRawOcr("");

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const Tesseract = await import("tesseract.js");
      const variants = await createOcrVariants(file);

      // Run OCR on original + all variants in parallel
      const ocrJobs = [
        Tesseract.recognize(file, "eng", { logger: () => {} }),
        ...variants.map((v) => Tesseract.recognize(v, "eng", { logger: () => {} })),
      ];
      const results = await Promise.all(ocrJobs);

      // Parse all results and pick the best one
      let bestResult: UpiTransaction | null = null;
      let bestOcrText = "";
      let bestScore = -1;

      for (const r of results) {
        const text = r.data.text;
        if (!text.trim()) continue;

        const parsed = parseUpiText(text);
        // Score: amount is most important, then confidence
        const score = (parsed.amount > 0 ? 100 : 0) + parsed.confidence;

        console.log(`=== OCR Variant (score: ${score}) ===\n`, text.slice(0, 200));

        if (score > bestScore) {
          bestScore = score;
          bestResult = parsed;
          bestOcrText = text;
        }
      }

      setRawOcr(bestOcrText);
      console.log("=== Best OCR Text ===\n", bestOcrText);
      console.log("=== Best Parsed ===", bestResult);

      if (!bestOcrText.trim()) {
        setState("error");
        setError("Could not read any text from the image. Try a clearer screenshot.");
        return;
      }

      if (!bestResult) {
        bestResult = parseUpiText(bestOcrText);
      }

      bestResult.category = autoCategory(bestResult.merchant);

      if (bestResult.amount <= 0) {
        setState("error");
        setError("Could not extract amount. You can enter it manually below.");
        setParsed(bestResult);
        return;
      }

      setParsed(bestResult);
      setState("parsed");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "OCR processing failed");
    }
  }, []);

  const saveAsExpense = useCallback(async (data: UpiTransaction) => {
    if (!user) return;
    setState("saving");
    try {
      await addDoc(collection(db, "transactions"), {
        title: `${data.upiApp} - ${data.merchant}`,
        amount: data.amount,
        type: "expense",
        category: data.category || "Other",
        date: data.date,
        notes: `UPI Txn: ${data.txnId || "N/A"} | ${data.upiApp} | ${data.time}`,
        user_id: user.uid,
        source: "upi_scan",
        upi_meta: {
          merchant: data.merchant,
          txnId: data.txnId,
          upiApp: data.upiApp,
          confidence: data.confidence,
        },
        created_at: new Date().toISOString(),
      });
      setState("saved");
      showToast("UPI expense saved successfully!", "success");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to save");
      showToast("Failed to save expense", "error");
    }
  }, [user, showToast]);

  const reset = useCallback(() => {
    setState("idle");
    setParsed(null);
    setPreview("");
    setError("");
    setRawOcr("");
  }, []);

  return { state, parsed, setParsed, preview, error, rawOcr, scanImage, saveAsExpense, reset };
}
