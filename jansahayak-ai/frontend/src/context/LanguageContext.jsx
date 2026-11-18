/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    // Nav
    appName: 'JanSahayak AI',
    appSub: 'Public Grievance Intelligence & Incident Coordination System',
    portalTitle: 'National Grievance Portal',
    navHome: 'Home',
    navRegister: 'Register Grievance',
    navTrack: 'Track Grievance',
    navOfficer: 'Officer Portal',
    navIncidents: 'Incidents & Clusters',
    switchLang: 'हिंदी में देखें',
    backendOnline: 'Backend Online',
    backendOffline: 'Backend Disconnected',

    // Citizen Home
    heroBadge: 'Govt. of India Initiative • AI Powered Redressal',
    heroTitle: 'Voice Your Civic Concerns. Get Swift Resolution.',
    heroDesc: 'JanSahayak AI connects citizens with public administration. Experience automated department classification, real-time tracking, and proactive incident response.',
    btnFileGrievance: 'Register New Grievance',
    btnTrackStatus: 'Track Existing Grievance',
    howItWorks: 'How JanSahayak AI Works',
    step1Title: 'Submit Grievance',
    step1Desc: 'Describe your issue in English or Hindi. Our AI assistant analyzes urgency & department.',
    step2Title: 'Intelligent Routing',
    step2Desc: 'Automated matching routes your grievance directly to the responsible local authority.',
    step3Title: 'Transparent Tracking',
    step3Desc: 'Follow progress in real time with SMS/Reference ID updates at each resolution stage.',

    // Registration Form
    regHeading: 'Register Citizen Grievance',
    regSubheading: 'Submit your civic issue. Accurate details help our AI system dispatch prompt action.',
    titleLabel: 'Grievance Title',
    titlePlaceholder: 'e.g., Pothole on MG Road causing traffic accidents',
    descLabel: 'Detailed Description',
    descPlaceholder: 'Provide location landmarks, duration of issue, severity, and any hazards...',
    langLabel: 'Preferred Language',
    districtLabel: 'District',
    districtPlaceholder: 'Select or enter district (e.g., Bhopal, Indore)',
    localityLabel: 'Locality / Ward / Mohalla',
    localityPlaceholder: 'e.g., Sector 4, Arera Colony, Near Community Hall',
    categoryLabel: 'Category',
    priorityLabel: 'Priority Level',
    deptLabel: 'Assigned Department',
    deptSelectPlaceholder: 'Select Department (or use AI Recommendation)',
    submitBtn: 'Submit Grievance to Administration',
    submittingBtn: 'Submitting Grievance...',
    aiCopilotTitle: 'JanSahayak AI Copilot',
    aiCopilotDesc: 'Analyzing grievance context in real time...',
    aiSuggestedDept: 'Recommended Department',
    aiSuggestedPriority: 'Detected Priority',
    aiConfidence: 'AI Confidence',
    aiApply: 'Apply AI Recommendations',
    aiHazards: 'Safety Hazard Detected',

    // Success Screen
    successTitle: 'Grievance Successfully Registered',
    successDesc: 'Your complaint has been assigned a unique Reference ID and routed to the department.',
    refIdLabel: 'Your Grievance Reference ID',
    copyId: 'Copy Reference ID',
    copied: 'Copied!',
    trackNow: 'Track This Grievance Now',
    registerAnother: 'Register Another Grievance',

    // Track Form
    trackHeading: 'Track Grievance Status',
    trackSubheading: 'Enter your Reference ID (e.g., JS-A1B2C3D4) to check live progress and action history.',
    trackInputPlaceholder: 'Enter Reference ID (e.g. JS-ABC12345)',
    trackBtn: 'Check Status',
    trackingBtn: 'Locating Record...',
    notFoundTitle: 'Grievance Record Not Found',
    notFoundDesc: 'No record matches this reference number. Please check the ID or contact administration.',

    // Statuses
    statusSubmitted: 'Submitted',
    statusUnderReview: 'Under Review',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    statusRejected: 'Rejected',

    // Priorities
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical',

    // Officer Portal
    officerHeading: 'Officer Intelligence Dashboard',
    officerSub: 'District Public Grievance Redressal & Incident Command Cell',
    totalComplaints: 'Total Registered',
    pendingReview: 'Under Review',
    activeAction: 'In Progress',
    resolvedComplaints: 'Resolved & Closed',
    criticalAlerts: 'Critical / High Alerts',
    filterByStatus: 'Filter Status',
    filterByPriority: 'Filter Priority',
    filterByDept: 'Filter Department',
    searchPlaceholder: 'Search by Ref ID, Title, Locality...',
    updateStatusBtn: 'Update Status',
    viewDetails: 'View Details',
    incidentDetection: 'Incident Clusters Detected',
  },
  hi: {
    // Nav
    appName: 'जनसहायक AI',
    appSub: 'लोक शिकायत निवारण एवं घटना समन्वय प्रणाली',
    portalTitle: 'राष्ट्रीय जन शिकायत पोर्टल',
    navHome: 'मुख्य पृष्ठ',
    navRegister: 'शिकायत दर्ज करें',
    navTrack: 'शिकायत ट्रैक करें',
    navOfficer: 'अधिकारी पोर्टल',
    navIncidents: 'घटनाएं एवं समूह',
    switchLang: 'View in English',
    backendOnline: 'सर्वर सक्रिय',
    backendOffline: 'सर्वर संपर्क टूटा',

    // Citizen Home
    heroBadge: 'भारत सरकार की पहल • AI संचालित निवारण',
    heroTitle: 'अपनी जन समस्याओं को पहुंचाएं सही विभाग तक।',
    heroDesc: 'जनसहायक AI नागरिकों को सीधे प्रशासन से जोड़ता है। स्वचालित विभाग पहचान, वास्तविक समय ट्रैकिंग और त्वरित समाधान का अनुभव करें।',
    btnFileGrievance: 'नई शिकायत दर्ज करें',
    btnTrackStatus: 'शिकायत की स्थिति जांचें',
    howItWorks: 'जनसहायक AI कैसे कार्य करता है',
    step1Title: 'शिकायत दर्ज करें',
    step1Desc: 'हिंदी या अंग्रेजी में समस्या बताएं। हमारा AI विभाग और गंभीरता की पहचान करता है।',
    step2Title: 'स्मार्ट प्रेषण',
    step2Desc: 'स्वचालित मिलान आपकी शिकायत को सीधे संबंधित स्थानीय अधिकारी तक पहुंचाता है।',
    step3Title: 'पारदर्शी निगरानी',
    step3Desc: 'प्रत्येक चरण पर संदर्भ आईडी के माध्यम से निवारण की स्थिति सीधे देखें।',

    // Registration Form
    regHeading: 'नागरिक शिकायत पंजीकरण',
    regSubheading: 'अपनी नागरिक समस्या दर्ज करें। सटीक विवरण से AI प्रणाली तुरंत कार्रवाई सुनिश्चित करती है।',
    titleLabel: 'शिकायत का शीर्षक',
    titlePlaceholder: 'उदा. मुख्य मार्ग पर गड्ढे के कारण दुर्घटना की आशंका',
    descLabel: 'विस्तृत विवरण',
    descPlaceholder: 'स्थान, लैंडमार्क, समस्या की अवधि और खतरे का विवरण दें...',
    langLabel: 'पसंदीदा भाषा',
    districtLabel: 'जिला',
    districtPlaceholder: 'जिला चुनें या लिखें (उदा. भोपाल, इंदौर)',
    localityLabel: 'इलाका / वार्ड / मोहल्ला',
    localityPlaceholder: 'उदा. सेक्टर 4, अरेरा कॉलोनी, कम्युनिटी हॉल के पास',
    categoryLabel: 'श्रेणी',
    priorityLabel: 'प्राथमिकता स्तर',
    deptLabel: 'संबंधित विभाग',
    deptSelectPlaceholder: 'विभाग चुनें (या AI अनुशंसा अपनाएं)',
    submitBtn: 'प्रशासन को शिकायत भेजें',
    submittingBtn: 'शिकायत भेजी जा रही है...',
    aiCopilotTitle: 'जनसहायक AI सहायक',
    aiCopilotDesc: 'शिकायत संदर्भ का लाइव विश्लेषण हो रहा है...',
    aiSuggestedDept: 'अनुशंसित विभाग',
    aiSuggestedPriority: 'पहचानी गई प्राथमिकता',
    aiConfidence: 'AI सटीकता',
    aiApply: 'AI सुझाव लागू करें',
    aiHazards: 'सुरक्षा जोखिम पहचाना गया',

    // Success Screen
    successTitle: 'शिकायत सफलतापूर्वक दर्ज हो गई',
    successDesc: 'आपकी शिकायत को संदर्भ आईडी दी गई है और संबंधित विभाग को भेज दिया गया है।',
    refIdLabel: 'आपकी शिकायत संदर्भ आईडी',
    copyId: 'आईडी कॉपी करें',
    copied: 'कॉपी हो गई!',
    trackNow: 'अभी स्थिति देखें',
    registerAnother: 'अन्य शिकायत दर्ज करें',

    // Track Form
    trackHeading: 'शिकायत की स्थिति ट्रैक करें',
    trackSubheading: 'अपनी संदर्भ आईडी दर्ज करें (उदा. JS-A1B2C3D4) और लाइव प्रगति देखें।',
    trackInputPlaceholder: 'संदर्भ आईडी दर्ज करें (उदा. JS-ABC12345)',
    trackBtn: 'स्थिति देखें',
    trackingBtn: 'रिकॉर्ड खोज रहे हैं...',
    notFoundTitle: 'शिकायत रिकॉर्ड नहीं मिला',
    notFoundDesc: 'इस संदर्भ संख्या का कोई रिकॉर्ड उपलब्ध नहीं है। कृपया आईडी दोबारा जांचें।',

    // Statuses
    statusSubmitted: 'दर्ज (Submitted)',
    statusUnderReview: 'समीक्षाधीन (Under Review)',
    statusInProgress: 'प्रगति पर (In Progress)',
    statusResolved: 'निराकृत (Resolved)',
    statusClosed: 'समाप्त (Closed)',
    statusRejected: 'अस्वीकृत (Rejected)',

    // Priorities
    priorityLow: 'निम्न (Low)',
    priorityMedium: 'मध्यम (Medium)',
    priorityHigh: 'उच्च (High)',
    priorityCritical: 'अति-गंभीर (Critical)',

    // Officer Portal
    officerHeading: 'अधिकारी नियंत्रण डैशबोर्ड',
    officerSub: 'जिला लोक शिकायत निवारण एवं घटना समन्वय केंद्र',
    totalComplaints: 'कुल दर्ज शिकायतें',
    pendingReview: 'समीक्षाधीन',
    activeAction: 'कार्य प्रगति पर',
    resolvedComplaints: 'निराकृत एवं पूर्ण',
    criticalAlerts: 'अति-गंभीर / उच्च चेतावनी',
    filterByStatus: 'स्थिति अनुसार फ़िल्टर',
    filterByPriority: 'प्राथमिकता अनुसार',
    filterByDept: 'विभाग अनुसार',
    searchPlaceholder: 'आईडी, शीर्षक या इलाके से खोजें...',
    updateStatusBtn: 'स्थिति बदलें',
    viewDetails: 'विवरण देखें',
    incidentDetection: 'पहचाने गए घटना समूह',
  },
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'))
  }

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
