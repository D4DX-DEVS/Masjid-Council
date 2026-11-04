import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Monitor, Save, Smartphone, X } from 'lucide-react';
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

// Crop shapes offered in the editor. The wide one matches the carousel's recommended 2160 × 500.
const DESKTOP_CROP = {
  aspects: [
    { label: 'Wide 4.3 : 1', value: 2160 / 500 },
    { label: '3 : 1', value: 3 },
    { label: '16 : 9', value: 16 / 9 },
    { label: 'Free', value: null },
  ],
};
const MOBILE_CROP = {
  aspects: [
    { label: 'Original shape', value: null },
    { label: '4 : 3', value: 4 / 3 },
    { label: 'Square 1 : 1', value: 1 },
    { label: 'Portrait 4 : 5', value: 4 / 5 },
  ],
};

/** Shows how the banner will look in the home page carousel on a desktop and on a phone. */
const BannerPreview = ({ image, mobileImage, title }) => {
  const [view, setView] = useState('desktop');
  if (!image) return null;
  const phoneSrc = mobileImage || image;
  const tab = (key, Icon, text) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === key}
      onClick={() => setView(key)}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
        view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      {text}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">Preview</span>
        <div role="tablist" aria-label="Preview device" className="inline-flex rounded-lg bg-gray-100 p-1">
          {tab('desktop', Monitor, 'Desktop')}
          {tab('mobile', Smartphone, 'Mobile')}
        </div>
      </div>
      <div className="flex justify-center rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
        {view === 'desktop' ? (
          <div className="w-full overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200">
            <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="p-2">
              <img src={image} alt={title} className="block h-auto w-full rounded-md" />
            </div>
          </div>
        ) : (
          <div className="w-56 rounded-[1.75rem] bg-gray-900 p-2 shadow-lg">
            <div className="overflow-hidden rounded-[1.25rem] bg-white">
              <div className="mx-auto my-1.5 h-1.5 w-12 rounded-full bg-gray-200" />
              <div className="px-2 pb-6">
                <img src={phoneSrc} alt={title} className="block h-auto w-full rounded-lg shadow ring-1 ring-gray-100" />
              </div>
            </div>
          </div>
        )}
      </div>
      {view === 'mobile' && !mobileImage && (
        <p className="mt-1 text-xs text-amber-700">
          No mobile image yet, so phones show the wide image. Upload one above for readable text.
        </p>
      )}
    </div>
  );
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
                hint="Wide image, about 2160 × 500 px. You can crop after picking. JPG, PNG or WEBP, up to 5 MB."
                previewSrc={draft.image?.url}
                upload={uploadBannerImage}
                crop={DESKTOP_CROP}
                onUploaded={(image) => set({ image })}
                onError={setLocalError}
              />

              <ImageUploadField
                label="Mobile image (optional)"
                hint="Shown on phones instead of the wide image, e.g. 1080 × 1080 or 1448 × 1086 px. You can crop after picking. Leave empty to use the wide one."
                previewSrc={draft.mobileImage?.url}
                upload={uploadBannerImage}
                crop={MOBILE_CROP}
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

              <BannerPreview
                image={draft.image?.url}
                mobileImage={draft.mobileImage?.url}
                title={draft.title}
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
