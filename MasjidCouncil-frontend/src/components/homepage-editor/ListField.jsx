import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

/**
 * An editable list of items, each with its own sub-fields (application cards, statistics).
 * FieldComponent is FieldControl, passed in rather than imported to keep the two files from
 * importing each other.
 */
const ListField = ({ field, value, defaultValue, onChange, onError, confirm, idPrefix, FieldComponent }) => {
  const noun = field.itemName || 'item';
  const Field = FieldComponent;
  const [open, setOpen] = useState(null);

  const update = (index, patch) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) =>
    confirm({
      title: `Delete this ${noun}?`,
      description: `"${field.itemLabel(value[index], index)}" is removed from the section.`,
      confirmLabel: 'Delete',
      destructive: true,
      action: () => {
        onChange(value.filter((_, i) => i !== index));
        setOpen(null);
      },
    });
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpen(open === index ? target : open);
  };
  const add = () =>
    confirm({
      title: `Add a ${noun}?`,
      description: `A new ${noun} is added at the end of "${field.label}", ready to fill in.`,
      confirmLabel: `Add ${noun}`,
      action: () => {
        onChange([...value, { ...field.newItem }]);
        setOpen(value.length);
      },
    });

  const iconButton =
    'flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">{field.label}</span>
        <span className="text-xs text-gray-400">
          {value.length} / {field.max}
        </span>
      </div>

      <ul className="space-y-2">
        {value.map((item, index) => {
          const expanded = open === index;
          return (
            <li key={index} className="rounded-lg border border-gray-200">
              <div className="flex items-center gap-1 pl-1 pr-1">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : index)}
                  aria-expanded={expanded}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                  <span className="truncate">{field.itemLabel(item, index)}</span>
                </button>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className={iconButton}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Move down"
                  className={iconButton}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove"
                  className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {expanded && (
                <div className="hp-drop space-y-4 border-t border-gray-100 p-3">
                  {field.fields.map((sub) => (
                    <Field
                      key={sub.key}
                      field={sub}
                      value={item[sub.key]}
                      defaultValue={defaultValue[index]?.[sub.key] ?? field.newItem[sub.key]}
                      onChange={(next) => update(index, { [sub.key]: next })}
                      onError={onError}
                      confirm={confirm}
                      idPrefix={`${idPrefix}-${index}`}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={add}
        disabled={value.length >= field.max}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
    </div>
  );
};

export default ListField;
