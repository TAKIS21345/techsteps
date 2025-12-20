const fs = require('fs');
const path = require('path');
const { translate } = require('google-translate-api-x');

// Source of truth: English
const sourceLang = 'en';

// Supported languages
const supportedLanguages = [
  'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar',
  'he', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'no', 'da',
  'fi', 'hu', 'cs', 'sk', 'sl', 'hr', 'bg', 'ro', 'et', 'lv',
  'lt', 'uk'
];

const localesDir = path.join(__dirname, '../public/locales');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return {};
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const setByPath = (obj, path, value) => {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
};

const getByPath = (obj, path) => {
  return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

// Flatten object to map: "path.to.key" -> "value"
const flattenObject = (obj, prefix = '') => {
  let flattened = {};
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(flattened, flattenObject(obj[k], prefix + k + '.'));
    } else {
      flattened[prefix + k] = obj[k];
    }
  }
  return flattened;
};

async function updateTranslations() {
  console.log('🚀 Starting optimized translation update...');

  const sourcePath = path.join(localesDir, sourceLang, 'translation.json');
  console.log(`Reading source from: ${sourcePath}`);
  const sourceData = readJSON(sourcePath);
  const sourceFlat = flattenObject(sourceData);
  const sourceKeyCount = Object.keys(sourceFlat).length;
  console.log(`Source keys found: ${sourceKeyCount}`);

  if (sourceKeyCount === 0) {
    console.error("ERROR: Source file appears empty or unreadable!");
    return;
  }

  for (const lang of supportedLanguages) {
    console.log(`\n---------------------------------`);
    console.log(`Target Language: ${lang}`);
    const targetPath = path.join(localesDir, lang, 'translation.json');
    let targetData = readJSON(targetPath);
    let modified = false;

    const targetDir = path.join(localesDir, lang);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // itemsToTranslate: [{ key: 'path.to.key', text: 'Hello' }]
    let itemsToTranslate = [];

    for (const key in sourceFlat) {
      if (getByPath(targetData, key) === undefined) {
        let val = sourceFlat[key];
        // Handle arrays by treating them as multiple items or specialized handling?
        // Simple approach: if it's an array, we add each item with index suffix for internal tracking? 
        // No, flattenObject kept arrays as values.
        if (Array.isArray(val)) {
          // Add entire array to list? Google translate usually takes string array.
          // We can add each string in the array to our batch list.
          val.forEach((item, idx) => {
            itemsToTranslate.push({ key: `${key}.${idx}`, text: item, isArrayItem: true, parentKey: key, index: idx });
          });
        } else if (typeof val === 'string') {
          // Skip placeholders
          if (!val.match(/^\{\{.*\}\}$/)) {
            itemsToTranslate.push({ key, text: val });
          } else {
            setByPath(targetData, key, val); // Copy placeholder directly
            modified = true;
          }
        } else {
          setByPath(targetData, key, val); // Copy non-strings directly
          modified = true;
        }
      }
    }

    if (itemsToTranslate.length === 0) {
      console.log(`✓ Up to date.`);
      continue;
    }

    console.log(`Found ${itemsToTranslate.length} missing items. processing in batches...`);

    // Batch size
    const BATCH_SIZE = 30;

    for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
      const batch = itemsToTranslate.slice(i, i + BATCH_SIZE);
      const textsToTranslate = batch.map(b => b.text);

      try {
        // Translate batch
        const res = await translate(textsToTranslate, { from: sourceLang, to: lang });
        const translatedTexts = res.map(r => r.text);

        // Assign back
        batch.forEach((item, idx) => {
          const translated = translatedTexts[idx];
          if (item.isArrayItem) {
            // Start array if not exists
            let arr = getByPath(targetData, item.parentKey);
            if (!arr || !Array.isArray(arr)) {
              arr = [];
              setByPath(targetData, item.parentKey, arr);
            }
            arr[item.index] = translated;
          } else {
            setByPath(targetData, item.key, translated);
          }
        });
        modified = true;
        process.stdout.write('█');

        // Short delay between batches
        await new Promise(r => setTimeout(r, 1000));

      } catch (e) {
        console.error(`\nBatch failed: ${e.message}. Falling back to English for this batch.`);
        batch.forEach(item => {
          if (item.isArrayItem) {
            let arr = getByPath(targetData, item.parentKey);
            if (!arr) { arr = []; setByPath(targetData, item.parentKey, arr); }
            arr[item.index] = item.text;
          } else {
            setByPath(targetData, item.key, item.text);
          }
        });
        modified = true;
      }
    }

    if (modified) {
      writeJSON(targetPath, targetData);
      console.log(`\n✓ Saved ${lang}`);
    }
  }
}

updateTranslations();
