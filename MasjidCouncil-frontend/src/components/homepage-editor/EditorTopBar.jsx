import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Loader2,
  Monitor,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import { PREVIEW_DEVICES } from '../../lib/homepage/preview';

const DEVICE_ICONS = { phone: Smartphone, tablet: Tablet, desktop: Monitor };
const DEVICES = PREVIEW_DEVICES.map((d) => ({ ...d, icon: DEVICE_ICONS[d.id] }));

const VIEWS = [
  { id: 'edit', label: 'Edit', icon: Pencil },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const segment = (active) =>
  `flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
  }`;

const button =
  'inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50';

/**
 * The customiser's only chrome: back, status, view and device switches, and the actions.
 * Everything else on screen is the editor panel and the preview.
 */
const EditorTopBar = ({
  onBack,
  status,
  view,
  onViewChange,
  device,
  onDeviceChange,
  busy,
  canSave,
  canPublish,
  canDiscard,
  onSave,
  onPublish,
  onDiscard,
  onReset,
  showActions = true,
}) => (
  <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:px-4">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to the dashboard"
      title="Back to the dashboard"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>

    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <h1 className="hidden truncate text-base font-semibold text-gray-900 sm:block">Homepage Design</h1>
      {status && (
        <span role="status" className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.tone}`}>
          {status.text}
        </span>
      )}
    </div>

    {showActions && (
      <>
        <div className="order-last flex w-full items-center justify-center gap-2 sm:order-none sm:ml-auto sm:w-auto">
          <div role="group" aria-label="View" className="flex flex-1 rounded-lg bg-gray-100 p-0.5 sm:flex-none">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                aria-pressed={view === v.id}
                className={`${segment(view === v.id)} flex-1 sm:flex-none`}
              >
                <v.icon className="h-4 w-4" />
                {v.label}
              </button>
            ))}
          </div>

          <div role="group" aria-label="Preview width" className="hidden rounded-lg bg-gray-100 p-0.5 md:flex">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onDeviceChange(d.id)}
                aria-pressed={device === d.id}
                aria-label={`${d.label} width`}
                title={`${d.label} · ${d.width}px`}
                className={`${segment(device === d.id)} w-10 px-0`}
              >
                <d.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="More actions"
                title="More actions"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={6}
                className="z-[90] w-60 rounded-xl bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(16,24,40,0.3)] ring-1 ring-gray-100"
              >
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  Open the live home page
                </a>
                <Popover.Close asChild>
                  <button
                    type="button"
                    onClick={onDiscard}
                    disabled={!canDiscard || !!busy}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Undo2 className="h-4 w-4 text-gray-400" />
                    Discard draft
                  </button>
                </Popover.Close>
                <Popover.Close asChild>
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={!!busy}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-400" />
                    Reset to original design
                  </button>
                </Popover.Close>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || !!busy}
            className={`${button} border border-gray-200 text-gray-800 hover:bg-gray-50`}
          >
            {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">Save draft</span>
            <span className="sm:hidden">Save</span>
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish || !!busy}
            className={`${button} bg-[#1F6B3A] text-white hover:bg-[#2E7D4F]`}
          >
            {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </>
    )}
  </header>
);

export default EditorTopBar;
