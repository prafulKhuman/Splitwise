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

// Preprocess image: convert to grayscale, invert if dark, boost contrast
function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Draw original
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const avgBrightness = totalBrightness / (data.length / 4);
      const isDark = avgBrightness < 128;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // Convert to grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Invert if dark background (white text on dark → black text on white)
        if (isDark) gray = 255 - gray;

        // Boost contrast: stretch histogram
        gray = ((gray - 128) * 1.8) + 128;
        gray = Math.max(0, Math.min(255, gray));

        // Sharpen: threshold to make text crisper
        gray = gray > 140 ? 255 : gray < 80 ? 0 : gray;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob || file), "image/png");
    };
    img.src = URL.createObjectURL(file);
  });
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

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Preprocess: invert dark screenshots, enhance contrast
      const processedBlob = await preprocessImage(file);

      // Dynamic import Tesseract.js
      const Tesseract = await import("tesseract.js");

      // Run OCR on both original and preprocessed, pick best result
      const [originalResult, processedResult] = await Promise.all([
        Tesseract.recognize(file, "eng", { logger: () => {} }),
        Tesseract.recognize(processedBlob, "eng", { logger: () => {} }),
      ]);

      const ocrText1 = originalResult.data.text;
      const ocrText2 = processedResult.data.text;

      // Parse both and pick the one with higher confidence
      const parsed1 = parseUpiText(ocrText1);
      const parsed2 = parseUpiText(ocrText2);

      const bestOcr = parsed2.amount > 0 && parsed2.confidence >= parsed1.confidence ? ocrText2 : ocrText1;
      const result = parsed2.amount > 0 && parsed2.confidence >= parsed1.confidence ? parsed2 : parsed1;

      // Store raw OCR for debugging
      setRawOcr(bestOcr);
      console.log("=== OCR Raw Text (Original) ===\n", ocrText1);
      console.log("=== OCR Raw Text (Processed) ===\n", ocrText2);
      console.log("=== Parsed Result ===", result);

      if (!bestOcr.trim()) {
        setState("error");
        setError("Could not read any text from the image. Try a clearer screenshot.");
        return;
      }

      result.category = autoCategory(result.merchant);

      if (result.amount <= 0) {
        setState("error");
        setError("Could not extract amount. You can enter it manually below.");
        setParsed(result);
        return;
      }

      setParsed(result);
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
