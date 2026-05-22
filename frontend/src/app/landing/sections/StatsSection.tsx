import { Zap, HardDrive, Clock, Users } from 'lucide-react';

const stats = [
  { value: '20+',    label: 'Free tools',     icon: Zap,       color: 'bg-amber-50 text-amber-600'    },
  { value: '100 MB', label: 'Max file size',  icon: HardDrive, color: 'bg-blue-50 text-blue-600'      },
  { value: '1 hr',   label: 'Auto-delete',    icon: Clock,     color: 'bg-emerald-50 text-emerald-600' },
  { value: '0',      label: 'Account needed', icon: Users,     color: 'bg-violet-50 text-violet-600'  },
];

export default function StatsSection() {
  return (
    <section id="stats" className="bg-white border-b border-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14">

        {/* Label */}
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          By the numbers
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ value, label, icon: Icon, color }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">{value}</p>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

