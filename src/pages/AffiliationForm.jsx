import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, Trash2, X } from "lucide-react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AffiliationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Basic Information
    mosqueName: "",
    mosqueAddress: "",
    localityAddress: "",
    yearStarted: "",

    // Address Details
    completeAddress: "",
    district: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",

    // Jamaat-e-Islami Details
    area: "",
    jamaatDistrict: "",

    // Mosque Facilities
    facilities: [],

    // Cemetery Details
    hasCemetery: "",
    cemeteryDescription: "",

    // Mosque Specialty
    specialtyDescription: "",
    category: "",

    // Juma Participants
    menCount: "",
    womenCount: "",

    // Financial Details
    financialAssets: "",
    incomeSource: "",
    monthlyExpenses: "",

    // Official Records
    maintainsAccounts: "",
    recordsKept: [],

    // Last Year Accounts
    totalIncome: "",
    totalExpense: "",

    // Community Services
    communityServices: [],
    otherServices: "",

    // Managing Committee
    committeeType: "",
    president: { name: "", mobile: "", email: "" },
    secretary: { name: "", mobile: "", email: "" },

    // Staff Details
    staff: [
      {
        number: 1,
        age: "",
        salary: "",
        qualification: "",
        remarks: "",
        work: "",
      },
    ],
    hasOutstateStaff: "",
    followsOutstateProcedures: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  
  // External API data states
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('');
  const [trackingId, setTrackingId] = useState('');
  
  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Submit confirmation modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const facilities = [
    "മദ്രസ",
    "റീഡിംഗ് റൂം",
    "ലൈബ്രറി",
    "ഡിജിറ്റൽ ലൈബ്രറി",
    "ഹോളിഡേ മദ്രസ",
    "ഖുർആൻ സ്റ്റഡിസെൻ്റർ",
    "സകാത്ത് സെല്‍",
    "പലിശരഹിത നിധി",
    "നോട്ടീസ് ബോർഡ്",
    "വനിതാ വേദി",
    "സേവന വേദി",
  ];

  const recordTypes = [
    "അസറ്റ് രജിസ്റ്റർ",
    "വരിസംഖ്യ റസിപ്റ്റ്",
    "പെയ്മെന്‍റ് വൗചർ",
    "സാലറി റസിപ്റ്റ്",
    "ജനന/മരണ രജിസ്റ്റർ",
    "വിവാഹ രജിസ്റ്റർ",
    "വിവാഹ മോചന രജിസ്റ്റര്‍",
    "സ്റ്റാഫ് പെയ്റോള്‍",
    "ഇൻവാഡ്/ ഔട്ട്‍വാഡ് ഫയൽ",
    "ഖബര്‍ രജിസ്റ്റ്റ്‍",
    "ഡേ ബുക്ക്",
  ];

  const communityServices = [
    "പലിശരഹിത നിധി",
    "അയൽകൂട്ടം",
    "അഗതി മന്ദിരങ്ങൾ/ യതീഖാനകൾ",
    "ബ്ലഡ് ബാങ്ക്",
    "പാലിയേറ്റിവ് പ്രവർത്തനങ്ങൾ",
    "തൊഴിൽ പരിശീലനങ്ങൾ",
    "മെഡിക്കൽ ഹെൽപ്",
    "കൗൺസ‌ലിംഗ്",
    "ഡി-അഡിക്ഷൻ സെന്‍റര്‍",
    "സ്കോളർഷിപ്പ്",
    "കരിയർ ഹെൽപ് സെൻ്റർ",
  ];


  // Fallback data for districts
  const getFallbackDistricts = () => [
    { id: 1, name: 'Kozhikode', districtName: 'Kozhikode' },
    { id: 2, name: 'Malappuram', districtName: 'Malappuram' },
    { id: 3, name: 'Kannur', districtName: 'Kannur' },
    { id: 4, name: 'Kasaragod', districtName: 'Kasaragod' },
    { id: 5, name: 'Wayanad', districtName: 'Wayanad' },
    { id: 6, name: 'Thrissur', districtName: 'Thrissur' },
    { id: 7, name: 'Ernakulam', districtName: 'Ernakulam' },
    { id: 8, name: 'Kottayam', districtName: 'Kottayam' },
    { id: 9, name: 'Alappuzha', districtName: 'Alappuzha' },
    { id: 10, name: 'Pathanamthitta', districtName: 'Pathanamthitta' },
    { id: 11, name: 'Kollam', districtName: 'Kollam' },
    { id: 12, name: 'Thiruvananthapuram', districtName: 'Thiruvananthapuram' },
    { id: 13, name: 'Palakkad', districtName: 'Palakkad' },
    { id: 14, name: 'Idukki', districtName: 'Idukki' }
  ];

  // Fallback data for areas
  const getFallbackAreas = () => [
    { id: 1, name: 'Kozhikode City', areaName: 'Kozhikode City' },
    { id: 2, name: 'Feroke', areaName: 'Feroke' },
    { id: 3, name: 'Koyilandy', areaName: 'Koyilandy' },
    { id: 4, name: 'Vadakara', areaName: 'Vadakara' },
    { id: 5, name: 'Thiruvambady', areaName: 'Thiruvambady' },
    { id: 6, name: 'Koduvally', areaName: 'Koduvally' },
    { id: 7, name: 'Balussery', areaName: 'Balussery' },
    { id: 8, name: 'Perambra', areaName: 'Perambra' },
    { id: 9, name: 'Thiruvallur', areaName: 'Thiruvallur' },
    { id: 10, name: 'Elathur', areaName: 'Elathur' }
  ];


  // Fetch districts from external API (Updated for Malarvadi pattern)
  const fetchDistricts = async () => {
    setLoadingDistricts(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/districts`);
      const result = await response.json();
      
      if (result.success && result.districts && Array.isArray(result.districts)) {
        setDistricts(result.districts);
        console.log('Districts loaded from new API:', result.districts);
      } else {
        console.warn('New API failed, using fallback data');
        console.log('API Response:', result);
        setDistricts(getFallbackDistricts());
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      setApiError('Failed to load districts from new API');
      setDistricts(getFallbackDistricts());
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Filter areas by district (client-side filtering like SuperAdminDashboard)
  const filterAreasByDistrict = (districtName) => {
    if (!districtName) {
      setFilteredAreas([]);
      return;
    }

    const filtered = areas.filter(area => 
      (area.district && area.district.title === districtName) || 
      (area.district && area.district.title === '') || 
      !area.district
    );
    
    setFilteredAreas(filtered);
    console.log(`Filtered areas for district ${districtName}:`, filtered);
  };

  // Fetch areas for a specific district using new Malarvadi pattern
  const fetchAreasForDistrict = async (districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/areas/${districtId}`);
      const result = await response.json();
      
      if (result.success && result.areas && Array.isArray(result.areas)) {
        setAreas(result.areas);
        setFilteredAreas(result.areas);
        console.log(`Areas loaded for district ${districtId}:`, result.areas);
        return result.areas;
      } else {
        console.warn(`Failed to fetch areas for district ${districtId}, using fallback`);
        const fallbackAreas = getFallbackAreas();
        setAreas(fallbackAreas);
        setFilteredAreas(fallbackAreas);
        return fallbackAreas;
      }
    } catch (error) {
      console.error(`Error fetching areas for district ${districtId}:`, error);
      const fallbackAreas = getFallbackAreas();
      setAreas(fallbackAreas);
      setFilteredAreas(fallbackAreas);
      return fallbackAreas;
    }
  };

  // Fetch all areas from external API (for initial load) - Updated for Malarvadi pattern
  const fetchAreas = async () => {
    setLoadingAreas(true);
    setApiError(null);
    
    try {
      // Note: The new API requires districtId for areas, so we'll use fallback for now
      // In a real implementation, you'd need to fetch areas per district
      console.warn('New API requires districtId for areas, using fallback data');
      const fallbackAreas = getFallbackAreas();
      setAreas(fallbackAreas);
      setFilteredAreas(fallbackAreas);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setApiError('Failed to load areas from new API');
      const fallbackAreas = getFallbackAreas();
      setAreas(fallbackAreas);
      setFilteredAreas(fallbackAreas);
    } finally {
      setLoadingAreas(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('AffiliationForm mounted, fetching external API data...');
    // Ensure we start with fallback data immediately
    setDistricts(getFallbackDistricts());
    const fallbackAreas = getFallbackAreas();
    setAreas(fallbackAreas);
    setFilteredAreas(fallbackAreas);
    // Then try to fetch from API
    fetchDistricts();
    fetchAreas();
  }, []);


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
    
    // Handle district change to fetch areas dynamically
    if (field === 'district' && value) {
      // Find the district ID to fetch areas
      const selectedDistrict = districts.find(d => 
        (d.title || d.name || d.districtName) === value
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        // If no district ID found, use fallback areas
        const fallbackAreas = getFallbackAreas();
        setAreas(fallbackAreas);
        setFilteredAreas(fallbackAreas);
      }
    }
    
    // Handle jamaat district change to fetch areas dynamically
    if (field === 'jamaatDistrict' && value) {
      // Find the district ID to fetch areas
      const selectedDistrict = districts.find(d => 
        (d.title || d.name || d.districtName) === value
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        // If no district ID found, use fallback areas
        const fallbackAreas = getFallbackAreas();
        setAreas(fallbackAreas);
        setFilteredAreas(fallbackAreas);
      }
    }
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
    validateField(`${parent}.${field}`, value);
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const addStaff = () => {
    setFormData((prev) => ({
      ...prev,
      staff: [
        ...prev.staff,
        {
          number: prev.staff.length + 1,
          age: "",
          salary: "",
          qualification: "",
          remarks: "",
          work: "",
        },
      ],
    }));
  };

  const removeStaff = (index) => {
    setFormData((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index),
    }));
  };

  const handleStaffChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      staff: prev.staff.map((staff, i) =>
        i === index ? { ...staff, [field]: value } : staff
      ),
    }));
  };

  const validateMobileNumber = (number) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePincode = (pincode) => {
    const pincodeRegex = /^[0-9]+$/;
    return pincodeRegex.test(pincode);
  };

  // Modal functions
  const showSuccessModal = (message, id) => {
    setModalType('success');
    setModalMessage(message);
    setTrackingId(id);
    setShowModal(true);
  };

  const showErrorModal = (message) => {
    setModalType('error');
    setModalMessage(message);
    setTrackingId('');
    setShowModal(true);
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

    if (!formData.mosqueAddress || formData.mosqueAddress.trim() === "") {
      errors.mosqueAddress = true;
      hasErrors = true;
    }

    if (!formData.localityAddress || formData.localityAddress.trim() === "") {
      errors.localityAddress = true;
      hasErrors = true;
    }

    if (!formData.yearStarted || formData.yearStarted.trim() === "") {
      errors.yearStarted = true;
      hasErrors = true;
    }

    if (!formData.completeAddress || formData.completeAddress.trim() === "") {
      errors.completeAddress = true;
      hasErrors = true;
    }

    if (!formData.district || formData.district.trim() === "") {
      errors.district = true;
      hasErrors = true;
    }

    if (!formData.pincode || formData.pincode.trim() === "") {
      errors.pincode = true;
      hasErrors = true;
    }

    if (!formData.phone || formData.phone.trim() === "") {
      errors.phone = true;
      hasErrors = true;
    }

    if (!formData.jamaatDistrict || formData.jamaatDistrict.trim() === "") {
      errors.jamaatDistrict = true;
      hasErrors = true;
    }

    if (!formData.area || formData.area.trim() === "") {
      errors.area = true;
      hasErrors = true;
    }

    if (!formData.hasCemetery || formData.hasCemetery.trim() === "") {
      errors.hasCemetery = true;
      hasErrors = true;
    }

    if (!formData.specialtyDescription || formData.specialtyDescription.trim() === "") {
      errors.specialtyDescription = true;
      hasErrors = true;
    }

    if (!formData.category || formData.category.trim() === "") {
      errors.category = true;
      hasErrors = true;
    }

    if (!formData.financialAssets || formData.financialAssets.trim() === "") {
      errors.financialAssets = true;
      hasErrors = true;
    }

    if (!formData.incomeSource || formData.incomeSource.trim() === "") {
      errors.incomeSource = true;
      hasErrors = true;
    }

    if (!formData.monthlyExpenses || formData.monthlyExpenses.trim() === "") {
      errors.monthlyExpenses = true;
      hasErrors = true;
    }

    if (!formData.totalIncome || formData.totalIncome.trim() === "") {
      errors.totalIncome = true;
      hasErrors = true;
    }

    if (!formData.totalExpense || formData.totalExpense.trim() === "") {
      errors.totalExpense = true;
      hasErrors = true;
    }

    if (!formData.committeeType || formData.committeeType.trim() === "") {
      errors.committeeType = true;
      hasErrors = true;
    }

    if (!formData.president.name || formData.president.name.trim() === "") {
      errors.presidentName = true;
      hasErrors = true;
    }

    if (!formData.secretary.name || formData.secretary.name.trim() === "") {
      errors.secretaryName = true;
      hasErrors = true;
    }

    if (!formData.hasOutstateStaff || formData.hasOutstateStaff.trim() === "") {
      errors.hasOutstateStaff = true;
      hasErrors = true;
    }

    if (!formData.followsOutstateProcedures || formData.followsOutstateProcedures.trim() === "") {
      errors.followsOutstateProcedures = true;
      hasErrors = true;
    }

    // Validate mobile numbers if provided
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      errors.phone = true;
      hasErrors = true;
    }

    if (formData.president.mobile && !validateMobileNumber(formData.president.mobile)) {
      errors.presidentMobile = true;
      hasErrors = true;
    }

    if (formData.secretary.mobile && !validateMobileNumber(formData.secretary.mobile)) {
      errors.secretaryMobile = true;
      hasErrors = true;
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = true;
      hasErrors = true;
    }

    if (formData.president.email && !validateEmail(formData.president.email)) {
      errors.presidentEmail = true;
      hasErrors = true;
    }

    if (formData.secretary.email && !validateEmail(formData.secretary.email)) {
      errors.secretaryEmail = true;
      hasErrors = true;
    }

    // Validate pincode if provided
    if (formData.pincode && !validatePincode(formData.pincode)) {
      errors.pincode = true;
      hasErrors = true;
    }

    // Validate staff details - all staff must have required fields
    if (formData.staff && formData.staff.length > 0) {
      for (let i = 0; i < formData.staff.length; i++) {
        const staff = formData.staff[i];
        if (!staff.age || staff.age.trim() === "") {
          errors[`staffAge${i}`] = true;
          hasErrors = true;
        }
        if (!staff.salary || staff.salary.trim() === "") {
          errors[`staffSalary${i}`] = true;
          hasErrors = true;
        }
        if (!staff.qualification || staff.qualification.trim() === "") {
          errors[`staffQualification${i}`] = true;
          hasErrors = true;
        }
      }
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

  const validateField = (fieldName, value) => {
    let isValid = true;

    if (
      fieldName === "phone" ||
      fieldName === "president.mobile" ||
      fieldName === "secretary.mobile"
    ) {
      if (value && !validateMobileNumber(value)) {
        isValid = false;
      }
    }

    if (
      fieldName === "email" ||
      fieldName === "president.email" ||
      fieldName === "secretary.email"
    ) {
      if (value && !validateEmail(value)) {
        isValid = false;
      }
    }

    if (fieldName === "pincode") {
      if (value && !validatePincode(value)) {
        isValid = false;
      }
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: !isValid,
    }));

    return isValid;
  };

  const handleSubmit = async () => {
    console.log("Form submission started...");
    console.log("Form data:", formData);

    // Mobile number validation
    if (formData.phone && !validateMobileNumber(formData.phone)) {
      showErrorModal("ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }

    if (
      formData.president.mobile &&
      !validateMobileNumber(formData.president.mobile)
    ) {
      showErrorModal("ദയവായി പ്രസിഡന്റിന്റെ സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }

    if (
      formData.secretary.mobile &&
      !validateMobileNumber(formData.secretary.mobile)
    ) {
      showErrorModal("ദയവായി സെക്രട്ടറിയുടെ സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക");
      return;
    }

    // Email validation
    if (formData.email && !validateEmail(formData.email)) {
      showErrorModal("ദയവായി സാധുവായ ഇമെയിൽ വിലാസം നൽകുക");
      return;
    }

    if (formData.president.email && !validateEmail(formData.president.email)) {
      showErrorModal("ദയവായി പ്രസിഡന്റിന്റെ സാധുവായ ഇമെയിൽ വിലാസം നൽകുക");
      return;
    }

    if (formData.secretary.email && !validateEmail(formData.secretary.email)) {
      showErrorModal("ദയവായി സെക്രട്ടറിയുടെ സാധുവായ ഇമെയിൽ വിലാസം നൽകുക");
      return;
    }

    // Pincode validation
    if (formData.pincode && !validatePincode(formData.pincode)) {
      showErrorModal("ദയവായി പിൻകോഡിൽ അക്കങ്ങൾ മാത്രം നൽകുക");
      return;
    }

    // Basic validation - Required fields
    if (
      !formData.mosqueName ||
      !formData.mosqueAddress ||
      !formData.localityAddress ||
      !formData.yearStarted
    ) {
      showErrorModal("ദയവായി എല്ലാ അടിസ്ഥാന വിവരങ്ങളും പൂരിപ്പിക്കുക");
      return;
    }

    if (
      !formData.completeAddress ||
      !formData.district ||
      !formData.pincode ||
      !formData.phone
    ) {
      showErrorModal("ദയവായി എല്ലാ വിലാസ വിവരങ്ങളും പൂരിപ്പിക്കുക");
      return;
    }

    // Validate Jamaat-e-Islami section
    if (!formData.jamaatDistrict) {
      showErrorModal("ദയവായി ജമാഅത്തെ ഇസ്‌ലാമി ജില്ല തിരഞ്ഞെടുക്കുക");
      return;
    }

    if (!formData.area) {
      showErrorModal("ദയവായി ജമാഅത്തെ ഇസ്‌ലാമി ഏരിയ തിരഞ്ഞെടുക്കുക");
      return;
    }

    // Additional validation for committee details
    if (!formData.committeeType) {
      showErrorModal("ദയവായി മാനേജിംഗ് കമ്മിറ്റിയുടെ തരം തിരഞ്ഞെടുക്കുക");
      return;
    }

    if (!formData.president.name || !formData.secretary.name) {
      showErrorModal("ദയവായി പ്രസിഡന്റിന്റെയും സെക്രട്ടറിയുടെയും പേര് നൽകുക");
      return;
    }

    // Validate financial details
    if (!formData.financialAssets || formData.financialAssets.trim() === "") {
      showErrorModal("ദയവായി പള്ളിയുടെ സ്ഥാവര-ജംഗമ സ്വത്തുക്കൾ നൽകുക");
      return;
    }

    if (!formData.incomeSource || formData.incomeSource.trim() === "") {
      showErrorModal("ദയവായി വരുമാന മാർഗ്ഗങ്ങൾ നൽകുക");
      return;
    }

    if (!formData.monthlyExpenses || formData.monthlyExpenses.trim() === "") {
      showErrorModal("ദയവായി പ്രതിമാസ ചെലവ് നൽകുക");
      return;
    }

    // Validate account details
    if (!formData.totalIncome || formData.totalIncome.trim() === "") {
      showErrorModal("ദയവായി കഴിഞ്ഞ വർഷത്തെ മൊത്തം വരവ് നൽകുക");
      return;
    }

    if (!formData.totalExpense || formData.totalExpense.trim() === "") {
      showErrorModal("ദയവായി കഴിഞ്ഞ വർഷത്തെ മൊത്തം ചെലവ് നൽകുക");
      return;
    }

    // Validate cemetery field
    if (!formData.hasCemetery) {
      showErrorModal("ദയവായി ഖബറിസ്ഥാൻ ഉണ്ടോ എന്ന് തിരഞ്ഞെടുക്കുക");
      return;
    }

    // Validate mosque capacity and area
    if (!formData.specialtyDescription || formData.specialtyDescription.trim() === "") {
      showErrorModal("ദയവായി പള്ളിയിൽ എത്ര പേർക്ക് നമസ്‌കരിക്കാമെന്ന് നൽകുക");
      return;
    }

    if (!formData.category || formData.category.trim() === "") {
      showErrorModal("ദയവായി പള്ളിയുടെ വിസ്തീർണം നൽകുക");
      return;
    }

    // Validate outstate staff fields
    if (!formData.hasOutstateStaff) {
      showErrorModal("ദയവായി അന്യ സംസ്ഥാന ജീവനക്കാർ ഉണ്ടോ എന്ന് തിരഞ്ഞെടുക്കുക");
      return;
    }

    if (!formData.followsOutstateProcedures) {
      showErrorModal("ദയവായി അന്യ സംസ്ഥാന ജീവനക്കാരെ നിയമിക്കുമ്പോൾ ആവശ്യമായ നടപടിക്രമങ്ങൾ പാലിക്കാറുണ്ടോ എന്ന് തിരഞ്ഞെടുക്കുക");
      return;
    }

    // Validate staff details - all staff must have required fields
    if (formData.staff && formData.staff.length > 0) {
      for (let i = 0; i < formData.staff.length; i++) {
        const staff = formData.staff[i];
        if (!staff.age || staff.age.trim() === "") {
          showErrorModal(`ദയവായി ജീവനക്കാരുടെ വയസ്സ് നൽകുക (വരി ${i + 1})`);
          return;
        }
        if (!staff.salary || staff.salary.trim() === "") {
          showErrorModal(`ദയവായി ജീവനക്കാരുടെ ശമ്പളം നൽകുക (വരി ${i + 1})`);
          return;
        }
        if (!staff.qualification || staff.qualification.trim() === "") {
          showErrorModal(`ദയവായി ജീവനക്കാരുടെ യോഗ്യത നൽകുക (വരി ${i + 1})`);
          return;
        }
      }
    }

    try {
      console.log(
        "Making API call to:",
        `${API_BASE_URL}/api/mosqueAffiliation/create`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/mosqueAffiliation/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const result = await response.json();
      console.log("Response data:", result);
      console.log("Response success:", result.success);
      console.log("Response message:", result.message);

      if (result.success) {
        showSuccessModal(
          "അപേക്ഷ സമർപ്പിച്ചു!",
          result.data.affiliationNumber || 'N/A'
        );
        // Reset form after successful submission
        setFormData({
          mosqueName: "",
          mosqueAddress: "",
          localityAddress: "",
          yearStarted: "",
          completeAddress: "",
          district: "",
          pincode: "",
          phone: "",
          email: "",
          website: "",
          area: "",
          jamaatDistrict: "",
          facilities: [],
          hasCemetery: "",
          cemeteryDescription: "",
          specialtyDescription: "",
          category: "",
          menCount: "",
          womenCount: "",
          financialAssets: "",
          incomeSource: "",
          monthlyExpenses: "",
          maintainsAccounts: "",
          recordsKept: [],
          totalIncome: "",
          totalExpense: "",
          communityServices: [],
          otherServices: "",
          committeeType: "",
          president: { name: "", mobile: "", email: "" },
          secretary: { name: "", mobile: "", email: "" },
          staff: [
            {
              number: 1,
              age: "",
              salary: "",
              qualification: "",
              remarks: "",
              work: "",
            },
          ],
          hasOutstateStaff: "",
          followsOutstateProcedures: "",
        });
      } else {
        console.error("Form submission failed:", result);
        showErrorModal(`പിശക്: ${result.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", error.message);
      showErrorModal(
        "അപേക്ഷ സമർപ്പിക്കുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
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
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Anek Malayalam Variable" }}
              >
                മസ്ജിദ് അഫിലിയേഷനുള്ള അപേക്ഷ
              </h1>
              <p className="text-gray-600">Mosque Affiliation Application</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Anek Malayalam Variable" }}
            >
              അടിസ്ഥാന വിവരങ്ങൾ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  1. പള്ളിയുടെ പേര് <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mosqueName}
                  onChange={(e) =>
                    handleInputChange("mosqueName", e.target.value)
                  }
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.mosqueName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  2. പള്ളിയുടെ സ്വഭാവം <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mosqueAddress}
                  onChange={(e) =>
                    handleInputChange("mosqueAddress", e.target.value)
                  }
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.mosqueAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option
                    value=""
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    തിരഞ്ഞെടുക്കുക
                  </option>
                  <option
                    value="മഹല്ലി പള്ളി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    മഹല്ലി പള്ളി
                  </option>
                  <option
                    value="ജുമുഅത്ത് പള്ളി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ജുമുഅത്ത് പള്ളി
                  </option>
                  <option
                    value="നമസ്ക്‌കാരപള്ളി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    നമസ്ക്‌കാരപള്ളി
                  </option>
                  <option
                    value="ട‌ൗൺ പള്ളി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ട‌ൗൺ പള്ളി
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  3. മഹല്ലിന്‍റെ സ്വഭാവം <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.localityAddress}
                  onChange={(e) =>
                    handleInputChange("localityAddress", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option
                    value=""
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    തിരഞ്ഞെടുക്കുക
                  </option>
                  <option
                    value="പൂർണ മഹല്ല്"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    പൂർണ മഹല്ല്
                  </option>
                  <option
                    value="ഭാഗിക മഹല്ല്"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ഭാഗിക മഹല്ല്
                  </option>
                  <option
                    value="സംയുക്തമഹല്ല്"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    സംയുക്തമഹല്ല്
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  4. പള്ളി പ്രവർത്തനമാരംഭിച്ച വർഷം <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.yearStarted}
                  onChange={(e) =>
                    handleInputChange("yearStarted", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Address Details */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              5. വിലാസ വിവരങ്ങൾ
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  പൂർണ വിലാസം <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.completeAddress}
                  onChange={(e) =>
                    handleInputChange("completeAddress", e.target.value)
                  }
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ജില്ല <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    disabled={loadingDistricts}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                      validationErrors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">
                      {loadingDistricts ? "ലോഡിംഗ്..." : "ജില്ല തിരഞ്ഞെടുക്കുക"}
                    </option>
                    {Array.isArray(districts) && districts.map((district) => (
                      <option key={district.id} value={district.title || district.name || district.districtName}>
                        {district.title || district.name || district.districtName}
                      </option>
                    ))}
                  </select>
                  {apiError && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ {apiError} - Using fallback data
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    പിൻകോഡ് <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (/^\d*$/.test(value)) {
                        handleInputChange("pincode", value);
                      }
                    }}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ഫോൺ നമ്പർ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (/^\d*$/.test(value)) {
                        handleInputChange("phone", value);
                      }
                    }}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.phone
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ഇ മെയിൽ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.email
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    വെബ്സൈറ്റ്
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Jamaat-e-Islami Details */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              6. ജമാഅത്തെ ഇസ്‌ലാമി ഘടകം
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  ജില്ല <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jamaatDistrict}
                  onChange={(e) => {
                    const selectedDistrict = e.target.value;
                    handleInputChange("jamaatDistrict", selectedDistrict);
                    // Clear area when district changes
                    handleInputChange("area", "");
                    // Filter areas for the selected district
                    filterAreasByDistrict(selectedDistrict);
                  }}
                  disabled={loadingDistricts}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingDistricts ? "ലോഡിംഗ്..." : "ജില്ല തിരഞ്ഞെടുക്കുക"}
                  </option>
           {Array.isArray(districts) && districts.map((district) => (
             <option key={district.id} value={district.title || district.name || district.districtName}>
               {district.title || district.name || district.districtName}
             </option>
           ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  ഏരിയ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  disabled={loadingAreas || !formData.jamaatDistrict}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {!formData.jamaatDistrict 
                      ? "ആദ്യം ജില്ല തിരഞ്ഞെടുക്കുക" 
                      : loadingAreas 
                        ? "ലോഡിംഗ്..." 
                        : filteredAreas.length === 0
                          ? "ഈ ജില്ലയിൽ ഏരിയകൾ ഇല്ല"
                          : "ഏരിയ തിരഞ്ഞെടുക്കുക"
                    }
                  </option>
           {Array.isArray(filteredAreas) && filteredAreas.map((area) => (
             <option key={area.id} value={area.title || area.name || area.areaName}>
               {area.title || area.name || area.areaName}
             </option>
           ))}
                </select>
                {/* {!formData.jamaatDistrict && (
                  <p className="text-sm text-gray-500 mt-1">
                    ആദ്യം ജില്ല തിരഞ്ഞെടുക്കുക
                  </p>
                )} */}
                {apiError && (
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ {apiError} - Using fallback data
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Mosque Facilities */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              7. പള്ളിയോടനുബന്ധിച്ച ഇതര സംവിധാനങ്ങൾ
            </h2>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-2 "
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              {facilities.map((facility) => (
                <label key={facility} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() =>
                      handleCheckboxChange("facilities", facility)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{facility}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Cemetery Details */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              8. ഖബറിസ്ഥാൻ വിവരങ്ങൾ
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  ഖബറിസ്ഥാൻ ഉണ്ടോ? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCemetery"
                      value="ഉണ്ട്"
                      checked={formData.hasCemetery === "ഉണ്ട്"}
                      onChange={(e) =>
                        handleInputChange("hasCemetery", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">ഉണ്ട്</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCemetery"
                      value="ഇല്ല"
                      checked={formData.hasCemetery === "ഇല്ല"}
                      onChange={(e) =>
                        handleInputChange("hasCemetery", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">ഇല്ല</span>
                  </label>
                </div>
              </div>
              {formData.hasCemetery === "ഉണ്ട്" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ഉണ്ടങ്കിൽ വിനൂർദ്ദനം എന്ത്
                  </label>
                  <input
                    type="text"
                    value={formData.cemeteryDescription}
                    onChange={(e) =>
                      handleInputChange("cemeteryDescription", e.target.value)
                    }
                    placeholder="വിനൂർദ്ദനം"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Mosque Specialty */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              9. പള്ളിയുടെ ശേഷി
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  പള്ളിയിൽ എത്ര പേർക്ക് നമസ്‌കരിക്കാം? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.specialtyDescription}
                  onChange={(e) =>
                    handleInputChange("specialtyDescription", e.target.value)
                  }
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  വിസ്തീര്‍ണം <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="വർഗ അടി / വർഗ മീറ്റർ"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Juma Participants */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              10. ജുമുഅഅക്ക് പങ്കെടുക്കുന്നവരുടെ ശരാശരി എണ്ണം
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  പുരുഷന്മാർ
                </label>
                <input
                  type="number"
                  value={formData.menCount}
                  onChange={(e) =>
                    handleInputChange("menCount", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  സ്ത്രീകൾ
                </label>
                <input
                  type="number"
                  value={formData.womenCount}
                  onChange={(e) =>
                    handleInputChange("womenCount", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Financial Details */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              11-13. സാമ്പത്തിക വിവരങ്ങൾ
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  11. പള്ളിയുടെ സ്ഥാവര-ജംഗമ സ്വത്തുക്കൾ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.financialAssets}
                  onChange={(e) =>
                    handleInputChange("financialAssets", e.target.value)
                  }
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  12. വരുമാന മാർഗ്ഗങ്ങൾ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.incomeSource}
                  onChange={(e) =>
                    handleInputChange("incomeSource", e.target.value)
                  }
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  13. പ്രതിമാസ ചെലവ് (രൂപ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) =>
                    handleInputChange("monthlyExpenses", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Official Records */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              14-15. ഓഡിറ്റും രേഖകളും
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  14. വരവ് ചെലവ് കണക്കുകൾ കൃത്യമായി ഓഡിറ്റ് ചെയ്യാറാണ്ടോ?
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="maintainsAccounts"
                      value="ഉണ്ട്"
                      checked={formData.maintainsAccounts === "ഉണ്ട്"}
                      onChange={(e) =>
                        handleInputChange("maintainsAccounts", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="ml-2"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ഉണ്ട്
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="maintainsAccounts"
                      value="ഇല്ല"
                      checked={formData.maintainsAccounts === "ഇല്ല"}
                      onChange={(e) =>
                        handleInputChange("maintainsAccounts", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="ml-2"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ഇല്ല
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  15. രേഖകൾ സൂക്ഷിക്കാറുണ്ടോ?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {recordTypes.map((record) => (
                    <label key={record} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.recordsKept.includes(record)}
                        onChange={() =>
                          handleCheckboxChange("recordsKept", record)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{record}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Last Year Accounts */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              16. കഴിഞ്ഞ ഒരു വർഷത്തെ മൊത്തം കണക്ക്
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  വരവ് (രൂപ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalIncome}
                  onChange={(e) =>
                    handleInputChange("totalIncome", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  ചെലവ് (രൂപ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalExpense}
                  onChange={(e) =>
                    handleInputChange("totalExpense", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Community Services */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              17. മഹല്ലിന്‍റെ / പള്ളിയുടെ മേൽനോട്ടത്തിൽ നടക്കുന്ന ജനസേവന
              സംരംഭങ്ങൾ
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {communityServices.map((service) => (
                  <label key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.communityServices.includes(service)}
                      onChange={() =>
                        handleCheckboxChange("communityServices", service)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  മറ്റുള്ളവ
                </label>
                <textarea
                  value={formData.otherServices}
                  onChange={(e) =>
                    handleInputChange("otherServices", e.target.value)
                  }
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Managing Committee */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              31-32. മാനേജിംഗ് കമ്മിറ്റിയും ഭാരവാഹികളും
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  31. മാനേജിംഗ് കമ്മിറ്റിയുടെ പേര് <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.committeeType}
                  onChange={(e) =>
                    handleInputChange("committeeType", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option
                    value=""
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    തിരഞ്ഞെടുക്കുക
                  </option>
                  <option
                    value="ട്രസ്റ്റ്"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    ട്രസ്റ്റ്{" "}
                  </option>
                  <option
                    value="അസോസിയേഷൻ"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    അസോസിയേഷൻ
                  </option>
                  <option
                    value="കമ്മറ്റി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    കമ്മറ്റി
                  </option>
                  <option
                    value="മുതവല്ലി"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    മുതവല്ലി
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3
                    className="font-medium mb-3"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    പ്രസിഡന്‍റ് / ചെയർമാൻ
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="പേര് *"
                      value={formData.president.name}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "president",
                          "name",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.presidentName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="tel"
                      placeholder="മൊബൈൽ"
                      value={formData.president.mobile}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "president",
                          "mobile",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors["president.mobile"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="ഇ മെയിൽ"
                      value={formData.president.email}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "president",
                          "email",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors["president.email"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <h3
                    className="font-medium mb-3"
                    style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                  >
                    സെക്രട്ടറി
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="പേര് *"
                      value={formData.secretary.name}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "secretary",
                          "name",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.secretaryName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="tel"
                      placeholder="മൊബൈൽ"
                      value={formData.secretary.mobile}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "secretary",
                          "mobile",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors["secretary.mobile"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="ഇ മെയിൽ"
                      value={formData.secretary.email}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "secretary",
                          "email",
                          e.target.value
                        )
                      }
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors["secretary.email"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Staff Details */}
          <section>
            <h2
              className="text-xl font-semibold mb-4 text-gray-800"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              34. ജീവനക്കാരുടെ വിവരങ്ങൾ
            </h2>
            <p
              className="text-sm text-gray-600 mb-4"
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
            >
              ഖത്വീബ് ഉൾപെടെ ജീവനക്കാരെ സംബന്ധിച്ച വിവരങ്ങൾ
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      നമ്പർ
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      വയസ്സ് <span className="text-red-500">*</span>
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      സാലറി <span className="text-red-500">*</span>
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      യോഗ്യത <span className="text-red-500">*</span>
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ശമ്പളം
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      റിമാർക്സ്
                    </th>
                    <th
                      className="border border-gray-300 p-2 text-left"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      പ്രവർത്തനം
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.staff.map((staff, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">
                        {staff.number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="number"
                          value={staff.age}
                          onChange={(e) =>
                            handleStaffChange(index, "age", e.target.value)
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={staff.salary}
                          onChange={(e) =>
                            handleStaffChange(index, "salary", e.target.value)
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={staff.qualification}
                          onChange={(e) =>
                            handleStaffChange(
                              index,
                              "qualification",
                              e.target.value
                            )
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={staff.salary}
                          onChange={(e) =>
                            handleStaffChange(index, "salary", e.target.value)
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={staff.remarks}
                          onChange={(e) =>
                            handleStaffChange(index, "remarks", e.target.value)
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={staff.work}
                          onChange={(e) =>
                            handleStaffChange(index, "work", e.target.value)
                          }
                          className="w-full p-1 border border-gray-200 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addStaff}
              className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                പുതിയ ജീവനക്കാരുടെ ചേർക്കുക
              </span>
            </button>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  അന്യ സംസ്ഥാന ജീവനക്കാർ ഉണ്ടോ? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasOutstateStaff"
                      value="ഉണ്ട്"
                      checked={formData.hasOutstateStaff === "ഉണ്ട്"}
                      onChange={(e) =>
                        handleInputChange("hasOutstateStaff", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="ml-2"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ഉണ്ട്
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasOutstateStaff"
                      value="ഇല്ല"
                      checked={formData.hasOutstateStaff === "ഇല്ല"}
                      onChange={(e) =>
                        handleInputChange("hasOutstateStaff", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="ml-2"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ഇല്ല
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                >
                  അന്യ സംസ്ഥാന ജീവനക്കാരെ നിയമിക്കുമ്പോൾ ആവശ്യമായ നടപടിക്രമങ്ങൾ
                  പാലിക്കാറുണ്ടോ/രേഖകൾ സൂക്ഷിക്കാറുണ്ടോ? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                      type="radio"
                      name="followsOutstateProcedures"
                      value="ഉണ്ട്"
                      checked={formData.followsOutstateProcedures === "ഉണ്ട്"}
                      onChange={(e) =>
                        handleInputChange(
                          "followsOutstateProcedures",
                          e.target.value
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">ഉണ്ട്</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                      type="radio"
                      name="followsOutstateProcedures"
                      value="ഇല്ല"
                      checked={formData.followsOutstateProcedures === "ഇല്ല"}
                      onChange={(e) =>
                        handleInputChange(
                          "followsOutstateProcedures",
                          e.target.value
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="ml-2"
                      style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
                    >
                      ഇല്ല
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              റദ്ദാക്കുക
            </button>
            <button
              style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
              onClick={handleSubmitClick}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
            >
              <span>അപേക്ഷ സമർപ്പിക്കുക</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

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
              <p className="text-gray-700 mb-4" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                {modalMessage}
              </p>
              
              {modalType === 'success' && trackingId && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    ട്രാക്കിംഗ് ഐഡി:
                  </p>
                  <p className="text-lg font-bold text-green-900" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
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
                  style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}
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
                      പള്ളിയുടെ പേര്:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.mosqueName || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      ജില്ല:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.district || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      ഫോൺ നമ്പർ:
                    </h4>
                    <p className="text-gray-600">
                      {formData.phone || 'നൽകിയിട്ടില്ല'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      പ്രസിഡന്റ്:
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: "Noto Sans Malayalam, sans-serif" }}>
                      {formData.president.name || 'നൽകിയിട്ടില്ല'}
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

export default AffiliationForm;
