// Shared design tokens + charts for the admin / super-admin dashboards.
export const C = {
  green: '#1F6B3A',
  green2: '#2E7D4F',
  greenSoft: '#EAF6EF',
  text: '#111827',
  sub: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  warning: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316'
};

export const cardShadow = { boxShadow: '0 6px 24px rgba(0,0,0,.06)' };

export const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(date).toLocaleDateString('en-GB');
};

export const statusBadge = (status) => ({
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-[#EAF6EF] text-[#1F6B3A] border border-green-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200'
}[status] || 'bg-gray-100 text-gray-600 border border-gray-200');

/* Smooth cubic path through monthly points */
const buildLinePath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TrendChart = ({ counts }) => {
  const W = 640, H = 200, PAD = 28;
  const max = Math.max(4, ...counts);
  const pts = counts.map((v, i) => [
    PAD + (i * (W - PAD * 2)) / 11,
    H - PAD - (v / max) * (H - PAD * 2)
  ]);
  const line = buildLinePath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full h-auto" role="img" aria-label="Applications per month">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green2} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.green2} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD} x2={W - PAD} y1={H - PAD - t * (H - PAD * 2)} y2={H - PAD - t * (H - PAD * 2)}
          stroke={C.border} strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke={C.green2} strokeWidth="2.5" strokeLinecap="round" />
      {MONTHS.map((m, i) => (
        <text key={m} x={pts[i][0]} y={H + 8} textAnchor="middle" fontSize="11" fill={C.sub}>{m}</text>
      ))}
    </svg>
  );
};

export const DonutChart = ({ approved, pending, rejected }) => {
  const total = approved + pending + rejected || 1;
  const R = 54, CIRC = 2 * Math.PI * R;
  const segs = [
    { v: approved, color: C.green2 },
    { v: pending, color: C.warning },
    { v: rejected, color: C.danger }
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 flex-shrink-0" role="img" aria-label="Status distribution">
      {segs.map((s, i) => {
        const len = (s.v / total) * CIRC;
        const el = (
          <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="18"
            strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-offset}
            transform="rotate(-90 70 70)" />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill={C.text}>{approved + pending + rejected}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill={C.sub}>Total</text>
    </svg>
  );
};

export const StatusLegend = ({ approved, pending, rejected }) => {
  const total = approved + pending + rejected || 1;
  return (
    <div className="space-y-3 text-sm flex-1 min-w-[170px]">
      {[
        ['Approved', approved, C.green2],
        ['Pending', pending, C.warning],
        ['Rejected', rejected, C.danger]
      ].map(([label, v, color]) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="font-medium text-[#111827]">{label}</span>
          <span className="text-[#6B7280] whitespace-nowrap ml-auto">{Math.round((v / total) * 100)}% ({v})</span>
        </div>
      ))}
    </div>
  );
};
