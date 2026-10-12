import { useCallback, useState } from 'react';
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

export const STATE_REQUIREMENTS_PROMPT = `
Analyze the appraisal report for state-specific requirements based on the property's state.
Your output must be a single, clean JSON object. Do not include any text outside of the JSON object.
The JSON object must have a "summary" (a one to two-line overview of findings) and a "details" array.
Each object in the "details" array represents a requirement and must have the following keys:
- "requirement": A string describing the state-specific rule being checked.
- "status": A string, which must be one of 'Fulfilled', 'Not Fulfilled', or 'Not Applicable'.
- "value_or_comment": A string containing the extracted value or a brief comment explaining the status. If a value is extracted, also include the page number.

State-Specific Requirements:
- **Appraiser’s Fee Disclosure**: Required for AZ, CO, CT, GA, IL, LA, NJ, NV, NM, ND, OH, UT, VA, VT, WV.
- **AMC License # Inclusion**: Required for GA, IL, MT, NJ, OH, VT.
- **AMC License # and Expiration Date**: Required for IL (e.g., "558000312, Exp: 12/31/2026").
- **AMC Fee Inclusion**: Required for NV, NM, UT.
- **California (CA)**:
  - Comment on smoke/CO detectors.
  - Comment on double-strapped water heater.
  - For properties built after 2008, a specific CO detector comment is needed.
- **Illinois (IL)**:
  - AMC License # must be '558000312' with expiration '12/31/2026'.
  - Appraiser must disclose their fee.
  - Addendum must include the "Illinois Administrative Code 1455.245" statement.
  - Report must comment on Carbon Monoxide detector presence and include photos.
- **Utah (UT)**:
  - Comment on double-strapped water heaters.
  - AMC fee must be included.
  - Appraiser’s fee must be disclosed.
- **Virginia (VA)**: Confirm if smoke and CO detectors are installed.
- **Wisconsin (WI)**:
  - A copy of the invoice must be attached.
  - Confirm CO detector installation per Wis. Stat. Ann. § 101.647.
- **New York (NY)**: A copy of the invoice should be included (unless the client is Plaza Home Mortgage).
`;

const StateRequirementCheck = ({ onPromptSubmit, loading, response, error }) => {
  const [filterValue, setFilterValue] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'json'
  const [copied, setCopied] = useState(false);

  const handleCheckRequirements = () => {
    onPromptSubmit(STATE_REQUIREMENTS_PROMPT);
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
      if (data.STATE_REQUIREMENT_CHECK) data = data.STATE_REQUIREMENT_CHECK;
      else if (data.state_requirement_check) data = data.state_requirement_check;
      else if (data['State Requirement Check']) data = data['State Requirement Check'];
    }

    const { summary, details } = data || {};

    const greenStatuses = ['fulfilled', 'ok', 'pass', 'passed', 'yes'];
    const isGreen = (status) => {
      const normalized = String(status || '').trim().toLowerCase();
      return greenStatuses.includes(normalized);
    };

    const isRedOrReview = (status) => {
      const normalized = String(status || '').trim().toLowerCase();
      return ['not fulfilled', 'failed', 'needs review', 'review', 'no'].includes(normalized);
    };

    const getStatusStyle = (status) => {
      const normalizedStatus = String(status || '').trim().toLowerCase();
      const greenList = ['fulfilled', 'ok', 'yes', 'pass', 'passed'];
      const redList = ['not fulfilled', 'failed', 'no'];
      const yellowList = ['needs review', 'review'];
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

    const parsedDetails = Array.isArray(details) ? details : [];

    const filteredDetails = parsedDetails.filter(item => {
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
            <Typography variant="h6" component="div" color="primary.main" display="flex" alignItems="center" gap={1}>
              {viewMode === 'table' ? <TableChartIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
              {viewMode === 'table' ? 'State Requirements Breakdown' : 'State Requirements (Raw JSON)'}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {viewMode === 'table' && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="state-status-filter-label">Filter Status</InputLabel>
                  <Select
                    labelId="state-status-filter-label"
                    id="state-status-filter"
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
                  startIcon={<TableChartIcon fontSize="small" />}
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'json' ? 'contained' : 'outlined'}
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
                  a.download = 'state_requirements.json';
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
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary.main">
                    Summary
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {summary}
                  </Typography>
                </Paper>
              )}

              {details && Array.isArray(details) && (
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
                      {sortedDetails.length > 0 ? (
                        sortedDetails.map((item, index) => {
                          const normalizedStatus = String(item.status || '').trim().toLowerCase();
                          const isInvalid = ['not fulfilled', 'failed', 'needs review', 'no'].includes(normalizedStatus);
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
                                  item.value_or_comment
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No matching items found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      </Stack>
    );
  }, [response, filterValue, viewMode, copied]);

  return (
    <div id="state-requirement-section" className="card shadow mb-4">
      <div className="card-header CAR1 bg-primary text-white">
        <strong>State Requirement Check</strong>
      </div>
      <div className="card-body">
        <Stack spacing={2}>
          <Button
            onClick={handleCheckRequirements}
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Check State Requirements'}
          </Button>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {response && renderResponse()}
        </Stack>
      </div>
    </div>
  );
};

export default StateRequirementCheck;
