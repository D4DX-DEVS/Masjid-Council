import * as AlertDialog from '@radix-ui/react-alert-dialog';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) => (
  <AlertDialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[100] data-[state=open]:animate-in data-[state=open]:fade-in" />
      <AlertDialog.Content className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl bg-white p-6 shadow-2xl focus:outline-none">
        <AlertDialog.Title className="text-base font-semibold text-gray-900">
          {title}
        </AlertDialog.Title>
        {description && (
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            {description}
          </AlertDialog.Description>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialog.Cancel asChild>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {cancelLabel}
            </button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
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

export default ConfirmDialog;
