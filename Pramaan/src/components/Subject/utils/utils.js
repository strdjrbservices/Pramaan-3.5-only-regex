import uploadSoundFile from '../../../Assets/upload.mp3';
import successSoundFile from '../../../Assets/success.mp3';
import errorSoundFile from '../../../Assets/error.mp3';

export const API_BASE_URL = process.env.REACT_APP_API_URL || (
    typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.') ||
        window.location.port === '3000'
    )
        ? `http://${window.location.hostname || '127.0.0.1'}:8000`
        : 'https://appraisalreviewoffline-strdjrbservices.pythonanywhere.com'
);

export const getComparisonStyle = (field, extractedValue, comparisonValue) => {
    if (!comparisonValue) {
        return {};
    }
    const areDifferent = String(extractedValue).trim() !== String(comparisonValue).trim();
    if (areDifferent) {
        return { border: '1px solid red' };
    }
    return {};
};

export const playSound = (soundType) => {
    let soundFile;
    if (soundType === 'success') {
        soundFile = successSoundFile;
    } else if (soundType === 'error') {
        soundFile = errorSoundFile;
    } else if (soundType === 'upload') {
        soundFile = uploadSoundFile;
    } else {
        return;
    }

    try {
        const audio = new Audio(soundFile);
        audio.play().catch(e => {
            if (e.name !== 'NotAllowedError') {
                console.warn("Error playing sound:", e);
            }
        });

    } catch (e) {
        if (e.name !== 'NotAllowedError') {
            console.warn("Error playing sound:", e);
        }
    }
};

export const SECTION_DISPLAY_NAMES = {
    ALL: 'All Sections (Clean JSON)',
    SUBJECT: 'Subject Property',
    CONTRACT: 'Contract Section',
    NEIGHBORHOOD: 'Neighborhood Section',
    SITE: 'Site Section',
    IMPROVEMENTS: 'Improvements Section',
    SALES_GRID: 'Sales Comparison Grid',
    RECONCILIATION: 'Reconciliation',
    INFO_OF_SALES: 'Sales Comparison Approach',
    SALES_TRANSFER: 'Sales History / Transfer',
    PRIOR_SALE_HISTORY: 'Prior Sale History',
    COST_APPROACH: 'Cost Approach',
    INCOME_APPROACH: 'Income Approach',
    PUD_INFO: 'PUD Information',
    MARKET_CONDITIONS: 'Market Conditions',
    CONDO: 'Condominium Info',
    CONDO_FORECLOSURE: 'Condo Foreclosure Section',
    CERTIFICATION: 'Certification Section',
    PROJECT_SITE: 'Project Site Section',
    PROJECT_INFO: 'Project Information',
    PROJECT_ANALYSIS: 'Project Analysis',
    UNIT_DESCRIPTIONS: 'Unit Descriptions',
    SUBJECT_RENT_SCHEDULE: 'Subject Rent Schedule',
    RENT_SCHEDULE_GRID: 'Comparable Rent Schedule',
    RENT_SCHEDULE_RECONCILIATION: 'Rent Reconciliation',
    COMPARABLE_RENTAL_DATA: 'Comparable Rental Data',
    STATE_REQUIREMENT_CHECK: 'State Requirement Check',
    CLIENT_REQUIREMENT_CHECK: 'Client Requirement Check',
    ESCALATION_CHECK: 'Escalation Check',
    FHA_REQUIREMENT_CHECK: 'FHA Requirement Check',
    ADU_CHECK: 'ADU Check',
    UNPAID_OK_CHECK: 'Unpaid OK Check',
    MATHEMATICAL_VERIFICATION: 'Mathematical Verification',
    EXTRACTED_PHOTOS: 'Extracted Photos & Exhibits'
};

export const sanitizeJsonForPreview = (jsonObj) => {
    if (!jsonObj || typeof jsonObj !== 'object') return jsonObj;
    return JSON.parse(JSON.stringify(jsonObj, (key, value) => {
        if (key === 'image_data' && typeof value === 'string' && value.length > 200) {
            return `[Base64 Image Data - ${Math.round(value.length / 1024)} KB]`;
        }
        return value;
    }));
};

export const getCleanStructuredJson = (rawData, targetSection = 'ALL') => {
    if (!rawData || typeof rawData !== 'object') return {};

    const cleanSections = {};

    // 1. SUBJECT section (merge Subject and SUBJECT, collect any root-level subject fields)
    const subj = { ...(rawData.SUBJECT || {}), ...(rawData.Subject || {}) };
    const commonSubjectKeys = [
        'Property Address', 'Full Address', 'City', 'County', 'State', 'Zip Code',
        'Borrower', 'Owner of Public Record', 'Legal Description', "Assessor's Parcel #",
        'Tax Year', 'R.E. Taxes $', 'Neighborhood Name', 'Map Reference', 'Census Tract',
        'Occupant', 'Special Assessments $', 'PUD', 'HOA $', 'HOA(per year)', 'HOA(per month)',
        'Property Rights Appraised', 'Assignment Type', 'Lender/Client', 'Lender/Client Address'
    ];
    commonSubjectKeys.forEach(k => {
        if (subj[k] === undefined && rawData[k] !== undefined && typeof rawData[k] !== 'object') {
            subj[k] = rawData[k];
        }
    });
    if (Object.keys(subj).length > 0) {
        cleanSections['SUBJECT'] = subj;
    }

    // 2. Standard Appraisal Sections in canonical order
    const standardSectionKeys = [
        'CONTRACT',
        'NEIGHBORHOOD',
        'SITE',
        'IMPROVEMENTS',
        'SALES_GRID',
        'RECONCILIATION',
        'INFO_OF_SALES',
        'SALES_TRANSFER',
        'PRIOR_SALE_HISTORY',
        'COST_APPROACH',
        'INCOME_APPROACH',
        'PUD_INFO',
        'MARKET_CONDITIONS',
        'CONDO',
        'CONDO_FORECLOSURE',
        'CERTIFICATION',
        'PROJECT_SITE',
        'PROJECT_INFO',
        'PROJECT_ANALYSIS',
        'UNIT_DESCRIPTIONS',
        'SUBJECT_RENT_SCHEDULE',
        'RENT_SCHEDULE_GRID',
        'RENT_SCHEDULE_RECONCILIATION',
        'COMPARABLE_RENTAL_DATA'
    ];

    const spuriousCompAdjFields = new Set([
        'Address Adjustment',
        'Proximity to Subject Adjustment',
        'Sale Price Adjustment',
        'Sale Price/Gross Liv. Area Adjustment',
        'Data Source(s) Adjustment',
        'Verification Source(s) Adjustment',
        'Adjusted Sale Price of Comparables Adjustment',
        'Adjusted Sale Price Adjustment',
        'Adjusted Sale Price of Comparable Adjustment',
        'Net Adjustment (Total) Adjustment'
    ]);

    standardSectionKeys.forEach(key => {
        const val = rawData[key] || rawData[key.charAt(0) + key.slice(1).toLowerCase()];
        if (val && typeof val === 'object' && Object.keys(val).length > 0) {
            if (key === 'SALES_GRID') {
                const cleanSalesGrid = {};

                // 1. Subject entry
                const rawSubject = val.Subject || val.SUBJECT || val.subject;
                if (rawSubject && typeof rawSubject === 'object') {
                    const cleanSubj = {};
                    Object.entries(rawSubject).forEach(([sKey, sVal]) => {
                        const isAdjustmentKey = sKey.endsWith(' Adjustment') || sKey.endsWith('Adjustment');
                        const isCompOnlyKey = /Adjusted Sale Price|Proximity to Subject|Net Adjustment/i.test(sKey);
                        if (isAdjustmentKey || isCompOnlyKey) {
                            if (sVal !== '' && sVal !== null && sVal !== undefined) {
                                cleanSubj[sKey] = sVal;
                            }
                        } else {
                            cleanSubj[sKey] = sVal;
                        }
                    });
                    cleanSalesGrid['Subject'] = cleanSubj;
                }

                // 2. Comparable Sales: group by comp index and eliminate duplicate alias keys
                const compIndices = new Set();
                const compEntriesByIndex = {};

                Object.entries(val).forEach(([compKey, compObj]) => {
                    if (compKey.toLowerCase() === 'subject') return;
                    if (!compObj || typeof compObj !== 'object') return;

                    const m = compKey.match(/#\s*(\d+)/) || compKey.match(/(?:comp|comparable)\s*#?\s*(\d+)/i);
                    if (m) {
                        const idx = parseInt(m[1], 10);
                        compIndices.add(idx);
                        if (!compEntriesByIndex[idx]) compEntriesByIndex[idx] = [];
                        compEntriesByIndex[idx].push({ key: compKey, data: compObj });
                    }
                });

                Array.from(compIndices).sort((a, b) => a - b).forEach(idx => {
                    const entries = compEntriesByIndex[idx] || [];
                    // Prefer canonical key "COMPARABLE SALE #{idx}"
                    entries.sort((a, b) => {
                        const isCanonA = a.key === `COMPARABLE SALE #${idx}` ? 1 : 0;
                        const isCanonB = b.key === `COMPARABLE SALE #${idx}` ? 1 : 0;
                        return isCanonA - isCanonB;
                    });
                    const mergedComp = {};
                    entries.forEach(e => Object.assign(mergedComp, e.data));

                    const cleanComp = {};
                    Object.entries(mergedComp).forEach(([cKey, cVal]) => {
                        if (spuriousCompAdjFields.has(cKey)) return;
                        cleanComp[cKey] = cVal;
                    });

                    cleanSalesGrid[`COMPARABLE SALE #${idx}`] = cleanComp;
                });

                cleanSections['SALES_GRID'] = cleanSalesGrid;
            } else if (key === 'COMPARABLE_RENTAL_DATA' || key === 'RENT_SCHEDULE_GRID') {
                const cleanRentGrid = {};
                const rentIndices = new Set();
                const rentEntriesByIndex = {};

                Object.entries(val).forEach(([rKey, rentObj]) => {
                    if (!rentObj || typeof rentObj !== 'object') return;
                    const m = rKey.match(/#\s*(\d+)/) || rKey.match(/(?:comp|comparable|rental|no\.?)\s*#?\s*(\d+)/i);
                    if (m) {
                        const idx = parseInt(m[1], 10);
                        rentIndices.add(idx);
                        if (!rentEntriesByIndex[idx]) rentEntriesByIndex[idx] = [];
                        rentEntriesByIndex[idx].push({ key: rKey, data: rentObj });
                    } else {
                        cleanRentGrid[rKey] = rentObj;
                    }
                });

                Array.from(rentIndices).sort((a, b) => a - b).forEach(idx => {
                    const entries = rentEntriesByIndex[idx] || [];
                    entries.sort((a, b) => {
                        const isCanonA = a.key === `COMPARABLE RENTAL #${idx}` ? 1 : 0;
                        const isCanonB = b.key === `COMPARABLE RENTAL #${idx}` ? 1 : 0;
                        return isCanonA - isCanonB;
                    });
                    const mergedRent = {};
                    entries.forEach(e => Object.assign(mergedRent, e.data));
                    cleanRentGrid[`COMPARABLE RENTAL #${idx}`] = mergedRent;
                });

                cleanSections[key] = cleanRentGrid;
            } else {
                cleanSections[key] = { ...val };
            }
        }
    });

    // 3. Requirement & Verification Checks (deduplicate Title Case vs UPPERCASE)
    const checkMappings = [
        { canonical: 'STATE_REQUIREMENT_CHECK', aliases: ['State Requirement Check'] },
        { canonical: 'CLIENT_REQUIREMENT_CHECK', aliases: ['Client Requirement Check'] },
        { canonical: 'ESCALATION_CHECK', aliases: ['Escalation Check'] },
        { canonical: 'FHA_REQUIREMENT_CHECK', aliases: ['FHA Requirement Check', 'FHA_CHECK'] },
        { canonical: 'ADU_CHECK', aliases: ['ADU Check', 'ADU_REQUIREMENT_CHECK'] },
        { canonical: 'UNPAID_OK_CHECK', aliases: ['Unpaid OK Check', 'UNPAID_OK'] },
        { canonical: 'MATHEMATICAL_VERIFICATION', aliases: ['mathematical_verification'] },
        { canonical: 'EXTRACTED_PHOTOS', aliases: ['extracted_photos'] }
    ];

    checkMappings.forEach(({ canonical, aliases }) => {
        let checkVal = rawData[canonical];
        if (!checkVal) {
            for (const a of aliases) {
                if (rawData[a]) {
                    checkVal = rawData[a];
                    break;
                }
            }
        }
        if (checkVal && typeof checkVal === 'object') {
            cleanSections[canonical] = checkVal;
        }
    });

    // 4. Any remaining custom object sections (excluding duplicate aliases, comps, flat fields)
    const excludeFromCustom = new Set([
        'raw', 'Subject', 'SUBJECT', ...standardSectionKeys,
        ...standardSectionKeys.map(k => k.charAt(0) + k.slice(1).toLowerCase()),
        ...checkMappings.flatMap(m => [m.canonical, ...m.aliases])
    ]);

    Object.keys(rawData).forEach(k => {
        if (excludeFromCustom.has(k)) return;
        // Skip comp aliases (e.g. "Comparable Sale #1", "Comp 1", "COMPARABLE SALE #1")
        if (/^comp(?:arable)?(?:\s*sale)?\s*#?\s*\d+/i.test(k)) return;
        // Skip rental comp aliases
        if (/^(?:comparable\s*)?rental\s*#?\s*\d+/i.test(k)) return;
        // Skip primitives (flat fields belonging to sections)
        if (typeof rawData[k] !== 'object' || rawData[k] === null) return;
        if (Object.keys(rawData[k]).length > 0) {
            cleanSections[k] = rawData[k];
        }
    });

    // If targetSection is 'ALL', return the full clean structure
    if (!targetSection || targetSection === 'ALL') {
        return cleanSections;
    }

    // If a specific section is requested:
    const targetUpper = String(targetSection).trim().toUpperCase();
    const matchedKey = Object.keys(cleanSections).find(
        k => k.toUpperCase() === targetUpper || k.replace(/_/g, '').toUpperCase() === targetUpper.replace(/_/g, '')
    );

    if (matchedKey) {
        return { [matchedKey]: cleanSections[matchedKey] };
    }

    return cleanSections;
};
