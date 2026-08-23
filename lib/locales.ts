export const locales = {
  en: { label: "English", native: "English" },
  hi: { label: "Hindi", native: "हिन्दी" },
  bn: { label: "Bengali", native: "বাংলা" },
  gu: { label: "Gujarati", native: "ગુજરાતી" },
  kn: { label: "Kannada", native: "ಕನ್ನಡ" },
  mr: { label: "Marathi", native: "मराठी" },
  ta: { label: "Tamil", native: "தமிழ்" },
  te: { label: "Telugu", native: "తెలుగు" },
} as const;

export type Locale = keyof typeof locales;

type Copy = {
  start: string;
  language: string;
  safety: string;
  next: string;
  back: string;
  dashboard: string;
  evidence: string;
  submit: string;
  timeline: string;
  complete: string;
  reset: string;
  synthetic: string;
  notOfficial: string;
  currentOwner: string;
  download: string;
};

export const copy: Record<Locale, Copy> = {
  en: { start: "Start the demo", language: "Language", safety: "Your money is safe in this synthetic scenario. It is awaiting record correction, not lost.", next: "Continue", back: "Back", dashboard: "Transfer dashboard", evidence: "Evidence", submit: "Submit correction request", timeline: "Case timeline", complete: "Transfer complete", reset: "Reset demo", synthetic: "Synthetic prototype", notOfficial: "Independent prototype — not an official EPFO service", currentOwner: "Current owner", download: "Download resolution summary" },
  hi: { start: "डेमो शुरू करें", language: "भाषा", safety: "इस काल्पनिक मामले में आपका धन सुरक्षित है। यह रिकॉर्ड सुधार की प्रतीक्षा में है, खोया नहीं है।", next: "आगे बढ़ें", back: "वापस", dashboard: "ट्रांसफर डैशबोर्ड", evidence: "साक्ष्य", submit: "सुधार अनुरोध भेजें", timeline: "मामले की समयरेखा", complete: "ट्रांसफर पूरा हुआ", reset: "डेमो रीसेट करें", synthetic: "काल्पनिक प्रोटोटाइप", notOfficial: "स्वतंत्र प्रोटोटाइप — यह आधिकारिक EPFO सेवा नहीं है", currentOwner: "वर्तमान जिम्मेदार", download: "समाधान सारांश डाउनलोड करें" },
  bn: { start: "ডেমো শুরু করুন", language: "ভাষা", safety: "এই কাল্পনিক ক্ষেত্রে আপনার অর্থ নিরাপদ। এটি রেকর্ড সংশোধনের অপেক্ষায় আছে, হারিয়ে যায়নি।", next: "এগিয়ে যান", back: "ফিরে যান", dashboard: "ট্রান্সফার ড্যাশবোর্ড", evidence: "প্রমাণ", submit: "সংশোধনের অনুরোধ পাঠান", timeline: "মামলার সময়রেখা", complete: "ট্রান্সফার সম্পন্ন", reset: "ডেমো রিসেট করুন", synthetic: "কাল্পনিক প্রোটোটাইপ", notOfficial: "স্বাধীন প্রোটোটাইপ — এটি EPFO-র আনুষ্ঠানিক পরিষেবা নয়", currentOwner: "বর্তমান দায়িত্বপ্রাপ্ত", download: "সমাধানের সারাংশ ডাউনলোড করুন" },
  gu: { start: "ડેમો શરૂ કરો", language: "ભાષા", safety: "આ કાલ્પનિક કેસમાં તમારું નાણું સુરક્ષિત છે. તે રેકોર્ડ સુધારાની રાહમાં છે, ખોવાયું નથી.", next: "આગળ વધો", back: "પાછળ", dashboard: "ટ્રાન્સફર ડેશબોર્ડ", evidence: "પુરાવા", submit: "સુધારાની વિનંતી મોકલો", timeline: "કેસ સમયરેખા", complete: "ટ્રાન્સફર પૂર્ણ", reset: "ડેમો રીસેટ કરો", synthetic: "કાલ્પનિક પ્રોટોટાઇપ", notOfficial: "સ્વતંત્ર પ્રોટોટાઇપ — સત્તાવાર EPFO સેવા નથી", currentOwner: "વર્તમાન જવાબદાર", download: "નિરાકરણ સારાંશ ડાઉનલોડ કરો" },
  kn: { start: "ಡೆಮೊ ಆರಂಭಿಸಿ", language: "ಭಾಷೆ", safety: "ಈ ಕಾಲ್ಪನಿಕ ಪ್ರಕರಣದಲ್ಲಿ ನಿಮ್ಮ ಹಣ ಸುರಕ್ಷಿತವಾಗಿದೆ. ಅದು ದಾಖಲೆ ತಿದ್ದುಪಡಿಯ ನಿರೀಕ್ಷೆಯಲ್ಲಿದೆ, ಕಳೆದುಹೋಗಿಲ್ಲ.", next: "ಮುಂದುವರಿಸಿ", back: "ಹಿಂದೆ", dashboard: "ವರ್ಗಾವಣೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", evidence: "ದಾಖಲೆಗಳು", submit: "ತಿದ್ದುಪಡಿ ವಿನಂತಿ ಸಲ್ಲಿಸಿ", timeline: "ಪ್ರಕರಣದ ಸಮಯರೇಖೆ", complete: "ವರ್ಗಾವಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ", reset: "ಡೆಮೊ ಮರುಹೊಂದಿಸಿ", synthetic: "ಕಾಲ್ಪನಿಕ ಪ್ರೋಟೋಟೈಪ್", notOfficial: "ಸ್ವತಂತ್ರ ಪ್ರೋಟೋಟೈಪ್ — ಅಧಿಕೃತ EPFO ಸೇವೆಯಲ್ಲ", currentOwner: "ಪ್ರಸ್ತುತ ಹೊಣೆಗಾರ", download: "ಪರಿಹಾರ ಸಾರಾಂಶ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ" },
  mr: { start: "डेमो सुरू करा", language: "भाषा", safety: "या काल्पनिक प्रकरणात तुमचे पैसे सुरक्षित आहेत. ते नोंद दुरुस्तीच्या प्रतीक्षेत आहेत, हरवलेले नाहीत.", next: "पुढे जा", back: "मागे", dashboard: "ट्रान्सफर डॅशबोर्ड", evidence: "पुरावे", submit: "दुरुस्ती विनंती पाठवा", timeline: "केसची कालरेषा", complete: "ट्रान्सफर पूर्ण", reset: "डेमो रीसेट करा", synthetic: "काल्पनिक प्रोटोटाइप", notOfficial: "स्वतंत्र प्रोटोटाइप — अधिकृत EPFO सेवा नाही", currentOwner: "सध्याचा जबाबदार", download: "निराकरण सारांश डाउनलोड करा" },
  ta: { start: "டெமோவைத் தொடங்குங்கள்", language: "மொழி", safety: "இந்த கற்பனை வழக்கில் உங்கள் பணம் பாதுகாப்பாக உள்ளது. அது பதிவுத் திருத்தத்திற்காக காத்திருக்கிறது; இழக்கப்படவில்லை.", next: "தொடரவும்", back: "பின்", dashboard: "பரிமாற்ற டாஷ்போர்டு", evidence: "ஆதாரம்", submit: "திருத்தக் கோரிக்கையை அனுப்பவும்", timeline: "வழக்கு காலவரிசை", complete: "பரிமாற்றம் முடிந்தது", reset: "டெமோவை மீட்டமை", synthetic: "கற்பனை முன்மாதிரி", notOfficial: "சுயாதீன முன்மாதிரி — அதிகாரப்பூர்வ EPFO சேவை அல்ல", currentOwner: "தற்போதைய பொறுப்பாளர்", download: "தீர்வு சுருக்கத்தைப் பதிவிறக்கவும்" },
  te: { start: "డెమో ప్రారంభించండి", language: "భాష", safety: "ఈ కల్పిత కేసులో మీ డబ్బు సురక్షితంగా ఉంది. ఇది రికార్డు సవరణ కోసం వేచి ఉంది, పోయిపోలేదు.", next: "కొనసాగించండి", back: "వెనుకకు", dashboard: "బదిలీ డ్యాష్‌బోర్డ్", evidence: "ఆధారాలు", submit: "సవరణ అభ్యర్థన పంపండి", timeline: "కేసు కాలక్రమం", complete: "బదిలీ పూర్తయింది", reset: "డెమో రీసెట్ చేయండి", synthetic: "కల్పిత నమూనా", notOfficial: "స్వతంత్ర నమూనా — అధికారిక EPFO సేవ కాదు", currentOwner: "ప్రస్తుత బాధ్యుడు", download: "పరిష్కార సారాంశం డౌన్‌లోడ్ చేయండి" },
};
