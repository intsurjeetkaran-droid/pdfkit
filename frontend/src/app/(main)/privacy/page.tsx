import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PDFKit Privacy Policy — how we handle your files and data. We collect minimal data and delete all files within 1 hour.',
};

const LAST_UPDATED = 'May 22, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Overview</h2>
          <p className="leading-relaxed">
            PDFKit is designed with privacy as a core principle. We collect the minimum data necessary
            to operate the service. We do not require you to create an account, provide your name, or
            share your email address to use any feature of PDFKit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Files you upload</h2>
          <p className="leading-relaxed">
            When you upload a file to PDFKit, it is stored temporarily on our servers solely for the
            purpose of processing your request. All uploaded files and processed output files are
            automatically and permanently deleted within <strong>1 hour</strong> of upload. We do not
            read, analyse, index, or share the contents of your files with any third party.
          </p>
          <p className="mt-3 leading-relaxed">
            Files are stored in an isolated storage system accessible only during the processing
            window. Each file is assigned a random identifier — there is no connection between a
            file and any user identity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data we collect automatically</h2>
          <p className="leading-relaxed">When you use PDFKit, our servers automatically log:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm">
            <li>Your IP address (used for rate limiting — not stored long-term)</li>
            <li>The HTTP method and path of your request</li>
            <li>The HTTP status code and response time</li>
            <li>Your browser's User-Agent string</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            These server logs are retained for a maximum of 7 days for security and debugging purposes,
            then permanently deleted. We do not use this data for advertising or profiling.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Cookies</h2>
          <p className="leading-relaxed">
            PDFKit uses only essential cookies required for the service to function. We do not use
            tracking cookies, advertising cookies, or third-party analytics cookies. See our{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Third-party services</h2>
          <p className="leading-relaxed">
            PDFKit may display advertisements served by Google AdSense. Google may use cookies to
            serve ads based on your prior visits to this or other websites. You can opt out of
            personalised advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>.
          </p>
          <p className="mt-3 leading-relaxed">
            We do not share your personal data with Google or any other third party beyond what is
            required for ad serving. Your uploaded files are never shared with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data retention</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-semibold">Data type</th>
                  <th className="pb-2 font-semibold">Retention period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Uploaded files',        '1 hour (auto-deleted)'],
                  ['Processed output files','1 hour (auto-deleted)'],
                  ['Server access logs',    '7 days'],
                  ['Rate limit counters',   '15 minutes'],
                  ['Error logs',            '30 days'],
                ].map(([type, period]) => (
                  <tr key={type}>
                    <td className="py-2 text-slate-700">{type}</td>
                    <td className="py-2 text-slate-500">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your rights</h2>
          <p className="leading-relaxed">
            Because we do not collect personal data tied to your identity, most data subject rights
            (access, rectification, erasure) are satisfied automatically — your files are deleted
            within 1 hour and we hold no profile on you.
          </p>
          <p className="mt-3 leading-relaxed">
            If you have questions about your data or wish to request deletion of any server logs
            associated with your IP address, contact us at{' '}
            <a href="/contact" className="text-blue-600 hover:underline">our contact page</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Security</h2>
          <p className="leading-relaxed">
            All data in transit is encrypted using TLS 1.2 or higher. Files are stored in an isolated
            storage system with no public access. Each file is accessible only via a time-limited,
            randomly generated URL that expires when the file is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">8. Children's privacy</h2>
          <p className="leading-relaxed">
            PDFKit is not directed at children under the age of 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, please contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to this policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. The "Last updated" date at the top
            of this page reflects the most recent revision. Continued use of PDFKit after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
          <p className="leading-relaxed">
            For privacy-related questions, please use our{' '}
            <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
          </p>
        </section>

      </div>
    </div>
  );
}

