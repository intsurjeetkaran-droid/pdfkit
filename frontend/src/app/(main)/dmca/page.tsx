import type { Metadata } from 'next';
import { ShieldOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA & Copyright',
  description: 'PDFKit DMCA and copyright policy. How to report copyright infringement.',
};

const LAST_UPDATED = 'May 22, 2026';

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">DMCA & Copyright</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Our position on copyright</h2>
          <p className="leading-relaxed">
            PDFKit respects intellectual property rights and expects users to do the same. PDFKit is a
            processing tool — we do not host, store, or distribute user files beyond the 1-hour
            processing window. We do not have access to the contents of files after they are deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">User responsibility</h2>
          <p className="leading-relaxed">
            Users are solely responsible for ensuring they have the legal right to upload, process,
            and download any file they submit to PDFKit. This includes:
          </p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm">
            <li>Owning the copyright to the file, or</li>
            <li>Having explicit permission from the copyright holder, or</li>
            <li>The file being in the public domain, or</li>
            <li>Your use qualifying as fair use / fair dealing under applicable law</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            PDFKit does not condone and expressly prohibits the use of our Service to infringe
            copyright or any other intellectual property right.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">DMCA takedown notice</h2>
          <p className="leading-relaxed">
            Because PDFKit does not permanently store user files (all files are deleted within 1 hour),
            traditional DMCA takedown requests for user-uploaded content are generally not applicable —
            the content will already be deleted before any notice could be processed.
          </p>
          <p className="mt-3 leading-relaxed">
            If you believe that any content on the PDFKit website itself (not user-uploaded files)
            infringes your copyright, please submit a written notice containing:
          </p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm">
            <li>Your name, address, telephone number, and email address</li>
            <li>A description of the copyrighted work you claim has been infringed</li>
            <li>The specific URL on PDFKit where the allegedly infringing material is located</li>
            <li>A statement that you have a good-faith belief that the use is not authorised by the copyright owner</li>
            <li>A statement that the information in your notice is accurate and, under penalty of perjury, that you are the copyright owner or authorised to act on their behalf</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">How to submit a notice</h2>
          <p className="leading-relaxed">
            Send your DMCA notice via our{' '}
            <a href="/contact" className="text-blue-600 hover:underline">contact page</a>{' '}
            with the subject line "DMCA Notice". We will review and respond to valid notices promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Counter-notification</h2>
          <p className="leading-relaxed">
            If you believe your content was removed in error, you may submit a counter-notification
            via our contact page. Counter-notifications must include the same information as a
            takedown notice plus a statement that you consent to the jurisdiction of the relevant
            federal court and that you will accept service of process from the complainant.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Repeat infringers</h2>
          <p className="leading-relaxed">
            PDFKit will, in appropriate circumstances, block access for users who are repeat
            infringers of intellectual property rights.
          </p>
        </section>

      </div>
    </div>
  );
}

