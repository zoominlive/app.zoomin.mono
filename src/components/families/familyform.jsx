import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
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
import CloseIcon from '@mui/icons-material/Close';
const STEPS = [
  'Enter the primary family members details',
  'Add additional family members that watch the stream or click Next Step',
  'Add any children that belong to this family'
];

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
      className="add-family-dialog">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {'Add Family'}
        <DialogContentText>Please add family member so they can watch stream</DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleFormDialogClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />
      {isCloseDialog ? (
        <>
          <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
            <DialogContentText>
              Are you sure you want to exit before completing the wizard ?
            </DialogContentText>
          </Stack>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <Stack direction="row" justifyContent="flex-end" width="100%">
              <Button
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5 }}
                onClick={() => {
                  setIsCloseDialog(false);
                }}>
                No
              </Button>

              <Button
                id="yes-btn"
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5, color: '#ffff' }}
                style={{ color: '#ffff' }}
                onClick={() => {
                  setIsCloseDialog(false);
                  props.setOpen(false);
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </>
      ) : (
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
                      sx={{ marginRight: 1.5 }}
                      onClick={handleBack}>
                      Previous Step
                    </Button>
                  )}
                  <LoadingButton
                    className="add-btn save-changes-btn"
                    loading={submitLoading || isValidating}
                    loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                    startIcon={(submitLoading || isValidating) && <SaveIcon />}
                    variant="text"
                    // onClick={handleFormSubmit}
                    type="submit">
                    {activeStep === STEPS.length - 1 ? 'Finish' : 'Next Step'}
                  </LoadingButton>
                </Stack>
                {/* </Stack> */}
              </DialogActions>
            </Form>
          )}
        </Formik>
      )}
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
