import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Save, X } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { uploadBannerImage } from '../lib/banners';

/**
 * Add or edit one banner. A plain Dialog, like EditFieldDialog: it is a form, not a
 * confirmation. Saving is the caller's job — onSave receives the draft and does the request.
 */

const EMPTY = {
  title: '',
  image: { url: '', key: '' },
  mobileImage: { url: '', key: '' },
  linkUrl: '',
  openInNewTab: true,
  enabled: true,
};

const isValidLink = (link) =>
  !link || /^https?:\/\//i.test(link) || (link.startsWith('/') && !link.startsWith('//'));

const BannerFormDialog = ({ banner, onSave, onCancel, saving, error, confirm }) => {
  const [draft, setDraft] = useState(EMPTY);
  const [localError, setLocalError] = useState('');

  // Reopening on a different banner must not keep the previous one's draft.
  useEffect(() => {
    setDraft(banner && banner !== 'new' ? { ...EMPTY, ...banner } : EMPTY);
    setLocalError('');
  }, [banner]);

  if (!banner) return null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return setLocalError('Title is required.');
    if (!draft.image?.url) return setLocalError('Upload a banner image.');
    if (!isValidLink(draft.linkUrl.trim())) {
      return setLocalError('Link must start with https:// or / (a page on this site).');
    }
    setLocalError('');
    onSave({ ...draft, title: draft.title.trim(), linkUrl: draft.linkUrl.trim() });
  };

  const shownError = localError || error;
  const isNew = banner === 'new';

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next && !saving) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35)] focus:outline-none"
        >
          <form onSubmit={submit}>
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {isNew ? 'Add banner' : 'Edit banner'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={saving}
                  aria-label="Close"
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Title<span className="text-red-500"> *</span>
                </span>
                <input
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                  maxLength={200}
                  placeholder="ZAAD — the digital office for your mahallu"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <span className="mt-1 block text-xs text-gray-400">
                  Not shown on the banner. Read aloud by screen readers and used in this list.
                </span>
              </label>

              <ImageUploadField
                label="Banner image"
                required
                hint="Wide image, about 2160 × 500 px. JPG, PNG or WEBP, up to 5 MB."
                previewSrc={draft.image?.url}
                upload={uploadBannerImage}
                onUploaded={(image) => set({ image })}
                onError={setLocalError}
              />

              <ImageUploadField
                label="Mobile image (optional)"
                hint="Shown on phones instead of the wide image, e.g. 1080 × 1080 px. Leave empty to use the wide one."
                previewSrc={draft.mobileImage?.url}
                upload={uploadBannerImage}
                onUploaded={(mobileImage) => set({ mobileImage })}
                onRemove={() =>
                  confirm({
                    title: 'Remove the mobile image?',
                    description: 'Phones will show the wide banner image instead.',
                    confirmLabel: 'Remove',
                    destructive: true,
                    action: () => set({ mobileImage: { url: '', key: '' } }),
                  })
                }
                onError={setLocalError}
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Link (optional)</span>
                <input
                  value={draft.linkUrl}
                  onChange={(e) => set({ linkUrl: e.target.value })}
                  maxLength={500}
                  placeholder="https://zaad.info or /about"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <span className="mt-1 block text-xs text-gray-400">
                  Where a click on the banner goes. Empty means the banner is not clickable.
                </span>
              </label>

              <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={draft.openInNewTab !== false}
                    onChange={(e) => set({ openInNewTab: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Open external link in a new tab</span>
                </label>
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={draft.enabled !== false}
                    onChange={(e) => set({ enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Show on the home page</span>
                </label>
              </div>

              {shownError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {shownError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BannerFormDialog;
