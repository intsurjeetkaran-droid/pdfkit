import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'PDFKit Terms of Service — the rules for using our free PDF tools.',
};

const LAST_UPDATED = 'May 22, 2026';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of terms</h2>
          <p className="leading-relaxed">
            By accessing or using PDFKit ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of service</h2>
          <p className="leading-relaxed">
            PDFKit provides free, web-based PDF processing tools including but not limited to: merging,
            splitting, compressing, converting, watermarking, encrypting, and extracting content from
            PDF files. The Service is provided "as is" without any guarantee of availability or accuracy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Acceptable use</h2>
          <p className="leading-relaxed mb-3">You agree not to use PDFKit to:</p>
          <ul className="space-y-2 list-disc list-inside text-sm">
            <li>Upload, process, or distribute files that infringe any copyright, trademark, or other intellectual property right</li>
            <li>Upload files containing malware, viruses, or any malicious code</li>
            <li>Process files containing illegal content including but not limited to child sexual abuse material</li>
            <li>Attempt to reverse-engineer, scrape, or overload the Service</li>
            <li>Use automated tools to circumvent rate limits</li>
            <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Your files and content</h2>
          <p className="leading-relaxed">
            You retain full ownership of all files you upload to PDFKit. By uploading a file, you grant
            PDFKit a temporary, limited licence to process that file solely for the purpose of providing
            the requested service. This licence expires when the file is deleted (within 1 hour of upload).
          </p>
          <p className="mt-3 leading-relaxed">
            You are solely responsible for ensuring you have the right to upload and process any file
            you submit to the Service. PDFKit is not responsible for any copyright infringement or
            other legal issues arising from files you upload.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Rate limits and fair use</h2>
          <p className="leading-relaxed">
            To ensure fair access for all users, PDFKit enforces rate limits:
          </p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm">
            <li>Standard operations: 100 requests per 15 minutes per IP address</li>
            <li>Heavy operations (compress, PDF-to-Word, HTML-to-PDF): 20 requests per hour per IP address</li>
            <li>Maximum file size: 100 MB per file</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            Attempts to circumvent these limits may result in your IP address being temporarily blocked.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Disclaimer of warranties</h2>
          <p className="leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
            EXPRESS OR IMPLIED. PDFKIT DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
            ERROR-FREE, OR THAT THE RESULTS OBTAINED FROM USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE.
          </p>
          <p className="mt-3 leading-relaxed">
            You use the Service at your own risk. Always keep backups of important files before
            processing them with any online tool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Limitation of liability</h2>
          <p className="leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PDFKIT SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, ARISING
            FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">8. Advertising</h2>
          <p className="leading-relaxed">
            PDFKit may display advertisements served by Google AdSense or similar advertising networks.
            These advertisements help fund the free operation of the Service. Advertisers do not have
            access to your uploaded files or processing data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to the service</h2>
          <p className="leading-relaxed">
            PDFKit reserves the right to modify, suspend, or discontinue any part of the Service at
            any time without notice. We are not liable to you or any third party for any modification,
            suspension, or discontinuation of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">10. Governing law</h2>
          <p className="leading-relaxed">
            These Terms shall be governed by and construed in accordance with applicable law. Any
            disputes arising from these Terms or your use of the Service shall be resolved through
            good-faith negotiation before any formal legal proceedings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">11. Changes to these terms</h2>
          <p className="leading-relaxed">
            We may update these Terms of Service from time to time. The "Last updated" date at the
            top of this page reflects the most recent revision. Continued use of PDFKit after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact</h2>
          <p className="leading-relaxed">
            For questions about these Terms, please use our{' '}
            <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
          </p>
        </section>

      </div>
    </div>
  );
}

