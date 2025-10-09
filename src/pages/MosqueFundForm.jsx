import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MosqueFundForm = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    // Mosque Details
    mosqueName: '',
    mckAffiliation: '',
    address: '',
    managementType: '',
    presidentSecretary: '',
    district: '',
    area: '',
    jamathIslami:'',
    phone: '',
    
    // Help Status
    mckFundService: '',
    previousHelp: '',
    
    // Current Help Details
    helpPurpose: '',
    needDescription: '',
    expectedExpense: '',
    ownContribution: '',
    
    // Welfare Fund Details
    mosqueOfficialName: '',
    mosqueOfficialPhone: '',
    whatsappNumber: '',
    
    // Bank Details (CDN URLs)
    bankPassbook: '',
    fullEstimate: '',
    
    // Declarations
    declaration1: false,
    declaration2: false
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState({
    bankPassbook: null,
    fullEstimate: null
  });

  const [uploadProgress, setUploadProgress] = useState({
    bankPassbook: 0,
    fullEstimate: 0
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Note: jamathIslami is NOT auto-filled - user must select manually
  });

  // Custom alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success', 'error', 'warning'

  // Modal states for validation flow
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Custom alert functions
  const showCustomAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    // Auto hide after 6 seconds for better visibility
    setTimeout(() => {
      setShowAlert(false);
    }, 6000);
  };

  const hideAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  // Modal functions
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

    // Validate all required fields based on backend model
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

    if (!formData.phone || formData.phone.trim() === "") {
      errors.phone = true;
      hasErrors = true;
    }

    if (!formData.district || formData.district.trim() === "") {
      errors.district = true;
      hasErrors = true;
    }

    if (!formData.mckFundService || formData.mckFundService.trim() === "") {
      errors.mckFundService = true;
      hasErrors = true;
    }

    if (!formData.previousHelp || formData.previousHelp.trim() === "") {
      errors.previousHelp = true;
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

    if (!formData.expectedExpense || formData.expectedExpense.trim() === "") {
      errors.expectedExpense = true;
      hasErrors = true;
    }

    if (!formData.mosqueOfficialName || formData.mosqueOfficialName.trim() === "") {
      errors.mosqueOfficialName = true;
      hasErrors = true;
    }

    if (!formData.mosqueOfficialPhone || formData.mosqueOfficialPhone.trim() === "") {
      errors.mosqueOfficialPhone = true;
      hasErrors = true;
    }

    if (!formData.whatsappNumber || formData.whatsappNumber.trim() === "") {
      errors.whatsappNumber = true;
      hasErrors = true;
    }

    // Validate mobile numbers if provided
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      errors.phone = true;
      hasErrors = true;
    }

    if (formData.mosqueOfficialPhone && !validateMobileNumber(formData.mosqueOfficialPhone)) {
      errors.mosqueOfficialPhone = true;
      hasErrors = true;
    }

    if (formData.whatsappNumber && !validateMobileNumber(formData.whatsappNumber)) {
      errors.whatsappNumber = true;
      hasErrors = true;
    }

    // Set validation errors
    setValidationErrors(errors);

    if (hasErrors) {
      showCustomAlert("ദയവായി എല്ലാ ആവശ്യമായ വിവരങ്ങളും പൂരിപ്പിക്കുക", 'error');
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

  const validateField = (fieldName, value) => {
    let isValid = true;
    
    if (['phone', 'mosqueOfficialPhone', 'whatsappNumber'].includes(fieldName)) {
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
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/units/${areaId}`);
      const result = await response.json();
      
      if (result.success && result.units && Array.isArray(result.units)) {
        setUnits(result.units);
        return result.units;
      } else {
        const fallbackUnits = getFallbackUnits();
        setUnits(fallbackUnits);
        return fallbackUnits;
      }
    } catch (error) {
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
          jamathIslami: mosqueData.jamathArea?.[0]?.district
        });
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          mosqueName: mosqueData.name || '',
          address: mosqueData.address?.[0]?.address || '',
          district: districtName,
          area: areaName
          // Note: jamathIslami is NOT auto-filled - user must select manually
        }));
        
        // Mark fields as auto-filled (read-only) - EXCLUDING jamathIslami
        setAutoFilledFields({
          mosqueName: !!mosqueData.name,
          address: !!mosqueData.address?.[0]?.address,
          district: !!districtName,
          area: !!areaName
          // jamathIslami is NOT auto-filled - user must select manually
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
        showCustomAlert('മസ്ജിദ് വിവരങ്ങൾ ഓട്ടോ ഫിൽ ചെയ്തു!', 'success');
      } else {
        showCustomAlert('അഫിലിയേഷൻ നമ്പർ കണ്ടെത്താൻ കഴിഞ്ഞില്ല', 'error');
      }
    } catch (error) {
      console.error('Error fetching mosque data:', error);
      showCustomAlert('വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു', 'error');
    } finally {
      setLoadingAffiliation(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
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
        jamathIslami: '' // Reset unit when district changes
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
        jamathIslami: '' // Reset unit when area changes
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
        [name]: newValue
      }));
    }
    
    if (type !== 'checkbox') {
      validateField(name, value);
    }
  };

  const validateMobileNumber = (number) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  // File upload functions
  const handleFileUpload = async (file, fieldName) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showCustomAlert('ദയവായി PDF, JPEG, PNG, GIF, WEBP ഫയലുകൾ മാത്രം അപ്ലോഡ് ചെയ്യുക', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showCustomAlert('ഫയൽ സൈസ് 5MB ൽ കുറവായിരിക്കണം', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));

    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/upload-files`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const fileData = result.data[fieldName];
        if (fileData) {
          setUploadedFiles(prev => ({
            ...prev,
            [fieldName]: {
              name: fileData.originalName,
              url: fileData.cdnUrl,
              key: fileData.key
            }
          }));
          
          setFormData(prev => ({
            ...prev,
            [fieldName]: fileData.cdnUrl
          }));
          
          showCustomAlert(`${fieldName === 'bankPassbook' ? 'ബാങ്ക് പാസ് ബുക്ക്' : 'എസ്റ്റിമേറ്റ്'} ഫയൽ വിജയകരമായി അപ്ലോഡ് ചെയ്തു!`, 'success');
        }
      } else {
        showCustomAlert('ഫയൽ അപ്ലോഡ് ചെയ്യുന്നതിൽ പിശക്: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('File upload error:', error);
      showCustomAlert('ഫയൽ അപ്ലോഡ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, fieldName);
    }
  };

  const removeFile = (fieldName) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: null
    }));
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleSubmit = async () => {
    if (!formData.declaration1 || !formData.declaration2) {
      showCustomAlert('കൃപയാ എല്ലാ പ്രഖ്യാപനങ്ങളും അംഗീകരിക്കുക', 'warning');
      return;
    }

    // Mobile number validation
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      showCustomAlert("ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക", 'error');
      return;
    }

    if (formData.mosqueOfficialPhone && !validateMobileNumber(formData.mosqueOfficialPhone)) {
      showCustomAlert("ദയവായി മസ്ജിദ് ഉദ്യോഗസ്ഥന്റെ സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക", 'error');
      return;
    }

    if (formData.whatsappNumber && !validateMobileNumber(formData.whatsappNumber)) {
      showCustomAlert("ദയവായി സാധുവായ 10 അക്ക വാട്സാപ്പ് നമ്പർ നൽകുക", 'error');
      return;
    }

    // Validate required fields
    const requiredFields = [
      'mosqueName', 'mckAffiliation', 'address', 'phone', 'district',
      'mckFundService', 'previousHelp', 'helpPurpose', 'needDescription',
      'expectedExpense', 'mosqueOfficialName', 'mosqueOfficialPhone', 'whatsappNumber'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      showCustomAlert('കൃപയാ എല്ലാ ആവശ്യമായ ഫീൽഡുകളും പൂരിപ്പിക്കുക', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showCustomAlert('അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു! (Application submitted successfully!)', 'success');
        
        // Delay form reset to allow user to see success message
        setTimeout(() => {
          // Reset form
          setFormData({
            mosqueName: '',
            mckAffiliation: '',
            address: '',
            managementType: '',
            presidentSecretary: '',
            district: '',
            area: '',
            jamathIslami:'',
            phone: '',
            mckFundService: '',
            previousHelp: '',
            helpPurpose: '',
            needDescription: '',
            expectedExpense: '',
            ownContribution: '',
            mosqueOfficialName: '',
            mosqueOfficialPhone: '',
            whatsappNumber: '',
            bankPassbook: '',
            fullEstimate: '',
            declaration1: false,
            declaration2: false
          });
          
          // Reset file uploads
          setUploadedFiles({
            bankPassbook: null,
            fullEstimate: null
          });
          setShowForm(false);
        }, 2000); // Wait 2 seconds before resetting
      } else {
        showCustomAlert('അപേക്ഷ സമർപ്പിക്കുന്നതിൽ പിശക്: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showCustomAlert('അപേക്ഷ സമർപ്പിക്കുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow mt-2">
        <div className="flex items-center gap-4 mb-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="Masjid Council Kerala" className="h-12 w-auto" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്ജിദ് ഫണ്ട് സഹായത്തിനുള്ള അപേക്ഷ</h1>
            <p className="text-lg text-gray-700" style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്ജിദ് കൗൺസിൽ കേരള</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-2"style={{ fontFamily: "Anek Malayalam Variable" }}>
            നിർദേശങ്ങൾ വായിക്കുക
          </h2>
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <ul className="list-disc space-y-2 text-gray-800 text-sm ml-6" style={{ fontFamily: "Anek Malayalam Variable" }}>
            <li>MCK യിൽ അഫിലിയേറ്റ് ചെയ്‌ത മസ്‌ജിദുകൾക്ക് വേണ്ടിയുള്ള സംവിധാനമാണിത്. അഫിലിയേറ്റ് ചെയ്യാത്ത പള്ളികളുടെ അപേക്ഷ പരിഗണിക്കുകയില്ല.</li>
            <li>എല്ലാ മാസവും ആദ്യത്തെ വെള്ളിയാഴ്‌ച ജുമുഅക്ക് ശേഷം മസ്‌ജിദ് ഫണ്ട് സമാഹരിക്കുകയും കേന്ദ്രത്തിലടക്കുകയും ചെയ്യുന്ന പള്ളികൾക്കാണ് സഹായത്തിന് അർഹതയുള്ളത്.</li>
            <li>പള്ളികളുമായി ബന്ധപ്പെട്ട അറ്റകുറ്റപ്പണികൾക്ക് വേണ്ടിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്. പുതിയ പള്ളി നിർമ്മാണത്തിനോ പള്ളിയുമായി ചേർന്ന് നിൽകുന്ന മറ്റു സംവിധാനങ്ങൾക്കോ (മദ്രസ, ലൈബ്രറി) സഹായം ലഭ്യമല്ല.</li>
            <li>മസ്‌ജിദ് പ്രസിഡന്‍റ് / സെക്രട്ടറിയാണ് അപേക്ഷ സമർപ്പിക്കേണ്ടത്.</li>
            <li>സഹായം ആവശ്യമായ ഇനത്തിന്‍റെ പ്ലാൻ, എസ്റ്റിമേറ്റ് എന്നിവ അപേക്ഷയോടൊപ്പം സമർപ്പിക്കേണ്ടതാണ്.</li>
            <li>ഒരു തവണ സഹായം അനുവദിക്കപ്പെട്ട മസ്‌ജിദുകൾക്ക് പിന്നീട് നാല് വർഷത്തിന് ശേഷം മാത്രമേ അപേക്ഷ സമർപ്പിക്കാൻ അർഹതയുള്ളൂ.</li>
            <li>സഹായം ആവശ്യമായ മസ്‌ജിദിൻ്റെ ബാങ്ക് പാസ് ബുക്കിൻ്റെ കോപ്പി (അക്കൗണ്ട് നമ്പർ, അക്കൗണ്ട് ഹോൾഡറുടെ പേര് ഉള്ള ഭാഗം) അപേക്ഷയോടൊപ്പം ചേർക്കണം.</li>
            <li>അക്കൗണ്ട് മസ്‌ജിദ്/മാനേജിംഗ് കമ്മറ്റി/ട്രസ്റ്റിൻ്റെ പേരിലുള്ളതായിരിക്കണം.</li>
            <li>സഹായം സ്വീകരിച്ചതിൻ്റെ റസിപ്റ്റ് മസ്‌ജിദ് കൗൺസിൽ കേരളക്ക് നൽകേണ്ടതാണ്.</li>
          </ul>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 text-sm text-gray-900">
          <strong style={{ fontFamily: "Anek Malayalam Variable" }}>NB:</strong> അപേക്ഷയോടൊപ്പമുള്ള മാർഗനിർദ്ദേശങ്ങളിൽ സൂചിപ്പിച്ച രേഖകൾ അപേക്ഷയോടൊപ്പം സമർപ്പിക്കേണ്ടതാണ്.
        </div>

        <div className="text-right mt-4">
          <button 
          style={{ fontFamily: "Anek Malayalam Variable" }}
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            നിർദേശങ്ങൾ വായിച്ചു, അപേക്ഷ പൂരിപ്പിക്കുക
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mt-2">
        <div className="bg-white border-b p-6 relative">
          {/* Cross button */}
          <button
            onClick={showCancelConfirmation}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
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
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Anek Malayalam Variable" }}>
              മസ്ജിദ് ഫണ്ട് സഹായത്തിനുള്ള അപേക്ഷ
            </h1>
              <p className="text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്ജിദ് കൗൺസിൽ കേരള</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Mosque Details Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4"style={{ fontFamily: "Anek Malayalam Variable" }}>മസ്ജിദ് വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                എം സി കെ അഫിലിയേഷൻ നമ്പർ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
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
               style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              മാനേജിംഗ് കമ്മിറ്റി/ട്രസ്‌റ്റ്
              </label>
              <input
                type="text"
                name="managementType"
                value={formData.managementType}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              പ്രസിഡൻ്റ്/ ചെയർമാൻ
              </label>
              <input
                type="text"
                name="presidentSecretary"
                value={formData.presidentSecretary}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഫോൺ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
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
                ഏരിയ
                {autoFilledFields.area && (
                  <span className="text-green-600 text-xs ml-2">(ഓട്ടോ ഫിൽ ചെയ്തു)</span>
                )}
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  autoFilledFields.area ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              ജമാഅത്തെ ഇസ്‌ലാമി പ്രാദേശിക ഘടകം
              </label>
              <select
                name="jamathIslami"
                value={formData.jamathIslami}
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
        </div>

        {/* Help Status Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>മുമ്പ് സഹായം സംബന്ധിച്ച വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              മസ്‌ജിദ് കൗൺസിൽ കേരളക്ക് മാസാന്ത ഫണ്ട് ശേഖരണം നടക്കാറുണ്ടോ <span className="text-red-500">*</span>
              </label>
              <select
               style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                name="mckFundService"
                value={formData.mckFundService}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mckFundService ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">തിരഞ്ഞെടുക്കുക</option>
                <option value="yes">ഉണ്ട്</option>
                <option value="no">ഇല്ല</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              മസ്‌ജിദ് കൗൺസിലിൽ നിന്ന് മുമ്പ് സഹായം ലഭ്യമായിട്ടുണ്ടോ <span className="text-red-500">*</span>
              </label>
              <select
               style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                name="previousHelp"
                value={formData.previousHelp}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.previousHelp ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">തിരഞ്ഞെടുക്കുക</option>
                <option value="yes">ഉണ്ട്</option>
                <option value="no">ഇല്ല</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Help Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>നലവിലെ സഹായം സംബന്ധിച്ച വിവരങ്ങൾ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              ഇപ്പോൾ സഹായം ആവശ്യമായ ഇനം <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="helpPurpose"
                value={formData.helpPurpose}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.helpPurpose ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ആവശ്യത്തിന്റെ വിശദവിവരം <span className="text-red-500">*</span>
              </label>
              <textarea
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
                സ്വന്തമായി ശേഖരിക്കാവുന്ന തുക (രൂപ)
                </label>
                <input
                 style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  type="number"
                  name="ownContribution"
                  value={formData.ownContribution}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Welfare Fund Details */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>കോൺടാക്റ്റ് വിവരങ്ങൾ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                മസ്ജിദ് പ്രസിഡന്റ്/സെക്രട്ടറി <span className="text-red-500">*</span>
              </label>
              <input
               style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="text"
                name="mosqueOfficialName"
                value={formData.mosqueOfficialName}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mosqueOfficialName ? 'border-red-500' : 'border-gray-300'
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
                name="mosqueOfficialPhone"
                value={formData.mosqueOfficialPhone}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.mosqueOfficialPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                വാട്സാപ്പ് നമ്പർ <span className="text-red-500">*</span>
              </label>
              <input
               style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.whatsappNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>ആവശ്യമായ ഡോക്യുമെന്റുകൾ</h2>
          <div className="space-y-6">
            {/* Bank Passbook Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ബാങ്ക് പാസ് ബുക്കിന്റെ കോപ്പി (PDF, JPEG, PNG, GIF, WEBP)
              </label>
              {!uploadedFiles.bankPassbook ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="bankPassbook"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={(e) => handleFileChange(e, 'bankPassbook')}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label htmlFor="bankPassbook" className="cursor-pointer">
                    <div className="text-gray-500 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      ഫയൽ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ ഇവിടെ ഡ്രാഗ് ചെയ്യുക
                    </p>
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      പരമാവധി 5MB, PDF, JPEG, PNG, GIF, WEBP
                    </p>
                  </label>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                        {uploadedFiles.bankPassbook.name}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={uploadedFiles.bankPassbook.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        കാണുക
                      </a>
                      <button
                        onClick={() => removeFile('bankPassbook')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        നീക്കം ചെയ്യുക
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Full Estimate Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                പ്ലാൻ, എസ്റ്റിമേറ്റ് ഫയൽ (PDF, JPEG, PNG, GIF, WEBP)
              </label>
              {!uploadedFiles.fullEstimate ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="fullEstimate"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={(e) => handleFileChange(e, 'fullEstimate')}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label htmlFor="fullEstimate" className="cursor-pointer">
                    <div className="text-gray-500 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      ഫയൽ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ ഇവിടെ ഡ്രാഗ് ചെയ്യുക
                    </p>
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      പരമാവധി 5MB, PDF, JPEG, PNG, GIF, WEBP
                    </p>
                  </label>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                        {uploadedFiles.fullEstimate.name}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={uploadedFiles.fullEstimate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        കാണുക
                      </a>
                      <button
                        onClick={() => removeFile('fullEstimate')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        നീക്കം ചെയ്യുക
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Declarations */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>പ്രഖ്യാപനങ്ങൾ</h2>
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="declaration1"
                checked={formData.declaration1}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഞാൻ മസ്ജിദ് ഫണ്ട് സഹായത്തിനുള്ള എല്ലാ നിർദേശങ്ങളും വായിച്ച് മനസ്സിലാക്കിയുണ്ട്.
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="declaration2"
                checked={formData.declaration2}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
              ഞാൻ ഇവിടെ നൽകിയിരിക്കുന്ന എല്ലാ വിവരങ്ങളും സത്യവും കൃത്യവുമാണെന്ന് പ്രഖ്യാപിക്കുന്നു. തെറ്റായ വിവരങ്ങൾ നൽകിയാൽ അതിന്റെ പൂർണ്ണ ഉത്തരവാദിത്തം എന്റേതായിരിക്കും.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
           style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            റദ്ദാക്കുക
          </button>
          <button
           style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className={`px-8 py-3 text-white font-semibold rounded-lg transition duration-200 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                സമർപ്പിക്കുന്നു...
              </div>
            ) : (
              'അപേക്ഷ സമർപ്പിക്കുക'
            )}
          </button>
        </div>
      </div>

      {/* Custom Alert Component */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            {/* Logo and Title */}
            <div className="text-center mb-4">
              <img 
                src={logo} 
                alt="Masjid Council Kerala" 
                className="h-12 w-auto mx-auto mb-3"
              />
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Anek Malayalam Variable" }}>
                {alertType === 'success' && 'വിജയം'}
                {alertType === 'error' && 'പിശക്'}
                {alertType === 'warning' && 'മുന്നറിയിപ്പ്'}
              </h3>
            </div>

            {/* Status Icon */}
            <div className="flex justify-center mb-4">
              {alertType === 'success' && (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {alertType === 'error' && (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {alertType === 'warning' && (
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-700" style={{ fontFamily: "Anek Malayalam Variable" }}>
                {alertMessage}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={hideAlert}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  alertType === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  alertType === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
                style={{ fontFamily: "Anek Malayalam Variable" }}
              >
                ശരി
              </button>
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
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                നിങ്ങൾ ഉപേക്ഷിക്കുന്നത് ഉറപ്പാണോ? നിങ്ങൾ നൽകിയ എല്ലാ വിവരങ്ങളും നഷ്ടമാകും.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
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
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ദയവായി നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കുക:
              </p>
              
              {/* Form Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      മസ്ജിദിന്റെ പേര്:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.mosqueName || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      എം സി കെ അഫിലിയേഷൻ:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.mckAffiliation || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      സഹായ ആവശ്യം:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.helpPurpose || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      പ്രതീക്ഷിക്കുന്ന ചെലവ്:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      ₹{formData.expectedExpense || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                ഈ വിവരങ്ങൾ ശരിയാണെങ്കിൽ "സമർപ്പിക്കുക" ക്ലിക്ക് ചെയ്യുക. തിരുത്താൻ ആഗ്രഹിക്കുന്നുവെങ്കിൽ "തിരുത്തുക" ക്ലിക്ക് ചെയ്യുക.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeSubmitModal}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  തിരുത്തുക
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
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

export default MosqueFundForm;