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
  // This is the slowest step — LibreOffice must start, parse the PDF,
  // reconstruct the layout, and write the DOCX.
  const command = `libreoffice --headless --convert-to docx "${inputPath}" --outdir "${OUTPUT_DIR}"`;
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
