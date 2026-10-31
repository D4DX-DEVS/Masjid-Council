import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlignLeft,
  CirclePlay,
  Images,
  LayoutGrid,
  LayoutPanelLeft,
  Megaphone,
  MessageCircleQuestionMark,
  MousePointerClick,
  X,
} from 'lucide-react';
import { ADDABLE_TYPES, SECTION_META } from '../../lib/homepage/fields';

const ICONS = {
  text: AlignLeft,
  imageText: LayoutPanelLeft,
  cta: MousePointerClick,
  cards: LayoutGrid,
  gallery: Images,
  video: CirclePlay,
  faq: MessageCircleQuestionMark,
  notice: Megaphone,
};

/** The picker behind "Add section": one tile per section type the admin can add. */
const AddSectionDialog = ({ open, onPick, onClose }) => (
  <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className="mc-dialog-overlay fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-[2px]" />
      <Dialog.Content className="mc-dialog-panel fixed left-1/2 top-1/2 z-[101] max-h-[85vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35)] focus:outline-none">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <Dialog.Title className="text-base font-semibold text-gray-900">Add a section</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-sm text-gray-500">
              It goes in above the footer. Move it anywhere after.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {ADDABLE_TYPES.map((type) => {
            const meta = SECTION_META[type];
            const Icon = ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="group flex min-h-20 items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-green-600"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF6EF] text-[#1F6B3A] transition-colors group-hover:bg-[#1F6B3A] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{meta.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{meta.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default AddSectionDialog;
