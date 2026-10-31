import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import FieldControl from './FieldControl';
import { SECTION_META, THEME_GROUPS } from '../../lib/homepage/fields';
import { DEFAULT_THEME, isCustomSection, sectionDefaults, sectionType } from '../../lib/homepage/defaults';

const Group = ({ title, children }) => (
  <section className="space-y-4">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
    {children}
  </section>
);

const Header = ({ title, hint, onBack, actions }) => (
  <div className="mb-5 space-y-3">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      All sections
    </button>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 gap-1">{actions}</div>
    </div>
  </div>
);

const resetButton = (label, onClick) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
  >
    <RotateCcw className="h-4 w-4" />
  </button>
);

export const ThemeEditor = ({ theme, onChange, onBack, onError, confirm }) => (
  <div>
    <Header
      title="Theme"
      hint="Colours and fonts every section uses unless it sets its own."
      onBack={onBack}
      actions={resetButton('Reset theme to default', () =>
        confirm({
          title: 'Reset the theme?',
          description: 'Every colour and font goes back to the original design. Nothing changes for visitors until you publish.',
          confirmLabel: 'Reset theme',
          destructive: true,
          action: () => onChange({ ...DEFAULT_THEME }),
        })
      )}
    />
    <div className="space-y-8">
      {THEME_GROUPS.map((group) => (
        <Group key={group.title} title={group.title}>
          {group.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={theme[field.key]}
              defaultValue={DEFAULT_THEME[field.key]}
              onChange={(value) => onChange({ ...theme, [field.key]: value })}
              onError={onError}
              confirm={confirm}
              idPrefix="hp-theme"
            />
          ))}
        </Group>
      ))}
    </div>
  </div>
);

/** Content and layout controls for one section. */
const SectionEditor = ({ section, role, onChange, onBack, onError, onDelete, confirm }) => {
  const meta = SECTION_META[sectionType(section)];
  const base = sectionDefaults(section);
  const custom = isCustomSection(section);
  const hidden = section.visible === false;
  const managedPath = meta.managedAt
    ? `/${role === 'superadmin' ? 'superadmin' : 'admin'}-${meta.managedAt}`
    : null;

  const setContent = (key, value) => onChange({ ...section, content: { ...section.content, [key]: value } });
  const setLayout = (key, value) => onChange({ ...section, layout: { ...section.layout, [key]: value } });

  return (
    <div>
      <Header
        title={meta.label}
        hint={meta.hint}
        onBack={onBack}
        actions={
          <>
            <button
              type="button"
              onClick={() => onChange({ ...section, visible: hidden })}
              aria-pressed={!hidden}
              aria-label={hidden ? 'Show this section' : 'Hide this section'}
              title={hidden ? 'Show' : 'Hide'}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {(meta.content.length > 0 || meta.layout.length > 0) &&
              resetButton('Reset this section to default', () =>
                confirm({
                  title: `Reset "${meta.label}"?`,
                  description: 'Its text, images, spacing and colours go back to how the section started.',
                  confirmLabel: 'Reset section',
                  destructive: true,
                  action: () => onChange({ ...base, visible: section.visible }),
                })
              )}
            {custom && (
              <button
                type="button"
                onClick={() => onDelete(section)}
                aria-label="Delete this section"
                title="Delete"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        }
      />

      {hidden && (
        <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          This section is hidden and will not appear on the home page.
        </p>
      )}

      {managedPath && (
        <Link
          to={managedPath}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Edit {meta.label.toLowerCase()}
        </Link>
      )}

      <div className="space-y-8">
        {meta.content.length > 0 && (
          <Group title="Content">
            {meta.content.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={section.content[field.key]}
                defaultValue={base.content[field.key]}
                onChange={(value) => setContent(field.key, value)}
                onError={onError}
                confirm={confirm}
                idPrefix={`hp-${section.id}`}
              />
            ))}
          </Group>
        )}

        {meta.layout.length > 0 && (
          <Group title="Layout and colours">
            {meta.layout.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={section.layout[field.key]}
                defaultValue={base.layout[field.key]}
                onChange={(value) => setLayout(field.key, value)}
                onError={onError}
                confirm={confirm}
                idPrefix={`hp-${section.id}-layout`}
              />
            ))}
          </Group>
        )}

        {!managedPath && meta.content.length === 0 && meta.layout.length === 0 && (
          <p className="text-sm text-gray-500">This section has no settings beyond its position.</p>
        )}
      </div>
    </div>
  );
};

export default SectionEditor;
