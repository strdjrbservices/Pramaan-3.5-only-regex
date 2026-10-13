import { getCleanStructuredJson, sanitizeJsonForPreview, SECTION_DISPLAY_NAMES } from './utils';

describe('Clean JSON Data formatting for Extracted JSON Data view', () => {
  const mockRawData = {
    // Duplicate subject representations
    Subject: {
      'Property Address': '123 Main St',
      'City': 'Dallas',
      'State': 'TX'
    },
    SUBJECT: {
      'Property Address': '123 Main St',
      'Zip Code': '75001',
      'Borrower': 'John Doe'
    },
    // Top-level duplicate flat fields
    'Property Address': '123 Main St',
    'City': 'Dallas',
    'Contract Price $': '500,000',

    // Contract section
    CONTRACT: {
      'Contract Price $': '500,000',
      'Date of Contract': '01/15/2026'
    },

    // Sales Grid with comps and duplicate alias keys (reproducing user scenario)
    SALES_GRID: {
      Subject: {
        Address: '123 Main St',
        'Location Adjustment': '',
        'Net Adjustment (Total)': ''
      },
      'COMPARABLE SALE #1': { Address: '125 Main St', 'Sale Price': '510,000', 'Address Adjustment': 'Ave' },
      'COMPARABLE SALE # 1': { Address: '125 Main St', 'Sale Price': '510,000' },
      'COMPARABLE #1': { Address: '125 Main St', 'Sale Price': '510,000' },
      'Comparable Sale #1': { Address: '125 Main St', 'Sale Price': '510,000' },
      'Comp 1': { Address: '125 Main St', 'Sale Price': '510,000' },
      'COMP 1': { Address: '125 Main St', 'Sale Price': '510,000' },
      'COMPARABLE SALE #2': { Address: '127 Main St', 'Sale Price': '520,000' },
      'Comp 2': { Address: '127 Main St', 'Sale Price': '520,000' }
    },

    // Duplicate top-level comp aliases that should be eliminated
    'COMPARABLE SALE #1': { Address: '125 Main St' },
    'COMPARABLE SALE # 1': { Address: '125 Main St' },
    'Comp 1': { Address: '125 Main St' },
    'COMP 1': { Address: '125 Main St' },
    'Comparable Sale #1': { Address: '125 Main St' },
    'Comparable Sale #2': { Address: '127 Main St' },

    // Requirement Checks duplicates
    STATE_REQUIREMENT_CHECK: { summary: 'Compliant', details: [] },
    'State Requirement Check': { summary: 'Compliant', details: [] },
    CLIENT_REQUIREMENT_CHECK: { summary: 'Lender rules passed', details: [] },
    'Client Requirement Check': { summary: 'Lender rules passed', details: [] },

    // Raw dump string
    raw: '{"massive": "json dump string that should never be in output"}'
  };

  test('merges SUBJECT and Subject into a single clean section without duplicating', () => {
    const cleanAll = getCleanStructuredJson(mockRawData, 'ALL');

    expect(cleanAll.SUBJECT).toBeDefined();
    expect(cleanAll.Subject).toBeUndefined(); // Should NOT have duplicate Subject
    expect(cleanAll.SUBJECT['Property Address']).toBe('123 Main St');
    expect(cleanAll.SUBJECT['Zip Code']).toBe('75001');
    expect(cleanAll.SUBJECT['City']).toBe('Dallas');
  });

  test('removes top-level duplicate comp aliases, cleans SALES_GRID to only canonical comp keys, and removes spurious adjustment noise', () => {
    const cleanAll = getCleanStructuredJson(mockRawData, 'ALL');

    expect(cleanAll['raw']).toBeUndefined();
    expect(cleanAll['COMPARABLE SALE #1']).toBeUndefined();
    expect(cleanAll['Comp 1']).toBeUndefined();
    expect(cleanAll['COMP 1']).toBeUndefined();
    expect(cleanAll['Comparable Sale #1']).toBeUndefined();

    // Comps remain properly nested inside SALES_GRID under canonical keys ONLY
    expect(cleanAll.SALES_GRID).toBeDefined();
    expect(cleanAll.SALES_GRID['Subject']).toBeDefined();
    expect(cleanAll.SALES_GRID['Subject']['Location Adjustment']).toBeUndefined(); // Empty adjustment removed
    expect(cleanAll.SALES_GRID['COMPARABLE SALE #1']).toBeDefined();
    expect(cleanAll.SALES_GRID['COMPARABLE SALE #2']).toBeDefined();
    expect(cleanAll.SALES_GRID['COMPARABLE SALE #1']['Address Adjustment']).toBeUndefined(); // Spurious noise removed

    // Duplicate alias keys inside SALES_GRID MUST be gone
    expect(cleanAll.SALES_GRID['COMPARABLE SALE # 1']).toBeUndefined();
    expect(cleanAll.SALES_GRID['COMPARABLE #1']).toBeUndefined();
    expect(cleanAll.SALES_GRID['Comparable Sale #1']).toBeUndefined();
    expect(cleanAll.SALES_GRID['Comp 1']).toBeUndefined();
    expect(cleanAll.SALES_GRID['COMP 1']).toBeUndefined();
    expect(cleanAll.SALES_GRID['Comp 2']).toBeUndefined();

    // Exactly 3 keys in SALES_GRID: Subject, COMPARABLE SALE #1, COMPARABLE SALE #2
    expect(Object.keys(cleanAll.SALES_GRID)).toEqual(['Subject', 'COMPARABLE SALE #1', 'COMPARABLE SALE #2']);
  });

  test('deduplicates requirement checks so they appear only once under canonical keys', () => {
    const cleanAll = getCleanStructuredJson(mockRawData, 'ALL');

    expect(cleanAll.STATE_REQUIREMENT_CHECK).toBeDefined();
    expect(cleanAll['State Requirement Check']).toBeUndefined();
    expect(cleanAll.CLIENT_REQUIREMENT_CHECK).toBeDefined();
    expect(cleanAll['Client Requirement Check']).toBeUndefined();
  });

  test('filters by specific section when requested', () => {
    const contractOnly = getCleanStructuredJson(mockRawData, 'CONTRACT');

    expect(Object.keys(contractOnly)).toEqual(['CONTRACT']);
    expect(contractOnly.CONTRACT['Contract Price $']).toBe('500,000');
    expect(contractOnly.SUBJECT).toBeUndefined();
    expect(contractOnly.SALES_GRID).toBeUndefined();
  });

  test('handles case-insensitive and title-case section selection', () => {
    const subjectResult = getCleanStructuredJson(mockRawData, 'Subject');

    expect(Object.keys(subjectResult)).toEqual(['SUBJECT']);
    expect(subjectResult.SUBJECT['Property Address']).toBe('123 Main St');
  });

  test('sanitizes large base64 image strings for preview and download', () => {
    const withPhotos = {
      EXTRACTED_PHOTOS: [
        {
          caption: 'Front View',
          page: 3,
          image_data: 'data:image/jpeg;base64,' + 'A'.repeat(50000)
        }
      ]
    };

    const sanitized = sanitizeJsonForPreview(withPhotos);
    expect(sanitized.EXTRACTED_PHOTOS[0].caption).toBe('Front View');
    expect(sanitized.EXTRACTED_PHOTOS[0].image_data).toContain('[Base64 Image Data -');
  });

  test('contains display names for all canonical sections', () => {
    expect(SECTION_DISPLAY_NAMES.ALL).toBe('All Sections (Clean JSON)');
    expect(SECTION_DISPLAY_NAMES.SUBJECT).toBe('Subject Property');
    expect(SECTION_DISPLAY_NAMES.CONTRACT).toBe('Contract Section');
    expect(SECTION_DISPLAY_NAMES.SALES_GRID).toBe('Sales Comparison Grid');
  });
});
