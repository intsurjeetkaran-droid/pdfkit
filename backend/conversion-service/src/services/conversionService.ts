import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { execCommand } from '../utils/exec';
import logger from '../logger';
import { Timer } from '../utils/timer';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// OFFICE → PDF
// Tool: LibreOffice headless  (DOCX / XLSX / PPTX / DOC / XLS / PPT)
// Typical time: 3–15 s depending on document complexity
// ─────────────────────────────────────────────────────────────────────────────
export const officeToPdf = async (inputPath: string): Promise<string> => {
  const t = new Timer('office-to-pdf');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ office-to-pdf started', { inputPath, inputSizeKB });

  // LibreOffice writes the PDF next to the input file using the same base name
  const command = `libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${OUTPUT_DIR}"`;
  await execCommand(command);
  t.step('libreoffice-exec');

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const rawOutput = path.join(OUTPUT_DIR, `${baseName}.pdf`);

  if (!fs.existsSync(rawOutput)) {
    throw new Error('LibreOffice conversion failed — output file not found');
  }

  // Rename to a UUID so concurrent requests never collide
  const uniqueOutput = path.join(OUTPUT_DIR, `converted-${uuidv4()}.pdf`);
  fs.renameSync(rawOutput, uniqueOutput);
  t.step('rename');

  const outputSizeKB = Math.round(fs.statSync(uniqueOutput).size / 1024);
  logger.info('✔ office-to-pdf done', t.summary({ inputSizeKB, outputSizeKB, outputPath: uniqueOutput }));

  return uniqueOutput;
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF → IMAGE
// Tool: pdftoppm (poppler-utils)
// Typical time: 1–5 s per page at 150 DPI
// ─────────────────────────────────────────────────────────────────────────────
export const pdfToImage = async (
  inputPath: string,
  format: 'png' | 'jpg' = 'png',
  dpi = 150
): Promise<string[]> => {
  const t = new Timer('pdf-to-image');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ pdf-to-image started', { inputPath, format, dpi, inputSizeKB });

  const outputPrefix = path.join(OUTPUT_DIR, `pdf-img-${uuidv4()}`);
  const formatFlag = format === 'png' ? '-png' : '-jpeg';

  // pdftoppm generates one image file per page, named <prefix>-001.png etc.
  const command = `pdftoppm ${formatFlag} -r ${dpi} "${inputPath}" "${outputPrefix}"`;
  await execCommand(command);
  t.step('pdftoppm-exec');

  // Collect all generated pages in sorted order
  const outputFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith(path.basename(outputPrefix)))
    .sort()
    .map((f) => path.join(OUTPUT_DIR, f));

  if (outputFiles.length === 0) {
    throw new Error('pdf-to-image failed — no output files found');
  }
  t.step('collect-files');

  logger.info('✔ pdf-to-image done', t.summary({ pageCount: outputFiles.length, format, dpi }));
  return outputFiles;
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE → PDF
// Tools: sharp (decode/normalise) + pdf-lib (embed)
// Typical time: 200–800 ms
// ─────────────────────────────────────────────────────────────────────────────
export const imageToPdf = async (inputPath: string): Promise<string> => {
  const t = new Timer('image-to-pdf');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ image-to-pdf started', { inputPath, inputSizeKB });

  // sharp normalises any image format (JPEG, WebP, TIFF, BMP …) to PNG
  // so pdf-lib can always embed it without format-specific branches
  const [imageBuffer, metadata] = await Promise.all([
    sharp(inputPath).png().toBuffer(),
    sharp(inputPath).metadata()
  ]);
  t.step('sharp-decode');

  const width = metadata.width || 595;   // A4 fallback
  const height = metadata.height || 842;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);
  const pngImage = await pdfDoc.embedPng(imageBuffer);
  page.drawImage(pngImage, { x: 0, y: 0, width, height });
  t.step('pdf-lib-embed');

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(OUTPUT_DIR, `image-to-pdf-${uuidv4()}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  t.step('write-file');

  const outputSizeKB = Math.round(pdfBytes.length / 1024);
  logger.info('✔ image-to-pdf done', t.summary({ inputSizeKB, outputSizeKB, outputPath }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPRESS PDF
// Tool: Ghostscript
// Quality presets (ascending quality / size):
//   screen → ebook → printer → prepress
// Typical time: 2–30 s depending on file size and quality
// ─────────────────────────────────────────────────────────────────────────────
export const compressPdf = async (
  inputPath: string,
  quality: 'screen' | 'ebook' | 'printer' | 'prepress' = 'ebook'
): Promise<string> => {
  const t = new Timer('compress-pdf');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ compress-pdf started', { inputPath, quality, inputSizeKB });

  const outputPath = path.join(OUTPUT_DIR, `compressed-${uuidv4()}.pdf`);

  // Ghostscript flags:
  //   -dNOPAUSE -dBATCH  → non-interactive batch mode
  //   -dQUIET            → suppress progress output
  //   -dPDFSETTINGS      → quality preset
  const command = [
    'gs',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${quality}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile="${outputPath}"`,
    `"${inputPath}"`
  ].join(' ');

  await execCommand(command, 300_000); // allow up to 5 min for large files
  t.step('ghostscript-exec');

  if (!fs.existsSync(outputPath)) {
    throw new Error('Ghostscript compression failed — output file not found');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  const reductionPct = Math.round((1 - outputSizeKB / inputSizeKB) * 100);
  t.step('stats');

  logger.info('✔ compress-pdf done', t.summary({
    quality,
    inputSizeKB,
    outputSizeKB,
    reductionPct: `${reductionPct}%`,
    outputPath
  }));

  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF → WORD (DOCX)
// Tool: LibreOffice headless
// Note: LibreOffice's PDF import is text-layer based; scanned PDFs will produce
//       a DOCX with embedded images rather than editable text.
// Typical time: 5–30 s depending on page count and complexity
// ─────────────────────────────────────────────────────────────────────────────
export const pdfToWord = async (inputPath: string): Promise<string> => {
  const t = new Timer('pdf-to-word');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ pdf-to-word started', { inputPath, inputSizeKB });

  // Step 1: LibreOffice converts PDF → DOCX
  // --infilter='writer_pdf_import' forces LibreOffice to open the PDF as a
  // Writer document so it can export to DOCX. Without this flag, Alpine's
  // minimal LibreOffice build falls back to Draw and has no DOCX export filter.
  const command = `libreoffice --headless --infilter='writer_pdf_import' --convert-to docx "${inputPath}" --outdir "${OUTPUT_DIR}"`;
  await execCommand(command, 300_000);
  t.step('libreoffice-exec');

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const rawOutput = path.join(OUTPUT_DIR, `${baseName}.docx`);

  if (!fs.existsSync(rawOutput)) {
    throw new Error('pdf-to-word failed — LibreOffice did not produce a DOCX file');
  }

  // Step 2: Rename to UUID to avoid collisions under concurrent load
  const uniqueOutput = path.join(OUTPUT_DIR, `pdf-to-word-${uuidv4()}.docx`);
  fs.renameSync(rawOutput, uniqueOutput);
  t.step('rename');

  const outputSizeKB = Math.round(fs.statSync(uniqueOutput).size / 1024);
  logger.info('✔ pdf-to-word done', t.summary({ inputSizeKB, outputSizeKB, outputPath: uniqueOutput }));

  return uniqueOutput;
};

// ─── PDF → TXT ───────────────────────────────────────────────────────────────
// Tool: pdftotext (poppler-utils — already installed in Docker)
export const pdfToText = async (inputPath: string): Promise<{ outputPath: string; text: string; pageCount: number }> => {
  const t = new Timer('pdf-to-text');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ pdf-to-text started', { inputPath, inputSizeKB });

  const outputPath = path.join(OUTPUT_DIR, `pdf-text-${uuidv4()}.txt`);

  // -layout preserves original layout as much as possible
  // -enc UTF-8 ensures Unicode output
  const command = `pdftotext -layout -enc UTF-8 "${inputPath}" "${outputPath}"`;
  await execCommand(command);
  t.step('pdftotext-exec');

  if (!fs.existsSync(outputPath)) {
    throw new Error('pdf-to-text failed — pdftotext did not produce output');
  }

  const text = fs.readFileSync(outputPath, 'utf-8');
  t.step('read-output');

  // Estimate page count from form-feed characters (pdftotext uses \f between pages)
  const pageCount = Math.max(1, (text.match(/\f/g) || []).length + 1);

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ pdf-to-text done', t.summary({ inputSizeKB, outputSizeKB, pageCount }));

  return { outputPath, text, pageCount };
};

// ─── SVG → PDF ───────────────────────────────────────────────────────────────
// Tools: sharp (rasterize SVG) + pdf-lib (embed as PNG in PDF)
export const svgToPdf = async (inputPath: string, options: { pageSize?: 'A4' | 'Letter' | 'auto'; orientation?: 'portrait' | 'landscape' } = {}): Promise<string> => {
  const t = new Timer('svg-to-pdf');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ svg-to-pdf started', { inputPath, inputSizeKB, options });

  // Rasterize SVG to PNG at high DPI for quality
  const pngBuffer = await sharp(inputPath).png({ quality: 100 }).toBuffer();
  const metadata = await sharp(pngBuffer).metadata();
  t.step('sharp-rasterize');

  const imgWidth  = metadata.width  || 595;
  const imgHeight = metadata.height || 842;

  // Determine page dimensions
  let pageWidth: number;
  let pageHeight: number;

  if (options.pageSize === 'A4') {
    pageWidth  = options.orientation === 'landscape' ? 841.89 : 595.28;
    pageHeight = options.orientation === 'landscape' ? 595.28 : 841.89;
  } else if (options.pageSize === 'Letter') {
    pageWidth  = options.orientation === 'landscape' ? 792 : 612;
    pageHeight = options.orientation === 'landscape' ? 612 : 792;
  } else {
    // auto: use image dimensions
    pageWidth  = imgWidth;
    pageHeight = imgHeight;
  }

  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([pageWidth, pageHeight]);
  const pngImg = await pdfDoc.embedPng(pngBuffer);

  // Scale image to fit page while preserving aspect ratio
  const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  const drawW = imgWidth  * scale;
  const drawH = imgHeight * scale;
  const x     = (pageWidth  - drawW) / 2;
  const y     = (pageHeight - drawH) / 2;

  page.drawImage(pngImg, { x, y, width: drawW, height: drawH });
  t.step('pdf-lib-embed');

  const pdfBytes  = await pdfDoc.save();
  const outputPath = path.join(OUTPUT_DIR, `svg-to-pdf-${uuidv4()}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  t.step('write-file');

  const outputSizeKB = Math.round(pdfBytes.length / 1024);
  logger.info('✔ svg-to-pdf done', t.summary({ inputSizeKB, outputSizeKB, outputPath }));
  return outputPath;
};

// ─── MULTI-IMAGES → PDF ──────────────────────────────────────────────────────
// Tools: sharp + pdf-lib
// Supports: JPG, JPEG, PNG, WebP, TIFF, BMP
// Options: pageSize, orientation, margin, fit mode
export interface MultiImageOptions {
  pageSize?: 'A4' | 'Letter' | 'auto';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  fit?: 'contain' | 'cover' | 'stretch';
}

export const imagesToPdf = async (inputPaths: string[], options: MultiImageOptions = {}): Promise<string> => {
  const t = new Timer('images-to-pdf');
  logger.info('▶ images-to-pdf started', { count: inputPaths.length, options });

  const { pageSize = 'A4', orientation = 'portrait', margin = 0, fit = 'contain' } = options;

  const pdfDoc = await PDFDocument.create();

  for (const imgPath of inputPaths) {
    // Normalize all images to PNG via sharp for consistent pdf-lib embedding
    const pngBuffer = await sharp(imgPath).png().toBuffer();
    const meta      = await sharp(pngBuffer).metadata();
    const imgW      = meta.width  || 595;
    const imgH      = meta.height || 842;

    // Page dimensions
    let pageW: number;
    let pageH: number;
    if (pageSize === 'A4') {
      pageW = orientation === 'landscape' ? 841.89 : 595.28;
      pageH = orientation === 'landscape' ? 595.28 : 841.89;
    } else if (pageSize === 'Letter') {
      pageW = orientation === 'landscape' ? 792 : 612;
      pageH = orientation === 'landscape' ? 612 : 792;
    } else {
      pageW = imgW;
      pageH = imgH;
    }

    const page   = pdfDoc.addPage([pageW, pageH]);
    const pngImg = await pdfDoc.embedPng(pngBuffer);

    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;

    let drawW: number;
    let drawH: number;
    let x: number;
    let y: number;

    if (fit === 'stretch') {
      drawW = availW;
      drawH = availH;
      x = margin;
      y = margin;
    } else if (fit === 'cover') {
      const scale = Math.max(availW / imgW, availH / imgH);
      drawW = imgW * scale;
      drawH = imgH * scale;
      x = margin + (availW - drawW) / 2;
      y = margin + (availH - drawH) / 2;
    } else {
      // contain (default)
      const scale = Math.min(availW / imgW, availH / imgH);
      drawW = imgW * scale;
      drawH = imgH * scale;
      x = margin + (availW - drawW) / 2;
      y = margin + (availH - drawH) / 2;
    }

    page.drawImage(pngImg, { x, y, width: drawW, height: drawH });
    t.step(`embed-image-${inputPaths.indexOf(imgPath) + 1}`);
  }

  const pdfBytes  = await pdfDoc.save();
  const outputPath = path.join(OUTPUT_DIR, `images-to-pdf-${uuidv4()}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  t.step('write-file');

  const outputSizeKB = Math.round(pdfBytes.length / 1024);
  logger.info('✔ images-to-pdf done', t.summary({ imageCount: inputPaths.length, outputSizeKB, outputPath }));
  return outputPath;
};
