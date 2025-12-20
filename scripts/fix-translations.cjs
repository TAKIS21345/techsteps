
const fs = require('fs');
const path = require('path');
const { translate } = require('google-translate-api-x');

// CONFIGURATION
const localesDir = path.join(__dirname, '../public/locales');
const sourceLang = 'en';
const supportedLanguages = [
    'es', 'fr'
];

// Helper to flatten object
function flattenObject(ob) {
    var toReturn = {};
    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

// Helper to unflatten object
function unflattenObject(data) {
    var result = {};
    for (var i in data) {
        var keys = i.split('.');
        keys.reduce(function (r, e, j) {
            return r[e] || (r[e] = (keys.length - 1 === j ? data[i] : {}));
        }, result);
    }
    return result;
}

// Helper: Read JSON file
function readJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return {};
}

// Helper: Write JSON file
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// Main function
async function fixTranslations() {
    console.log('🔧 Starting translation repair...');

    const sourcePath = path.join(localesDir, sourceLang, 'translation.json');
    const sourceData = readJSON(sourcePath);
    const sourceFlat = flattenObject(sourceData);

    for (const lang of supportedLanguages) {
        console.log(`\nChecking ${lang}...`);
        const targetPath = path.join(localesDir, lang, 'translation.json');
        if (!fs.existsSync(targetPath)) {
            console.log(`  Skipping ${lang} (file not found)`);
            continue;
        }

        const targetData = readJSON(targetPath);
        const targetFlat = flattenObject(targetData);

        const keysToFix = [];

        // Identify keys that need fixing (same as English and length > 4)
        for (const key in sourceFlat) {
            const sourceVal = sourceFlat[key];
            const targetVal = targetFlat[key];

            if (Array.isArray(sourceVal)) {
                if (JSON.stringify(sourceVal) === JSON.stringify(targetVal)) {
                    keysToFix.push({ key, value: sourceVal, isArray: true });
                }
            } else if (typeof sourceVal === 'string') {
                if (sourceVal === targetVal && !['TechStep', 'Email', 'Zoom', 'Google', 'WhatsApp'].includes(sourceVal)) {
                    keysToFix.push({ key, value: sourceVal, isArray: false });
                }
            }
        }

        if (keysToFix.length === 0) {
            console.log(`  ✓ No fixes needed for ${lang}`);
            continue;
        }

        console.log(`  Found ${keysToFix.length} keys to fix (English fallback detected).`);

        // Process in batches
        const BATCH_SIZE = 5;
        let updatedCount = 0;

        for (let i = 0; i < keysToFix.length; i += BATCH_SIZE) {
            const batch = keysToFix.slice(i, i + BATCH_SIZE);

            const batchRequests = [];
            const batchIndices = [];

            batch.forEach((item, idx) => {
                if (item.isArray) {
                    item.value.forEach((str, arrIdx) => {
                        batchRequests.push(str);
                        batchIndices.push({ key: item.key, arrIdx, rootIdx: idx });
                    });
                } else {
                    batchRequests.push(item.value);
                    batchIndices.push({ key: item.key, arrIdx: -1, rootIdx: idx });
                }
            });

            try {
                if (batchRequests.length > 0) {
                    const res = await translate(batchRequests, { to: lang, rejectOnPartialFail: false });

                    // Defensive check for response
                    if (!res || !Array.isArray(res) || res.length !== batchRequests.length) {
                        console.error(`  Batch mismatch or invalid response. Expected ${batchRequests.length}, got ${res ? res.length : 'null'}`);
                        // Fallback individually
                        for (let k = 0; k < batchRequests.length; k++) {
                            try {
                                const singleRes = await translate(batchRequests[k], { to: lang });
                                const translatedText = singleRes.text;
                                const meta = batchIndices[k];
                                if (meta.arrIdx === -1) {
                                    targetFlat[meta.key] = translatedText;
                                } else {
                                    if (!targetFlat[meta.key]) targetFlat[meta.key] = [];
                                    if (!Array.isArray(targetFlat[meta.key])) targetFlat[meta.key] = [...sourceFlat[meta.key]];
                                    targetFlat[meta.key][meta.arrIdx] = translatedText;
                                }
                                updatedCount++;
                            } catch (singleErr) {
                                console.error(`    Skipping single item: ${singleErr.message}`);
                            }
                        }
                    } else {
                        batchIndices.forEach((meta, resIdx) => {
                            const translatedText = res[resIdx] ? res[resIdx].text : null;
                            if (translatedText) {
                                if (meta.arrIdx === -1) {
                                    targetFlat[meta.key] = translatedText;
                                } else {
                                    if (!targetFlat[meta.key]) targetFlat[meta.key] = [];
                                    if (!Array.isArray(targetFlat[meta.key])) targetFlat[meta.key] = [...sourceFlat[meta.key]];
                                    targetFlat[meta.key][meta.arrIdx] = translatedText;
                                }
                            }
                        });
                        updatedCount += batch.length;
                        process.stdout.write('.');
                    }
                }
            } catch (err) {
                console.error(`  Batch failed: ${err.message}`);
                await new Promise(r => setTimeout(r, 2000));
            }

            await new Promise(r => setTimeout(r, 500));
        }

        // Save updated file - MOVED OUTSIDE LOOP
        if (updatedCount > 0) {
            const newTargetData = unflattenObject(targetFlat);
            writeJSON(targetPath, newTargetData);
            console.log(`\n  ✓ Fixed ${updatedCount} keys for ${lang}`);
        } else {
            console.log(`\n  No changes saved for ${lang}`);
        }
    }

    console.log('\n✨ Repair complete!');
}

fixTranslations();
