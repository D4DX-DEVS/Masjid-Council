import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import FeatureBlocked from '../components/FeatureBlocked';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import {
  fetchPublicationAdmin,
  updatePublication,
  uploadPublicationImage,
} from '../lib/publications';

// TipTap is ~90KB gzipped. Loading it here rather than at module scope keeps it out of the
// bundle a visitor downloads to read a chapter.
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));

const Field = ({ label, hint, textarea, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
    {textarea ? (
      <textarea
        {...props}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
      />
    ) : (
      <input
        {...props}
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
      />
    )}
    {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
  </label>
);

const PublicationEditor = ({ role = 'superadmin' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const Sidebar = role === 'superadmin' ? SuperAdminSidebar : AdminSidebar;
  const listPath = `/${role === 'superadmin' ? 'superadmin' : 'admin'}-publications`;
  const access = useFeatureAccess('publications');

  const [publication, setPublication] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [removingChapter, setRemovingChapter] = useState(null);

  useEffect(() => {
    if (access !== 'allowed') return;
    fetchPublicationAdmin(id)
      .then(setPublication)
      .catch((error) => setMessage({ type: 'error', text: error.message }));
  }, [id, access]);

  // A misclick on the browser's back button should not throw away an edited chapter.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = (changes) => {
    setPublication((current) => ({ ...current, ...changes }));
    setDirty(true);
  };

  const patchChapter = (index, changes) => {
    setPublication((current) => {
      const chapters = [...current.chapters];
      chapters[index] = { ...chapters[index], ...changes };
      return { ...current, chapters };
    });
    setDirty(true);
  };

  const addChapter = () => {
    const nextId = Math.max(0, ...(publication.chapters || []).map((c) => c.id || 0)) + 1;
    const chapters = [
      ...(publication.chapters || []),
      { id: nextId, slug: `chapter-${nextId}`, title: 'New chapter', order: 0, bodyHtml: '' },
    ];
    patch({ chapters });
    setActiveChapter(chapters.length - 1);
  };

  const moveChapter = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= publication.chapters.length) return;
    const chapters = [...publication.chapters];
    [chapters[index], chapters[target]] = [chapters[target], chapters[index]];
    patch({ chapters });
    setActiveChapter(target);
  };

  const removeChapter = () => {
    const index = removingChapter;
    const chapters = publication.chapters.filter((_, i) => i !== index);
    patch({ chapters });
    setActiveChapter(Math.max(0, Math.min(index, chapters.length - 1)));
    setRemovingChapter(null);
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const coverImage = await uploadPublicationImage(file, 'coverImage');
      patch({ coverImage });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updatePublication(publication._id, publication);
      setPublication(saved);
      setDirty(false);
      setMessage({ type: 'success', text: 'Saved.' });
    } catch (error) {
      // The edit stays in state, so a failed save can be retried without retyping.
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (access === 'denied') {
    return (
      <div className="flex min-h-screen bg-[#F7F8FA]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <PageHeader role={role} title="Publication" shortTitle="Publication" />
          <FeatureBlocked feature="publications" />
        </div>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="flex min-h-screen bg-[#F7F8FA]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <PageHeader role={role} title="Publication" shortTitle="Publication" />
          <div className="mx-auto max-w-5xl px-4 py-8">
            {message ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {message.text}
              </p>
            ) : (
              <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            )}
          </div>
        </div>
      </div>
    );
  }

  const chapter = publication.chapters?.[activeChapter] || null;

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <PageHeader
          role={role}
          title={publication.titleMalayalam || publication.title}
          shortTitle="Publication"
          subtitle={`/resources/${publication.slug}`}
          actions={
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? 'Save changes' : 'Saved'}
            </button>
          }
        />

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(listPath)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All publications
          </button>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-[#EAF6EF] text-[#1F6B3A] ring-1 ring-green-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Publication details */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title (English)"
                value={publication.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
              <Field
                label="Title (Malayalam)"
                value={publication.titleMalayalam}
                onChange={(e) => patch({ titleMalayalam: e.target.value })}
                style={{ fontFamily: 'Noto Sans Malayalam' }}
              />
              <Field
                label="Subtitle"
                value={publication.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value })}
                style={{ fontFamily: 'Noto Sans Malayalam' }}
              />
              <Field
                label="URL slug"
                value={publication.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                hint="Changing this breaks links already shared."
              />
              <div className="sm:col-span-2">
                <Field
                  label="Card description"
                  textarea
                  value={publication.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  hint="Shown on the home page card, not in the reader."
                  style={{ fontFamily: 'Noto Sans Malayalam' }}
                />
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <span className="mb-2 block text-sm font-medium text-gray-700">Cover image</span>
              <div className="flex flex-wrap items-center gap-4">
                {publication.coverImage?.url ? (
                  <div className="relative">
                    <img
                      src={publication.coverImage.url}
                      alt=""
                      className="h-28 w-auto rounded-lg object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => patch({ coverImage: { url: '', key: '' } })}
                      aria-label="Remove cover image"
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow ring-1 ring-gray-200 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {publication.coverImage?.url ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => uploadCover(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <label className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-gray-100 pt-5">
              <input
                type="checkbox"
                checked={publication.isPublished}
                onChange={(e) => patch({ isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Published (visible on the home page)</span>
            </label>
          </section>

          {/* Chapters */}
          <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  Chapters ({publication.chapters?.length || 0})
                </h2>
                <button
                  type="button"
                  onClick={addChapter}
                  aria-label="Add chapter"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F6B3A] hover:bg-[#EAF6EF]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <ol className="max-h-[420px] space-y-0.5 overflow-y-auto lg:max-h-[70vh]">
                {publication.chapters?.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveChapter(index)}
                      className={`flex w-full gap-2 rounded-lg px-3 py-2 text-left text-sm leading-snug transition-colors ${
                        index === activeChapter
                          ? 'bg-[#EAF6EF] font-semibold text-[#1F6B3A]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: 'Noto Sans Malayalam' }}
                    >
                      <span className="shrink-0 tabular-nums text-gray-400">{index + 1}.</span>
                      <span className="min-w-0 truncate">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
              {chapter ? (
                <>
                  <div className="mb-4 flex flex-wrap items-end gap-3">
                    <div className="min-w-0 flex-1">
                      <Field
                        label="Chapter title"
                        value={chapter.title}
                        onChange={(e) => patchChapter(activeChapter, { title: e.target.value })}
                        style={{ fontFamily: 'Noto Sans Malayalam' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveChapter(activeChapter, -1)}
                        disabled={activeChapter === 0}
                        aria-label="Move chapter up"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChapter(activeChapter, 1)}
                        disabled={activeChapter === publication.chapters.length - 1}
                        aria-label="Move chapter down"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemovingChapter(activeChapter)}
                        aria-label="Delete chapter"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Suspense
                    fallback={
                      <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-gray-200">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                      </div>
                    }
                  >
                    <RichTextEditor
                      key={chapter.id}
                      value={chapter.bodyHtml}
                      onChange={(html) => patchChapter(activeChapter, { bodyHtml: html })}
                      onError={(text) => setMessage({ type: 'error', text })}
                    />
                  </Suspense>
                </>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-sm text-gray-500">No chapters yet.</p>
                  <button
                    type="button"
                    onClick={addChapter}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white hover:bg-[#2E7D4F]"
                  >
                    <Plus className="h-4 w-4" />
                    Add a chapter
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={removingChapter !== null}
        title="Delete this chapter?"
        description={
          removingChapter !== null
            ? `"${publication.chapters[removingChapter]?.title}" will be removed when you save.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={removeChapter}
        onCancel={() => setRemovingChapter(null)}
      />
    </div>
  );
};

export default PublicationEditor;
