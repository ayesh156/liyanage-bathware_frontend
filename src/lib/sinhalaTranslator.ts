/**
 * Creative English to Sinhala Translation Utility
 * Provides automatic and creative translations for product names and invoice text
 */

// Common building material translations
const buildingMaterialMappings: Record<string, string> = {
  // Steel & Metal
  'steel': 'වානේ',
  'iron': 'යකඩ',
  'copper': 'තඹ',
  'aluminum': 'ඇලුමිනියම්',
  'brass': 'පිත්තල',
  'metal': 'ලෝහ',
  'wire': 'වයිරු',
  'rod': 'දණ්ඩ',
  'pipe': 'පයිපය',
  'tube': 'නලිකා',
  'sheet': 'තහඩු',
  'plate': 'ප්ලේට්',
  'bar': 'බාර්',
  'bolt': 'බෝල්ට්',
  'nut': 'නට්',
  'screw': 'ඉස්කුරුවी',
  'nail': 'ගස්',
  
  // Electrical
  'cable': 'කේබල්',
  'breaker': 'බ්‍රේකර්',
  'switch': 'ස්විච්',
  'socket': 'සොකට්',
  'bulb': 'බල්බ්',
  'light': 'ආලෝකය',
  'electric': 'විදුලි',
  'panel': 'පැනලය',
  
  // Plumbing
  'tap': 'ටැප්',
  'fitting': 'සවිකිරීම',
  'valve': 'කපාటය',
  'pump': 'පම්පය',
  'tank': 'ටැංකිය',
  'sink': 'සින්ක්',
  
  // General Materials
  'paint': 'පින්තුරු',
  'wood': 'දැව',
  'timber': 'කර දැව',
  'brick': 'ඉඩඩ',
  'cement': 'සිමෙන්',
  'sand': 'වැලි',
  'stone': 'ගල්',
  'tile': 'ටයිල්',
  'glass': 'වීදුරු',
  'plastic': 'ප්ලාස්ටික්',
  
  // Tools
  'hammer': 'මhammer',
  'saw': 'කර',
  'drill': 'කෝටුව',
  'wrench': 'එක්සත්',
  'spanner': 'స්පැනර්',
  'plier': 'ප්ලයර්',
  'level': 'නිම්නය',
  'ruler': 'පටිමාණ',
  'tape': 'ටේප්',
  'knife': 'පිත්තල',
  'shovel': 'බෙල්ල',
  'pickaxe': 'පිකස්',
  'axe': 'කිරුණ',
  'broom': 'ඉවුණ',
  
  // Sizes & Dimensions (will be appended to translations)
  'mm': 'මි.මී',
  'cm': 'සෙ.මී',
  'inch': 'අඟල්',
  'foot': 'පාදය',
  'meter': 'මීටර්',
  'kg': 'කි.ග්‍ර',
  'liter': 'ලීටර්',

  // Common Brands & Terms
  'box': 'බොක්ස්',
  'impact': 'ඉම්පැක්ට්',
  'stanley': 'ස්ටැන්ලි',
  'fatmax': 'ෆැට්මැක්ස්',
  'black': 'කළු',
  'decker': 'ඩෙකර්',
  'makita': 'මකිටා',
  'bosch': 'බොෂ්',
  'dewalt': 'ඩිවෝල්ට්',
  'ingco': 'ඉන්කෝ',
  'total': 'ටෝටල්',
};

/**
 * Translates English text to Sinhala creatively
 * Uses mapping for common terms and phonetic translation for uncommon ones
 */
export function translateToSinhala(englishText: string): string {
  if (!englishText) return '';

  const words = englishText.toLowerCase().split(/\s+/);
  const translatedWords: string[] = [];

  for (const word of words) {
    // Remove common suffixes and special characters for matching
    const cleanWord = word.replace(/[^a-z0-9]/gi, '');
    
    // Direct lookup
    if (buildingMaterialMappings[cleanWord]) {
      translatedWords.push(buildingMaterialMappings[cleanWord]);
      continue;
    }

    // Check if word contains common material terms
    let found = false;
    for (const [key, value] of Object.entries(buildingMaterialMappings)) {
      if (cleanWord.includes(key)) {
        // Replace the English term with Sinhala
        const translated = word.replace(new RegExp(key, 'i'), value);
        translatedWords.push(translated);
        found = true;
        break;
      }
    }

    if (!found) {
      // Fallback: Keep original English word if no translation found
      // This prevents bad phonetic transliterations for unknown brands/terms
      translatedWords.push(word);
    }
  }

  return translatedWords.join(' ');
}

/**
 * Phonetic transliteration from English to Sinhala
 * Converts English text to approximate Sinhala phonetics
 */
function phoneticTransliterate(word: string): string {
  if (!word) return '';

  // Remove special characters
  const cleanWord = word.replace(/[^a-z0-9]/gi, '').toLowerCase();

  // Create a mapping for common English letter combinations
  const transliterationMap: Record<string, string> = {
    // Vowels
    'a': 'අ',
    'e': 'එ',
    'i': 'ඉ',
    'o': 'ඔ',
    'u': 'උ',
    
    // Consonants
    'b': 'බ',
    'c': 'ක',
    'd': 'ඩ',
    'f': 'ෆ',
    'g': 'ග',
    'h': 'හ',
    'j': 'ජ',
    'k': 'ක',
    'l': 'ල',
    'm': 'ම',
    'n': 'න',
    'p': 'ප',
    'r': 'ර',
    's': 'ස',
    't': 'ත',
    'v': 'ව',
    'w': 'ව',
    'y': 'ය',
    'z': 'ز',
    
    // Common digraphs
    'sh': 'ශ',
    'ch': 'ච',
    'th': 'ත',
    'ph': 'ෆ',
    'gh': 'ඝ',
  };

  let result = '';
  let i = 0;

  while (i < cleanWord.length) {
    // Try digraphs first
    const digraph = cleanWord.substring(i, i + 2);
    if (transliterationMap[digraph]) {
      result += transliterationMap[digraph];
      i += 2;
      continue;
    }

    // Single character
    const char = cleanWord[i];
    result += transliterationMap[char] || char;
    i++;
  }

  return result || word; // Fallback to original word
}

/**
 * Get invoice header translations for Sinhala mode
 */
export function getInvoiceHeaderSinhala() {
  return {
    invoice: 'ගිණුම්පතිකා',
    date: 'දිනය',
    customer: 'පාරිභෝගිකයා',
    items: 'භාණ්ඩ',
    quantity: 'ප්‍රමාණය',
    price: 'මිල',
    amount: 'මුදල',
    subtotal: 'උප එකතුව',
    discount: 'වට්ටම',
    tax: 'බදු',
    total: 'මුළුතුව',
    paid: 'ගෙවා ඇත',
    pending: 'අපේක්ෂාව',
    status: 'තත්ත්වය',
    footer: '© 2025 Powered by Nebulainfinite',
  };
}

/**
 * Batch translate product names
 */
export function translateProductNames(products: Array<{ name: string; nameAlt?: string }>): Array<{ name: string; nameAlt: string }> {
  return products.map(product => ({
    name: product.name,
    nameAlt: product.nameAlt || translateToSinhala(product.name),
  }));
}
