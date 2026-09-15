// OCR Service - Text extraction, segment recognition, and multi-language translations
import { OCRSample } from '../types';

export const OCR_SAMPLES: OCRSample[] = [
  {
    id: 'entrance-sign',
    title: 'Main Entrance & Accessibility Sign',
    category: 'Signage & Directions',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    rawText: 'MAIN ENTRANCE\nOpen 9:00 AM – 6:00 PM\nReception →\nWheelchair Ramp on Left',
    segments: [
      {
        id: 'seg-1',
        text: 'MAIN ENTRANCE',
        category: 'header',
        box: { top: 15, left: 10, width: 80, height: 18 },
      },
      {
        id: 'seg-2',
        text: 'Open 9:00 AM – 6:00 PM',
        category: 'detail',
        box: { top: 38, left: 12, width: 76, height: 14 },
      },
      {
        id: 'seg-3',
        text: 'Reception →',
        category: 'instruction',
        box: { top: 58, left: 15, width: 50, height: 16 },
      },
      {
        id: 'seg-4',
        text: 'Wheelchair Ramp on Left',
        category: 'warning',
        box: { top: 78, left: 12, width: 76, height: 14 },
      },
    ],
    translations: {
      en: {
        title: 'Main Entrance & Directions',
        text: 'MAIN ENTRANCE\nOpen 9:00 AM – 6:00 PM\nReception →\nWheelchair Ramp on Left',
        spokenSummary: 'Main Entrance. Open 9:00 AM to 6:00 PM. Reception is to the right. Wheelchair ramp is located on the left.',
      },
      ta: {
        title: 'முதன்மை நுழைவாயில் மற்றும் வழிகாட்டுதல்',
        text: 'முதன்மை நுழைவாயில்\nதிறக்கும் நேரம்: காலை 9:00 – மாலை 6:00\nவரவேற்பறை →\nஇடதுபுறம் சக்கர நாற்காலி சாய்வுப் பாதை',
        spokenSummary: 'முதன்மை நுழைவாயில். திறக்கும் நேரம் காலை 9:00 மணி முதல் மாலை 6:00 மணி வரை. வரவேற்பறை வலதுபுறம் உள்ளது. இடதுபுறம் சக்கர நாற்காலி பாதை உள்ளது.',
      },
      hi: {
        title: 'मुख्य प्रवेश द्वार और दिशा निर्देश',
        text: 'मुख्य प्रवेश द्वार\nसमय: सुबह 9:00 – शाम 6:00\nस्वागत कक्ष →\nबाईं ओर व्हीलचेयर रैंप',
        spokenSummary: 'मुख्य प्रवेश द्वार। खुलने का समय सुबह 9:00 से शाम 6:00 बजे तक। स्वागत कक्ष दाईं ओर है। व्हीलचेयर रैंप बाईं ओर उपलब्ध है।',
      },
      ml: {
        title: 'പ്രധാന പ്രവേശന കവാടവും ദിശാസൂചനയും',
        text: 'പ്രധാന പ്രവേശന കവാടം\nപ്രവൃത്തി സമയം: രാവിലെ 9:00 – വൈകിട്ട് 6:00\nസ്വീകരണ മുറി →\nഇടതുവശത്ത് വീൽചെയർ റാമ്പ്',
        spokenSummary: 'പ്രധാന പ്രവേശന കവാടം. പ്രവൃത്തി സമയം രാവിലെ ഒൻപത് മണി മുതൽ വൈകിട്ട് ആറ് മണി വരെ. റിസപ്ഷൻ വലതുവശത്ത്. വീൽചെയർ റാമ്പ് ഇടതുവശത്ത് സ്ഥിതിചെയ്യുന്നു.',
      },
      te: {
        title: 'ప్రధాన ప్రవేశ ద్వారము మరియు దిశానిర్దేశం',
        text: 'ప్రధాన ప్రవేశ ద్వారం\nతెరిచే సమయం: ఉదయం 9:00 – సాయంత్రం 6:00\nరిసెప్షన్ →\nఎడమవైపు వీల్ చైర్ ర్యాంప్ అందుబాటులో ఉంది',
        spokenSummary: 'ప్రధాన ప్రవేశ ద్వారం. తెరిచే వేళలు ఉదయం తొమ్మిది నుండి సాయంత్రం ఆరు గంటల వరకు. రిసెప్షన్ కుడివైపున ఉంది. ఎడమవైపు వీల్ చైర్ ర్యాంప్ ఉంది.',
      },
    },
  },
  {
    id: 'medicine-bottle',
    title: 'Prescription Medication Instructions',
    category: 'Healthcare & Medicine',
    previewUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    rawText: 'AMOXICILLIN 500mg\nTake 1 capsule every 8 hours with water.\nTake with meals.\nFinish full course of medication.\nKeep out of reach of children.',
    segments: [
      {
        id: 'med-1',
        text: 'AMOXICILLIN 500mg',
        category: 'header',
        box: { top: 15, left: 10, width: 80, height: 16 },
      },
      {
        id: 'med-2',
        text: 'Take 1 capsule every 8 hours with water',
        category: 'instruction',
        box: { top: 36, left: 10, width: 80, height: 18 },
      },
      {
        id: 'med-3',
        text: 'Take with meals',
        category: 'detail',
        box: { top: 58, left: 10, width: 50, height: 14 },
      },
      {
        id: 'med-4',
        text: 'CAUTION: Finish full course of medication',
        category: 'warning',
        box: { top: 76, left: 10, width: 80, height: 16 },
      },
    ],
    translations: {
      en: {
        title: 'Amoxicillin 500mg Instructions',
        text: 'AMOXICILLIN 500mg\nTake 1 capsule every 8 hours with water.\nTake with meals.\nFinish full course of medication.',
        spokenSummary: 'Amoxicillin 500 milligrams. Take one capsule every eight hours with water. Take with meals. Finish full course.',
      },
      ta: {
        title: 'அமாக்சிசிலின் 500 மிகி மருந்து வழிகாட்டுதல்',
        text: 'அமாக்சிசிலின் 500 மிகி\nஒவ்வொரு 8 மணி நேரத்திற்கும் 1 மாத்திரை தண்ணீருடன் உட்கொள்ளவும்.\nஉணவுக்குப் பின் உட்கொள்ளவும்.\nமுழு மாத்திரைப் படிப்பையும் முடிக்கவும்.',
        spokenSummary: 'அமாக்சிசிலின் 500 மில்லிகிராம். ஒவ்வொரு எட்டு மணி நேரத்திற்கும் ஒரு மாத்திரை தண்ணீருடன் எடுத்துக்கொள்ளவும். உணவுக்குப் பின் உட்கொள்ளவும்.',
      },
      hi: {
        title: 'एमोक्सिसिलिन 500 मि.ग्रा. दवा निर्देश',
        text: 'एमोक्सिसिलिन 500 मि.ग्रा.\nहर 8 घंटे में पानी के साथ 1 कैप्सूल लें।\nभोजन के साथ लें।\nदवा का पूरा कोर्स समाप्त करें।',
        spokenSummary: 'एमोक्सिसिलिन 500 मिलीग्राम। हर आठ घंटे में एक कैप्सूल पानी के साथ लें। भोजन के बाद लें।',
      },
      ml: {
        title: 'അമോക്സിസിലിൻ 500 മില്ലിഗ്രാം മരുന്ന് കുറിപ്പ്',
        text: 'അമോക്സിസിലിൻ 500 മില്ലിഗ്രാം\nഓരോ 8 മണിക്കൂറിലും ഒരു ഗുളിക വെള്ളത്തോടൊപ്പം കഴിക്കുക.\nഭക്ഷണത്തോടൊപ്പം കഴിക്കുക.\nകോഴ്സ് പൂർത്തിയാക്കുക.',
        spokenSummary: 'അമോക്സിസിലിൻ 500 മില്ലിഗ്രാം. ഓരോ എട്ട് മണിക്കൂറിലും ഒരു കാപ്സ്യൂൾ വീതം കഴിക്കുക.',
      },
      te: {
        title: 'అమోక్సిసిలిన్ 500 మి.గ్రా మందుల సూచనలు',
        text: 'అమోక్సిసిలిన్ 500 మి.గ్రా\nప్రతి 8 గంటలకు 1 గుళిక నీటితో వేసుకోవాలి.\nభోజనం తర్వాత తీసుకోవాలి.\nకోర్సు పూర్తయ్యే వరకు వాడాలి.',
        spokenSummary: 'అమోక్సిసిలిన్ 500 మిల్లీగ్రాములు. ప్రతి ఎనిమిది గంటలకు ఒక క్యాప్సూల్ నీటితో తీసుకోండి.',
      },
    },
  },
  {
    id: 'cafe-menu',
    title: 'Cafe Drink & Breakfast Menu',
    category: 'Dining & Menus',
    previewUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    rawText: 'ARTISAN COFFEE\nOat Milk Flat White — $4.50\nFilter Coffee — $3.50\nFresh Croissant — $3.80\nGluten-Free Muffin — $4.20\nOrder at counter or request table assistance',
    segments: [
      {
        id: 'menu-1',
        text: 'ARTISAN COFFEE & BAKERY',
        category: 'header',
        box: { top: 12, left: 10, width: 80, height: 16 },
      },
      {
        id: 'menu-2',
        text: 'Oat Milk Flat White — $4.50',
        category: 'detail',
        box: { top: 32, left: 10, width: 80, height: 14 },
      },
      {
        id: 'menu-3',
        text: 'Filter Coffee — $3.50',
        category: 'detail',
        box: { top: 50, left: 10, width: 80, height: 14 },
      },
      {
        id: 'menu-4',
        text: 'Gluten-Free Muffin — $4.20 (Allergen Friendly)',
        category: 'instruction',
        box: { top: 68, left: 10, width: 80, height: 14 },
      },
    ],
    translations: {
      en: {
        title: 'Cafe Menu',
        text: 'Oat Milk Flat White $4.50\nFilter Coffee $3.50\nFresh Croissant $3.80\nGluten-Free Muffin $4.20',
        spokenSummary: 'Menu items include Oat Milk Flat White for 4 dollars 50, Filter Coffee for 3 dollars 50, and Gluten-Free Muffin for 4 dollars 20.',
      },
      ta: {
        title: 'காபி மற்றும் சிற்றுண்டி பட்டியல்',
        text: 'ஓட்ஸ் மில்க் பிளாட் ஒயிட் ₹180\nவடிகட்டிய காபி ₹120\nபுதிய குரோசண்ட் ₹150\nபசையம் இல்லாத கேக் ₹170',
        spokenSummary: 'மெனுவில் ஓட்ஸ் பால் காபி, பில்டர் காபி, மற்றும் பசையம் இல்லாத சிற்றுண்டிகள் உள்ளன.',
      },
      hi: {
        title: 'कैफे मेनू और पेय पदार्थ',
        text: 'ओट मिल्क फ्लैट व्हाइट ₹180\nफ़िल्टर कॉफ़ी ₹120\nताज़ा क्रोइसैंट ₹150\nग्लूटेन-मुक्त मफिन ₹170',
        spokenSummary: 'मेनू में ओट मिल्क कॉफी, फिल्टर कॉफी और ग्लूटेन-फ्री मफिन उपलब्ध हैं।',
      },
      ml: {
        title: 'കഫേ വിഭവങ്ങളുടെ പട്ടിക',
        text: 'ഓട്സ് മിൽക്ക് ഫ്ലാറ്റ് വൈറ്റ് ₹180\nഫിൽട്ടർ കോഫി ₹120\nഫ്രഷ് ക്രൊവാസന്റ് ₹150\nഗ്ലൂട്ടൻ ഫ്രീ മഫിൻ ₹170',
        spokenSummary: 'മെനുവിൽ ഓട്സ് മിൽക്ക് കോഫി, ഫിൽട്ടർ കോഫി എന്നിവ ലഭ്യമാണ്.',
      },
      te: {
        title: 'కేఫ్ మెనూ మరియు పానీయాలు',
        text: 'ఓట్ మిల్క్ ఫ్లాట్ వైట్ ₹180\nఫిల్టర్ కాఫీ ₹120\nఫ్రెష్ క్రోసెంట్ ₹150\nగ్లూటెన్ రహిత మఫిన్ ₹170',
        spokenSummary: 'మెనూలో ఓట్ మిల్క్ కాఫీ, ఫిల్టర్ కాఫీ మరియు తాజా అల్పాహారాలు ఉన్నాయి.',
      },
    },
  },
];

class OCRService {
  getSamples(): OCRSample[] {
    return OCR_SAMPLES;
  }

  getSampleById(id: string): OCRSample {
    return OCR_SAMPLES.find((s) => s.id === id) || OCR_SAMPLES[0];
  }

  simulateImageOCR(file: File): Promise<OCRSample> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        resolve({
          id: `custom-ocr-${Date.now()}`,
          title: `Uploaded Document: ${file.name}`,
          category: 'Uploaded Image',
          previewUrl: previewUrl || OCR_SAMPLES[0].previewUrl,
          rawText: 'ACCESSIBLE RESTROOM\nFloor 2, Corridor West\nDoor width 95cm\nBraille Signage & Emergency Pull Cord Inside',
          segments: [
            { id: 'u1', text: 'ACCESSIBLE RESTROOM', category: 'header', box: { top: 20, left: 10, width: 80, height: 20 } },
            { id: 'u2', text: 'Floor 2, Corridor West', category: 'detail', box: { top: 45, left: 10, width: 80, height: 16 } },
            { id: 'u3', text: 'Door width 95cm - Step-Free', category: 'instruction', box: { top: 65, left: 10, width: 80, height: 16 } },
          ],
          translations: {
            en: {
              title: 'Accessible Restroom Directions',
              text: 'ACCESSIBLE RESTROOM\nFloor 2, Corridor West\nDoor width 95cm with Braille Signage',
              spokenSummary: 'Accessible restroom located on floor 2, corridor west. Door width is 95 centimeters with Braille signage.',
            },
            ta: {
              title: 'மாற்றுத்திறனாளிகளுக்கான கழிப்பறை',
              text: 'அணுகக்கூடிய கழிப்பறை\nதளம் 2, மேற்கு நடைபாதை\nகதவு அகலம் 95 செ.மீ, பிரெய்லி வசதி உள்ளது',
              spokenSummary: 'இரண்டாம் தளத்தில் மாற்றுத்திறனாளிகளுக்கான கழிப்பறை உள்ளது.',
            },
            hi: {
              title: 'सुलभ शौचालय सूचना',
              text: 'सुलभ शौचालय\nमंजिल 2, पश्चिमी गलियारा\nदरवाजे की चौड़ाई 95 सेमी, ब्रेल संकेतक उपलब्ध',
              spokenSummary: 'दूसरी मंजिल पर सुलभ शौचालय उपलब्ध है।',
            },
            ml: {
              title: 'ഭിന്നശേഷി സൗഹൃദ ശുചിമുറി',
              text: 'രണ്ടാം നില, പടിഞ്ഞാറൻ ഇടനാഴി\nവാതിലിന്റെ വീതി 95 സെ.മീ, ബ്രെയിൽ ബോർഡ് ലഭ്യമാണ്',
              spokenSummary: 'രണ്ടാം നിലയിൽ ഭിന്നശേഷി സൗഹൃദ ശുചിമുറി ലഭ്യമാണ്.',
            },
            te: {
              title: 'దివ్యాంగుల విశ్రాంతి గది',
              text: '2వ అంతస్తు, పశ్చిమ కారిడార్\nద్వారం వెడల్పు 95 సెం.మీ, బ్రెయిలీ సంకేతాలు ఉన్నాయి',
              spokenSummary: 'రెండవ అంతస్తులో దివ్యాంగుల సౌకర్యవంతమైన విశ్రాంతి గది ఉంది.',
            },
          },
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

export const ocrService = new OCRService();
