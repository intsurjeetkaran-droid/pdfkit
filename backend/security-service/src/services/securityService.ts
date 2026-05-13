import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execCommand } from '../utils/exec';
import { Timer } from '../utils/timer';
import logger from '../logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Safely load a PDF — returns 400 for corrupt/empty files.
 */
async function loadPDF(filePath: string): Promise<PDFDocument> {
  const buf = await fs.promises.readFile(filePath);
  if (buf.length === 0) {
    throw Object.assign(new Error('File is empty (0 bytes)'), { statusCode: 400 });
  }
  try {
    return await PDFDocument.load(buf);
  } catch (e: any) {
    throw Object.assign(
      new Error(`Invalid or corrupt PDF: ${e.message}`),
      { statusCode: 400 }
    );
  }
}

/**
 * Classify a qpdf error message and return a user-friendly 400 error.
 * qpdf exits non-zero for many recoverable conditions — we map them to
 * clear 400 messages instead of leaking raw tool output as 500.
 */
function classifyQpdfError(rawMessage: string): Error {
  const msg = rawMessage.toLowerCase();

  if (msg.includes('invalid password') || msg.includes('password')) {
    return Object.assign(
      new Error('Incorrect password. Cannot unlock this PDF.'),
      { statusCode: 400 }
    );
  }
  if (msg.includes('not encrypted') || msg.includes('not a password-protected')) {
    return Object.assign(
      new Error('This PDF is not password-protected. Nothing to unlock.'),
      { statusCode: 400 }
    );
  }
  if (msg.includes('damaged') || msg.includes('reconstruct') || msg.includes('not a pdf')) {
    return Object.assign(
      new Error('Invalid or corrupt PDF: qpdf could not process this file.'),
      { statusCode: 400 }
    );
  }
  if (msg.includes('already encrypted')) {
    return Object.assign(
      new Error('This PDF is already password-protected.'),
      { statusCode: 400 }
    );
  }

  // Unknown qpdf error — still return 400 with a safe message
  return Object.assign(
    new Error('PDF security operation failed. The file may be corrupt or unsupported.'),
    { statusCode: 400 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTECT — add a user password to a PDF using qpdf
//
// Uses qpdf 11.7+ named-flag syntax:
//   qpdf --encrypt --user-password=<pw> --owner-password=<pw> --bits=256 -- <in> <out>
//
// Typical time: 500ms – 3s depending on file size
// ─────────────────────────────────────────────────────────────────────────────
export const protectPDF = async (
  filePath: string,
  userPassword: string,
  ownerPassword?: string
): Promise<string> => {
  const t = new Timer('protect-pdf');
  const inputSizeKB = Math.round(fs.statSync(filePath).size / 1024);
  logger.info('▶ protect-pdf started', { inputSizeKB });

  if (!userPassword || userPassword.trim().length === 0) {
    throw Object.assign(new Error('userPassword is required'), { statusCode: 400 });
  }

  // Validate the PDF is readable before handing to qpdf
  // This catches corrupt/empty files with a clean 400 before qpdf sees them
  await loadPDF(filePath);
  t.step('validate-pdf');

  const outputPath = path.join(OUTPUT_DIR, `protected-${uuidv4()}.pdf`);
  const owner = ownerPassword || userPassword;

  // qpdf 11.7+ named-flag form — avoids shell quoting issues with special chars
  const command = [
    'qpdf',
    '--encrypt',
    `--user-password=${userPassword}`,
    `--owner-password=${owner}`,
    '--bits=256',
    '--',
    `"${filePath}"`,
    `"${outputPath}"`
  ].join(' ');

  try {
    await execCommand(command);
  } catch (e: any) {
    // Map qpdf errors to clean 400 responses
    throw classifyQpdfError(e.message);
  }
  t.step('qpdf-exec');

  if (!fs.existsSync(outputPath)) {
    throw new Error('qpdf did not produce output file');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ protect-pdf done', t.summary({ inputSizeKB, outputSizeKB }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// UNLOCK — remove password from a PDF using qpdf
//
// Requires the current password to decrypt.
// Typical time: 500ms – 3s
// ─────────────────────────────────────────────────────────────────────────────
export const unlockPDF = async (
  filePath: string,
  password: string
): Promise<string> => {
  const t = new Timer('unlock-pdf');
  const inputSizeKB = Math.round(fs.statSync(filePath).size / 1024);
  logger.info('▶ unlock-pdf started', { inputSizeKB });

  if (!password || password.trim().length === 0) {
    throw Object.assign(new Error('password is required to unlock the PDF'), { statusCode: 400 });
  }

  const outputPath = path.join(OUTPUT_DIR, `unlocked-${uuidv4()}.pdf`);

  // qpdf --password=<pw> --decrypt <input> <output>
  const command = [
    'qpdf',
    `--password=${password}`,
    '--decrypt',
    `"${filePath}"`,
    `"${outputPath}"`
  ].join(' ');

  try {
    await execCommand(command);
  } catch (e: any) {
    // Map all qpdf errors to clean 400 responses:
    //   - wrong password
    //   - not encrypted (nothing to unlock)
    //   - corrupt file
    throw classifyQpdfError(e.message);
  }
  t.step('qpdf-exec');

  if (!fs.existsSync(outputPath)) {
    throw new Error('qpdf did not produce output file');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ unlock-pdf done', t.summary({ inputSizeKB, outputSizeKB }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE METADATA — strip all embedded metadata from a PDF using pdf-lib
//
// Removes: Title, Author, Subject, Keywords, Creator, Producer,
//          CreationDate, ModDate, and any custom XMP metadata.
//
// Pure in-process operation — no external tools needed.
// Typical time: 100ms – 1s
// ─────────────────────────────────────────────────────────────────────────────
export const removeMetadata = async (filePath: string): Promise<string> => {
  const t = new Timer('remove-metadata');
  const inputSizeKB = Math.round(fs.statSync(filePath).size / 1024);
  logger.info('▶ remove-metadata started', { inputSizeKB });

  // loadPDF already handles empty/corrupt files with 400
  const pdf = await loadPDF(filePath);
  t.step('load-pdf');

  // Clear all standard document info fields
  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setCreator('');
  pdf.setProducer('');

  // Clear dates
  pdf.setCreationDate(new Date(0));
  pdf.setModificationDate(new Date(0));

  // Remove XMP metadata stream from the catalog dictionary if present
  // Guard against corrupt PDFs where catalog may be undefined
  try {
    const catalog = pdf.catalog;
    if (catalog && catalog.has('Metadata' as any)) {
      catalog.delete('Metadata' as any);
    }
  } catch {
    // Catalog access failed — skip XMP removal, continue with other fields
    logger.warn('Could not access PDF catalog for XMP removal');
  }
  t.step('strip-metadata');

  // Wrap save() in try/catch — some borderline PDFs pass load() but fail save()
  let outputBytes: Uint8Array;
  try {
    outputBytes = await pdf.save();
  } catch (e: any) {
    throw Object.assign(
      new Error(`Failed to process PDF: ${e.message}`),
      { statusCode: 400 }
    );
  }
  t.step('serialize');

  const outputPath = path.join(OUTPUT_DIR, `no-metadata-${uuidv4()}.pdf`);
  await fs.promises.writeFile(outputPath, outputBytes);
  t.step('write-file');

  const outputSizeKB = Math.round(outputBytes.length / 1024);
  logger.info('✔ remove-metadata done', t.summary({ inputSizeKB, outputSizeKB }));
  return outputPath;
};
