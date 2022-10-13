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
import { Form, Formik } from 'formik';
import validationschema from './addfamilyforms/validationschema';

const STEPS = ['Primary', 'Secondary', 'Children'];

const AddFamily = (props) => {
  const [activeStep, setActiveStep] = useState(0);

  // Method to render different form for different step
  const renderStepContent = (step, values, setFieldValue, touched, errors) => {
    switch (step) {
      case 0:
        return (
          <Primary
            setFieldValue={setFieldValue}
            values={values}
            touched={touched}
            errors={errors}
          />
        );
      case 1:
        return (
          <Secondary
            setFieldValue={setFieldValue}
            values={values}
            touched={touched}
            errors={errors}
          />
        );
      case 2:
        return (
          <Children
            setFieldValue={setFieldValue}
            values={values}
            touched={touched}
            errors={errors}
            roomsList={props.roomsList}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  // Method to go to previous step
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Method to next to previous step
  const handleSubmit = (data) => {
    if (activeStep === STEPS.length - 1) {
      console.log('Data', data);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleFormDialogClose = () => {
    props.setOpen(false);
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleFormDialogClose}
      fullWidth
      className="add-family-dialog">
      <DialogTitle>Add Family</DialogTitle>
      <Divider />
      <Formik
        validationSchema={validationschema[activeStep]}
        validateOnChange
        enableReinitialize
        initialValues={{
          primary: {
            first_name: '',
            last_name: '',
            role: '',
            phone: undefined,
            email: ''
          },
          secondary: [],
          children: []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => (
          <Form>
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
              <Box p={3}>
                {renderStepContent(activeStep, values, setFieldValue, touched, errors)}
              </Box>
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
                  <Button variant="text" onClick={handleFormDialogClose}>
                    CANCEL
                  </Button>
                  <Button variant="text" type="submit">
                    {activeStep === STEPS.length - 1 ? 'FINISH' : 'NEXT'}
                  </Button>
                </Stack>
              </Stack>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddFamily;

AddFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  roomsList: PropTypes.array
};
