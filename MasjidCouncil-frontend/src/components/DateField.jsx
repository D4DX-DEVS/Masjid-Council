import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import 'react-day-picker/style.css';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ponytail: build the Date from parts, not new Date(iso) - that parses as UTC and
// shifts the day backwards for anyone east of Greenwich (i.e. everyone here).
const fromISO = (iso) => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};

/**
 * Drop-in replacement for <input type="date"> - same value/onChange contract
 * (value is "YYYY-MM-DD", onChange gets { target: { name, value } }).
 *
 * @param {{ name?: string, value?: string, onChange?: (e: {target: {name: string, value: string}}) => void,
 *   disabled?: boolean, placeholder?: string, className?: string,
 *   min?: string, max?: string }} props
 */
const DateField = ({ name, value, onChange, disabled, placeholder = 'തീയതി', className = '', min, max }) => {
  const [open, setOpen] = React.useState(false);
  const selected = fromISO(value);

  const emit = (next) => {
    onChange?.({ target: { name, value: next } });
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
        aria-label={name}
      >
        <span className={selected ? '' : 'text-gray-400'}>
          {selected
            ? `${pad(selected.getDate())}-${pad(selected.getMonth() + 1)}-${selected.getFullYear()}`
            : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-gray-500" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[200] rounded-2xl border border-gray-100 bg-white p-2.5 text-[13px] shadow-[0_12px_32px_rgba(16,24,40,0.14)]"
          style={{
            '--rdp-accent-color': '#1F6B3A',
            '--rdp-accent-background-color': '#ecfdf5',
            '--rdp-today-color': '#1F6B3A',
            '--rdp-selected-border': '2px solid #1F6B3A',
            // Compact grid — the default 44px cells make a huge popover.
            '--rdp-day-width': '32px',
            '--rdp-day-height': '32px',
            '--rdp-day_button-width': '32px',
            '--rdp-day_button-height': '32px',
            '--rdp-day_button-border-radius': '9px',
            '--rdp-nav-height': '28px',
            '--rdp-nav_button-width': '28px',
            '--rdp-nav_button-height': '28px',
            '--rdp-weekday-opacity': '0.6',
            '--rdp-weekday-padding': '0.25rem 0',
          }}
        >
          <DayPicker
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            defaultMonth={selected}
            selected={selected}
            showOutsideDays
            classNames={{
              weekday: 'text-[11px] font-semibold uppercase tracking-wide text-gray-400',
              outside: 'text-gray-300',
              selected: 'bg-[#1F6B3A] text-white rounded-[9px] font-semibold',
              today: 'font-bold text-[#1F6B3A]',
            }}
            disabled={[
              ...(fromISO(min) ? [{ before: fromISO(min) }] : []),
              ...(fromISO(max) ? [{ after: fromISO(max) }] : []),
            ]}
            onSelect={(d) => d && emit(toISO(d))}
          />
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
            <button type="button" onClick={() => emit('')} className="text-gray-500 hover:text-gray-700">
              ക്ലിയർ
            </button>
            <button
              type="button"
              onClick={() => emit(toISO(new Date()))}
              className="font-semibold text-[#1F6B3A] hover:underline"
            >
              ഇന്ന്
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default DateField;
