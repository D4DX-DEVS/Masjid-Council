import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Confirmation for an action that cannot be undone.
 *
 * Destructive is the default because that is what the callers are: deleting a publication, a
 * chapter, a submission. The icon and the red confirm button carry that weight, and Cancel
 * holds the focus so a stray Enter cannot delete anything.
 */
const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  const Icon = destructive ? AlertTriangle : HelpCircle;

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="mc-dialog-overlay fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-[2px]" />
        <AlertDialog.Content className="mc-dialog-panel fixed left-1/2 top-1/2 z-[101] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35)] focus:outline-none">
          <div className="flex gap-4 p-6">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                destructive ? 'bg-red-50 text-red-600' : 'bg-[#EAF6EF] text-[#1F6B3A]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <AlertDialog.Title className="text-base font-semibold text-gray-900">
                {title}
              </AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  destructive
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                    : 'bg-[#1F6B3A] hover:bg-[#2E7D4F] focus-visible:ring-green-600'
                }`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ConfirmDialog;
