import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  styled
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Primary from './addfamilyforms/primary';
import Secondary from './addfamilyforms/secondary';
import Children from './addfamilyforms/children';
import { Form, Formik } from 'formik';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useRef } from 'react';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import API from '../../api';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import * as yup from 'yup';
import moment from 'moment-timezone';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '../../assets/completed-step.svg'; // For active icon
import ActiveStep from '../../assets/active-step.svg'; // For active icon
import InactiveStep from '../../assets/inactive-step.svg';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const STEPS = [
  { label: 'Primary Member', description: 'Add Primary Member' },
  { label: 'Other Members', description: 'Add Other Members' },
  { label: 'Children', description: 'Children Details' }
];

// Custom Styling for Stepper Container
const CustomStepper = styled(Stepper)({
  backgroundColor: '#F7F8FC', // Light gray background as per your screenshot
  borderRadius: '8px',
  padding: '16px',
  justifyContent: 'space-around'
});

// Custom Styling for StepLabel to hide step numbers
const CustomStepLabel = styled(StepLabel)({
  '& .MuiStepLabel-labelContainer': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  '& .MuiStepLabel-label': {
    fontWeight: '500'
  }
});

// Custom StepIcon Component
// eslint-disable-next-line react/prop-types
const StepIcon = ({ active, completed }) => (
  <>
    {completed ? (
      <img src={CheckCircleIcon} alt="CheckCircleIcon" />
    ) : active ? (
      <img src={ActiveStep} alt="ActiveStep" />
    ) : (
      <img src={InactiveStep} alt="InactiveStep" />
    )}
  </>
);

const AddFamily = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const formikRef = useRef();
  const [isCloseDialog, setIsCloseDialog] = useState(false);

  function checkEmailUnique(value) {
    if (value) {
      return new Promise((resolve) => {
        API.post('users/emailValidation', { email: value }).then((response) => {
          if (response.status === 200) {
            if (response.data.Data) {
              return resolve(false);
            } else {
              return resolve(true);
            }
          } else {
            errorMessageHandler(
              enqueueSnackbar,
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
            setSubmitLoading(false);
          }
        });
      });
    }
  }
  // Validation schema for family form inside component beacause if async email validation
  const validationSchema = [
    yup.object().shape({
      primary: yup.object().shape({
        first_name: yup.string().required('First Name is required'),
        last_name: yup.string().required('Last Name is required'),
        relationship: yup.string().required('Role is required'),
        phone: yup
          .string()
          .matches(
            /^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm,
            'Enter valid phone number'
          ),
        email: yup
          .string()
          .email('Enter valid email')
          .required('Email is required')
          .test('checkEmailUnique', 'Email already exists', checkEmailUnique)
      })
    }),
    yup.object().shape({
      secondary: yup.array().of(
        yup.object().shape({
          first_name: yup.string().required('First Name is required'),
          last_name: yup.string().required('Last Name is required'),
          relationship: yup.string().required('Role is required'),
          phone: yup
            .string()
            .matches(
              /^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm,
              'Enter valid phone number'
            ),
          email: yup
            .string()
            .email('Enter valid email')
            .required('Email is required')
            .test('checkEmailUnique', 'Email already exists', checkEmailUnique)
        })
      )
    }),
    yup.object().shape({
      children: yup
        .array()
        .of(
          yup.object().shape({
            first_name: yup.string().required('First Name is required'),
            last_name: yup.string().required('Last Name is required'),
            zones: yup
              .array()
              .of(
                yup.object().shape({
                  zone_id: yup.string(),
                  zone_name: yup.string()
                })
              )
              .min(1, 'Select at least one zone')
              .required('required'),
            locations: yup.array().min(1, 'Select at least one location').required('required')
          })
        )
        .min(1, 'Add atleast one child')
    })
  ];

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
            zonesList={props.zonesList}
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

  // Method to next to previous step and creating the family
  const handleSubmit = (data, { setTouched, setSubmitting }) => {
    if (activeStep === STEPS.length - 1) {
      setSubmitLoading(true);

      const payload = structuredClone(data);

      payload.primary.member_type = 'primary';
      payload.primary.time_zone = moment.tz.guess();
      payload.primary.location = authCtx.user.locations;
      payload.secondary.forEach((parent) => {
        parent.member_type = 'secondary';
        parent.time_zone = moment.tz.guess();
        parent.location = authCtx.user.locations;
      });

      payload.children.forEach((child) => {
        child.location = { locations: child.locations };
        delete child.locations;
      });

      API.post('family/add', {
        ...payload,
        cust_id: localStorage.getItem('cust_id'),
        tenant_id: localStorage.getItem('tenant_id')
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          setIsCloseDialog(false);
          props.setOpen(false);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setSubmitLoading(false);
      });
    } else {
      setActiveStep(activeStep + 1);
      setTouched({});
      setSubmitting(false);
    }
  };

  const handleFormDialogClose = () => {
    // if (!submitLoading) {
    //   props.setOpen(false);
    // } else {
    //   setIsCloseDialog(true);
    // }
    setIsCloseDialog(isCloseDialog ? false : true);
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleFormDialogClose}
      fullWidth
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      className="add-family-dialog">
      {isCloseDialog ? (
        <ConfirmationDialog
          onConfirm={() => {
            setIsCloseDialog(false);
            props.setOpen(false);
          }}
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          handleFormDialogClose={handleFormDialogClose}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            {'Add Family'}
            <DialogContentText>
              {activeStep == 0
                ? 'Start by adding a Primary Member'
                : activeStep == 1
                ? 'Here you can add additional family members'
                : activeStep == 2
                ? 'Here you can add children as well as schedule their start'
                : ''}
            </DialogContentText>
            <IconButton
              aria-label="close"
              onClick={handleFormDialogClose}
              sx={{
                position: 'absolute',
                right: 18,
                top: 30
              }}>
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          <Formik
            validationSchema={validationSchema[activeStep]}
            validateOnChange={false}
            validateOnBlur={true}
            innerRef={formikRef}
            enableReinitialize
            initialValues={{
              primary: {
                first_name: '',
                last_name: '',
                relationship: '',
                phone: '',
                email: ''
              },
              secondary: [
                // {
                //   first_name: '',
                //   last_name: '',
                //   relationship: '',
                //   phone: '',
                //   email: ''
                // }
              ],
              children: [
                {
                  first_name: '',
                  last_name: '',
                  zones: [],
                  locations: [],
                  enable_date: null,
                  selected_option: 'Start Now',
                  date_picker_open: 'false'
                }
              ]
            }}
            validate={(values) => {
              const errors = {};

              const emails = [values.primary.email];

              values.secondary.forEach((parent) => {
                emails.push(parent.email);
              });

              const duplicateEmails = emails.filter(
                (item, index) => emails.indexOf(item) !== index
              );

              if (activeStep === 2) {
                errors.children = {};
                const childrenTemp = values.children.map(() => {
                  return {};
                });

                values.children.forEach((child, idx) => {
                  if (child.selected_option === 'Schedule start date') {
                    if (child.enable_date == '') {
                      childrenTemp[idx].enable_date = 'Date is required';
                    }
                  }
                });

                errors.children = childrenTemp;

                if (errors.children.length === 0) {
                  delete errors.children;
                } else {
                  if (errors.children.length > 0) {
                    errors.children = errors.children.filter(
                      (value) => Object.keys(value).length !== 0
                    );
                    if (errors.children.length === 0) {
                      delete errors.children;
                    }
                  }
                }
              }

              if (activeStep === 1) {
                const secondaryTemp = values.secondary.map(() => {
                  return {};
                });

                values.secondary.forEach((parent, idx) => {
                  duplicateEmails.forEach((email) => {
                    if (parent.email && parent.email === email) {
                      secondaryTemp[idx].email = 'Email must be unique';
                    }
                  });
                });

                errors.secondary = secondaryTemp;

                if (errors.secondary.length === 0) {
                  delete errors.secondary;
                } else {
                  if (errors.secondary.length > 0) {
                    errors.secondary = errors.secondary.filter(
                      (value) => Object.keys(value).length !== 0
                    );
                    if (errors.secondary.length === 0) {
                      delete errors.secondary;
                    }
                  }
                }
              }

              return errors;
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors, isValidating }) => (
              <Form>
                <DialogContent>
                  <Box mt={2}>
                    <CustomStepper activeStep={activeStep}>
                      {STEPS.map((step, index) => (
                        <Step key={index}>
                          <CustomStepLabel StepIconComponent={StepIcon}>
                            {/* <Box sx={{ display: 'flex', flexDirection: 'column' }}> */}
                            <Typography variant="subtitle1" fontWeight="bold">
                              {step.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {step.description}
                            </Typography>
                            {/* </Box> */}
                          </CustomStepLabel>
                        </Step>
                      ))}
                    </CustomStepper>
                  </Box>
                  <Box paddingY={3}>
                    {renderStepContent(activeStep, values, setFieldValue, touched, errors)}
                  </Box>
                </DialogContent>
                <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
                  {/* <Stack direction="row" justifyContent="space-between" width="100%"> */}
                  <Stack direction="row" justifyContent="flex-end" width="100%">
                    {/* <Button
              disabled={submitLoading || isValidating}
              variant="text"
              onClick={handleFormDialogClose}>
              CANCEL
            </Button> */}
                    {activeStep > 0 && (
                      <Button
                        //className="add-btn save-changes-btn"
                        className="log-btn"
                        variant="outlined"
                        sx={{ marginRight: 1.5, borderRadius: '60px !important' }}
                        onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    {activeStep == 0 && (
                      <Button
                        //className="add-btn save-changes-btn"
                        className="log-btn"
                        variant="outlined"
                        sx={{ marginRight: 1.5, borderRadius: '60px !important' }}
                        onClick={handleFormDialogClose}>
                        Cancel
                      </Button>
                    )}
                    <LoadingButton
                      className="add-btn save-changes-btn"
                      sx={{ borderRadius: '60px !important' }}
                      loading={submitLoading || isValidating}
                      loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                      startIcon={(submitLoading || isValidating) && <SaveIcon />}
                      variant="text"
                      // onClick={handleFormSubmit}
                      type="submit">
                      {activeStep === STEPS.length - 1 ? 'Finish' : 'Next'}
                    </LoadingButton>
                  </Stack>
                  {/* </Stack> */}
                </DialogActions>
              </Form>
            )}
          </Formik>
        </>
      )}
    </Dialog>
  );
};

export default AddFamily;

AddFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  zonesList: PropTypes.array,
  getFamiliesList: PropTypes.func
};
