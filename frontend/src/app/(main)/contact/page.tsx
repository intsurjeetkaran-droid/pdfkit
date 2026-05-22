import type { Metadata } from 'next';
import { Mail, MessageSquare, Clock, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact PDFKit — report a bug, ask a question, or send a DMCA notice.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Contact Us</h1>
        <p className="mt-3 text-slate-500 leading-relaxed">
          Have a question, found a bug, or need to send a legal notice? We&apos;re here.
        </p>
      </div>

      <div className="space-y-8">

        {/* Contact reasons */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: MessageSquare,
              color: 'bg-blue-50 text-blue-600',
              title: 'Bug reports',
              body: 'Found something broken? Tell us the tool, what you uploaded, and what went wrong.',
            },
            {
              icon: Shield,
              color: 'bg-emerald-50 text-emerald-600',
              title: 'Privacy & legal',
              body: 'DMCA notices, privacy requests, or data deletion requests.',
            },
            {
              icon: Mail,
              color: 'bg-violet-50 text-violet-600',
              title: 'General questions',
              body: 'Questions about how a tool works, file limits, or supported formats.',
            },
            {
              icon: Clock,
              color: 'bg-amber-50 text-amber-600',
              title: 'Response time',
              body: 'We aim to respond within 2 business days. Legal notices are prioritised.',
            },
          ].map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Send a message</h2>
          <p className="text-xs text-slate-400 mb-5">
            Fill in the form below or email us directly at{' '}
            <a href="mailto:support@pdfkit.io" className="text-blue-600 hover:underline font-medium">
              support@pdfkit.io
            </a>
          </p>
          <form className="space-y-4" action="#" method="POST">

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <select id="subject" name="subject" className="input" required>
                <option value="">Select a topic…</option>
                <option value="bug">Bug report</option>
                <option value="question">General question</option>
                <option value="privacy">Privacy / data request</option>
                <option value="dmca">DMCA / copyright notice</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Describe your issue or question in detail…"
                className="input resize-none"
                required
              />
            </div>

            <p className="text-xs text-slate-400">
              By submitting this form you agree to our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              We will only use your email to respond to your message.
            </p>

            <button
              type="submit"
              className="btn btn-primary w-full"
            >
              Send message
            </button>

          </form>
        </div>

        {/* Note about files */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Note:</strong> PDFKit does not store your files after 1 hour. If you are reporting
            a processing error, please describe the file type, size, and the exact error message you
            received. Do not send us your actual files via email.
          </p>
        </div>

      </div>
    </div>
  );
}
