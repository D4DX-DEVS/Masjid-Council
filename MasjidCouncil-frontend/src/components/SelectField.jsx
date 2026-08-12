import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * Drop-in replacement for a native <select> in the application forms.
 *
 * ponytail: it deliberately keeps the native contract - it reads the same
 * <option> children and calls onChange({ target: { name, value } }) - so the
 * existing handleChange handlers work untouched and each swap is a tag rename.
 *
 * @param {{ name?: string, value?: string, onChange?: (e: {target: {name: string, value: string}}) => void,
 *   required?: boolean, disabled?: boolean, placeholder?: string, children?: React.ReactNode }} props
 */
const SelectField = ({ name, value, onChange, required, disabled, placeholder, children }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const searchRef = React.useRef(null);

  const options = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === 'option'
  );

  // An option with an empty value is the "choose..." prompt, not a real choice:
  // Radix rejects empty-string item values, so it becomes the placeholder.
  const isPrompt = (option) => String(option.props.value ?? '') === '';
  const prompt = options.find(isPrompt);
  const items = options.filter((option) => !isPrompt(option));
  const promptText = placeholder ?? (prompt ? prompt.props.children : 'Select');

  const needle = search.trim().toLowerCase();
  const filteredItems = needle
    ? items.filter((option) => String(option.props.children).toLowerCase().includes(needle))
    : items;

  return (
    <Select.Root
      name={name}
      value={value || undefined}
      onValueChange={(next) => onChange?.({ target: { name, value: next } })}
      required={required}
      disabled={disabled}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSearch('');
          // ponytail: Radix focuses the checked item on open - steal it back for the search box next tick.
          requestAnimationFrame(() => searchRef.current?.focus());
        }
      }}
    >
      <Select.Trigger
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-[0.7rem] text-left text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 disabled:bg-gray-50 disabled:text-gray-400 data-[placeholder]:text-gray-400"
        aria-label={name}
      >
        {/* min-w-0 + truncate keeps a long label on one line instead of growing the trigger */}
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">
          <Select.Value placeholder={promptText} />
        </span>
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[200] max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
        >
          {/* ponytail: short lists (payment mode, yes/no) fit on screen - search is noise there. */}
          {items.length > 8 && (
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-2.5 py-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Escape') e.stopPropagation();
                }}
                placeholder="Search..."
                className="w-full text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          )}
          <Select.Viewport className="p-1.5">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-gray-400">No results</div>
            ) : (
              filteredItems.map((option) => (
                <Select.Item
                  key={String(option.props.value)}
                  value={String(option.props.value)}
                  className="relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-8 text-sm text-gray-700 outline-none data-[highlighted]:bg-green-50 data-[highlighted]:text-green-800 data-[state=checked]:font-semibold data-[state=checked]:text-green-700"
                >
                  <Select.ItemText>{option.props.children}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2.5">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default SelectField;
