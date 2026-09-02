import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  createPublication,
  deletePublication,
  fetchPublicationSection,
  fetchPublicationsAdmin,
  reorderPublications,
  updatePublication,
  updatePublicationSection,
} from '../lib/publications';

/**
 * Publications list: order, publish state, and the section heading shown on the home page.
 * Editing one publication's chapters happens in PublicationEditor.
 */

const Field = ({ label, hint, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
    <input
      {...props}
      className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    />
    {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
  </label>
);

const PublicationsAdmin = ({ role = 'superadmin' }) => {
  const navigate = useNavigate();
  const Sidebar = role === 'superadmin' ? SuperAdminSidebar : AdminSidebar;

  const [publications, setPublications] = useState(null);
  const [section, setSection] = useState(null);
  const [message, setMessage] = useState(null);
  const [savingSection, setSavingSection] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const [list, sectionData] = await Promise.all([
        fetchPublicationsAdmin(),
        fetchPublicationSection(),
      ]);
      setPublications(list);
      setSection(sectionData);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setPublications([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSection = async () => {
    setSavingSection(true);
    try {
      const saved = await updatePublicationSection(section);
      setSection(saved);
      setMessage({ type: 'success', text: 'Section heading saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSavingSection(false);
    }
  };

  const togglePublished = async (publication) => {
    setBusyId(publication._id);
    try {
      // The API replaces the whole document, so the chapters have to go back with it —
      // sending only the flag would blank the book.
      await updatePublication(publication._id, {
        ...publication,
        isPublished: !publication.isPublished,
        chapters: publication.chapters,
      });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index, direction) => {
    const next = [...publications];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPublications(next);
    try {
      await reorderPublications(next.map((p) => ({ id: p._id })));
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      load();
    }
  };

  const addPublication = async () => {
    try {
      const created = await createPublication({
        title: 'New publication',
        titleMalayalam: '',
        chapters: [],
      });
      navigate(`/${role === 'superadmin' ? 'superadmin' : 'admin'}-publications/${created._id}`);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePublication(deleting._id);
      setDeleting(null);
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setDeleting(null);
    }
  };

  const editPath = (id) =>
    `/${role === 'superadmin' ? 'superadmin' : 'admin'}-publications/${id}`;

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <PageHeader
          role={role}
          title="Publications"
          shortTitle="Publications"
          subtitle="Books and guides shown on the home page"
        />

        <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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

          {/* Section copy — this is what lets the council rename the section without a deploy. */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Section on the home page</h2>
            {section ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Heading"
                    value={section.heading}
                    onChange={(e) => setSection({ ...section, heading: e.target.value })}
                    placeholder="പ്രസിദ്ധീകരണങ്ങൾ"
                  />
                  <Field
                    label="Button label"
                    value={section.ctaLabel}
                    onChange={(e) => setSection({ ...section, ctaLabel: e.target.value })}
                    placeholder="വായിക്കുക"
                  />
                </div>
                <Field
                  label="Subtitle"
                  value={section.subtitle}
                  onChange={(e) => setSection({ ...section, subtitle: e.target.value })}
                  placeholder="Optional line under the heading"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={section.enabled !== false}
                      onChange={(e) => setSection({ ...section, enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Show this section on the home page</span>
                  </label>
                  <button
                    type="button"
                    onClick={saveSection}
                    disabled={savingSection}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F] disabled:opacity-60"
                  >
                    {savingSection ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Publications</h2>
              <button
                type="button"
                onClick={addPublication}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F]"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {publications === null && (
              <div className="space-y-3">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            )}

            {publications?.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-gray-500">No publications yet.</p>
                <button
                  type="button"
                  onClick={addPublication}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white hover:bg-[#2E7D4F]"
                >
                  <Plus className="h-4 w-4" />
                  Add the first one
                </button>
              </div>
            )}

            <ul className="space-y-3">
              {publications?.map((publication, index) => (
                <li
                  key={publication._id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex shrink-0 flex-row gap-1 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === publications.length - 1}
                      aria-label="Move down"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  {publication.coverImage?.url ? (
                    <img
                      src={publication.coverImage.url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-semibold text-gray-900"
                      style={{ fontFamily: 'Noto Sans Malayalam' }}
                    >
                      {publication.titleMalayalam || publication.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      /resources/{publication.slug} · {publication.chapters?.length || 0} chapters
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        publication.isPublished
                          ? 'bg-[#EAF6EF] text-[#1F6B3A] ring-1 ring-green-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      }`}
                    >
                      {publication.isPublished ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {publication.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {publication.isPublished && (
                      <a
                        href={`/resources/${publication.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on the site"
                        title="View on the site"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => togglePublished(publication)}
                      disabled={busyId === publication._id}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busyId === publication._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : publication.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {publication.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(editPath(publication._id))}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(publication)}
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
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this publication?"
        description={
          deleting
            ? `"${deleting.titleMalayalam || deleting.title}" and its ${deleting.chapters?.length || 0} chapters will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default PublicationsAdmin;
