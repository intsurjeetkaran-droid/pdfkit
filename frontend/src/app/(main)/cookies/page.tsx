import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'PDFKit Cookie Policy — we use only essential cookies. No tracking, no advertising cookies from us.',
};

const LAST_UPDATED = 'May 22, 2026';

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">What are cookies?</h2>
          <p className="leading-relaxed">
            Cookies are small text files stored on your device by your web browser when you visit a
            website. They are widely used to make websites work efficiently and to provide information
            to website owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">How PDFKit uses cookies</h2>
          <p className="leading-relaxed">
            PDFKit uses a minimal number of cookies. We do not use cookies for tracking, profiling,
            or advertising purposes beyond what is described below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Types of cookies we use</h2>

          {/* Essential */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">Essential</span>
              <span className="text-xs text-slate-400">Always active</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              These cookies are strictly necessary for the website to function. They cannot be disabled.
              They include session management and security tokens that prevent cross-site request forgery.
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="pb-1.5 text-left font-semibold">Cookie</th>
                    <th className="pb-1.5 text-left font-semibold">Purpose</th>
                    <th className="pb-1.5 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-1.5 font-mono text-slate-700">__session</td>
                    <td className="py-1.5 text-slate-500">Session management</td>
                    <td className="py-1.5 text-slate-500">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Advertising */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Advertising</span>
              <span className="text-xs text-slate-400">Google AdSense</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              PDFKit may display advertisements served by Google AdSense. Google uses cookies to serve
              ads based on your prior visits to this or other websites. These cookies are set by Google,
              not by PDFKit.
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="pb-1.5 text-left font-semibold">Cookie</th>
                    <th className="pb-1.5 text-left font-semibold">Purpose</th>
                    <th className="pb-1.5 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['__gads',  'Google AdSense ad delivery',       '13 months'],
                    ['__gpi',   'Google AdSense ad personalisation', '13 months'],
                    ['IDE',     'Google DoubleClick ad targeting',   '13 months'],
                  ].map(([name, purpose, duration]) => (
                    <tr key={name}>
                      <td className="py-1.5 font-mono text-slate-700">{name}</td>
                      <td className="py-1.5 text-slate-500">{purpose}</td>
                      <td className="py-1.5 text-slate-500">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Managing cookies</h2>
          <p className="leading-relaxed">
            You can control and delete cookies through your browser settings. Note that disabling
            essential cookies may affect the functionality of PDFKit.
          </p>
          <p className="mt-3 leading-relaxed">
            To opt out of Google personalised advertising, visit{' '}
            <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>{' '}
            or install the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out Browser Add-on
            </a>.
          </p>
          <p className="mt-3 leading-relaxed">
            Browser-specific cookie management guides:
          </p>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            {[
              ['Chrome',  'https://support.google.com/chrome/answer/95647'],
              ['Firefox', 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer'],
              ['Safari',  'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac'],
              ['Edge',    'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09'],
            ].map(([browser, url]) => (
              <li key={browser}>
                <a href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {browser}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Changes to this policy</h2>
          <p className="leading-relaxed">
            We may update this Cookie Policy from time to time. The "Last updated" date at the top
            reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Contact</h2>
          <p className="leading-relaxed">
            For questions about our use of cookies, please use our{' '}
            <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
          </p>
        </section>

      </div>
    </div>
  );
}

