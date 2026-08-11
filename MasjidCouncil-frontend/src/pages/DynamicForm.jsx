import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DynamicField, {
  STRUCTURAL_TYPES,
  evaluateConditional,
  isEmptyValue,
} from '../components/DynamicFieldRenderer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Public renderer for admin-configured forms. formType comes from the route
// param (/apply/:formType) or a fixed prop (legacy paths like /mosque-fund).
const DynamicForm = ({ formType: formTypeProp }) => {
  const params = useParams();
  const formType = formTypeProp || params.formType;

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [uploadingField, setUploadingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/form-config/${formType}`);
        if (!res.ok) {
          setUnavailable(true);
          return;
        }
        const data = await res.json();
        setConfig(data.data);
        setShowInstructions((data.data.instructions || []).length > 0);
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formType]);

  // Master-data districts for the roleMapping district field.
  // master-data responds { districts: [{id, title}] } / { areas: [{id, title}] }
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/master-data/districts`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts || []))
      .catch(() => {});
  }, []);

  const districtFieldId = config?.roleMapping?.districtFieldId;
  const areaFieldId = config?.roleMapping?.areaFieldId;
  const selectedDistrict = formData[`field_${districtFieldId}`];

  // Areas depend on the chosen district
  useEffect(() => {
    if (!selectedDistrict) {
      setAreas([]);
      return;
    }
    const district = districts.find((d) => d.title === selectedDistrict);
    if (!district) return;
    fetch(`${API_BASE_URL}/api/master-data/areas/${district.id}`)
      .then((r) => r.json())
      .then((d) => setAreas(d.areas || []))
      .catch(() => {});
  }, [selectedDistrict, districts]);

  const pages = useMemo(
    () => [...(config?.pages || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [config]
  );
  const page = pages[pageIndex];

  const withLocationOptions = (field) => {
    if (field.id === districtFieldId) {
      return { ...field, options: districts.map((d) => d.title) };
    }
    if (field.id === areaFieldId) {
      return { ...field, options: areas.map((a) => a.title) };
    }
    return field;
  };

  const setValue = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [`field_${field.id}`]: value };
      // Changing district resets the chosen area
      if (field.id === districtFieldId) delete next[`field_${areaFieldId}`];
      return next;
    });
  };

  const handleFile = async (field, file) => {
    if (!file) return;
    setUploadingField(field.id);
    try {
      const body = new FormData();
      body.append(`field_${field.id}`, file);
      const res = await fetch(`${API_BASE_URL}/api/submissions/upload-files`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (data.success) {
        const uploaded = data.data[`field_${field.id}`];
        setValue(field, uploaded.cdnUrl);
      } else {
        setErrors([data.message || 'File upload failed']);
      }
    } catch {
      setErrors(['File upload failed']);
    } finally {
      setUploadingField(null);
    }
  };

  const validatePage = (p) => {
    const pageErrors = [];
    for (const rawField of p.fields || []) {
      if (!rawField.enabled || STRUCTURAL_TYPES.includes(rawField.type)) continue;
      const { visible, required } = evaluateConditional(rawField, formData);
      if (!visible || !required) continue;
      if (isEmptyValue(formData[`field_${rawField.id}`])) {
        pageErrors.push(`${rawField.label} നിർബന്ധമാണ്`);
      }
    }
    return pageErrors;
  };

  const next = () => {
    const pageErrors = validatePage(page);
    setErrors(pageErrors);
    if (pageErrors.length === 0) {
      setPageIndex((i) => i + 1);
      window.scrollTo(0, 0);
    }
  };

  const submit = async () => {
    const pageErrors = validatePage(page);
    setErrors(pageErrors);
    if (pageErrors.length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${formType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        window.scrollTo(0, 0);
      } else {
        setErrors(data.errors || [data.message || 'Submission failed']);
      }
    } catch {
      setErrors(['Submission failed. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>;
  }

  if (unavailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ഫോം ലഭ്യമല്ല</h1>
        <p className="text-gray-600 mb-6">ഈ അപേക്ഷാ ഫോം ഇപ്പോൾ ലഭ്യമല്ല. പിന്നീട് ശ്രമിക്കുക.</p>
        <Link to="/" className="text-emerald-700 font-semibold underline">ഹോം പേജിലേക്ക്</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-emerald-800 mb-2">അപേക്ഷ സമർപ്പിച്ചു</h1>
          <p className="text-gray-600 mb-6">നിങ്ങളുടെ അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചിരിക്കുന്നു.</p>
          <Link to="/" className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
            ഹോം പേജിലേക്ക്
          </Link>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    const instructions = [...(config.instructions || [])].sort((a, b) => a.order - b.order);
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-emerald-800 mb-1">{config.title}</h1>
          <p className="text-gray-500 text-sm mb-6">{config.description}</p>
          <h2 className="font-bold text-gray-800 mb-3">ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm mb-8">
            {instructions.map((ins) => (
              <li key={ins.id}>{ins.text}</li>
            ))}
          </ol>
          <button
            onClick={() => setShowInstructions(false)}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
          >
            അപേക്ഷ ആരംഭിക്കുക
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-xl font-bold text-emerald-800 mb-1">{config.title}</h1>
        {pages.length > 1 && (
          <p className="text-sm text-gray-500 mb-4">
            ഘട്ടം {pageIndex + 1} / {pages.length} — {page.title}
          </p>
        )}
        {page.description && <p className="text-sm text-gray-600 mb-4">{page.description}</p>}

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {(page.fields || [])
            .filter((f) => f.enabled)
            .map((rawField) => {
              const { visible, required } = evaluateConditional(rawField, formData);
              if (!visible) return null;
              const field = withLocationOptions(rawField);
              const fullWidth = ['textarea', 'row', 'title', 'group', 'html'].includes(field.type);
              return (
                <div key={field.id} className={fullWidth ? 'sm:col-span-2' : ''}>
                  <DynamicField
                    field={field}
                    required={required}
                    value={formData[`field_${field.id}`]}
                    onChange={(v) => setValue(field, v)}
                    uploading={uploadingField === field.id}
                    onFileSelect={(file) => handleFile(field, file)}
                  />
                </div>
              );
            })}
        </div>

        {errors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {pageIndex > 0 ? (
            <button
              onClick={() => { setErrors([]); setPageIndex((i) => i - 1); window.scrollTo(0, 0); }}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              മുമ്പത്തേത്
            </button>
          ) : <span />}

          {pageIndex < pages.length - 1 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
            >
              അടുത്തത്
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || uploadingField !== null}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'സമർപ്പിക്കുന്നു…' : 'സമർപ്പിക്കുക'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicForm;
