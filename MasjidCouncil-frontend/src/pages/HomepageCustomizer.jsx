import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, X } from 'lucide-react';
import PendingConfirmDialog from '../components/PendingConfirmDialog';
import StateAdminAccessToggle from '../components/StateAdminAccessToggle';
import FeatureBlocked from '../components/FeatureBlocked';
import EditorTopBar from '../components/homepage-editor/EditorTopBar';
import SectionsPanel from '../components/homepage-editor/SectionsPanel';
import SectionEditor, { ThemeEditor } from '../components/homepage-editor/SectionEditor';
import AddSectionDialog from '../components/homepage-editor/AddSectionDialog';
import PreviewFrame from '../components/homepage-editor/PreviewFrame';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { MAX_CUSTOM_SECTIONS, isCustomSection, mergeHomepage, newSection, sectionType } from '../lib/homepage/defaults';
import { SECTION_META, THEME_GROUPS } from '../lib/homepage/fields';
import { PREVIEW_DEVICES, countInvalid } from '../lib/homepage/preview';
import {
  discardHomepageDraft,
  fetchHomepageAdmin,
  publishHomepage,
  saveHomepageDraft,
} from '../lib/homepage/api';

/**
 * Homepage Design: section order and visibility, theme, every section's copy, images, spacing
 * and colours, and sections the admin adds — with the real page previewed live beside it.
 *
 * Full screen, like a theme editor: the admin sidebar and page header would take a third of
 * the width from the two things that matter here. "Preview" hides the panel so the page shows
 * at full size; clicking a section in the preview opens its settings.
 *
 * Edits stay in this browser until "Save draft"; visitors keep seeing the published page
 * until "Publish". Every add, delete, reset, save and publish asks for confirmation first.
 */

const formatDate = (value) =>
  value ? new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const MESSAGE_MS = 4000;

const HomepageCustomizer = ({ role = 'superadmin' }) => {
  const navigate = useNavigate();
  const access = useFeatureAccess('homepage');
  const dashboardPath = role === 'superadmin' ? '/superadmin-dashboard' : '/admin-home';

  const [server, setServer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);
  const [view, setView] = useState('edit');
  const [device, setDevice] = useState(() => (window.innerWidth < 768 ? 'phone' : 'desktop'));
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [request, setRequest] = useState(null);
  const [picking, setPicking] = useState(false);
  // Which way the panel slides when its content changes: into a section, or back to the list.
  const [motion, setMotion] = useState('');
  const panelRef = useRef(null);
  const listScroll = useRef(0);

  const ask = setRequest;

  const adopt = (data) => {
    const merged = mergeHomepage(data.draft);
    setServer(data);
    setDraft(merged);
    setSavedSnapshot(JSON.stringify(merged));
  };

  const load = async () => {
    if (access !== 'allowed') return;
    setLoadError('');
    try {
      adopt(await fetchHomepageAdmin());
    } catch (error) {
      setLoadError(error.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  const dirty = draft !== null && JSON.stringify(draft) !== savedSnapshot;
  const invalid = useMemo(
    () => (draft ? countInvalid(draft, { SECTION_META, THEME_GROUPS, sectionType }) : 0),
    [draft]
  );
  const customCount = draft ? draft.sections.filter(isCustomSection).length : 0;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Success notes clear themselves; errors stay until dismissed.
  useEffect(() => {
    if (message?.type !== 'success') return undefined;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const run = async (name, task, success) => {
    setBusy(name);
    setMessage(null);
    try {
      await task();
      setMessage({ type: 'success', text: success });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------ actions */

  const saveDraft = () =>
    ask({
      title: 'Save this draft?',
      description: 'Your changes are kept, but visitors still see the published page until you publish.',
      confirmLabel: 'Save draft',
      action: () =>
        run('save', async () => adopt(await saveHomepageDraft(draft)), 'Draft saved. Publish to put it live.'),
    });

  const publish = () =>
    ask({
      title: 'Publish this design?',
      description: 'Every visitor will see the home page exactly as in the preview, within a minute.',
      confirmLabel: 'Publish',
      action: () =>
        run(
          'publish',
          async () => {
            if (dirty) await saveHomepageDraft(draft);
            adopt(await publishHomepage());
          },
          'Published. Visitors see the new home page within a minute.'
        ),
    });

  const discard = () =>
    ask({
      title: 'Discard the draft?',
      description: 'All changes since the last publish are thrown away and the editor goes back to the live page.',
      confirmLabel: 'Discard',
      destructive: true,
      action: () =>
        run('discard', async () => adopt(await discardHomepageDraft()), 'Draft discarded. Back to the published page.'),
    });

  const resetToDefaults = () =>
    ask({
      title: 'Reset to the original design?',
      description:
        'The draft goes back to the home page as it was built, and added sections are removed. Nothing changes for visitors until you publish.',
      confirmLabel: 'Reset',
      destructive: true,
      action: () => {
        setDraft(mergeHomepage(null));
        setSelected(null);
        setMessage({ type: 'success', text: 'Draft reset to the original design. Save or publish to keep it.' });
      },
    });

  const goBack = () =>
    dirty
      ? ask({
          title: 'Leave without saving?',
          description: 'Your unsaved changes will be lost. Save the draft first to keep them.',
          confirmLabel: 'Leave',
          destructive: true,
          action: () => navigate(dashboardPath),
        })
      : navigate(dashboardPath);

  // From the panel: open the section and scroll the preview to it.
  const select = (id) => {
    setMotion(id ? 'hp-panel-forward' : 'hp-panel-back');
    setSelected(id);
    if (id && id !== 'theme') setFocus(`${id}:${Date.now()}`);
  };

  // From a click in the preview: the section is already in view, so only open its settings.
  const selectFromPreview = useCallback((id) => {
    setMotion('hp-panel-forward');
    setSelected(id);
    setView('edit');
  }, []);

  // A section's settings start at the top; going back returns the list to where it was.
  useLayoutEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.scrollTop = selected ? 0 : listScroll.current;
  }, [selected]);

  const pickSection = (type) => {
    const label = SECTION_META[type].label;
    ask({
      title: `Add a "${label}" section?`,
      description: 'It goes in above the footer with sample content, ready to edit. You can move or delete it after.',
      confirmLabel: 'Add section',
      action: () => {
        const section = newSection(type, draft.sections);
        setDraft((d) => {
          const sections = [...d.sections];
          const footer = sections.findIndex((s) => s.id === 'footer');
          sections.splice(footer === -1 ? sections.length : footer, 0, section);
          return { ...d, sections };
        });
        setPicking(false);
        select(section.id);
      },
    });
  };

  const deleteSection = (section) => {
    const label = section.content.heading || SECTION_META[sectionType(section)].label;
    ask({
      title: `Delete "${label}"?`,
      description: 'The section and everything in it are removed from the draft. Discard the draft to undo before you save.',
      confirmLabel: 'Delete',
      destructive: true,
      action: () => {
        setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== section.id) }));
        if (selected === section.id) select(null);
      },
    });
  };

  const updateSection = (next) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s) => (s.id === next.id ? next : s)) }));

  const moveSection = (index, direction) =>
    setDraft((d) => {
      const target = index + direction;
      const sections = [...d.sections];
      if (target < 0 || target >= sections.length || SECTION_META[sectionType(sections[target])].pinned) return d;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });

  const toggleSection = (id) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, visible: s.visible === false } : s)),
    }));

  const onFieldError = (text) => text && setMessage({ type: 'error', text });

  const status = !draft
    ? null
    : dirty
      ? { text: 'Unsaved changes', tone: 'bg-amber-50 text-amber-800 ring-amber-200' }
      : server?.hasUnpublished
        ? { text: 'Draft not published', tone: 'bg-blue-50 text-blue-800 ring-blue-200' }
        : {
            text: server?.publishedAt ? `Live · ${formatDate(server.publishedAt)}` : 'Live · original',
            tone: 'bg-[#EAF6EF] text-[#1F6B3A] ring-green-200',
          };

  const selectedSection = draft?.sections.find((s) => s.id === selected);
  const deviceWidth = PREVIEW_DEVICES.find((d) => d.id === device).width;

  return (
    <div className="flex h-dvh flex-col bg-[#F7F8FA]">
      <EditorTopBar
        onBack={goBack}
        status={status}
        view={view}
        onViewChange={setView}
        device={device}
        onDeviceChange={setDevice}
        busy={busy}
        canSave={dirty && invalid === 0}
        canPublish={invalid === 0 && (dirty || !!server?.hasUnpublished)}
        canDiscard={dirty || !!server?.hasUnpublished}
        onSave={saveDraft}
        onPublish={publish}
        onDiscard={discard}
        onReset={resetToDefaults}
        showActions={access === 'allowed' && !!draft}
      />

      {invalid > 0 && (
        <p role="alert" className="shrink-0 bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {invalid === 1 ? '1 field has' : `${invalid} fields have`} an invalid value. Fix the field marked in red to save.
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        {access === 'denied' && (
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            <FeatureBlocked feature="homepage" homePath={dashboardPath} />
          </div>
        )}

        {access === 'allowed' && loadError && (
          <div className="m-4 h-fit flex-1 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-red-100 sm:m-6">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {(access === 'loading' || (access === 'allowed' && !loadError && !draft)) && (
          <>
            <div className="w-full shrink-0 space-y-3 border-r border-gray-200 bg-white p-5 lg:w-[420px]">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
            <div className="hidden flex-1 animate-pulse bg-gray-100 lg:block" />
          </>
        )}

        {access === 'allowed' && draft && (
          <>
            {/* On desktop the panel slides shut for Preview rather than vanishing; its content
                keeps a fixed width while it does, so nothing inside reflows mid-animation. */}
            <aside
              className={`shrink-0 overflow-hidden border-gray-200 bg-white lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                view === 'edit' ? 'block w-full border-r lg:w-[420px]' : 'hidden lg:block lg:w-0'
              }`}
            >
              <div
                ref={panelRef}
                onScroll={(e) => {
                  if (!selected) listScroll.current = e.currentTarget.scrollTop;
                }}
                className={`h-full overflow-y-auto transition-opacity duration-200 lg:w-[420px] ${
                  view === 'edit' ? 'opacity-100' : 'lg:opacity-0'
                }`}
              >
                <div key={selectedSection || selected === 'theme' ? selected : 'list'} className={`p-4 sm:p-5 ${motion}`}>
                  {selected === 'theme' ? (
                    <ThemeEditor
                      theme={draft.theme}
                      onChange={(theme) => setDraft((d) => ({ ...d, theme }))}
                      onBack={() => select(null)}
                      onError={onFieldError}
                      confirm={ask}
                    />
                  ) : selectedSection ? (
                    <SectionEditor
                      section={selectedSection}
                      role={role}
                      onChange={updateSection}
                      onBack={() => select(null)}
                      onError={onFieldError}
                      onDelete={deleteSection}
                      confirm={ask}
                    />
                  ) : (
                    <>
                      <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Tip: click any section in the preview to edit it.
                      </p>
                      <SectionsPanel
                        sections={draft.sections}
                        onMove={moveSection}
                        onToggle={toggleSection}
                        onSelect={select}
                        onAdd={() => setPicking(true)}
                        onDelete={deleteSection}
                        canAdd={customCount < MAX_CUSTOM_SECTIONS}
                      />
                      <div className="mt-6">
                        <StateAdminAccessToggle feature="homepage" show={role === 'superadmin'} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>

            <main className={`${view === 'preview' ? 'block' : 'hidden lg:block'} min-w-0 flex-1`}>
              <PreviewFrame
                config={draft}
                focus={focus}
                deviceWidth={deviceWidth}
                fillWidth={device === 'desktop'}
                onSelect={selectFromPreview}
              />
            </main>
          </>
        )}
      </div>

      {message && (
        <div
          key={message.text}
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`hp-rise fixed bottom-4 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${
            message.type === 'error' ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-[#1F6B3A] text-white ring-green-700'
          }`}
        >
          <span className="min-w-0 flex-1">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss"
            className="-m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <AddSectionDialog open={picking} onPick={pickSection} onClose={() => setPicking(false)} />
      <PendingConfirmDialog request={request} onClose={() => setRequest(null)} />
    </div>
  );
};

export default HomepageCustomizer;
