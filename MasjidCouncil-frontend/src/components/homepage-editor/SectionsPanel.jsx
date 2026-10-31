import React, { useLayoutEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff, Palette, Plus, Trash2 } from 'lucide-react';
import { SECTION_META } from '../../lib/homepage/fields';
import { isCustomSection, sectionType } from '../../lib/homepage/defaults';
import { capturePositions, playFlip } from '../../lib/homepage/flip';

/**
 * The page outline: every section in display order, with show/hide and move controls, and
 * delete for sections the admin added. The footer is pinned to the end, so it never moves and
 * nothing moves below it. Moved, added and removed rows glide rather than jump.
 */
const SectionsPanel = ({ sections, onMove, onToggle, onSelect, onAdd, onDelete, canAdd }) => {
  const lastMovable = sections.filter((s) => !SECTION_META[sectionType(s)]?.pinned).length - 1;
  const listRef = useRef(null);
  const before = useRef(null);
  const previousIds = useRef(null);
  const order = sections.map((s) => s.id).join(',');

  useLayoutEffect(() => {
    const list = listRef.current;
    // Nothing animates on first render: the list is arriving, not changing.
    if (previousIds.current) {
      // A move captured real positions. An add or delete did not, so rows that were already
      // there are pinned to where they are now and only a new row fades in.
      const from =
        before.current ||
        new Map(
          [...previousIds.current].map((id) => [
            id,
            list?.querySelector(`[data-hp-row="${CSS.escape(id)}"]`)?.offsetTop ?? 0,
          ])
        );
      playFlip(list, 'data-hp-row', from);
    }
    before.current = null;
    previousIds.current = new Set(order.split(','));
  }, [order]);

  const withGlide = (action) => (...args) => {
    before.current = capturePositions(listRef.current, 'data-hp-row');
    action(...args);
  };
  const move = withGlide(onMove);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onSelect('theme')}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-gray-200 px-4 text-left transition-colors hover:border-green-300 hover:bg-green-50/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF6EF] text-[#1F6B3A]">
          <Palette className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">Theme</span>
          <span className="block truncate text-xs text-gray-500">Colours and fonts for the whole page</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sections, top to bottom</h3>
        <ul ref={listRef} className="space-y-2">
          {sections.map((section, index) => {
            const meta = SECTION_META[sectionType(section)];
            const pinned = meta.pinned;
            const custom = isCustomSection(section);
            const hidden = section.visible === false;
            // An added section is named by its own heading, so two "Text" sections can be told apart.
            const title = custom ? section.content.heading || section.content.text || meta.label : meta.label;
            const subtitle = hidden ? 'Hidden' : custom ? meta.label : meta.hint;
            return (
              <li
                key={section.id}
                data-hp-row={section.id}
                className={`flex items-center gap-1 rounded-xl border p-1 transition-colors duration-200 ${
                  hidden ? 'border-dashed border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={pinned || index === 0}
                    aria-label={`Move ${title} up`}
                    className="flex h-6 w-9 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={pinned || index >= lastMovable}
                    aria-label={`Move ${title} down`}
                    className="flex h-6 w-9 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect(section.id)}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 ${
                        hidden ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      <span className="truncate">{title}</span>
                      {custom && (
                        <span className="shrink-0 rounded-full bg-[#EAF6EF] px-1.5 py-px text-[10px] font-medium text-[#1F6B3A]">
                          Added
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-gray-500">{subtitle}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggle(section.id)}
                  aria-pressed={!hidden}
                  aria-label={hidden ? `Show ${title}` : `Hide ${title}`}
                  title={hidden ? 'Show' : 'Hide'}
                  className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {custom && (
                  <button
                    type="button"
                    onClick={() => onDelete(section)}
                    aria-label={`Delete ${title}`}
                    title="Delete"
                    className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-700 transition-colors hover:border-green-400 hover:bg-green-50/40 hover:text-[#1F6B3A] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {canAdd ? 'Add section' : 'Section limit reached'}
        </button>
      </div>
    </div>
  );
};

export default SectionsPanel;
