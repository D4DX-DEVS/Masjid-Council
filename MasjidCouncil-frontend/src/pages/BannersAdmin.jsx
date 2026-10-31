import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import StateAdminAccessToggle from '../components/StateAdminAccessToggle';
import FeatureBlocked from '../components/FeatureBlocked';
import BannerFormDialog from '../components/BannerFormDialog';
import PendingConfirmDialog from '../components/PendingConfirmDialog';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import {
  createBanner,
  deleteBanner,
  fetchBannersAdmin,
  reorderBanners,
  updateBanner,
} from '../lib/banners';

/**
 * Banners for the home page carousel: add, edit, reorder, show/hide, delete.
 */
const BannersAdmin = ({ role = 'superadmin' }) => {
  const Sidebar = role === 'superadmin' ? SuperAdminSidebar : AdminSidebar;
  const isSuper = role === 'superadmin';
  const access = useFeatureAccess('banners');

  const [banners, setBanners] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // null = closed, 'new' = adding, a banner object = editing it.
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  // Add, edit and show/hide all ask first, like delete.
  const [request, setRequest] = useState(null);

  const load = async () => {
    if (access !== 'allowed') return;
    setLoadError('');
    try {
      setBanners(await fetchBannersAdmin());
    } catch (error) {
      setLoadError(error.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  const openEditor = (banner) => {
    setSaveError('');
    setEditing(banner);
  };

  const save = async (draft) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editing === 'new') {
        await createBanner(draft);
        setMessage({ type: 'success', text: 'Banner added.' });
      } else {
        await updateBanner(editing._id, draft);
        setMessage({ type: 'success', text: 'Banner saved.' });
      }
      setEditing(null);
      await load();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (banner) => {
    setBusyId(banner._id);
    try {
      await updateBanner(banner._id, { ...banner, enabled: !banner.enabled });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index, direction) => {
    const next = [...banners];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
    try {
      await reorderBanners(next.map((b) => ({ id: b._id })));
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      load();
    }
  };

  const confirmDelete = async () => {
    setDeletingBusy(true);
    try {
      await deleteBanner(deleting._id);
      setMessage({ type: 'success', text: 'Banner deleted.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setDeletingBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <PageHeader
          role={role}
          title="Banners"
          shortTitle="Banners"
          subtitle="Images shown in the carousel on the home page"
        />

        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <StateAdminAccessToggle feature="banners" show={isSuper} />

          {access === 'denied' && <FeatureBlocked feature="banners" />}

          {access !== 'allowed' ? null : (
          <>
          {message && (
            <div
              role="status"
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-[#EAF6EF] text-[#1F6B3A] ring-1 ring-green-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Banners</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Shown in this order. Hidden banners stay here but are not on the site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor('new')}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-[#1F6B3A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F]"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {loadError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center">
                <p className="text-sm text-red-700">{loadError}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            )}

            {!loadError && banners === null && (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 p-3 sm:p-4">
                    <div className="h-16 w-40 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadError && banners?.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-gray-500">
                  No banners yet. The home page shows no banner section until one is added.
                </p>
                <button
                  type="button"
                  onClick={() => openEditor('new')}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white hover:bg-[#2E7D4F]"
                >
                  <Plus className="h-4 w-4" />
                  Add the first one
                </button>
              </div>
            )}

            {!loadError && banners?.length > 0 && (
            <ul className="space-y-3">
              {banners.map((banner, index) => (
                <li
                  key={banner._id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex shrink-0 flex-row gap-1 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 sm:h-8 sm:w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === banners.length - 1}
                      aria-label="Move down"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 sm:h-8 sm:w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <img
                    src={banner.image?.url}
                    alt=""
                    className={`aspect-[4/1] w-full shrink-0 rounded-lg bg-gray-50 object-cover ring-1 ring-gray-100 sm:w-48 ${
                      banner.enabled ? '' : 'opacity-50 grayscale'
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{banner.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {banner.linkUrl || 'No link'}
                      {banner.mobileImage?.url ? ' · has mobile image' : ''}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        banner.enabled
                          ? 'bg-[#EAF6EF] text-[#1F6B3A] ring-1 ring-green-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      }`}
                    >
                      {banner.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {banner.enabled ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {banner.linkUrl && (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open link"
                        title="Open link"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setRequest({
                          title: banner.enabled ? 'Hide this banner?' : 'Show this banner?',
                          description: banner.enabled
                            ? `"${banner.title}" is taken off the home page. It stays here so you can show it again.`
                            : `"${banner.title}" appears in the home page carousel straight away.`,
                          confirmLabel: banner.enabled ? 'Hide' : 'Show',
                          action: () => toggleEnabled(banner),
                        })
                      }
                      disabled={busyId === banner._id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busyId === banner._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : banner.enabled ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {banner.enabled ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditor(banner)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(banner)}
                      aria-label="Delete"
                      title="Delete"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </section>
          </>
          )}
        </div>
      </div>

      <BannerFormDialog
        banner={editing}
        onSave={(draft) =>
          setRequest({
            title: editing === 'new' ? 'Add this banner?' : 'Save changes to this banner?',
            description:
              editing === 'new'
                ? `"${draft.title}" is added to the list${draft.enabled !== false ? ' and shown on the home page straight away' : ', hidden'}.`
                : `"${draft.title}" on the home page updates straight away.`,
            confirmLabel: editing === 'new' ? 'Add banner' : 'Save changes',
            action: () => save(draft),
          })
        }
        confirm={setRequest}
        onCancel={() => setEditing(null)}
        saving={saving}
        error={saveError}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete this banner?"
        description={
          deleting ? `"${deleting.title}" will be removed from the home page. This cannot be undone.` : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <PendingConfirmDialog request={request} onClose={() => setRequest(null)} />
    </div>
  );
};

export default BannersAdmin;
