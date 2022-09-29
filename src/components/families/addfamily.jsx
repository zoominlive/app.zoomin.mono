import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Primary from './addfamilyforms/primary';
import Secondary from './addfamilyforms/secondary';
import Children from './addfamilyforms/children';

const STEPS = ['Primary', 'Secondary', 'Children'];

const AddFamily = (props) => {
  const [activeStep, setActiveStep] = useState(0);

  // Method to render different form for different step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return <Primary />;
      case 1:
        return <Secondary />;
      case 2:
        return <Children />;
      default:
        return <div>Not Found</div>;
    }
  };

  // Method to go to previous step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Method to next to previous step
  const handleNext = () => {
    if (activeStep !== STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="add-family-dialog">
      <DialogTitle>Add Family</DialogTitle>
      <Divider />
      <DialogContent>
        <Box mt={2}>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box p={3}>{renderStepContent(activeStep)}</Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Stack direction="row" justifyContent="space-between" width="100%">
          {activeStep > 0 && (
            <Button
              variant="text"
              sx={{ marginLeft: '20px', color: '#00000042' }}
              onClick={handleBack}>
              BACK
            </Button>
          )}
          <Stack direction="row" justifyContent="flex-end" width="100%">
            <Button variant="text" onClick={() => props.setOpen(false)}>
              CANCEL
            </Button>
            <Button variant="text" onClick={handleNext}>
              {activeStep === STEPS.length - 1 ? 'FINISH' : 'NEXT'}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AddFamily;

AddFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
