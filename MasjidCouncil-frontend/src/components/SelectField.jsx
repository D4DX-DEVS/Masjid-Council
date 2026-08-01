import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

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
  const options = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === 'option'
  );

  // An option with an empty value is the "choose..." prompt, not a real choice:
  // Radix rejects empty-string item values, so it becomes the placeholder.
  const isPrompt = (option) => String(option.props.value ?? '') === '';
  const prompt = options.find(isPrompt);
  const items = options.filter((option) => !isPrompt(option));
  const promptText = placeholder ?? (prompt ? prompt.props.children : 'Select');

  return (
    <Select.Root
      name={name}
      value={value || undefined}
      onValueChange={(next) => onChange?.({ target: { name, value: next } })}
      required={required}
      disabled={disabled}
    >
      <Select.Trigger
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-[0.7rem] text-left text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 disabled:bg-gray-50 disabled:text-gray-400 data-[placeholder]:text-gray-400"
        aria-label={name}
      >
        <Select.Value placeholder={promptText} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
        >
          <Select.Viewport className="p-1.5">
            {items.map((option) => (
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
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default SelectField;
