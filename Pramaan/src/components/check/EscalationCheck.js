import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export const ESCALATION_RULES = [
  { id: 1, requirement: "Assignment Type Mismatch", ruleText: "1. Assignment Type Mismatch: If order form indicates ‘Purchase’ but report is marked ‘Refinance’, or vice-versa." },
  { id: 2, requirement: "Appraisal Type Mismatch", ruleText: "2. Appraisal Type Mismatch: If order form shows '1004+1007' but report is '1025'." },
  { id: 3, requirement: "Appraiser Mismatch", ruleText: "3. Appraiser Mismatch: If order form appraiser name differs from the completing appraiser in the report." },
  { id: 4, requirement: "Repairs vs. As-Is", ruleText: "4. Repairs vs. As-Is: If photos or comments show multiple repairs but the report is made 'As-is'." },
  { id: 5, requirement: "Supervisory Appraiser Signature", ruleText: "5. Supervisory Appraiser Signature: If the appraiser on the order form signs as the supervisory appraiser." },
  { id: 6, requirement: "Missing Revisions", ruleText: "6. Missing Revisions: If latest revision requests are not reflected in the report." },
  { id: 7, requirement: "Lender/Client Name Change", ruleText: "7. Lender/Client Name Change: If the lender/client name is changed in the report (e.g., from “Easy Street Capital” to “National Loan Funder”)." },
  { id: 8, requirement: "Appraiser Fee Mismatch", ruleText: "8. Appraiser Fee Mismatch: If the appraiser’s fee in the report does not match the engagement letter." },
  { id: 9, requirement: "Neighborhood Condition Comment", ruleText: "9. Neighborhood Condition Comment: If the Neighborhood section comment contains potentially negative words like \"*average* condition\"." },
  { id: 10, requirement: "Value vs. Price", ruleText: "10. Value vs. Price: If the final value is 10% lower than list price, purchase price, and prior sale price." },
  { id: 11, requirement: "1004D Mismatch", ruleText: "11. 1004D Mismatch: If order form shows ‘1004D Final Inspection/Appraisal Update’ but report is only one of them, or vice-versa." },
  { id: 12, requirement: "Loan/Appraisal Type Conflict", ruleText: "12. Loan/Appraisal Type Conflict: If order form loan type (e.g., USDA) conflicts with appraisal type (e.g., 1004 FHA)." },
  { id: 13, requirement: "Illegal Use", ruleText: "13. Illegal Use: If the property is marked as 'Illegal'." },
  { id: 14, requirement: "Multiple Kitchens", ruleText: "14. Multiple Kitchens: If a 1004 report shows 3+ kitchens, check for comments on whether they are permitted." },
  { id: 15, requirement: "Inspection/Effective Date Mismatch", ruleText: "15. Inspection/Effective Date Mismatch: If inspection date from records differs from the report's effective date." },
  { id: 16, requirement: "Value vs. Unadjusted Sales Price", ruleText: "16. Value vs. Unadjusted Sales Price: If final value is more than 10% higher than the unadjusted sales price." },
  { id: 17, requirement: "Drastic Grid Adjustments", ruleText: "17. Drastic Grid Adjustments: If sales grid adjustments are drastic." },
  { id: 18, requirement: "Commercial Location in Sales Grid", ruleText: "18. Commercial Location in Sales Grid: If a comparable's location is marked \"Commercial\"." },
  { id: 19, requirement: "Value Higher than Purchase Price", ruleText: "19. Value Higher than Purchase Price: If purchase price is 10% higher than the appraised value." },
  { id: 20, requirement: "Value Increase Since Prior Sale", ruleText: "20. Value Increase Since Prior Sale: If there's an increase in value since the subject's prior sale." },
  { id: 21, requirement: "Duplicate Addresses", ruleText: "21. Duplicate Addresses: If the subject address is the same as any comparable sale or rental comparable." },
  { id: 22, requirement: "Highest and Best Use 'NO'", ruleText: "22. Highest and Best Use 'NO': If 'Highest and best use' is marked 'NO'." },
  { id: 23, requirement: "Physical Deficiencies 'YES' but 'As-Is'", ruleText: "23. Physical Deficiencies 'YES' but 'As-Is': If 'Physical deficiencies' is marked 'YES' but the report is made 'as-is'." }
];

export const ESCALATION_CHECK_PROMPT = `
Analyze the appraisal report for the following 23 escalation rules.
You MUST process and include all 23 rules in the "details" array.
Your output must be a single, clean JSON object. Do not include any text outside of the JSON object.
The JSON object must have a "summary" (a one to two-line overview of findings) and a "details" array.
Each object in the "details" array represents a rule check and must have the following keys:
- "rule_number": An integer (1 to 23) corresponding to the rule number below.
- "requirement": A string matching the exact rule name (e.g., "Assignment Type Mismatch").
- "status": 'OK' if the rule is satisfied/passed, or 'Needs Escalation' if it fails/requires review.
- "value_or_comment": A string containing a brief comment explaining the finding (e.g., confirming consistency or describing any mismatch), along with the page number.

IMPORTANT INSTRUCTION FOR ORDER FORM / ENGAGEMENT LETTER:
If an order form or engagement letter is NOT included or provided in the report, do NOT mark Rules 1, 2, 3, 5, 8, 11, or 12 as 'Needs Escalation'. Instead, mark their status as 'OK' and comment 'Order form not provided in report; verified internal report consistency.'

Escalation Rules:
1. Assignment Type Mismatch: If order form indicates ‘Purchase’ but report is marked ‘Refinance’, or vice-versa. (If order form not provided: verify internal report consistency as OK).
2. Appraisal Type Mismatch: If order form shows '1004+1007' but report is '1025'. (If order form not provided: verify report form as OK).
3. Appraiser Mismatch: If order form appraiser name differs from the completing appraiser in the report. (If order form not provided: verify appraiser signature as OK).
4. Repairs vs. As-Is: If photos or comments show multiple repairs but the report is made 'As-is'.
5. Supervisory Appraiser Signature: If the appraiser on the order form signs as the supervisory appraiser. (If order form not provided: verify supervisory signature role as OK).
6. Missing Revisions: If latest revision requests are not reflected in the report.
7. Lender/Client Name Change: If the lender/client name is changed in the report (e.g., from “Easy Street Capital” to “National Loan Funder”).
8. Appraiser Fee Mismatch: If the appraiser’s fee in the report does not match the engagement letter. (If engagement letter not provided: verify fee disclosure as OK).
9. Neighborhood Condition Comment: If the Neighborhood section comment contains potentially negative words like "*average* condition".
10. Value vs. Price: If the final value is 10% lower than list price, purchase price.
11. 1004D Mismatch: If order form shows ‘1004D Final Inspection/Appraisal Update’ but report is only one of them, or vice-versa. (If order form not provided: verify as OK).
12. Loan/Appraisal Type Conflict: If order form loan type (e.g., USDA) conflicts with appraisal type (e.g., 1004 FHA). (If order form not provided: verify as OK).
13. Illegal Use: If the property is marked as 'Illegal'.
14. Multiple Kitchens: If a 1004 report shows 3+ kitchens, check for comments on whether they are permitted.
15. Inspection/Effective Date Mismatch: If inspection date from records differs from the report's effective date.
16. Value vs. Unadjusted Sales Price: If final value is more than 10% higher than the unadjusted sales price.
17. Drastic Grid Adjustments: If sales grid adjustments are drastic.
18. Commercial Location in Sales Grid: If a comparable's location is marked "Commercial".
19. Value Higher than Purchase Price: If purchase price is 10% higher than the appraised value.
20. Value Increase Since Prior Sale: If there's an increase in value since the subject's prior sale.
21. Duplicate Addresses: If the subject address is the same as any comparable sale or rental comparable.
22. Highest and Best Use 'NO': If 'Highest and best use' is marked 'NO'.
23. Physical Deficiencies 'YES' but 'As-Is': If 'Physical deficiencies' is marked 'YES' but the report is made 'as-is'.
`;

const EscalationCheck = ({ onPromptSubmit, loading, response, error }) => {
  const [filterValue, setFilterValue] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'json'
  const [copied, setCopied] = useState(false);

  const handleCheck = () => {
    onPromptSubmit(ESCALATION_CHECK_PROMPT);
  };

  const renderResponse = useCallback(() => {
    if (!response) return null;

    let data = response;
    if (typeof response === 'string') {
      try {
        data = JSON.parse(response);
      } catch (e) {
        return <pre>{response}</pre>;
      }
    }

    if (data && !data.details) {
      if (data.ESCALATION_CHECK) data = data.ESCALATION_CHECK;
      else if (data.escalation_check) data = data.escalation_check;
      else if (data['Escalation Check']) data = data['Escalation Check'];
    }

    const summary = data?.summary ?? 'No summary available.';
    const rawDetails = Array.isArray(data?.details) ? data.details : [];

    const details = ESCALATION_RULES.map(rule => {
      const match = rawDetails.find(d => {
        if (!d) return false;
        if (d.rule_number !== undefined && String(d.rule_number) === String(rule.id)) {
          return true;
        }
        const reqStr = String(d.requirement || '').toLowerCase();
        const ruleNameStr = rule.requirement.toLowerCase();
        return reqStr.includes(ruleNameStr) || ruleNameStr.includes(reqStr);
      });

      if (match) {
        return {
          requirement: rule.ruleText,
          status: match.status || 'OK',
          value_or_comment: match.value_or_comment || 'OK'
        };
      } else {
        return {
          requirement: rule.ruleText,
          status: 'OK',
          value_or_comment: 'OK'
        };
      }
    });

    const matchedBackendIndices = new Set();
    ESCALATION_RULES.forEach((rule) => {
      const matchIdx = rawDetails.findIndex(d => {
        if (!d) return false;
        if (d.rule_number !== undefined && String(d.rule_number) === String(rule.id)) {
          return true;
        }
        const reqStr = String(d.requirement || '').toLowerCase();
        const ruleNameStr = rule.requirement.toLowerCase();
        return reqStr.includes(ruleNameStr) || ruleNameStr.includes(reqStr);
      });
      if (matchIdx !== -1) {
        matchedBackendIndices.add(matchIdx);
      }
    });

    const extraDetails = rawDetails
      .filter((_, idx) => !matchedBackendIndices.has(idx))
      .map(d => ({
        requirement: d.requirement,
        status: d.status,
        value_or_comment: d.value_or_comment
      }));

    const mergedDetails = [...details, ...extraDetails];

    const greenStatuses = ['fulfilled', 'ok', 'pass', 'passed', 'yes'];
    const isGreen = (status) => {
      const normalized = String(status || '').trim().toLowerCase();
      return greenStatuses.includes(normalized);
    };

    const isRedOrReview = (status) => {
      const normalized = String(status || '').trim().toLowerCase();
      return ['needs escalation', 'escalation', 'failed', 'not fulfilled', 'needs review', 'no'].includes(normalized);
    };

    const getStatusStyle = (status) => {
      const normalizedStatus = String(status || '').trim().toLowerCase();
      const greenList = ['ok', 'pass', 'passed', 'fulfilled', 'yes'];
      const redList = ['needs escalation', 'escalation', 'failed', 'not fulfilled', 'no'];
      const yellowList = ['needs review', 'review', 'warning'];
      const naList = ['not applicable', 'n/a', 'na'];

      if (greenList.includes(normalizedStatus)) {
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'inline-block'
        };
      } else if (redList.includes(normalizedStatus)) {
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'inline-block'
        };
      } else if (yellowList.includes(normalizedStatus)) {
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'inline-block'
        };
      } else if (naList.includes(normalizedStatus)) {
        return {
          backgroundColor: '#e9ecef',
          color: '#495057',
          border: '1px solid #ced4da',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'inline-block'
        };
      }
      return {
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-block'
      };
    };

    const filteredDetails = mergedDetails.filter(item => {
      if (filterValue === 'passed') return isGreen(item.status);
      if (filterValue === 'failed') return isRedOrReview(item.status);
      return true;
    });

    const sortedDetails = [...filteredDetails].sort((a, b) => {
      const isGreenA = isGreen(a.status);
      const isGreenB = isGreen(b.status);
      if (isGreenA && !isGreenB) return -1;
      if (!isGreenA && isGreenB) return 1;
      return 0;
    });

    return (
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" color="error.main" display="flex" alignItems="center" gap={1}>
              {viewMode === 'table' ? <TableChartIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
              {viewMode === 'table' ? 'Escalation Rules Breakdown' : 'Escalation Rules (Raw JSON)'}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {viewMode === 'table' && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="escalation-status-filter-label">Filter Status</InputLabel>
                  <Select
                    labelId="escalation-status-filter-label"
                    id="escalation-status-filter"
                    value={filterValue}
                    label="Filter Status"
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="passed">Passed / OK</MenuItem>
                    <MenuItem value="failed">Failed / Review</MenuItem>
                  </Select>
                </FormControl>
              )}

              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  color="error"
                  startIcon={<TableChartIcon fontSize="small" />}
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'json' ? 'contained' : 'outlined'}
                  color="error"
                  startIcon={<CodeIcon fontSize="small" />}
                  onClick={() => setViewMode('json')}
                >
                  JSON View
                </Button>
              </ButtonGroup>

              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon fontSize="small" />}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'escalation_check.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download JSON
              </Button>
            </Stack>
          </Stack>

          {viewMode === 'json' ? (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2.5,
                borderRadius: 2,
                backgroundColor: '#0d1117',
                color: '#58a6ff',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                maxHeight: '480px',
                overflow: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <code>{JSON.stringify(data, null, 2)}</code>
            </Box>
          ) : (
            <>
              {summary && (
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom color="error.main">
                    Summary
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {summary}
                  </Typography>
                </Paper>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Requirement</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Value / Comment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDetails.length > 0 ? (sortedDetails.map((item, index) => {
                      const isInvalid = ['needs escalation', 'escalation', 'failed', 'not fulfilled'].includes(String(item.status || '').toLowerCase());
                      const statusStyle = getStatusStyle(item.status);

                      let tooltipContent = '';
                      if (isInvalid) {
                        if (typeof item.value_or_comment === 'object' && item.value_or_comment !== null) {
                          tooltipContent = item.value_or_comment.value || JSON.stringify(item.value_or_comment);
                        } else {
                          tooltipContent = item.value_or_comment;
                        }
                      }
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.requirement}</TableCell>
                          <TableCell>
                            {isInvalid ? (
                              <Tooltip title={tooltipContent} arrow>
                                <span style={statusStyle}>{item.status}</span>
                              </Tooltip>
                            ) : (
                              <span style={statusStyle}>{item.status}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {typeof item.value_or_comment === 'object' && item.value_or_comment !== null ? (
                              <>
                                {item.value_or_comment.value && (
                                  <Typography variant="body2">{item.value_or_comment.value}</Typography>
                                )}
                                {item.value_or_comment.page_no && (
                                  <Typography variant="caption" color="text.secondary">
                                    Page: {item.value_or_comment.page_no}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              String(item.value_or_comment)
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })) : (
                      <TableRow><TableCell colSpan={3} align="center">No matching items found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      </Stack>
    );
  }, [response, filterValue, viewMode, copied]);

  return (
    <div id="escalation-check-section" className="card shadow mb-4">
      <div className="card-header CAR1 bg-danger text-white">
        <strong>Escalation Check</strong>
      </div>
      <div className="card-body">
        <Stack spacing={2}>
          <Button
            onClick={handleCheck}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Run Escalation Check'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {response && renderResponse()}
        </Stack>
      </div>
    </div>
  );
};

export default EscalationCheck;
