// Renders one dynamic-form field from a FormConfiguration field definition.
// Shared by the public DynamicForm, the FormBuilder preview, and detail pages.
import SelectField from './SelectField';
import DateField from './DateField';

export const STRUCTURAL_TYPES = ['title', 'group', 'html', 'page'];

export const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.every((v) => isEmptyValue(v));
  return false;
};

// Mirrors backend lib/validateSubmission.js applyConditional
export const evaluateConditional = (field, formData) => {
  let visible = true;
  let required = !!field.required;
  const logic = field.conditionalLogic;
  if (!logic || logic.field === undefined || logic.field === null) return { visible, required };

  const watched = formData[`field_${logic.field}`];
  const watchedStr = watched === undefined || watched === null ? '' : String(watched);
  const target = logic.value === undefined || logic.value === null ? '' : String(logic.value);

  let matches;
  switch (logic.operator) {
    case 'equals': matches = watchedStr === target; break;
    case 'not_equals': matches = watchedStr !== target; break;
    case 'contains': matches = watchedStr.toLowerCase().includes(target.toLowerCase()); break;
    case 'not_contains': matches = !watchedStr.toLowerCase().includes(target.toLowerCase()); break;
    case 'greater_than': matches = Number(watchedStr) > Number(target); break;
    case 'less_than': matches = Number(watchedStr) < Number(target); break;
    case 'is_empty': matches = isEmptyValue(watched); break;
    case 'is_not_empty': matches = !isEmptyValue(watched); break;
    default: matches = true;
  }

  const action = logic.action || 'show';
  if (action === 'show') visible = matches;
  else if (action === 'hide') visible = !matches;
  else if (action === 'require') required = required || matches;
  else if (action === 'optional') required = required && !matches;

  return { visible, required };
};

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800 bg-white';

// number fields: no spinner arrows (scrolling over them used to change the answer silently)
const noSpinner =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const buildTable = (field, value) => {
  const cols = field.columns || (field.columnTitles || []).length || 2;
  const rows = Array.isArray(value) && value.length > 0 ? value : Array.from(
    { length: field.rows || 3 },
    () => Array(cols).fill('')
  );
  return { cols, rows };
};

const DynamicField = ({ field, value, onChange, required, uploading, onFileSelect }) => {
  const label = (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {field.label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
  const help = field.helpText ? (
    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
  ) : null;

  switch (field.type) {
    case 'title':
      return (
        <div className="pt-4 pb-1">
          <h3 className="text-lg font-bold text-emerald-800">{field.label}</h3>
          <hr className="mt-2 border-emerald-200" />
        </div>
      );
    case 'group':
      return (
        <div className="border-l-4 border-emerald-300 pl-3 py-1">
          <h4 className="font-semibold text-gray-700">{field.label}</h4>
        </div>
      );
    case 'html':
      // Rendered as plain text (not HTML) to avoid stored-XSS from config content.
      return <div className="text-sm text-gray-700 whitespace-pre-wrap">{field.helpText || field.placeholder || ''}</div>;

    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            className={inputClass}
            rows={3}
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <SelectField
            name={`field_${field.id}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'തിരഞ്ഞെടുക്കുക'}
          >
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </SelectField>
          {help}
        </div>
      );

    case 'radio':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-4 mt-1">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name={`field_${field.id}`}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="accent-emerald-600"
                />
                {opt}
              </label>
            ))}
          </div>
          {help}
        </div>
      );

    case 'yesno':
      return (
        <div>
          {label}
          <div className="flex gap-6 mt-1">
            {[
              { v: 'yes', t: 'ഉണ്ട് / അതെ' },
              { v: 'no', t: 'ഇല്ല' },
            ].map(({ v, t }) => (
              <label key={v} className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name={`field_${field.id}`}
                  checked={value === v}
                  onChange={() => onChange(v)}
                  className="accent-emerald-600"
                />
                {t}
              </label>
            ))}
          </div>
          {help}
        </div>
      );

    case 'checkbox':
    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      const toggle = (opt) =>
        onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-3 mt-1">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-emerald-600"
                />
                {opt}
              </label>
            ))}
          </div>
          {help}
        </div>
      );
    }

    case 'file':
      return (
        <div>
          {label}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onFileSelect && onFileSelect(e.target.files[0])}
            className="block w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
          {uploading && <p className="text-xs text-amber-600 mt-1">Uploading…</p>}
          {typeof value === 'string' && value && (
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline mt-1 inline-block">
              അപ്‌ലോഡ് ചെയ്ത ഫയൽ കാണുക
            </a>
          )}
          {help}
        </div>
      );

    case 'row': {
      const { cols, rows } = buildTable(field, value);
      const setCell = (r, c, cellValue) => {
        const next = rows.map((row) => [...row]);
        next[r][c] = cellValue;
        onChange(next);
      };
      const addRow = () => onChange([...rows.map((row) => [...row]), Array(cols).fill('')]);
      return (
        <div>
          {label}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50">
                <tr>
                  {field.firstColumnHeader !== undefined && field.firstColumnHeader !== '' && (
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">{field.firstColumnHeader}</th>
                  )}
                  {(field.columnTitles || Array(cols).fill('')).map((title, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 border-b">{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} className="border-b last:border-b-0">
                    {field.firstColumnHeader !== undefined && field.firstColumnHeader !== '' && (
                      <td className="px-3 py-1.5 text-gray-500">{r + 1}</td>
                    )}
                    {row.map((cell, c) => (
                      <td key={c} className="px-2 py-1.5">
                        <input
                          type="text"
                          className="w-full min-w-[8rem] px-2 py-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          value={cell || ''}
                          onChange={(e) => setCell(r, c, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {field.allowAddRows !== false && (
            <button type="button" onClick={addRow} className="mt-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium">
              + വരി ചേർക്കുക
            </button>
          )}
          {help}
        </div>
      );
    }

    case 'date':
      return (
        <div>
          {label}
          <DateField
            name={`field_${field.id}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            min={field.validation?.min}
            max={field.validation?.max}
            placeholder={field.placeholder || 'തീയതി'}
            className="px-3.5 py-[0.7rem]"
          />
          {help}
        </div>
      );

    default: {
      // text, number, phone, email, datetime, time, url, password
      const typeMap = { phone: 'tel', datetime: 'datetime-local' };
      const rules = field.validation || {};
      const isNumber = field.type === 'number';
      // These forms only ask for counts, amounts and years — never a negative.
      const min = rules.min ?? (isNumber ? 0 : undefined);
      return (
        <div>
          {label}
          <input
            type={typeMap[field.type] || field.type}
            className={isNumber ? `${inputClass} ${noSpinner}` : inputClass}
            placeholder={field.placeholder || ''}
            value={value || ''}
            min={min}
            max={rules.max}
            maxLength={rules.maxLength}
            onWheel={isNumber ? (e) => e.currentTarget.blur() : undefined}
            onKeyDown={
              isNumber
                ? (e) => {
                    // block the minus/exponent keys so "-14" can never be typed
                    if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                  }
                : undefined
            }
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );
    }
  }
};

export default DynamicField;
