import React from 'react';
import { RotateCcw } from 'lucide-react';
import SelectField from '../SelectField';
import ImageUploadField from '../ImageUploadField';
import ListField from './ListField';
import { FONTS } from '../../lib/homepage/fields';
import { imageSrc } from '../../lib/homepage/render';
import { fieldError } from '../../lib/homepage/preview';
import { uploadHomepageImage } from '../../lib/homepage/api';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20';

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
    {children}
  </label>
);

const Hint = ({ children, error }) =>
  error ? (
    <span role="alert" className="mt-1 block text-xs text-red-600">
      {error}
    </span>
  ) : children ? (
    <span className="mt-1 block text-xs text-gray-400">{children}</span>
  ) : null;

const ColorControl = ({ id, field, value, defaultValue, onChange }) => {
  const valid = HEX_COLOR.test(value || '');
  // An empty layout colour means "use the theme colour", which only a non-required field has.
  const inherits = !value && !field.required;
  return (
    <div>
      <Label htmlFor={id}>{field.label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${field.label} picker`}
          value={valid ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
        />
        <input
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={inherits ? 'Theme colour' : '#000000'}
          maxLength={7}
          className={`${inputClass} h-11 font-mono`}
        />
        {value !== defaultValue && (
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            aria-label={`Reset ${field.label}`}
            title="Reset to default"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      <Hint error={value && !valid ? 'Use a 6-digit hex colour like #1f6b3a.' : ''}>
        {inherits ? 'Empty uses the theme colour.' : field.hint}
      </Hint>
    </div>
  );
};

/**
 * One editor control, chosen by the field's kind (see lib/homepage/fields.js). Every change
 * goes straight to onChange so the preview follows each keystroke.
 */
const FieldControl = ({ field, value, defaultValue, onChange, onError, confirm, idPrefix = 'hp' }) => {
  // Without a confirm function (nothing above asked for one) actions run straight away.
  const ask = (request) => (confirm ? confirm(request) : request.action());
  const id = `${idPrefix}-${field.key}`;
  const error = fieldError(field, value);

  switch (field.kind) {
    case 'text':
    case 'link':
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <input
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            dir={field.dir}
            className={`${inputClass} h-11 ${error ? 'border-red-400' : ''}`}
          />
          <Hint error={error}>{field.hint}</Hint>
        </div>
      );
    case 'textarea':
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <textarea
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            dir={field.dir}
            rows={field.rows || 3}
            className={`${inputClass} py-2.5 leading-relaxed`}
          />
          <Hint>{field.hint}</Hint>
        </div>
      );
    case 'color':
      return <ColorControl id={id} field={field} value={value} defaultValue={defaultValue} onChange={onChange} />;
    case 'select':
    case 'font': {
      const options =
        field.kind === 'font'
          ? FONTS[field.fontGroup].map((font) => ({ value: font.name, label: font.name }))
          : field.options;
      return (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</span>
          <SelectField name={id} value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <Hint>{field.hint}</Hint>
        </div>
      );
    }
    case 'toggle':
      return (
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value !== false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );
    case 'image':
      return (
        <ImageUploadField
          label={field.label}
          hint={field.hint}
          previewSrc={imageSrc(value)}
          upload={(file) => uploadHomepageImage(file)}
          onUploaded={({ url }) => onChange(url)}
          onRemove={
            value
              ? () =>
                  ask({
                    title: 'Remove this image?',
                    description: `The image is taken off "${field.label}". You can upload another one any time.`,
                    confirmLabel: 'Remove',
                    destructive: true,
                    action: () => onChange(''),
                  })
              : undefined
          }
          onRestore={defaultValue && value !== defaultValue ? () => onChange(defaultValue) : undefined}
          onError={onError}
        />
      );
    case 'list':
      return (
        <ListField
          field={field}
          value={Array.isArray(value) ? value : []}
          defaultValue={Array.isArray(defaultValue) ? defaultValue : []}
          onChange={onChange}
          onError={onError}
          confirm={ask}
          idPrefix={id}
          FieldComponent={FieldControl}
        />
      );
    default:
      return null;
  }
};

export default FieldControl;
