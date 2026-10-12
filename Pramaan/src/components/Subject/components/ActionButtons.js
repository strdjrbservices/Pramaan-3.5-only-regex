import React from 'react';
import { Stack, Button, CircularProgress } from '@mui/material';

const ActionButtons = ({
    handleStateRequirementCheck,
    stateReqLoading,
    handleClientRequirementCheck,
    clientReqLoading,
    handleEscalationCheck,
    escalationLoading,
}) => (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
                if (handleStateRequirementCheck) handleStateRequirementCheck();
                const el = document.getElementById('state-requirement-section') || document.getElementById('state-requirement-check');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            disabled={stateReqLoading}
            id="quick-check-state-btn"
        >
            {stateReqLoading ? <CircularProgress size={18} /> : 'Quick Check: State Requirements'}
        </Button>
        <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => {
                if (handleClientRequirementCheck) handleClientRequirementCheck();
                const el = document.getElementById('client-requirement-check-section') || document.getElementById('client-requirement-check');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            disabled={clientReqLoading}
            id="quick-check-client-btn"
        >
            {clientReqLoading ? <CircularProgress size={18} /> : 'Quick Check: Client Requirements'}
        </Button>
    </Stack>
);

export default ActionButtons;
