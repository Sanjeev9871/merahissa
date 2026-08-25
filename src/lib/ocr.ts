'use client';

import { createWorker, type Worker } from 'tesseract.js';
import { extractFields, type ExtractedField } from './ocr-fields';

export { extractFields, type ExtractedField };

/**
 * Client-side OCR.
 *
 * This runs in the user's browser, on their device, and the image never
 * leaves it during extraction. That is a privacy control first and a cost
 * saving second: a death certificate is scanned locally, the user reads what
 * we extracted, corrects it, and only then does the file get uploaded.
 *
 * The extraction is a convenience to save typing. It is never trusted — every
 * extracted field is presented as an editable suggestion the user must
 * confirm, because OCR on a photographed Indian municipal certificate is
 * unreliable and a wrong date of death propagates into every form in the pack.
 */

export interface OcrResult {
  fields: ExtractedField[];
  rawTextLength: number;
  /** True when we found so little text the scan is probably unusable. */
  likelyUnreadable: boolean;
}

let worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  worker ??= await createWorker('eng');
  return worker;
}

/** Free the worker when the upload step unmounts; it holds real memory. */
export async function disposeOcr(): Promise<void> {
  if (worker) { await worker.terminate(); worker = null; }
}

export async function extractFromImage(
  file: File,
  docType: string,
): Promise<OcrResult> {
  const w = await getWorker();
  const { data } = await w.recognize(file);
  const text = data.text ?? '';

  return {
    fields: extractFields(text, docType),
    rawTextLength: text.trim().length,
    likelyUnreadable: text.trim().length < 40,
  };
}
