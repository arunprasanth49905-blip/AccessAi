import {
  OcrExtractInput,
  OcrResult,
  OcrSimplifyRequest,
  OcrSimplifyResponse,
  OcrTranslateRequest,
  OcrTranslateResponse,
} from '../../types/ocr.types.js';

export interface IDemoOcrSample {
  id: string;
  title: string;
  category: string;
  text: string;
  detectedLanguage: string;
  confidence: number;
  translations: Record<string, string>;
  simplified: string;
}

export const DEMO_OCR_SAMPLES: IDemoOcrSample[] = [
  {
    id: 'railway-sign',
    title: 'Railway Platform Sign',
    category: 'Transit & Wayfinding',
    text: 'Platform 2\nChennai Central\nTrain departs at 7:30 PM\nNext Stop: Arakkonam',
    detectedLanguage: 'en',
    confidence: 0.94,
    simplified: 'Platform 2. Chennai Central. Train departs at 7:30 PM. Next stop is Arakkonam.',
    translations: {
      en: 'Platform 2\nChennai Central\nTrain departs at 7:30 PM\nNext Stop: Arakkonam',
      ta: 'பிளாட்பாரம் 2\nசென்னை சென்ட்ரல்\nரயில் மாலை 7:30 மணிக்கு புறப்படும்\nஅடுத்த நிறுத்தம்: அரக்கோணம்',
      hi: 'प्लेटफॉर्म 2\nचेन्नई सेंट्रल\nट्रेन शाम 7:30 बजे रवाना होगी\nअगला पड़ाव: अराक्कोणम',
      ml: 'പ്ലാറ്റ്ഫോം 2\nചെന്നൈ സെൻട്രൽ\nട്രെയിൻ വൈകുന്നേരം 7:30-ന് പുറപ്പെടുന്നു\nഅടുത്ത സ്റ്റോപ്പ്: അരക്കോണം',
      te: 'ప్లాట్‌ఫారమ్ 2\nచెన్నై సెంట్రల్\nరైలు సాయంత్రం 7:30 గంటలకు బయలుదేరుతుంది\nతదుపరి స్టాప్: అరక్కోణం',
    },
  },
  {
    id: 'accessible-entrance',
    title: 'Public Building Notice',
    category: 'Accessibility & Entry',
    text: 'ACCESSIBLE ENTRANCE\nElevator to All Floors on Left\nBraille Signage & Tactile Paving Available\nOperating Hours: 8:00 AM – 8:00 PM',
    detectedLanguage: 'en',
    confidence: 0.95,
    simplified: 'Accessible entrance. Elevator is on the left. Braille signs and tactile paving available. Open 8:00 AM to 8:00 PM.',
    translations: {
      en: 'ACCESSIBLE ENTRANCE\nElevator to All Floors on Left\nBraille Signage & Tactile Paving Available\nOperating Hours: 8:00 AM – 8:00 PM',
      ta: 'அணுகக்கூடிய நுழைவாயில்\nஅனைத்து தளங்களுக்கும் லிப்ட் இடதுபுறம் உள்ளது\nபிரெய்லி பலகை மற்றும் தொட்டுணரும் தரை வசதி உள்ளது\nஇயங்கும் நேரம்: காலை 8:00 – இரவு 8:00',
      hi: 'सुलभ प्रवेश द्वार\nसभी मंजिलों के लिए लिफ्ट बाईं ओर है\nब्रेल संकेत और स्पर्शनीय फर्श उपलब्ध\nसमय: सुबह 8:00 – रात 8:00',
      ml: 'പ്രവേശന കവാടം\nഎല്ലാ നിലകളിലേക്കുമുള്ള ലിഫ്റ്റ് ഇടതുവശത്ത്\nബ്രെയിൻ ബോർഡും ടാക്‌ടൈൽ ടൈലുകളും ലഭ്യമാണ്\nസമയം: രാവിലെ 8:00 – രാത്രി 8:00',
      te: 'దివ్యాంగుల ప్రవేశ ద్వారం\nఅన్ని అంతస్తులకు లిఫ్ట్ ఎడమవైపున ఉంది\nబ్రెయిలీ బోర్డు మరియు స్పర్శ టైల్స్ ఉన్నాయి\nసమయం: ఉదయం 8:00 – రాత్రి 8:00',
    },
  },
  {
    id: 'classroom-notice',
    title: 'Classroom Notice',
    category: 'Education',
    text: 'Special Education Class\nRoom 204 • Ground Floor\nAssistance Available at Help Desk',
    detectedLanguage: 'en',
    confidence: 0.92,
    simplified: 'Special education class in Room 204 on the ground floor. Help desk is open for assistance.',
    translations: {
      en: 'Special Education Class\nRoom 204 • Ground Floor\nAssistance Available at Help Desk',
      ta: 'சிறப்புக் கல்வி வகுப்பு\nஅறை 204 • தரைத்தளம்\nஉதவி மையத்தில் வழிகாட்டுதல் கிடைக்கும்',
      hi: 'विशेष शिक्षा कक्षा\nकमरा 204 • भूतल\nहेल्प डेस्क पर सहायता उपलब्ध है',
      ml: 'പ്രത്യേക വിദ്യാഭ്യാസ ക്ലാസ്സ്\nമുറി 204 • ഗ്രൗണ്ട് ഫ്ലോർ\nസഹായ കേന്ദ്രത്തിൽ സഹായം ലഭ്യമാണ്',
      te: 'ప్రత్యేక విద్యా తరగతి\nగది 204 • గ్రౌండ్ ఫ్లోర్\nసహాయ కేంద్రం వద్ద సహాయం అందుబాటులో ఉంది',
    },
  },
  {
    id: 'cafe-menu',
    title: 'Cafe Menu',
    category: 'Dining',
    text: 'ARTISAN COFFEE & SNACKS\nFilter Coffee — ₹120\nOat Milk Chai — ₹150\nGluten-Free Muffin — ₹170\nTable service available on request',
    detectedLanguage: 'en',
    confidence: 0.88,
    simplified: 'Artisan Coffee and Snacks. Filter Coffee ₹120. Oat Milk Chai ₹150. Gluten-Free Muffin ₹170. Table service available on request.',
    translations: {
      en: 'ARTISAN COFFEE & SNACKS\nFilter Coffee — ₹120\nOat Milk Chai — ₹150\nGluten-Free Muffin — ₹170\nTable service available on request',
      ta: 'காபி மற்றும் சிற்றுண்டி\nபில்டர் காபி — ₹120\nஓட்ஸ் பால் தேநீர் — ₹150\nபசையம் இல்லாத மஃபின் — ₹170\nமேஜை சேவை கோரிக்கையின் பேரில் கிடைக்கும்',
      hi: 'कॉफ़ी और स्नैक्स\nफ़िल्टर कॉफ़ी — ₹120\nओट मिल्क चाय — ₹150\nग्लूटेन-मुक्त मफ़िन — ₹170\nअनुरोध पर टेबल सेवा उपलब्ध है',
      ml: 'കോഫിയും ലഘുഭക്ഷണവും\nഫിൽട്ടർ കോഫി — ₹120\nഓട്സ് പാൽ ചായ — ₹150\nഗ്ലൂട്ടൻ ഫ്രീ മഫിൻ — ₹170\nമേശയിൽ സേവനം ലഭ്യമാണ്',
      te: 'కాఫీ మరియు స్నాక్స్\nఫిల్టర్ కాఫీ — ₹120\nఓట్ మిల్క్ టీ — ₹150\nగ్లూటెన్ రహిత మఫిన్ — ₹170\nఅభ్యర్థనపై టేబుల్ సేవ అందుబాటులో ఉంది',
    },
  },
];

export class OcrFallbackProvider {
  /**
   * Deterministic OCR extraction fallback
   */
  async extract(_input: OcrExtractInput): Promise<OcrResult> {
    // Select sample based on context or rotate
    const sample = DEMO_OCR_SAMPLES[0];

    return {
      source: 'demo',
      text: sample.text,
      detectedLanguage: sample.detectedLanguage,
      confidence: sample.confidence,
      confidenceLevel: 'high',
      regions: [],
    };
  }

  /**
   * Deterministic text simplification fallback
   */
  async simplify(input: OcrSimplifyRequest): Promise<OcrSimplifyResponse> {
    const raw = input.text.trim();
    // Check if it matches any demo sample
    const matched = DEMO_OCR_SAMPLES.find((s) => s.text.includes(raw) || raw.includes(s.text));
    if (matched) {
      return {
        text: matched.simplified,
        confidence: 0.92,
      };
    }

    // Generic heuristic simplification: split into sentences, remove excess filler, keep lines short
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const simplifiedText = lines.length > 0 ? lines.join('. ') + '.' : raw;

    return {
      text: simplifiedText,
      confidence: 0.85,
    };
  }

  /**
   * Deterministic translation fallback
   */
  async translate(input: OcrTranslateRequest): Promise<OcrTranslateResponse> {
    const raw = input.text.trim();
    const target = input.targetLanguage;

    // Check if it matches any demo sample
    const matched = DEMO_OCR_SAMPLES.find((s) => s.text.includes(raw) || raw.includes(s.text));
    if (matched && matched.translations[target]) {
      return {
        sourceLanguage: matched.detectedLanguage,
        targetLanguage: target,
        text: matched.translations[target],
        confidence: 0.95,
      };
    }

    // If target is English and source appears to be English, return as-is
    if (target === 'en') {
      return {
        sourceLanguage: 'en',
        targetLanguage: 'en',
        text: raw,
        confidence: 0.9,
      };
    }

    // Dictionary of common accessibility terms for fallback demo
    const dictionary: Record<string, Record<string, string>> = {
      ta: {
        'Platform 2': 'பிளாட்பாரம் 2',
        'Chennai Central': 'சென்னை சென்ட்ரல்',
        'Train departs at 7:30 PM': 'ரயில் மாலை 7:30 மணிக்கு புறப்படும்',
        'Special Education Class': 'சிறப்புக் கல்வி வகுப்பு',
        'Room 204': 'அறை 204',
        'Ground Floor': 'தரைத்தளம்',
        'ACCESSIBLE ENTRANCE': 'அணுகக்கூடிய நுழைவாயில்',
        'Elevator': 'லிப்ட்',
        'Filter Coffee': 'பில்டர் காபி',
        'Restroom': 'கழிப்பறை',
        'Caution': 'எச்சரிக்கை',
      },
      hi: {
        'Platform 2': 'प्लेटफॉर्म 2',
        'Chennai Central': 'चेन्नई सेंट्रल',
        'Train departs at 7:30 PM': 'ट्रेन शाम 7:30 बजे रवाना होगी',
        'Special Education Class': 'विशेष शिक्षा कक्षा',
        'Room 204': 'कमरा 204',
        'Ground Floor': 'भूतल',
        'ACCESSIBLE ENTRANCE': 'सुलभ प्रवेश द्वार',
        'Elevator': 'लिफ्ट',
        'Filter Coffee': 'फ़िल्टर कॉफ़ी',
        'Restroom': 'शौचालय',
        'Caution': 'सावधानी',
      },
      ml: {
        'Platform 2': 'പ്ലാറ്റ്ഫോം 2',
        'Chennai Central': 'ചെന്നൈ സെൻട്രൽ',
        'Train departs at 7:30 PM': 'ട്രെയിൻ വൈകുന്നേരം 7:30-ന് പുറപ്പെടുന്നു',
        'Special Education Class': 'പ്രത്യേക വിദ്യാഭ്യാസ ക്ലാസ്സ്',
        'Room 204': 'മുറി 204',
        'Ground Floor': 'ഗ്രൗണ്ട് ഫ്ലോർ',
        'ACCESSIBLE ENTRANCE': 'പ്രവേശന കവാടം',
        'Elevator': 'ലിഫ്റ്റ്',
        'Filter Coffee': 'ഫിൽട്ടർ കോഫി',
        'Restroom': 'ശുചിമുറി',
        'Caution': 'ജാഗ്രത',
      },
      te: {
        'Platform 2': 'ప్లాట్‌ఫారమ్ 2',
        'Chennai Central': 'చెన్నై సెంట్రల్',
        'Train departs at 7:30 PM': 'రైలు సాయంత్రం 7:30 గంటలకు బయలుదేరుతుంది',
        'Special Education Class': 'ప్రత్యేక విద్యా తరగతి',
        'Room 204': 'గది 204',
        'Ground Floor': 'గ్రౌండ్ ఫ్లోర్',
        'ACCESSIBLE ENTRANCE': 'దివ్యాంగుల ప్రవేశ ద్వారం',
        'Elevator': 'లిఫ్ట్',
        'Filter Coffee': 'ఫిల్టర్ కాఫీ',
        'Restroom': 'విశ్రాంతి గది',
        'Caution': 'హెచ్చరిక',
      },
    };

    let translated = raw;
    const targetDict = dictionary[target] || {};
    for (const [enTerm, localizedTerm] of Object.entries(targetDict)) {
      translated = translated.replace(new RegExp(enTerm, 'gi'), localizedTerm);
    }

    return {
      sourceLanguage: input.sourceLanguage || 'en',
      targetLanguage: target,
      text: translated,
      confidence: 0.85,
    };
  }
}

export const ocrFallbackProvider = new OcrFallbackProvider();
