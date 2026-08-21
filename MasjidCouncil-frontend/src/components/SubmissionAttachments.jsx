import { useMemo, useState } from 'react';

// Uploaded files are stored in formData as the plain CDN url of the upload, keyed by
// `field_<id>` like every other answer. Nothing else in the submission records them, so
// the config's `file` fields are the only way to find what the applicant attached.
const collectAttachments = (config, submission) =>
  (config?.pages || [])
    .flatMap((page) => page.fields || [])
    .filter((field) => field.type === 'file')
    .map((field) => ({ field, url: submission?.formData?.[`field_${field.id}`] }))
    .filter((a) => typeof a.url === 'string' && a.url.trim() !== '')
    .map((a) => ({ ...a, url: a.url.trim() }));

const fileName = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || url);
  } catch {
    return url;
  }
};

const isImage = (url) => /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(url);

/**
 * Attachments panel for a submission.
 *
 * On screen it always lists what the applicant uploaded. With `selectable`, each file
 * also gets a print checkbox and the ticked ones are rendered into a print-only block,
 * so an admin can print the application with, without, or with only some of the files.
 *
 * @param {{ config: object, submission: object, selectable?: boolean }} props
 */
const SubmissionAttachments = ({ config, submission, selectable = false }) => {
  const attachments = useMemo(() => collectAttachments(config, submission), [config, submission]);
  // Default: every file prints. Unticking is the deliberate act, not ticking.
  const [selectedIds, setSelectedIds] = useState(null);
  const isSelected = (id) => (selectedIds === null ? true : selectedIds.includes(id));
  const toggle = (id) =>
    setSelectedIds((current) => {
      const base = current === null ? attachments.map((a) => a.field.id) : current;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });

  if (attachments.length === 0) return null;

  const selected = attachments.filter((a) => isSelected(a.field.id));
  const allOn = selected.length === attachments.length;

  return (
    // Renders inside the existing submission card on every console, so no card chrome here.
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-1 mb-3">
        <h3 className="font-bold text-emerald-800">
          അപ്‌ലോഡ് ചെയ്ത ഫയലുകൾ ({attachments.length})
        </h3>
        {selectable && attachments.length > 1 && (
          <button
            type="button"
            onClick={() => setSelectedIds(allOn ? [] : attachments.map((a) => a.field.id))}
            className="print-hide pdf-hide text-xs font-medium text-emerald-700 hover:underline"
          >
            {allOn ? 'പ്രിന്റിൽ ഒന്നും വേണ്ട' : 'എല്ലാം പ്രിന്റ് ചെയ്യുക'}
          </button>
        )}
      </div>

      {selectable && (
        <p className="print-hide pdf-hide text-xs text-gray-500 mb-3">
          ടിക്ക് ചെയ്ത ഫയലുകൾ മാത്രമേ പ്രിന്റിലും PDF-ലും വരൂ.
        </p>
      )}

      {/* On-screen list — every viewer sees this, print/PDF use the block below. */}
      <div className="print-hide pdf-hide grid sm:grid-cols-2 gap-3">
        {attachments.map(({ field, url }) => (
          <div key={field.id} className="flex items-start gap-3 border border-gray-200 rounded-xl p-3">
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected(field.id)}
                onChange={() => toggle(field.id)}
                className="mt-1 h-4 w-4 accent-emerald-700 shrink-0"
                aria-label={`Print ${field.label}`}
              />
            )}
            {isImage(url) ? (
              <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                <img
                  src={url}
                  alt={field.label}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
              </a>
            ) : (
              <span className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-500">
                PDF
              </span>
            )}
            <div className="min-w-0">
              <div className="text-xs text-gray-500">{field.label}</div>
              <div className="text-sm text-gray-800 font-medium truncate">{fileName(url)}</div>
              <a href={url} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">
                തുറക്കുക
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Print / PDF copy of the ticked files. `print-only` is hidden on screen and
          revealed by the print stylesheet and by the PDF hook's onclone. */}
      {selected.length > 0 && (
        <div className="print-only">
          {selected.map(({ field, url }) => (
            <div key={field.id} className="mb-4 break-inside-avoid">
              <div className="text-xs text-gray-500">{field.label}</div>
              {isImage(url) ? (
                <img src={url} alt={field.label} className="mt-1 max-h-[220mm] w-auto max-w-full" />
              ) : (
                <div className="text-sm text-gray-800 break-all">{fileName(url)} — {url}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionAttachments;
