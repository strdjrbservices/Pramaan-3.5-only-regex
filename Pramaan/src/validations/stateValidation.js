const checkAppraiserFee = (data) => {
    const fee = data?.CERTIFICATION?.["Appraiser's Fee"] || data?.CERTIFICATION?.["Appraisal Fee"] || data?.CERTIFICATION?.["Appraiser Fee"] || data?.CERTIFICATION?.["Appraisers Fee"] ||
                data?.SUBJECT?.["Appraiser's Fee"] || data?.SUBJECT?.["Appraisal Fee"] || data?.SUBJECT?.["Appraiser Fee"] || data?.SUBJECT?.["Appraisers Fee"] ||
                data?.["Appraiser's Fee"] || data?.["Appraisal Fee"] || data?.["Appraiser Fee"] || data?.["Appraisers Fee"];
    return fee && String(fee).replace(/[^0-9.]/g, '') > 0;
};

const checkAmcLicense = (data) => {
    const lic = data?.CERTIFICATION?.['AMC License #'] || data?.['AMC License #'] || data?.SUBJECT?.['AMC License #'] || data?.['AMC Reg. Number'] || data?.CERTIFICATION?.['AMC Reg. Number'];
    return lic && String(lic).trim().length > 0;
};

const checkAmcFee = (data) => {
    const fee = data?.CERTIFICATION?.['AMC Fee'] || data?.['AMC Fee'] || data?.SUBJECT?.['AMC Fee'];
    return fee && String(fee).replace(/[^0-9.]/g, '') > 0;
};

const getField = (data, key) => data?.[key] || data?.SUBJECT?.[key] || data?.Subject?.[key] || '';

export const checkStateRequirements = (field, text, data) => {
    if (field !== 'State') return null;

    const state = String(text || '').trim().toUpperCase();
    if (!state) return null;

    // State Requirements Matrix for all 19 regulated states
    const detailedChecks = {
        'AZ': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'CA': () => {
            const missing = [];
            if (!getField(data, 'Smoke detector comment') && !getField(data, 'CO detector comment')) {
                missing.push("Comment on smoke/CO detector presence or absence");
            }
            const wh = getField(data, 'Water heater double-strapped comment');
            if (!wh || (!wh.toLowerCase().includes('strap') && !wh.toLowerCase().includes('brace'))) {
                missing.push("Confirm water heater is double-strapped");
            }
            return missing;
        },
        'CO': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'CT': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'GA': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcLicense(data)) missing.push("AMC License #");
            const yr = parseInt(getField(data, 'Year Built') || data?.IMPROVEMENTS?.['Year Built'] || '0', 10);
            if (yr > 2008 && !getField(data, 'CO detector comment')) {
                missing.push("CO detector in general sleeping areas (built after 2008)");
            }
            return missing;
        },
        'IL': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body and certification");
            if (!checkAmcLicense(data)) missing.push("AMC License # (include expiration 12/31/2026)");
            if (!getField(data, 'CO detector comment')) missing.push("Confirm CO detector presence and provide photos");
            return missing;
        },
        'LA': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'MT': () => {
            const missing = [];
            if (!checkAmcLicense(data)) missing.push("AMC License #");
            return missing;
        },
        'NV': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcFee(data)) missing.push("AMC Fee");
            return missing;
        },
        'NJ': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcLicense(data)) missing.push("AMC License #");
            return missing;
        },
        'NM': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcFee(data)) missing.push("AMC Fee");
            return missing;
        },
        'NY': () => {
            const missing = [];
            const lender = getField(data, 'Lender/Client') || '';
            const isPlaza = String(lender).toUpperCase().includes('PLAZA');
            const hasInvoice = Boolean(data?.['Invoice Attached'] === 'Yes' || data?.Invoice === 'Yes');
            if (!isPlaza && !hasInvoice) {
                missing.push("Attach invoice (except for Plaza Home Mortgage)");
            }
            return missing;
        },
        'ND': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'OH': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcLicense(data)) missing.push("AMC License #");
            return missing;
        },
        'UT': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcFee(data)) missing.push("AMC Fee");
            const wh = getField(data, 'Water heater double-strapped comment') || data?.IMPROVEMENTS?.['Additional features'] || '';
            if (!wh || (!wh.toLowerCase().includes('strap') && !wh.toLowerCase().includes('brace'))) {
                missing.push("Confirm water heater is double-strapped per Loan Store guideline");
            }
            return missing;
        },
        'VT': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!checkAmcLicense(data)) missing.push("AMC License #");
            return missing;
        },
        'VA': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            if (!getField(data, 'Smoke detector comment') || !getField(data, 'CO detector comment')) {
                missing.push("Confirm smoke and CO detectors are installed");
            }
            return missing;
        },
        'WV': () => {
            const missing = [];
            if (!checkAppraiserFee(data)) missing.push("Appraiser's Fee in report body");
            return missing;
        },
        'WI': () => {
            const missing = [];
            const hasInvoice = Boolean(data?.['Invoice Attached'] === 'Yes' || data?.Invoice === 'Yes');
            if (!hasInvoice) missing.push("Attach invoice");
            const co = getField(data, 'CO detector comment') || data?.IMPROVEMENTS?.['Additional features'] || '';
            if (!co || (!co.toLowerCase().includes('co') && !co.toLowerCase().includes('carbon'))) {
                missing.push("Confirm CO detector installation where applicable (§ 101.647)");
            }
            return missing;
        },
    };

    if (detailedChecks[state]) {
        const missingItems = detailedChecks[state]();
        if (missingItems.length === 0) {
            return { isMatch: true, message: `All state requirements for ${state} appear to be met.` };
        } else {
            return { isError: true, message: `Missing for ${state}: ${missingItems.join(', ')}.` };
        }
    }

    return null;
};
