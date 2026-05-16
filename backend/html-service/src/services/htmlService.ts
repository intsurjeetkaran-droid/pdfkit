import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import puppeteer, { Browser, PDFOptions } from 'puppeteer-core';
import logger from '../logger';
import { Timer } from '../utils/timer';

const OUTPUT_DIR = path.resolve(__dirname, '../../outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Chromium executable — set via env in Docker, fallback for local dev
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

// ── Shared browser launch options ─────────────────────────────────────────────
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--single-process'
];

// ── PDF format options ─────────────────────────────────────────────────────────
export interface HtmlPdfOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  scale?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML FILE → PDF
// Tool: Puppeteer (headless Chromium)
// Reads an uploaded HTML file and renders it to PDF.
// ─────────────────────────────────────────────────────────────────────────────
export const htmlFileToPdf = async (
  inputPath: string,
  options: HtmlPdfOptions = {}
): Promise<string> => {
  const t = new Timer('html-file-to-pdf');
  const inputSizeKB = Math.round(fs.statSync(inputPath).size / 1024);
  logger.info('▶ html-file-to-pdf started', { inputPath, inputSizeKB, options });

  const htmlContent = fs.readFileSync(inputPath, 'utf-8');
  t.step('read-file');

  const outputPath = path.join(OUTPUT_DIR, `html-to-pdf-${uuidv4()}.pdf`);

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: LAUNCH_ARGS,
      headless: true
    });
    t.step('browser-launch');

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: options.waitUntil || 'networkidle0'
    });
    t.step('page-set-content');

    const pdfOptions: PDFOptions = {
      path: outputPath,
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false, // default true
      scale: options.scale || 1,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    };

    await page.pdf(pdfOptions);
    t.step('page-pdf');
  } finally {
    if (browser) await browser.close();
    t.step('browser-close');
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('html-file-to-pdf failed — Puppeteer did not produce output');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ html-file-to-pdf done', t.summary({ inputSizeKB, outputSizeKB, outputPath }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// URL → PDF
// Tool: Puppeteer (headless Chromium)
// Navigates to a URL and renders the page to PDF.
// ─────────────────────────────────────────────────────────────────────────────
export const urlToPdf = async (
  url: string,
  options: HtmlPdfOptions = {}
): Promise<string> => {
  const t = new Timer('url-to-pdf');
  logger.info('▶ url-to-pdf started', { url, options });

  const outputPath = path.join(OUTPUT_DIR, `url-to-pdf-${uuidv4()}.pdf`);

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: LAUNCH_ARGS,
      headless: true
    });
    t.step('browser-launch');

    const page = await browser.newPage();

    // Set a realistic viewport and user-agent for better rendering
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: options.waitUntil || 'networkidle2',
      timeout: 30_000
    });
    t.step('page-navigate');

    const pdfOptions: PDFOptions = {
      path: outputPath,
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      scale: options.scale || 1,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    };

    await page.pdf(pdfOptions);
    t.step('page-pdf');
  } finally {
    if (browser) await browser.close();
    t.step('browser-close');
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('url-to-pdf failed — Puppeteer did not produce output');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ url-to-pdf done', t.summary({ url, outputSizeKB, outputPath }));
  return outputPath;
};

// ─────────────────────────────────────────────────────────────────────────────
// RAW HTML STRING → PDF
// Tool: Puppeteer (headless Chromium)
// Accepts raw HTML content from the request body.
// ─────────────────────────────────────────────────────────────────────────────
export const htmlStringToPdf = async (
  htmlContent: string,
  options: HtmlPdfOptions = {}
): Promise<string> => {
  const t = new Timer('html-string-to-pdf');
  logger.info('▶ html-string-to-pdf started', { contentLength: htmlContent.length, options });

  const outputPath = path.join(OUTPUT_DIR, `html-string-to-pdf-${uuidv4()}.pdf`);

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: LAUNCH_ARGS,
      headless: true
    });
    t.step('browser-launch');

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: options.waitUntil || 'networkidle0'
    });
    t.step('page-set-content');

    const pdfOptions: PDFOptions = {
      path: outputPath,
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      scale: options.scale || 1,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    };

    await page.pdf(pdfOptions);
    t.step('page-pdf');
  } finally {
    if (browser) await browser.close();
    t.step('browser-close');
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('html-string-to-pdf failed — Puppeteer did not produce output');
  }

  const outputSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  logger.info('✔ html-string-to-pdf done', t.summary({ outputSizeKB, outputPath }));
  return outputPath;
};
