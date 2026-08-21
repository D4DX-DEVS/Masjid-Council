import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicField, { evaluateConditional } from '../components/DynamicFieldRenderer';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import AdminSidebar from '../components/AdminSidebar';
import PageHeader from '../components/PageHeader';
import SelectField from '../components/SelectField';
import ConfirmDialog from '../components/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'phone', 'email', 'date',
  'select', 'radio', 'checkbox', 'multiselect', 'yesno',
  'file', 'row', 'title', 'group', 'html',
];
const OPTION_TYPES = ['select', 'radio', 'checkbox', 'multiselect'];
// types that take a full line by default; per-field `fullWidth` overrides
const FULL_WIDTH_TYPES = ['textarea', 'row', 'title', 'group', 'html'];
const OPERATORS = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
const ACTIONS = ['show', 'hide', 'require', 'optional'];

// Keys match the sidebar's English names so admins can connect the two.
const FORM_TYPE_LABELS = {
  welfarefund: 'Welfare Fund — ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി (IMF)',
  mosquefund: 'Masjid Fund — മസ്ജിദ് ഫണ്ട്',
  affiliation: 'Affiliation — അഫിലിയേഷൻ',
  khateeb: 'Khateeb — ഖത്തീബ് രജിസ്ട്രേഷൻ',
};

const emptyPage = (id) => ({ id, title: `Page ${id}`, description: '', order: id, fields: [] });

// Labels and instructions are long Malayalam sentences — a single-line input hides the
// tail. Textarea that grows with its content, so the whole label is always readable.
// ponytail: sizing in a ref callback, no effect/observer — it runs on every render anyway.
const GrowText = ({ className = '', ...rest }) => (
  <textarea
    rows={1}
    ref={(el) => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }}
    // Wrapping is the point; a newline inside a label is not. Enter stays a no-op.
    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
    className={`resize-none overflow-hidden ${className}`}
    {...rest}
  />
);

const editorInput =
  'mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#2E7D4F] focus:ring-[3px] focus:ring-[#2E7D4F]/15 transition-all';
// number inputs: hide spinners; scroll must never change the value
const numberInput = `${editorInput} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

// Visual builder for dynamic form configurations. Same builder for both consoles —
// state admins get it too, only the token/sidebar/login differ.
const FormBuilder = ({ role = 'superadmin' }) => {
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const token = localStorage.getItem(isAdmin ? 'adminToken' : 'superAdminToken');

  const [formType, setFormType] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [config, setConfig] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedField, setExpandedField] = useState(null);
  const [tab, setTab] = useState('builder'); // builder | preview | settings
  const [previewData, setPreviewData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  // Destructive builder actions route through one Radix confirm instead of firing on click.
  const [confirm, setConfirm] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) { navigate(isAdmin ? '/admin-login' : '/superadmin-login'); return; }
    fetch(`${API_BASE_URL}/api/form-config`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => setSummaries(d.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadForm = async (type) => {
    setFormType(type);
    setMessage('');
    setPageIndex(0);
    setTab('builder');
    const res = await fetch(`${API_BASE_URL}/api/form-config/${type}/admin`, { headers: authHeaders });
    const data = await res.json();
    if (data.hasConfiguration) {
      setConfig(data.data);
    } else {
      setConfig({
        formType: type,
        title: FORM_TYPE_LABELS[type] || type,
        description: '',
        enabled: true,
        isPublished: false,
        pages: [emptyPage(1)],
        instructions: [],
        roleMapping: { districtFieldId: null, areaFieldId: null, phoneFieldId: null, nameFieldId: null },
      });
    }
  };

  const allFields = useMemo(
    () => (config?.pages || []).flatMap((p) => p.fields || []),
    [config]
  );
  const nextFieldId = () => Math.max(0, ...allFields.map((f) => f.id)) + 1;
  const nextPageId = () => Math.max(0, ...(config.pages || []).map((p) => p.id)) + 1;

  const updateConfig = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const updatePage = (index, patch) =>
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  const updateField = (fieldId, patch) =>
    setConfig((c) => ({
      ...c,
      pages: c.pages.map((p) => ({
        ...p,
        fields: (p.fields || []).map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
      })),
    }));

  const addField = (type) => {
    const field = {
      id: nextFieldId(),
      label: `New ${type} field`,
      type,
      required: false,
      enabled: true,
      ...(OPTION_TYPES.includes(type) ? { options: ['Option 1', 'Option 2'] } : {}),
      ...(type === 'row'
        ? { columns: 3, columnTitles: ['Column 1', 'Column 2', 'Column 3'], rows: 3, firstColumnHeader: 'No.', allowAddRows: true }
        : {}),
    };
    updatePage(pageIndex, { fields: [...(config.pages[pageIndex].fields || []), field] });
    setExpandedField(field.id);
  };

  const removeField = (fieldId) =>
    updatePage(pageIndex, {
      fields: config.pages[pageIndex].fields.filter((f) => f.id !== fieldId),
    });

  const moveField = (index, dir) => {
    const fields = [...config.pages[pageIndex].fields];
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    [fields[index], fields[target]] = [fields[target], fields[index]];
    updatePage(pageIndex, { fields });
  };

  const addPage = () => {
    const page = emptyPage(nextPageId());
    updateConfig({ pages: [...config.pages, page] });
    setPageIndex(config.pages.length);
  };

  const removePage = (index) => {
    if (config.pages.length <= 1) return;
    updateConfig({ pages: config.pages.filter((_, i) => i !== index) });
    setPageIndex(0);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/form-config/${formType}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: config.title,
          description: config.description,
          areaVerificationHint: config.areaVerificationHint,
          areaVerificationFields: (config.areaVerificationFields || []).filter((o) => o.trim() !== ''),
          officeCommentHint: config.officeCommentHint,
          enabled: config.enabled,
          pages: config.pages.map((p, i) => ({ ...p, order: i + 1 })),
          instructions: config.instructions,
          roleMapping: config.roleMapping,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setMessage(`Saved (v${data.data.version})`);
      } else {
        setMessage(data.message || 'Save failed');
      }
    } catch {
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    const res = await fetch(`${API_BASE_URL}/api/form-config/${formType}/publish`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isPublished: !config.isPublished }),
    });
    const data = await res.json();
    if (data.success) {
      setConfig((c) => ({ ...c, isPublished: data.data.isPublished }));
      setMessage(data.message);
    } else {
      setMessage(data.message || 'Publish failed');
    }
  };

  const shell = (content) => (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      {isAdmin ? <AdminSidebar /> : <SuperAdminSidebar />}
      <div className="flex-1 min-w-0">
        <PageHeader role={role} title="Form Builder" shortTitle="Forms" subtitle="Configure the application forms" />
        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">{content}</div>
      </div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel="Delete"
        onConfirm={() => { confirm?.onConfirm?.(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );

  // ---------- form type picker ----------
  if (!config) {
    return shell(
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-[#111827] mb-4">ഏത് അപേക്ഷാ ഫോം എഡിറ്റ് ചെയ്യണം?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(FORM_TYPE_LABELS).map(([type, label]) => {
            const summary = summaries.find((s) => s.formType === type);
            return (
              <button
                key={type}
                onClick={() => loadForm(type)}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-left hover:ring-2 hover:ring-[#2E7D4F] transition"
              >
                <div className="font-bold text-[#111827]">{label}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {summary
                    ? `v${summary.version} — ${summary.isPublished ? 'Published' : 'Draft'}`
                    : 'Not configured yet'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const page = config.pages[pageIndex];

  // ---------- field editor panel ----------
  const renderFieldEditor = (field) => (
    <div className="mt-3 border-t pt-3 grid gap-3 text-sm">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-gray-600">Placeholder</span>
          <GrowText className={editorInput} value={field.placeholder || ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-gray-600">Help text</span>
          <GrowText className={editorInput} value={field.helpText || ''}
            onChange={(e) => updateField(field.id, { helpText: e.target.value })} />
        </label>
      </div>

      {OPTION_TYPES.includes(field.type) && (
        <label className="block">
          <span className="text-gray-600">Options (one per line)</span>
          <textarea
            className={editorInput}
            rows={3}
            value={(field.options || []).join('\n')}
            onChange={(e) => updateField(field.id, { options: e.target.value.split('\n') })}
            onBlur={(e) => updateField(field.id, { options: e.target.value.split('\n').filter((o) => o.trim() !== '') })}
          />
        </label>
      )}

      {field.type === 'row' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-gray-600">Column titles (one per line)</span>
            <textarea className={editorInput} rows={3}
              value={(field.columnTitles || []).join('\n')}
              onChange={(e) => {
                const columnTitles = e.target.value.split('\n');
                updateField(field.id, { columnTitles, columns: columnTitles.length });
              }} />
          </label>
          <div className="grid gap-2">
            <label className="block">
              <span className="text-gray-600">Rows</span>
              <input
                type="number"
                min="1"
                className={numberInput}
                value={field.rows ?? ''}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) =>
                  updateField(field.id, { rows: e.target.value === '' ? '' : Number(e.target.value) })
                }
                onBlur={(e) => updateField(field.id, { rows: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>
            <label className="block">
              <span className="text-gray-600">First column header</span>
              <input className={editorInput} value={field.firstColumnHeader || ''}
                onChange={(e) => updateField(field.id, { firstColumnHeader: e.target.value })} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={field.allowAddRows !== false}
                onChange={(e) => updateField(field.id, { allowAddRows: e.target.checked })} />
              <span className="text-gray-600">Allow adding rows</span>
            </label>
          </div>
        </div>
      )}

      {['text', 'textarea', 'number', 'phone', 'email'].includes(field.type) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {field.type === 'number' ? (
            <>
              <label className="block"><span className="text-gray-600">Min</span>
                <input type="number" onWheel={(e) => e.currentTarget.blur()} className={numberInput} value={field.validation?.min ?? ''}
                  onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
              <label className="block"><span className="text-gray-600">Max</span>
                <input type="number" onWheel={(e) => e.currentTarget.blur()} className={numberInput} value={field.validation?.max ?? ''}
                  onChange={(e) => updateField(field.id, { validation: { ...field.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
            </>
          ) : (
            <>
              <label className="block"><span className="text-gray-600">Min length</span>
                <input type="number" onWheel={(e) => e.currentTarget.blur()} className={numberInput} value={field.validation?.minLength ?? ''}
                  onChange={(e) => updateField(field.id, { validation: { ...field.validation, minLength: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
              <label className="block"><span className="text-gray-600">Max length</span>
                <input type="number" onWheel={(e) => e.currentTarget.blur()} className={numberInput} value={field.validation?.maxLength ?? ''}
                  onChange={(e) => updateField(field.id, { validation: { ...field.validation, maxLength: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
            </>
          )}
        </div>
      )}

      <div className="border border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Conditional logic</span>
          {field.conditionalLogic ? (
            <button className="text-xs text-red-600" onClick={() => updateField(field.id, { conditionalLogic: undefined })}>Remove</button>
          ) : (
            <button
              className="text-xs text-emerald-700"
              onClick={() => updateField(field.id, { conditionalLogic: { field: allFields.find((f) => f.id !== field.id)?.id, operator: 'equals', value: '', action: 'show' } })}
            >
              + Add
            </button>
          )}
        </div>
        {field.conditionalLogic && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <SelectField name="cl-field" value={String(field.conditionalLogic.field ?? '')}
              onChange={(e) => updateField(field.id, { conditionalLogic: { ...field.conditionalLogic, field: Number(e.target.value) } })}>
              {allFields.filter((f) => f.id !== field.id).map((f) => (
                <option key={f.id} value={f.id}>#{f.id} {f.label.slice(0, 25)}</option>
              ))}
            </SelectField>
            <SelectField name="cl-operator" value={field.conditionalLogic.operator}
              onChange={(e) => updateField(field.id, { conditionalLogic: { ...field.conditionalLogic, operator: e.target.value } })}>
              {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
            </SelectField>
            <input className={editorInput.replace('mt-1 w-full ', '')} placeholder="value" value={field.conditionalLogic.value || ''}
              onChange={(e) => updateField(field.id, { conditionalLogic: { ...field.conditionalLogic, value: e.target.value } })} />
            <SelectField name="cl-action" value={field.conditionalLogic.action || 'show'}
              onChange={(e) => updateField(field.id, { conditionalLogic: { ...field.conditionalLogic, action: e.target.value } })}>
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </SelectField>
          </div>
        )}
      </div>
    </div>
  );

  // ---------- settings tab ----------
  const roleMappingSelect = (key, label) => (
    <label className="block">
      <span className="text-gray-600">{label}</span>
      <div className="mt-1">
        <SelectField
          name={key}
          value={config.roleMapping?.[key] === null || config.roleMapping?.[key] === undefined ? 'none' : String(config.roleMapping[key])}
          onChange={(e) =>
            updateConfig({
              roleMapping: { ...config.roleMapping, [key]: e.target.value === 'none' ? null : Number(e.target.value) },
            })
          }
        >
          <option value="none">— none —</option>
          {allFields.map((f) => (
            <option key={f.id} value={f.id}>#{f.id} {f.label.slice(0, 40)}</option>
          ))}
        </SelectField>
      </div>
    </label>
  );

  return shell(
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setConfig(null); setFormType(''); }} className="text-sm text-gray-500 hover:text-gray-800">← All forms</button>
          {/* Switch which apeksha is being edited */}
          <div className="w-full sm:w-96">
            <SelectField name="formType" value={formType} onChange={(e) => loadForm(e.target.value)}>
              {Object.entries(FORM_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </SelectField>
          </div>
          <span className="text-xs text-gray-500">
            v{config.version || 0} — {config.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-sm text-emerald-700">{message}</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-[#1F6B3A] text-white rounded-xl text-sm font-semibold hover:bg-[#2E7D4F] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={togglePublish}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${config.isPublished ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {config.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['builder', 'preview', 'settings'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${tab === t ? 'bg-[#1F6B3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'builder' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          {/* page tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {config.pages.map((p, i) => (
              <button key={p.id} onClick={() => setPageIndex(i)}
                className={`px-3 py-1.5 rounded-xl text-sm ${i === pageIndex ? 'bg-[#1F6B3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.title || `Page ${i + 1}`}
              </button>
            ))}
            <button onClick={addPage} className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 text-emerald-700 hover:bg-gray-200">+ Page</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <GrowText className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E7D4F] focus:ring-[3px] focus:ring-[#2E7D4F]/15 transition-all" placeholder="Page title" value={page.title}
              onChange={(e) => updatePage(pageIndex, { title: e.target.value })} />
            <div className="flex gap-2">
              <GrowText className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E7D4F] focus:ring-[3px] focus:ring-[#2E7D4F]/15 transition-all" placeholder="Page description" value={page.description || ''}
                onChange={(e) => updatePage(pageIndex, { description: e.target.value })} />
              {config.pages.length > 1 && (
                <button
                  onClick={() =>
                    setConfirm({
                      title: `Delete page "${page.title || `Page ${pageIndex + 1}`}"?`,
                      description: `All ${(page.fields || []).length} field(s) on this page will be removed.`,
                      onConfirm: () => removePage(pageIndex),
                    })
                  }
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                >Delete page</button>
              )}
            </div>
          </div>

          {/* fields */}
          <div className="space-y-3">
            {(page.fields || []).map((field, i) => (
              <div key={field.id} className={`border border-gray-200 rounded-xl p-3 ${field.enabled ? '' : 'opacity-50 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400 w-8">#{field.id}</span>
                  <GrowText className="flex-1 min-w-[10rem] border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E7D4F] focus:ring-[3px] focus:ring-[#2E7D4F]/15 transition-all font-medium" value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })} />
                  <div className="w-36">
                    <SelectField name={`type-${field.id}`} value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value })}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </SelectField>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} />
                    required
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input type="checkbox" checked={field.enabled} onChange={(e) => updateField(field.id, { enabled: e.target.checked })} />
                    enabled
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-600" title="Checked: field takes its own line. Unchecked: sits inline beside the next field.">
                    <input type="checkbox"
                      checked={field.fullWidth ?? FULL_WIDTH_TYPES.includes(field.type)}
                      onChange={(e) => updateField(field.id, { fullWidth: e.target.checked })} />
                    full width
                  </label>
                  <div className="flex gap-1 text-gray-400">
                    <button onClick={() => moveField(i, -1)} className="hover:text-gray-700 px-1">↑</button>
                    <button onClick={() => moveField(i, 1)} className="hover:text-gray-700 px-1">↓</button>
                    <button onClick={() => setExpandedField(expandedField === field.id ? null : field.id)} className="hover:text-gray-700 px-1">⚙</button>
                    <button
                      onClick={() =>
                        setConfirm({
                          title: `Delete field #${field.id}?`,
                          description: `"${field.label || 'Untitled'}" and its settings will be removed from this page. Save the form to make it permanent.`,
                          onConfirm: () => removeField(field.id),
                        })
                      }
                      className="hover:text-red-600 px-1"
                      aria-label="Delete field"
                    >✕</button>
                  </div>
                </div>
                {expandedField === field.id && renderFieldEditor(field)}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FIELD_TYPES.map((t) => (
              <button key={t} onClick={() => addField(t)}
                className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700">
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-emerald-800 mb-6">{config.title}</h2>
          {config.pages.map((p, pi) => (
            <div key={p.id} className="mb-8">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 mb-5">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                  ഘട്ടം {pi + 1}
                </span>
                <h3 className="font-semibold text-gray-700">{p.title}</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                {(p.fields || []).filter((f) => f.enabled).map((field) => {
                  const { visible, required } = evaluateConditional(field, previewData);
                  if (!visible) return null;
                  const fullWidth = field.fullWidth ?? FULL_WIDTH_TYPES.includes(field.type);
                  return (
                    <div key={field.id} className={fullWidth ? 'sm:col-span-2' : ''}>
                      <DynamicField
                        field={field}
                        required={required}
                        value={previewData[`field_${field.id}`]}
                        onChange={(v) => setPreviewData((d) => ({ ...d, [`field_${field.id}`]: v }))}
                        onFileSelect={() => {}}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 grid gap-4 max-w-2xl mx-auto">
          <label className="block">
            <span className="text-gray-600 text-sm">Form title</span>
            <GrowText className={editorInput} value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Description</span>
            <textarea className={editorInput} rows={2} value={config.description || ''}
              onChange={(e) => updateConfig({ description: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Area admin note — shown above the area admin's ശുപാർശ box (admins & super admin see the saved ശുപാർശ, not this note)</span>
            <textarea className={editorInput} rows={2} value={config.areaVerificationHint || ''}
              placeholder="അപേക്ഷ നേരിട്ട് പരിശോധിച്ചതിന് ശേഷം നിങ്ങളുടെ ശുപാർശ ഇവിടെ രേഖപ്പെടുത്തുക. ഇത് അഡ്മിൻ / സൂപ്പർ അഡ്മിൻ കാണും."
              onChange={(e) => updateConfig({ areaVerificationHint: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Area admin extra fields — one label per line (e.g. പേര്:). Area admin fills these next to the ശുപാർശ.</span>
            <textarea className={editorInput} rows={2}
              value={(config.areaVerificationFields || []).join('\n')}
              onChange={(e) => updateConfig({ areaVerificationFields: e.target.value.split('\n') })}
              onBlur={(e) => updateConfig({ areaVerificationFields: e.target.value.split('\n').filter((o) => o.trim() !== '') })} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Office-use note — shown above the ഓഫീസ് ഉപയോഗത്തിന് box (admins & super admin only)</span>
            <textarea className={editorInput} rows={2} value={config.officeCommentHint || ''}
              onChange={(e) => updateConfig({ officeCommentHint: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={config.enabled} onChange={(e) => updateConfig({ enabled: e.target.checked })} />
            Form enabled (accepting submissions when published)
          </label>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Role mapping (used for area-admin scoping & lists)</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {roleMappingSelect('districtFieldId', 'District field')}
              {roleMappingSelect('areaFieldId', 'Area field')}
              {roleMappingSelect('phoneFieldId', 'Phone field')}
              {roleMappingSelect('nameFieldId', 'Applicant name field')}
              {roleMappingSelect('amountFieldId', 'Requested amount field (for spending report)')}
              {roleMappingSelect('ownAmountFieldId', 'Own contribution field (സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക)')}
              {roleMappingSelect('aadhaarFieldId', 'Aadhaar field (blocks duplicate applications)')}
              <label className="block">
                <span className="text-gray-600">Aadhaar lock period after approval (years, 0 = no lock)</span>
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={config.roleMapping?.aadhaarLockYears ?? 4}
                  onChange={(e) =>
                    updateConfig({
                      roleMapping: {
                        ...config.roleMapping,
                        aadhaarLockYears: e.target.value === '' ? 4 : Math.max(0, Number(e.target.value)),
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Pre-form instructions</h3>
            <div className="space-y-2">
              {(config.instructions || []).map((ins, i) => (
                <div key={ins.id} className="flex gap-2">
                  <GrowText className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E7D4F] focus:ring-[3px] focus:ring-[#2E7D4F]/15 transition-all" value={ins.text}
                    onChange={(e) =>
                      updateConfig({
                        instructions: config.instructions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)),
                      })
                    } />
                  <button
                    className="text-red-500 text-sm"
                    aria-label="Delete instruction"
                    onClick={() =>
                      setConfirm({
                        title: 'Delete this instruction?',
                        description: ins.text || undefined,
                        onConfirm: () =>
                          updateConfig({ instructions: config.instructions.filter((_, j) => j !== i) }),
                      })
                    }
                  >✕</button>
                </div>
              ))}
              <button
                className="text-sm text-emerald-700"
                onClick={() =>
                  updateConfig({
                    instructions: [
                      ...(config.instructions || []),
                      { id: Math.max(0, ...(config.instructions || []).map((x) => x.id)) + 1, text: '', order: (config.instructions || []).length + 1 },
                    ],
                  })
                }
              >
                + Add instruction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormBuilder;
