import React, { useState } from 'react';
import { X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ponytail: static list — Kerala's 14 districts don't change; no external API call needed here
const KERALA_DISTRICTS = [
  'തിരുവനന്തപുരം', 'കൊല്ലം', 'പത്തനംതിട്ട', 'ആലപ്പുഴ', 'കോട്ടയം', 'ഇടുക്കി', 'എറണാകുളം',
  'തൃശ്ശൂർ', 'പാലക്കാട്', 'മലപ്പുറം', 'കോഴിക്കോട്', 'വയനാട്', 'കണ്ണൂർ', 'കാസർഗോഡ്'
];

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  masjidName: '',
  mahallu: '',
  area: '',
  district: '',
  khutbaRegular: '',
  movementRelation: '',
  attending: '',
  notAttendingReason: '',
  feePaid: ''
};

// Matches the other forms: Anek for headings, Noto Sans Malayalam for body/labels/inputs
const headingFont = { fontFamily: 'Anek Malayalam Variable' };
const bodyFont = { fontFamily: 'Noto Sans Malayalam, sans-serif' };

const KhateebRegistrationForm = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const showCustomAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const validateMobileNumber = (value) => /^[6-9]\d{9}$/.test(value);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateAllFields = () => {
    const errors = {};

    ['fullName', 'phone', 'masjidName', 'mahallu', 'district', 'khutbaRegular', 'movementRelation', 'attending', 'feePaid'].forEach((field) => {
      if (!formData[field] || !formData[field].trim()) errors[field] = true;
    });

    if (formData.phone && !validateMobileNumber(formData.phone)) errors.phone = true;
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = true;
    if (formData.attending === 'no' && !formData.notAttendingReason.trim()) errors.notAttendingReason = true;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showCustomAlert('ദയവായി എല്ലാ ആവശ്യമായ വിവരങ്ങളും ശരിയായി പൂരിപ്പിക്കുക', 'error');
      return false;
    }
    return true;
  };

  const handleSubmitClick = () => {
    if (validateAllFields()) setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/khateebRegistration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showCustomAlert('രജിസ്ട്രേഷൻ വിജയകരമായി സമർപ്പിച്ചു! (Registration submitted successfully!)', 'success');
        setTimeout(() => {
          setFormData(EMPTY_FORM);
          setShowForm(false);
        }, 2000);
      } else {
        showCustomAlert('രജിസ്ട്രേഷൻ സമർപ്പിക്കുന്നതിൽ പിശക്: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error submitting khateeb registration:', error);
      showCustomAlert('രജിസ്ട്രേഷൻ സമർപ്പിക്കുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full p-2.5 sm:p-3 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 ${
      validationErrors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  // ponytail: plain render fn, not a nested component — avoids remount-on-render
  const renderRadios = (name, options) =>
    options.map((option) => (
      <label
        key={option.value}
        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
          formData[name] === option.value ? 'border-green-500 bg-green-50' :
          validationErrors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={formData[name] === option.value}
          onChange={handleInputChange}
          className="w-5 h-5 accent-green-600"
        />
        <span className="text-sm sm:text-base text-gray-800">{option.label}</span>
      </label>
    ));

  const alertModal = showAlert && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="text-center mb-4">
          <img src={logo} alt="Masjid Council Kerala" className="h-12 w-auto mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900" style={headingFont}>
            {alertType === 'success' ? 'വിജയം' : alertType === 'error' ? 'പിശക്' : 'മുന്നറിയിപ്പ്'}
          </h3>
        </div>
        <p className="text-center text-gray-700 mb-6" style={bodyFont}>{alertMessage}</p>
        <div className="flex justify-center">
          <button
            onClick={() => setShowAlert(false)}
            className={`px-6 py-2 text-white rounded-lg ${
              alertType === 'success' ? 'bg-green-600 hover:bg-green-700' :
              alertType === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
            style={bodyFont}
          >
            ശരി
          </button>
        </div>
      </div>
    </div>
  );

  if (!showForm) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow mt-2" style={bodyFont}>
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          <img src={logo} alt="Masjid Council Kerala" className="h-10 sm:h-12 w-auto flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2" style={headingFont}>
              MIRQATH '26 — ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ
            </h1>
            <p className="text-sm sm:text-lg text-gray-700" style={headingFont}>മസ്ജിദ് കൗൺസിൽ കേരള</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-700" style={headingFont}>
            വിവരങ്ങൾ വായിക്കുക
          </h2>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm sm:text-base text-gray-800 leading-relaxed">
          മസ്ജിദ് കൗൺസിൽ കേരള സംസ്ഥാന കമ്മിറ്റി 2026 സെപ്റ്റംബർ 13 ഞായറാഴ്ച പാലക്കാട് മുണ്ടൂർ ഇബ്രാസൺ
          ഓഡിറ്റോറിയത്തിൽ വച്ച് സംഘടിപ്പിക്കുന്ന 'മിർഖാത്ത് '26' സംസ്ഥാന ഖത്തീബ് സംഗമത്തിന്റെ രജിസ്ട്രേഷൻ ഫോം.
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <ul className="list-disc space-y-2 text-gray-800 text-sm sm:text-base ml-6">
            <li>തീയതി: 2026 സെപ്റ്റംബർ 13, ഞായർ</li>
            <li>സമയം: രാവിലെ 10:00 - വൈകുന്നേരം 05:00</li>
            <li>സ്ഥലം: ഇബ്രാസൺ ഓഡിറ്റോറിയം, മുണ്ടൂർ, പാലക്കാട്</li>
            <li>രജിസ്ട്രേഷൻ ഫീസ്: ₹250 (അതാത് മസ്ജിദ് കമ്മിറ്റികൾ ഏരിയ കോഡിനേറ്റർമാർ മുഖേന അടക്കേണ്ടതാണ്)</li>
            <li>അവസാന തീയതി: 2026 ഓഗസ്റ്റ് 20</li>
          </ul>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 text-sm text-gray-900">
          <strong style={headingFont}>NB:</strong> രജിസ്ട്രേഷൻ ഫീസ് അതാത് മസ്ജിദ് കമ്മിറ്റികൾ ഏരിയ
          കോഡിനേറ്റർമാർ മുഖേന അടക്കേണ്ടതാണ്. അവസാന തീയതിക്ക് ശേഷമുള്ള രജിസ്ട്രേഷനുകൾ പരിഗണിക്കുകയില്ല.
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors"
          >
            ← ഹോമിലേക്ക് മടങ്ങുക
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors"
          >
            വിവരങ്ങൾ വായിച്ചു, രജിസ്ട്രേഷൻ പൂരിപ്പിക്കുക
          </button>
        </div>

        {/* keeps the success alert visible after the form resets back to this screen */}
        {alertModal}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white" style={bodyFont}>
      <div className="bg-white border-b pb-4 mb-6 relative">
        <button
          onClick={() => setShowCancelModal(true)}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="ഫോം ഉപേക്ഷിക്കുക"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 pr-12">
          <img src={logo} alt="Masjid Council Kerala" className="h-10 sm:h-12 w-auto flex-shrink-0" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900" style={headingFont}>
              MIRQATH '26 — ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ
            </h1>
            <p className="text-sm text-gray-600" style={headingFont}>മസ്ജിദ് കൗൺസിൽ കേരള</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Personal Details */}
        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4" style={headingFont}>
            1. വ്യക്തിഗത വിവരങ്ങൾ (Personal Details)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                ഖത്തീബിന്റെ പേര് (Full Name) <span className="text-red-500">*</span>
              </label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClass('fullName')} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                ഫോൺ / വാട്ട്സ്ആപ്പ് നമ്പർ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={inputClass('phone')}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                ഇമെയിൽ വിലാസം (Email Address)
              </label>
              <input type="email" inputMode="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass('email')} />
            </div>
          </div>
        </div>

        {/* 2. Masjid Details */}
        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4" style={headingFont}>
            2. മഹല്ല് / മസ്ജിദ് വിവരങ്ങൾ (Masjid Details)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                സേവനം അനുഷ്ഠിക്കുന്ന മസ്ജിദിന്റെ പേര് <span className="text-red-500">*</span>
              </label>
              <input type="text" name="masjidName" value={formData.masjidName} onChange={handleInputChange} className={inputClass('masjidName')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                മസ്ജിദ് സ്ഥിതി ചെയ്യുന്ന സ്ഥലം / മഹല്ല് <span className="text-red-500">*</span>
              </label>
              <input type="text" name="mahallu" value={formData.mahallu} onChange={handleInputChange} className={inputClass('mahallu')} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">ഏരിയ (Area)</label>
              <input type="text" name="area" value={formData.area} onChange={handleInputChange} className={inputClass('area')} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                ജില്ല (District) <span className="text-red-500">*</span>
              </label>
              <select name="district" value={formData.district} onChange={handleInputChange} className={inputClass('district')}>
                <option value="">ജില്ല തിരഞ്ഞെടുക്കുക</option>
                {KERALA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                ഖുത്ബ സ്ഥിരമായി നിർവഹിക്കുന്നുണ്ടോ? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {renderRadios('khutbaRegular', [
                  { value: 'regular', label: 'ഉണ്ട്' },
                  { value: 'occasional', label: 'ഇടക്കിടെ നിർവഹിക്കുന്നു' }
                ])}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                പ്രസ്ഥാന ബന്ധം <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {renderRadios('movementRelation', [
                  { value: 'rukn', label: 'റുക്ൻ' },
                  { value: 'karkun', label: 'കാർകുൻ' },
                  { value: 'active_associate', label: 'ആക്ടീവ് അസോസിയേറ്റ്' },
                  { value: 'none', label: 'ബന്ധമില്ല' }
                ])}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Participation */}
        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4" style={headingFont}>
            3. സംഗമത്തിലെ പങ്കാളിത്തം (Participation Confirmation) <span className="text-red-500">*</span>
          </h2>
          <div className="space-y-3">
            {renderRadios('attending', [
              { value: 'yes', label: 'അതെ, പങ്കെടുക്കും' },
              { value: 'no', label: 'ഇല്ല' }
            ])}
          </div>
          {formData.attending === 'no' && (
            <div className="mt-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                കാരണം <span className="text-red-500">*</span>
              </label>
              <textarea
                name="notAttendingReason"
                rows="3"
                value={formData.notAttendingReason}
                onChange={handleInputChange}
                className={inputClass('notAttendingReason')}
              />
            </div>
          )}
        </div>

        {/* 4. Payment */}
        <div className="border rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4" style={headingFont}>
            4. ഫീസ് അടച്ചതിന്റെ വിവരങ്ങൾ (Payment Details)
          </h2>
          <p className="text-sm text-gray-600 mb-3">രജിസ്ട്രേഷൻ ഫീസ് (₹250) <span className="text-red-500">*</span></p>
          <div className="space-y-3">
            {renderRadios('feePaid', [
              { value: 'yes', label: 'അടച്ചു' },
              { value: 'no', label: 'ഇല്ല' }
            ])}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            റദ്ദാക്കുക
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 text-white font-semibold rounded-lg transition-colors ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'സമർപ്പിക്കുന്നു...' : 'രജിസ്ട്രേഷൻ സമർപ്പിക്കുക'}
          </button>
        </div>
      </div>

      {alertModal}

      {/* Cancel Confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3">ഫോം ഉപേക്ഷിക്കുക</h3>
            <p className="text-gray-700 mb-6">
              നിങ്ങൾ ഉപേക്ഷിക്കുന്നത് ഉറപ്പാണോ? നിങ്ങൾ നൽകിയ എല്ലാ വിവരങ്ങളും നഷ്ടമാകും.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                റദ്ദാക്കുക
              </button>
              <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">
                ഉപേക്ഷിക്കുക
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-4">രജിസ്ട്രേഷൻ സമർപ്പിക്കുക</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <p><span className="font-semibold">പേര്:</span> {formData.fullName}</p>
              <p><span className="font-semibold">ഫോൺ:</span> {formData.phone}</p>
              <p><span className="font-semibold">മസ്ജിദ്:</span> {formData.masjidName}</p>
              <p><span className="font-semibold">ജില്ല:</span> {formData.district}</p>
              <p><span className="font-semibold">പങ്കെടുക്കുന്നു:</span> {formData.attending === 'yes' ? 'അതെ' : 'ഇല്ല'}</p>
              <p><span className="font-semibold">ഫീസ്:</span> {formData.feePaid === 'yes' ? 'അടച്ചു' : 'ഇല്ല'}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                തിരുത്തുക
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                സമർപ്പിക്കുക
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhateebRegistrationForm;
