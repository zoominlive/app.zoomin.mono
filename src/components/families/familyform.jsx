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
const STEPS = ['Primary', 'Secondary', 'Children'];

const AddFamily = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const formikRef = useRef();

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
            rooms: yup
              .array()
              .of(
                yup.object().shape({
                  room_id: yup.string(),
                  room_name: yup.string()
                })
              )
              .min(1, 'Select at least one room')
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

  // Method to next to previous step and creating the family
  const handleSubmit = (data, { setTouched, setSubmitting }) => {
    if (activeStep === STEPS.length - 1) {
      setSubmitLoading(true);

      const payload = structuredClone(data);

      payload.primary.member_type = 'primary';
      payload.primary.time_zone = moment.tz.guess();
      payload.primary.location = authCtx.user.location;

      payload.secondary.forEach((parent) => {
        parent.member_type = 'secondary';
        parent.time_zone = moment.tz.guess();
        parent.location = authCtx.user.location;
      });

      payload.children.forEach((child) => {
        child.location = { locations: child.locations };
        delete child.locations;
      });

      API.post('family/add', payload).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          handleFormDialogClose();
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
    if (!submitLoading) {
      props.setOpen(false);
    }
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
              rooms: [],
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

          const duplicateEmails = emails.filter((item, index) => emails.indexOf(item) !== index);

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
                  <Button
                    disabled={submitLoading || isValidating}
                    variant="text"
                    onClick={handleFormDialogClose}>
                    CANCEL
                  </Button>
                  <LoadingButton
                    loading={submitLoading || isValidating}
                    loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                    startIcon={(submitLoading || isValidating) && <SaveIcon />}
                    variant="text"
                    // onClick={handleFormSubmit}
                    type="submit">
                    {activeStep === STEPS.length - 1 ? 'FINISH' : 'NEXT'}
                  </LoadingButton>
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
  roomsList: PropTypes.array,
  getFamiliesList: PropTypes.func
};
