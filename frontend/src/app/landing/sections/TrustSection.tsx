import { Shield, Clock, Zap, Users } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    color: 'text-blue-600 bg-blue-50 ring-blue-100',
    title: 'No account ever',
    body: 'We never ask for your email, name, or any personal information. Zero sign-up friction.',
  },
  {
    icon: Clock,
    color: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
    title: '1-hour auto-delete',
    body: 'Every uploaded and processed file is permanently and automatically deleted after 60 minutes.',
  },
  {
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 ring-amber-100',
    title: 'No watermarks',
    body: 'Your output files are completely clean. We never stamp our logo or branding on your documents.',
  },
  {
    icon: Users,
    color: 'text-violet-600 bg-violet-50 ring-violet-100',
    title: 'No registration',
    body: 'No email, no password, no profile. Just upload your file and process it — that is all.',
  },
];

export default function TrustSection() {
  return (
    <section id="trust" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Privacy & Trust</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Your files are safe with us
          </h2>
          <p className="mt-4 text-slate-500 max-w-lg mx-auto leading-relaxed">
            We built PDFKit with privacy as a first principle — not an afterthought.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, color, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-4 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
