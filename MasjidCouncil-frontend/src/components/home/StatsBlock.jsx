import React from 'react';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  Layers,
  MapPin,
  PieChart,
  Star,
  Users,
} from 'lucide-react';
import { PADDING_CLASS, WIDTH_CLASS, color } from '../../lib/homepage/render';

// Names match STAT_ICON_NAMES in lib/homepage/fields.js and the backend allowlist.
const ICONS = {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  Layers,
  MapPin,
  PieChart,
  Star,
  Users,
};

// Reach at a glance — the highlighted number carries the ivory accent.
const StatsBlock = ({ section }) => {
  const { layout, content } = section;
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;

  const gradient = `linear-gradient(100deg, ${color(content.gradientFrom, '#78b247')} 0%, ${color(
    content.gradientVia,
    '#2f6b2f'
  )} 60%, ${color(content.gradientTo, '#17532b')} 100%)`;

  return (
    <div className={`px-4 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.xs}`}>
      <div
        className={`${WIDTH_CLASS[layout.width] || WIDTH_CLASS.normal} mx-auto rounded-2xl sm:rounded-3xl px-3 py-4 sm:px-6 sm:py-8 shadow-lg`}
        style={{ background: gradient }}
      >
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(var(--hp-stat-cols),minmax(0,1fr))] gap-y-3 sm:gap-y-7"
          style={{ '--hp-stat-cols': Math.min(items.length, 6) }}
        >
          {items.map((stat, index) => {
            const Icon = ICONS[stat.icon] || Landmark;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 sm:gap-4 px-1 sm:px-2 sm:justify-center ${
                  index > 0 ? 'lg:border-l lg:border-white/25' : ''
                }`}
              >
                <Icon className="w-5 h-5 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white/85 shrink-0" strokeWidth={1.25} />
                {/* Number and label share a line on phones, stack from sm up */}
                <div className="min-w-0 flex items-baseline gap-1.5 sm:block text-left">
                  <p
                    className="text-[15px] sm:text-2xl font-bold leading-none"
                    style={{
                      fontFamily: 'var(--hp-font-latin)',
                      color: stat.highlight ? color(content.highlightColor, '#f8f3d8') : '#ffffff',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[10px] sm:text-xs sm:mt-1.5 leading-snug truncate sm:whitespace-normal"
                    style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, '#dcfce7') }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsBlock;
