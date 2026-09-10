import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import DynamicField from './DynamicFieldRenderer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Edit one answer on a submitted application.
 *
 * Reuses DynamicField so an edited field gets the same widget the applicant filled in —
 * a select still only offers its configured options, a row table still edits as a table.
 * A plain Dialog rather than the AlertDialog behind ConfirmDialog: this is a form, and
 * an alert dialog's Cancel-holds-focus, nothing-else-matters shape fights a form.
 *
 * Saving is the caller's job: onSave receives the new value and does the request, so the
 * page keeps owning the submission it just changed.
 */
const EditFieldDialog = ({ field, value, onSave, onCancel, saving, error }) => {
  const [draft, setDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Reopening on a different field must not keep the previous field's draft.
  useEffect(() => {
    setDraft(value);
    setUploadError('');
  }, [field?.id, value]);

  if (!field) return null;

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append(`field_${field.id}`, file);
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/submissions/upload-submission-file`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const data = await res.json();
      if (data.success) {
        setDraft(data.data[`field_${field.id}`].cdnUrl);
      } else {
        setUploadError(data.message || 'File upload failed');
      }
    } catch {
      setUploadError('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isFile = field.type === 'file';
  const busy = saving || uploading;

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[101] w-[92vw] max-w-lg max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35)] focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {field.label}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={busy}
                aria-label="Close"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-6 py-5">
            <DynamicField
              field={{ ...field, label: '' }}
              value={draft}
              onChange={setDraft}
              required={!!field.required || !!field.unique}
              uploading={uploading}
              onFileSelect={handleFile}
            />

            {isFile && typeof draft === 'string' && draft !== '' && (
              <button
                type="button"
                onClick={() => setDraft('')}
                disabled={busy}
                className="mt-3 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                ഈ ഫയൽ നീക്കം ചെയ്യുക
              </button>
            )}

            {(uploadError || error) && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadError || error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1F6B3A] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#2E7D4F] hover:shadow-md disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              {saving ? 'Saving…' : 'Save change'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditFieldDialog;
