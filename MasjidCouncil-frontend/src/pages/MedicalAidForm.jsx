import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import logo from '../assets/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MedicalAidForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    // Mosque Details
    mosqueName: '',
    mckAffiliation: '',
    address: '',
    
    // Management Details
    committeePerson: '',
    managementType: '',
    phone: '',
    whatsapp: '',
    presidentPhone: '',
    presidentChairman: '',
    
    // Jamaat Details
    district: '',
    area: '',
    jammatDetails: '',
    
    // Application Details
    applicantDetails: '',
    chairmanDesignation: '',
    salary: '',
    
    // Help Details
    helpPurpose: '',
    needDescription: '',
    expectedExpense: '',
    ownContribution: '',
    previousHelp: '',
    mosquePresident: '',
    mosquePhone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // State for dropdown data
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // State for auto-fill functionality
  const [loadingAffiliation, setLoadingAffiliation] = useState(false);
  const [affiliationTimeout, setAffiliationTimeout] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState({
    mosqueName: false,
    address: false,
    district: false,
    area: false
    // Note: jammatDetails is NOT auto-filled - user must select manually
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('');
  const [trackingId, setTrackingId] = useState('');
  
  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Submit confirmation modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const validateField = (fieldName, value) => {
    let isValid = true;
    
    if (['phone', 'whatsapp', 'presidentPhone', 'mosquePhone'].includes(fieldName)) {
      if (value && !validateMobileNumber(value)) {
        isValid = false;
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: !isValid
    }));
    
    return isValid;
  };

  // Fetch districts from external API
  const fetchDistricts = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/districts`);
      const result = await response.json();
      
      if (result.success && result.districts && Array.isArray(result.districts)) {
        setDistricts(result.districts);
      } else {
        setDistricts(getFallbackDistricts());
      }
    } catch (error) {
      setDistricts(getFallbackDistricts());
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Fetch areas for a specific district
  const fetchAreasForDistrict = async (districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/areas/${districtId}`);
      const result = await response.json();
      
      if (result.success && result.areas && Array.isArray(result.areas)) {
        setAreas(result.areas);
        return result.areas;
      } else {
        const fallbackAreas = getFallbackAreas();
        setAreas(fallbackAreas);
        return fallbackAreas;
      }
    } catch (error) {
      const fallbackAreas = getFallbackAreas();
      setAreas(fallbackAreas);
      return fallbackAreas;
    }
  };

  // Fetch units for a specific area
  const fetchUnitsForArea = async (areaId) => {
    try {
      console.log('Fetching units for area ID:', areaId);
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/units/${areaId}`);
      const result = await response.json();
      
      console.log('Units API response:', result);
      
      if (result.success && result.units && Array.isArray(result.units)) {
        console.log('Successfully fetched units:', result.units);
        setUnits(result.units);
        return result.units;
      } else {
        console.log('Units API failed or returned no units, using fallback');
        console.log('API Error:', result.message || 'Unknown error');
        const fallbackUnits = getFallbackUnits();
        setUnits(fallbackUnits);
        return fallbackUnits;
      }
    } catch (error) {
      console.error('Error fetching units from API:', error);
      const fallbackUnits = getFallbackUnits();
      setUnits(fallbackUnits);
      return fallbackUnits;
    }
  };

  // Fallback data for districts
  const getFallbackDistricts = () => [
    { id: 1, title: 'Kozhikode', name: 'Kozhikode' },
    { id: 2, title: 'Malappuram', name: 'Malappuram' },
    { id: 3, title: 'Kannur', name: 'Kannur' },
    { id: 4, title: 'Kasaragod', name: 'Kasaragod' },
    { id: 5, title: 'Wayanad', name: 'Wayanad' },
    { id: 6, title: 'Thrissur', name: 'Thrissur' },
    { id: 7, title: 'Ernakulam', name: 'Ernakulam' },
    { id: 8, title: 'Kottayam', name: 'Kottayam' },
    { id: 9, title: 'Alappuzha', name: 'Alappuzha' },
    { id: 10, title: 'Pathanamthitta', name: 'Pathanamthitta' },
    { id: 11, title: 'Kollam', name: 'Kollam' },
    { id: 12, title: 'Thiruvananthapuram', name: 'Thiruvananthapuram' },
    { id: 13, title: 'Palakkad', name: 'Palakkad' },
    { id: 14, title: 'Idukki', name: 'Idukki' }
  ];

  // Fallback data for areas
  const getFallbackAreas = () => [
    { id: 1, title: 'Kozhikode City', name: 'Kozhikode City' },
    { id: 2, title: 'Feroke', name: 'Feroke' },
    { id: 3, title: 'Koyilandy', name: 'Koyilandy' },
    { id: 4, title: 'Vadakara', name: 'Vadakara' },
    { id: 5, title: 'Thiruvambady', name: 'Thiruvambady' },
    { id: 6, title: 'Koduvally', name: 'Koduvally' },
    { id: 7, title: 'Balussery', name: 'Balussery' },
    { id: 8, title: 'Perambra', name: 'Perambra' },
    { id: 9, title: 'Thiruvallur', name: 'Thiruvallur' },
    { id: 10, title: 'Elathur', name: 'Elathur' }
  ];

  // Fallback data for units
  const getFallbackUnits = () => [
    { id: 1, title: 'Unit 1', name: 'Unit 1' },
    { id: 2, title: 'Unit 2', name: 'Unit 2' },
    { id: 3, title: 'Unit 3', name: 'Unit 3' },
    { id: 4, title: 'Unit 4', name: 'Unit 4' },
    { id: 5, title: 'Unit 5', name: 'Unit 5' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle affiliation number with auto-fill
    if (name === 'mckAffiliation') {
      // Clear existing timeout
      if (affiliationTimeout) {
        clearTimeout(affiliationTimeout);
      }
      
      // Set new timeout for auto-fill
      const newTimeout = setTimeout(() => {
        if (value && value.length >= 7) {
          fetchMosqueByAffiliation(value);
        }
      }, 500); // 500ms delay after user stops typing
      
      setAffiliationTimeout(newTimeout);
    }
    
    if (name === 'district') {
      // When district changes, fetch areas for that district
      setFormData(prev => ({
        ...prev,
        district: value,
        area: '', // Reset area when district changes
        jammatDetails: '' // Reset unit when district changes
      }));
      
      // Find the district ID to fetch areas
      const selectedDistrict = districts.find(d => 
        (d.title || d.name) === value
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        // If no district ID found, use fallback areas
        const fallbackAreas = getFallbackAreas();
        setAreas(fallbackAreas);
      }
    } else if (name === 'area') {
      // When area changes, fetch units for that area
      setFormData(prev => ({
        ...prev,
        area: value,
        jammatDetails: '' // Reset unit when area changes
      }));
      
      // Find the area ID to fetch units
      const selectedArea = areas.find(a => 
        (a.title || a.name) === value
      );
      
      if (selectedArea && selectedArea.id) {
        fetchUnitsForArea(selectedArea.id);
      } else {
        // If no area ID found, use fallback units
        const fallbackUnits = getFallbackUnits();
        setUnits(fallbackUnits);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    validateField(name, value);
  };
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Scroll to top when form is shown
  useEffect(() => {
    if (showForm) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      fetchDistricts();
    }
  }, [showForm]);


  const validateMobileNumber = (number) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Modal functions
  const showSuccessModal = (message, id) => {
    setModalType('success');
    setModalMessage(message);
    setTrackingId(id);
    setShowModal(true);
    // Scroll to top when showing success modal
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const showErrorModal = (message) => {
    setModalType('error');
    setModalMessage(message);
    setTrackingId('');
    setShowModal(true);
    // Scroll to top when showing error modal
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setTrackingId('');
    setModalType('');
  };

  // Cancel modal functions
  const showCancelConfirmation = () => {
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  const handleCancelForm = () => {
    setShowCancelModal(false);
    navigate('/');
  };

  // Auto-fill function for mosque data by affiliation number
  const fetchMosqueByAffiliation = async (affiliationNumber) => {
    if (!affiliationNumber || affiliationNumber.length < 7) return;
    
    try {
      setLoadingAffiliation(true);
      
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${affiliationNumber}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const mosqueData = result.data;
        const districtName = mosqueData.address?.[0]?.district || '';
        const areaName = mosqueData.jamathArea?.[0]?.area || '';
        
        console.log('Auto-fill data:', {
          mosqueName: mosqueData.name,
          district: districtName,
          area: areaName,
          jammatDetails: mosqueData.jamathArea?.[0]?.district
        });
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          mosqueName: mosqueData.name || '',
          address: mosqueData.address?.[0]?.address || '',
          district: districtName,
          area: areaName
          // Note: jammatDetails is NOT auto-filled - user must select manually
        }));
        
        // Mark fields as auto-filled (read-only) - EXCLUDING jammatDetails
        setAutoFilledFields({
          mosqueName: !!mosqueData.name,
          address: !!mosqueData.address?.[0]?.address,
          district: !!districtName,
          area: !!areaName
          // jammatDetails is NOT auto-filled - user must select manually
        });
        
        // If district is found, fetch areas for that district to populate dropdown
        if (districtName) {
          console.log('Processing district:', districtName);
          const selectedDistrict = districts.find(d => 
            (d.title || d.name) === districtName
          );
          
          console.log('Selected district:', selectedDistrict);
          
          if (selectedDistrict && selectedDistrict.id) {
            // Fetch areas for the district
            try {
              console.log('Fetching areas for district ID:', selectedDistrict.id);
              const fetchedAreas = await fetchAreasForDistrict(selectedDistrict.id);
              
              // Wait for areas to be loaded, then set the area
              setTimeout(async () => {
                console.log('Setting area after areas loaded:', areaName);
                setFormData(prev => ({
                  ...prev,
                  area: areaName
                }));
                
                // After area is set, fetch units for that area
                if (areaName) {
                  console.log('Fetching units for area:', areaName);
                  try {
                    // Find the area ID to fetch units from the fetched areas
                    const selectedArea = fetchedAreas.find(a => 
                      (a.title || a.name) === areaName
                    );
                    
                    if (selectedArea && selectedArea.id) {
                      console.log('Fetching units for area ID:', selectedArea.id);
                      await fetchUnitsForArea(selectedArea.id);
                    } else {
                      console.log('Area not found in fetched areas, using fallback units');
                      const fallbackUnits = getFallbackUnits();
                      setUnits(fallbackUnits);
                    }
                  } catch (error) {
                    console.error('Error fetching units:', error);
                    const fallbackUnits = getFallbackUnits();
                    setUnits(fallbackUnits);
                  }
                }
              }, 200);
            } catch (error) {
              console.error('Error fetching areas:', error);
              // Use fallback areas if API fails
              const fallbackAreas = getFallbackAreas();
              setAreas(fallbackAreas);
            }
          } else {
            // If district not found in dropdown, use fallback areas
            console.log('District not found in dropdown, using fallback areas');
            const fallbackAreas = getFallbackAreas();
            setAreas(fallbackAreas);
            
            // Set area after fallback areas are set
            setTimeout(async () => {
              console.log('Setting area with fallback areas:', areaName);
              setFormData(prev => ({
                ...prev,
                area: areaName
              }));
              
              // After area is set, fetch units for that area
              if (areaName) {
                console.log('Fetching units for area with fallback areas:', areaName);
                try {
                  // Find the area ID to fetch units from fallback areas
                  const selectedArea = fallbackAreas.find(a => 
                    (a.title || a.name) === areaName
                  );
                  
                  if (selectedArea && selectedArea.id) {
                    console.log('Fetching units for area ID:', selectedArea.id);
                    await fetchUnitsForArea(selectedArea.id);
                  } else {
                    console.log('Area not found in fallback areas, using fallback units');
                    const fallbackUnits = getFallbackUnits();
                    setUnits(fallbackUnits);
                  }
                } catch (error) {
                  console.error('Error fetching units:', error);
                  const fallbackUnits = getFallbackUnits();
                  setUnits(fallbackUnits);
                }
              }
            }, 100);
          }
        }
        
        // Show success message
        showSuccessModal('മസ്ജിദ് വിവരങ്ങൾ ഓട്ടോ ഫിൽ ചെയ്തു!');
      } else {
        showErrorModal('അഫിലിയേഷൻ നമ്പർ കണ്ടെത്താൻ കഴിഞ്ഞില്ല');
      }
    } catch (error) {
      console.error('Error fetching mosque data:', error);
      showErrorModal('വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു');
    } finally {
      setLoadingAffiliation(false);
    }
  };

  // Submit confirmation modal functions
  const showSubmitConfirmation = () => {
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    handleSubmit();
  };

  // New function to validate all fields before showing confirmation
  const validateAllFields = () => {
    const errors = {};
    let hasErrors = false;

    // Validate all required fields
    if (!formData.mosqueName || formData.mosqueName.trim() === "") {
      errors.mosqueName = true;
      hasErrors = true;
    }

    if (!formData.mckAffiliation || formData.mckAffiliation.trim() === "") {
      errors.mckAffiliation = true;
      hasErrors = true;
    }

    if (!formData.address || formData.address.trim() === "") {
      errors.address = true;
      hasErrors = true;
    }

    if (!formData.committeePerson || formData.committeePerson.trim() === "") {
      errors.committeePerson = true;
      hasErrors = true;
    }

    if (!formData.managementType || formData.managementType.trim() === "") {
      errors.managementType = true;
      hasErrors = true;
    }

    if (!formData.whatsapp || formData.whatsapp.trim() === "") {
      errors.whatsapp = true;
      hasErrors = true;
    }

    if (!formData.district || formData.district.trim() === "") {
      errors.district = true;
      hasErrors = true;
    }

    if (!formData.area || formData.area.trim() === "") {
      errors.area = true;
      hasErrors = true;
    }

    if (!formData.applicantDetails || formData.applicantDetails.trim() === "") {
      errors.applicantDetails = true;
      hasErrors = true;
    }

    if (!formData.chairmanDesignation || formData.chairmanDesignation.trim() === "") {
      errors.chairmanDesignation = true;
      hasErrors = true;
    }

    if (!formData.salary || formData.salary === "") {
      errors.salary = true;
      hasErrors = true;
    }

    if (!formData.helpPurpose || formData.helpPurpose.trim() === "") {
      errors.helpPurpose = true;
      hasErrors = true;
    }

    if (!formData.needDescription || formData.needDescription.trim() === "") {
      errors.needDescription = true;
      hasErrors = true;
    }

    if (!formData.expectedExpense || formData.expectedExpense === "") {
      errors.expectedExpense = true;
      hasErrors = true;
    }

    if (!formData.ownContribution || formData.ownContribution === "") {
      errors.ownContribution = true;
      hasErrors = true;
    }

    if (!formData.previousHelp || formData.previousHelp === "") {
      errors.previousHelp = true;
      hasErrors = true;
    }

    if (!formData.mosquePresident || formData.mosquePresident.trim() === "") {
      errors.mosquePresident = true;
      hasErrors = true;
    }

    if (!formData.mosquePhone || formData.mosquePhone.trim() === "") {
      errors.mosquePhone = true;
      hasErrors = true;
    }

    // Validate mobile numbers if provided
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      errors.phone = true;
      hasErrors = true;
    }

    if (formData.whatsapp && !validateMobileNumber(formData.whatsapp)) {
      errors.whatsapp = true;
      hasErrors = true;
    }

    if (formData.presidentPhone && !validateMobileNumber(formData.presidentPhone)) {
      errors.presidentPhone = true;
      hasErrors = true;
    }

    if (formData.mosquePhone && !validateMobileNumber(formData.mosquePhone)) {
      errors.mosquePhone = true;
      hasErrors = true;
    }

    // Set validation errors
    setValidationErrors(errors);

    if (hasErrors) {
      showErrorModal("ദയവായി എല്ലാ ആവശ്യമായ വിവരങ്ങളും പൂരിപ്പിക്കുക");
      return false;
    }

    return true;
  };

  // Updated function to handle submit button click
  const handleSubmitClick = () => {
    if (validateAllFields()) {
      showSubmitConfirmation();
    }
  };

  const handleSubmit = async () => {
    // Mobile number validation
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      showErrorModal("ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }

    if (formData.whatsapp && !validateMobileNumber(formData.whatsapp)) {
      showErrorModal("ദയവായി സാധുവായ 10 അക്ക വാട്സാപ്പ് നമ്പർ നൽകുക");
      return;
    }

    if (formData.presidentPhone && !validateMobileNumber(formData.presidentPhone)) {
      showErrorModal("ദയവായി പ്രസിഡന്റിന്റെ സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക");
      return;
    }

    if (formData.mosquePhone && !validateMobileNumber(formData.mosquePhone)) {
      showErrorModal("ദയവായി മസ്ജിദ് ഉദ്യോഗസ്ഥന്റെ സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക");
      return;
    }

    // Validate new required fields
    if (!formData.whatsapp || formData.whatsapp.trim() === "") {
      showErrorModal("ദയവായി വാട്സാപ്പ് നമ്പർ നൽകുക");
      return;
    }

    if (!formData.chairmanDesignation || formData.chairmanDesignation.trim() === "") {
      showErrorModal("ദയവായി ജോലി ചെയ്യുന്ന തസ്‌തിക നൽകുക");
      return;
    }

    if (!formData.salary || formData.salary === "") {
      showErrorModal("ദയവായി വേതനം നൽകുക");
      return;
    }

    if (!formData.ownContribution || formData.ownContribution === "") {
      showErrorModal("ദയവായി സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക നൽകുക");
      return;
    }

    if (!formData.previousHelp || formData.previousHelp === "") {
      showErrorModal("ദയവായി മുമ്പ് സഹായം ലഭിച്ചിട്ടുണ്ടോ എന്ന് തിരഞ്ഞെടുക്കുക");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/welfarefund/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccessModal('അപേക്ഷ സമർപ്പിച്ചു!', result.data?.trackingId || 'N/A');
        // Reset form
        setFormData({
          mosqueName: '',
          mckAffiliation: '',
          address: '',
          committeePerson: '',
          managementType: '',
          phone: '',
          whatsapp: '',
          presidentPhone: '',
          presidentChairman: '',
          district: '',
          area: '',
          jammatDetails: '',
          applicantDetails: '',
          chairmanDesignation: '',
          salary: '',
          helpPurpose: '',
          needDescription: '',
          expectedExpense: '',
          ownContribution: '',
          previousHelp: '',
          mosquePresident: '',
          mosquePhone: ''
        });
        // Navigate after modal is closed
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        showErrorModal('പിശക്: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showErrorModal('അപേക്ഷ സമർപ്പിക്കുന്നതിൽ പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.');
    }
  };
  

  if (!showForm) {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-white mt-4">
        <div className="flex items-center gap-3 mb-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="Masjid Council Kerala" className="h-10 w-auto" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>
              ഇമാം മൗഅ്‌ദിൻ കക്ഷമനിദി
            </h1>
            <p className="text-lg text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>സഹായം ലഭിക്കുന്നതിന് അപേക്ഷ</p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: "Anek Malayalam Variable" }}>
            അപേക്ഷ പൂരിപ്പിക്കുന്നതിന് മുൻപ് ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" style={{ fontFamily: "Anek Malayalam Variable" }}>
            ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി - പൊതു നിര്‍ദ്ദേശങ്ങൾ:
            </h3>
            <ul className="space-y-1 text-gray-700" style={{ fontFamily: "Anek Malayalam Variable" }}>
              <li>• MCK യിൽ അഫിലിയേറ്റ് ചെയ്‌ത മസ്‌ജിദിലെ ജീവനക്കാർക്ക് വേണ്ടിയാണ് അപേക്ഷ നൽകേണ്ടത്.</li>
              <li>• മസ്‌ജിദ് കമ്മിറ്റിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്.</li>
              <li>• ജീവനക്കാരനെ സംബന്ധിച്ച വിശദവിവരങ്ങൾ രേഖപ്പെടുത്തേണ്ട ഫോറവും നിർബന്ധമായും പൂരിപ്പിച്ച് നൽകേണ്ടതാണ്.</li>
              <li>• സർവീസിൽ തുടരുന്ന സന്ദർഭത്തിൽ മാത്രമേ സഹായം ലഭ്യമാകുകയുള്ളൂ.</li>
              <li>• MCK യിൽ അഫിലിയേറ്റ് ചെയ്‌ത മസ്‌ജിദുകളിൽ തുടർച്ചയായി 5 വർഷം സർവീസ് ഉണ്ടായിരിക്കണം.</li>
              <li>• ജീവനക്കാരൻ സഹയാത്തിന് അർഹനാണെങ്കിൽ മസ്‌ജിദ് കമ്മിറ്റിയുടെ പേരിലാണ് ഫണ്ട് അനുവദിക്കുക.</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" style={{ fontFamily: "Anek Malayalam Variable" }}>
              സഹായം ലഭിക്കുന്ന ഇനങ്ങൾ:
            </h3>
            <ul className="space-y-1 text-gray-700" style={{ fontFamily: "Anek Malayalam Variable" }}>
              <li>• <strong>വീട് റിപ്പയർ:</strong> സ്വന്തമായി വീടുള്ള ജീവനക്കർക്ക് വീട് റിപ്പയർ ചെയ്യുന്നതിനാണ് സഹായം അനുവദിക്കുക</li>
              <li>• <strong>വിവാഹം:</strong> സ്വന്തം വിവാഹത്തിനും മക്കൾ, സഹോദരിമാർ എന്നിവരുടെ വിവാഹത്തിനും</li>
              <li>• <strong>ചികിത്സ:</strong> ഭാര്യ, മക്കൾ, മാതാപിതാക്കൾ എന്നിവരുടെ ചികിത്സക്കും സഹായം അനുവദിക്കും.</li>
              <li>• <strong>വിദ്യാഭ്യാസം:</strong> മക്കളുടെ വിദ്യാഭ്യാസത്തിന് സാമ്പത്തിക സഹായം.</li>
            </ul>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" style={{ fontFamily: "Anek Malayalam Variable" }}>
              അപേക്ഷയോടൊപ്പം ചേർക്കേണ്ട രേഖകൾ:
            </h3>
            <ul className="space-y-1 text-gray-700" style={{ fontFamily: "Anek Malayalam Variable" }}>
              <li>• സഹായം ആവശ്യമായ ജീവനക്കാരൻ്റെ ആധാർ കോപ്പി</li>
              <li>• മസ്‌ജിദിൻ്റെ ബാങ്ക് പാസ് ബുക്കിൻ്റെ കോപ്പി (അക്കൗണ്ട് നമ്പർ, അക്കൗണ്ട് ഹോൾഡറുടെ പേര് ഉള്ള ഭാഗം)</li>
              <li>• ചികിത്സക്ക്: ഡോക്ടറുടെ ശിപാർശ</li>
              <li>• വിദ്യാഭ്യാസത്തിന്: കോഴ്സിൻ്റെ ഫിസ് ഘടന, അഡ്‌മിഷൻ വിശദാംശങ്ങൾ</li>
            </ul>
          </div>
        </div>

        {/* <div className="mt-8 text-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition duration-200"
          >
            വീടിനായി സഹായം അപേക്ഷ പൂരിപ്പിക്കുക
          </button>
        </div> */}
         <div className="flex justify-center space-x-4 mt-6">
  <button
    onClick={() => {
  setShowForm(false);
  navigate("/");
}}
    className="px-4 py-2 border border-orange-500 text-orange-500 hover:bg-orange-100 rounded"
    style={{ fontFamily: "Anek Malayalam Variable" }}
  >
    വീട്ടിലേക്ക് മടങ്ങുക
  </button>
  <button
    onClick={() => setShowForm(true)}
    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
    style={{ fontFamily: "Anek Malayalam Variable" }}
  >
    അപേക്ഷ പൂരിപ്പിക്കുക
  </button>
</div>

      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6 relative">
        {/* Cross button */}
        <button
          onClick={showCancelConfirmation}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="ഫോം ഉപേക്ഷിക്കുക"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4 pr-12">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="Masjid Council Kerala" className="h-12 w-auto" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Anek Malayalam Variable" }}>
              ഇമാം മൗഅ്‌ദിൻ കക്ഷമനിദി
            </h1>
            <p className="text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>സഹായം ലഭിക്കുന്നതിന് അപേക്ഷ</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mosque Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്ജിദ് വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                എം സി കെ അഫിലിയേഷൻ നമ്പർ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="text"
                  name="mckAffiliation"
                  value={formData.mckAffiliation}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.mckAffiliation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {loadingAffiliation && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                മസ്ജിദിന്റെ പേര് <span className="text-red-500">*</span>
                {autoFilledFields.mosqueName && (
                  <span className="text-green-600 text-xs ml-2">(ഓട്ടോ ഫിൽ ചെയ്തു)</span>
                )}
              </label>
              <input
                type="text"
                name="mosqueName"
                value={formData.mosqueName}
                onChange={handleInputChange}
                readOnly={autoFilledFields.mosqueName}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mosqueName ? 'border-red-500' : 
                  autoFilledFields.mosqueName ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              വിലാസം <span className="text-red-500">*</span>
              {autoFilledFields.address && (
                <span className="text-green-600 text-xs ml-2">(ഓട്ടോ ഫിൽ ചെയ്തു)</span>
              )}
            </label>
            <textarea
            style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              readOnly={autoFilledFields.address}
              rows="3"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.address ? 'border-red-500' : 
                autoFilledFields.address ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
              required
            />
          </div>
        </div>

        {/* Management Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>മാനേജ്മെന്റ് വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                പരിപാലന കമ്മിറ്റി പ്രസിഡന്റ്/ട്രസ്‌റ്റ് <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="committeePerson"
                value={formData.committeePerson}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.committeePerson ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                മാനേജ്മെന്റ് കമ്മിറ്റി/ബോർഡ് <span className="text-red-500">*</span>
              </label>
              <select
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                name="managementType"
                value={formData.managementType}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.managementType ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">തിരഞ്ഞെടുക്കുക</option>
                <option value="managing_committee">മാനേജിംഗ് കമ്മിറ്റി</option>
                <option value="trust">ട്രസ്‌റ്റ്</option>
                <option value="association">അസോസിയേഷൻ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഫോൺ
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                വാട്സ്ആപ്പ് നമ്പർ <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.whatsapp ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                പ്രസിഡന്റ് ഫോൺ
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="tel"
                name="presidentPhone"
                value={formData.presidentPhone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.presidentPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                പ്രസിഡന്‍റ്/ ചെയർമാൻ
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="presidentChairman"
                value={formData.presidentChairman}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
          </div>
        </div>

        {/* Jamaat Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>ജമാഅത്തിന്റെ ഇസ്ലാമി വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ജില്ല <span className="text-red-500">*</span>
                {autoFilledFields.district && (
                  <span className="text-green-600 text-xs ml-2">(ഓട്ടോ ഫിൽ ചെയ്തു)</span>
                )}
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.district ? 'border-red-500' : 
                  autoFilledFields.district ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                required
                disabled={loadingDropdowns || autoFilledFields.district}
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
              >
                <option value="">{loadingDropdowns ? "ലോഡ് ചെയ്യുന്നു..." : "ജില്ല തിരഞ്ഞെടുക്കുക"}</option>
                {Array.isArray(districts) && districts.map((district) => (
                  <option key={district.id || district._id} value={district.title || district.name}>
                    {district.title || district.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഏരിയ <span className="text-red-500">*</span>
                {autoFilledFields.area && (
                  <span className="text-green-600 text-xs ml-2">(ഓട്ടോ ഫിൽ ചെയ്തു)</span>
                )}
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.area ? 'border-red-500' : 
                  autoFilledFields.area ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                required
                disabled={loadingDropdowns || !formData.district || autoFilledFields.area}
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
              >
                <option value="">
                  {!formData.district ? 'ആദ്യം ജില്ല തിരഞ്ഞെടുക്കുക' : 'ഏരിയ തിരഞ്ഞെടുക്കുക'}
                </option>
                {Array.isArray(areas) && areas.map((area) => (
                  <option key={area.id || area._id} value={area.title || area.name}>
                    {area.title || area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              ജമാഅത്തിന്റെ പ്രാദേശിക ഘടകം
            </label>
            <select
              name="jammatDetails"
              value={formData.jammatDetails}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingDropdowns || !formData.area}
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              <option value="">
                {!formData.area ? 'ആദ്യം ഏരിയ തിരഞ്ഞെടുക്കുക' : 'യൂണിറ്റ് തിരഞ്ഞെടുക്കുക'}
              </option>
              {Array.isArray(units) && units.map((unit) => (
                <option key={unit.id || unit._id} value={unit.title || unit.name}>
                  {unit.title || unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Application Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>അപേക്ഷ വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                അപേക്ഷ സമർപ്പിക്കുന്നത് ആർക്കാണ് വേണ്ടി <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="applicantDetails"
                value={formData.applicantDetails}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.applicantDetails ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              ജോലി ചെയ്യുന്ന തസ്‌തിക <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="chairmanDesignation"
                value={formData.chairmanDesignation}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.chairmanDesignation ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                വേതനം (രൂപ) <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.salary ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Help Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>സഹായ വിവരങ്ങൾ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                സഹായം ആവശ്യമുള്ള ഉദ്ദേശം <span className="text-red-500">*</span>
              </label>
              <select
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                name="helpPurpose"
                value={formData.helpPurpose}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.helpPurpose ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                
              >
                <option value="">തിരഞ്ഞെടുക്കുക</option>
                <option value="house">വീട് റിപ്പയർ</option>
                <option value="marriage">വിവാഹം</option>
                <option value="medical">ചികിത്സ</option>
                <option value="education">വിദ്യാഭ്യാസം</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ആവശ്യത്തിന്റെ വിശദവിവരം <span className="text-red-500">*</span>
              </label>
              <textarea
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                name="needDescription"
                value={formData.needDescription}
                onChange={handleInputChange}
                rows="4"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.needDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                  പ്രതീക്ഷിക്കുന്ന ചെലവ് (രൂപ) <span className="text-red-500">*</span>
                </label>
                <input
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="number"
                  name="expectedExpense"
                  value={formData.expectedExpense}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.expectedExpense ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക (രൂപ) <span className="text-red-500">*</span>
                </label>
                <input
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="number"
                  name="ownContribution"
                  value={formData.ownContribution}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.ownContribution ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Previous Help Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>മുമ്പത്തെ സഹായം</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
            മസ്ജിദ് കൗൺസിലിൽ നിന്ന് മുമ്പ് സഹായം ലഭ്യമായിട്ടുണ്ടോ <span className="text-red-500">*</span>
            </label>
            <div className={`flex space-x-4 p-3 rounded-lg border ${
              validationErrors.previousHelp ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}>
              <label className="flex items-center">
                <input
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="radio"
                  name="previousHelp"
                  value="yes"
                  checked={formData.previousHelp === 'yes'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                ഉണ്ട്
              </label>
              <label className="flex items-center">
                <input
                style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="radio"
                  name="previousHelp"
                  value="no"
                  checked={formData.previousHelp === 'no'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                ഇല്ല
              </label>
            </div>
          </div>
        </div>

        {/* Mosque Official Details */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്‌ജിദ് ഉദ്യോഗസ്ഥ വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              മസ്‌ജിദ് പ്രസിഡന്‍റ് / സെക്രട്ടറി <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="mosquePresident"
                value={formData.mosquePresident}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mosquePresident ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഫോൺ <span className="text-red-500">*</span>
              </label>
              <input
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="tel"
                name="mosquePhone"
                value={formData.mosquePhone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mosquePhone ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 mt-8">
        <button
        style={{ fontFamily: "Anek Malayalam Variable" }}
  type="button"
  onClick={() => {
  setShowForm(false);
  navigate("/");
}}
  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
>
  റദ്ദാക്കുക
</button>

          <button
          style={{ fontFamily: "Anek Malayalam Variable" }}
            type="button"
            onClick={handleSubmitClick}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
          >
            അപേക്ഷ സമർപ്പിക്കുക
          </button>
        </div>
      </form>

      {/* Custom Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 rounded-t-lg bg-white border-b border-gray-200">
              <div className="flex items-center">
                {/* Logo on the left */}
                <img src={logo} alt="Masjid Council Kerala" className="h-10 w-auto mr-4" />
                
                {/* Title and icon on the right */}
                <div className="flex items-center">
                  {modalType === 'success' ? (
                    <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <h3 className={`text-lg font-semibold ${
                    modalType === 'success' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {modalType === 'success' ? 'വിജയം!' : 'പിശക്!'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
                {modalMessage}
              </p>
              
              {modalType === 'success' && trackingId && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    ട്രാക്കിംഗ് ഐഡി:
                  </p>
                  <p className="text-lg font-bold text-green-900" style={{ fontFamily: "Anek Malayalam Variable" }}>
                    {trackingId}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    modalType === 'success' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    modalType === 'success' ? 'focus:ring-green-400' : 'focus:ring-red-400'
                  }`}
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  {modalType === 'success' ? 'ശരി' : 'ശരി'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 rounded-t-lg bg-white border-b border-gray-200">
              <div className="flex items-center">
                {/* Logo on the left */}
                <img src={logo} alt="Masjid Council Kerala" className="h-10 w-auto mr-4" />
                
                {/* Title and icon on the right */}
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-600">
                    ഫോം ഉപേക്ഷിക്കുക
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
                നിങ്ങൾ ഉപേക്ഷിക്കുന്നത് ഉറപ്പാണോ? നിങ്ങൾ നൽകിയ എല്ലാ വിവരങ്ങളും നഷ്ടമാകും.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  ഉപേക്ഷിക്കുക
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 rounded-t-lg bg-white border-b border-gray-200">
              <div className="flex items-center">
                {/* Logo on the left */}
                <img src={logo} alt="Masjid Council Kerala" className="h-10 w-auto mr-4" />
                
                {/* Title and icon on the right */}
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-600">
                    അപേക്ഷ സമർപ്പിക്കുക
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
                ദയവായി നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കുക:
              </p>
              
              {/* Form Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      മസ്ജിദിന്റെ പേര്:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      {formData.mosqueName || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      ജില്ല:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      {formData.district || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      ഫോൺ നമ്പർ:
                    </h4>
                    <p className="text-gray-600">
                      {formData.phone || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      സഹായ ഉദ്ദേശം:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>
                      {formData.helpPurpose || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
                ഈ വിവരങ്ങൾ ശരിയാണെങ്കിൽ "സമർപ്പിക്കുക" ക്ലിക്ക് ചെയ്യുക. തിരുത്താൻ ആഗ്രഹിക്കുന്നുവെങ്കിൽ "തിരുത്തുക" ക്ലിക്ക് ചെയ്യുക.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeSubmitModal}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  തിരുത്തുക
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  സമർപ്പിക്കുക
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalAidForm;