/* eslint-disable-next-line no-unsafe-optional-chaining */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Stack,
  Chip,
  Autocomplete,
  InputLabel,
  // Select,
  // MenuItem,
  // FormHelperText,
  IconButton,
  Typography
} from '@mui/material';
import { Plus } from 'react-feather';
import { FieldArray, Form, Formik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import _ from 'lodash';
import PhoneNumberInput from '../common/phonenumberinput';
// import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import moment from 'moment';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const STEPS = ['Customer', 'Customer Locations', 'User'];

const CustomerForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  // const [selectedRole, setSelectedRole] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [zoneList, setZoneList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [recurringChargeDate, setRecurringChargeDate] = useState(moment());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const validationSchema = [
    yup.object().shape({
      customer_first_name: yup.string('Enter first name').required('First name is required'),
      customer_last_name: yup.string('Enter last name').required('Last name is required'),
      company_name: yup.string('Enter company name').required('Company name is required'),
      phone: yup
        .string()
        .required('Phone is required')
        .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number'),
      address_1: yup.string('Enter address').required('Address is required'),
      address_2: yup.string('Enter address'),
      city: yup.string('Enter city').required('City is required'),
      country: yup
        .string('Enter country')
        .matches(/^[A-Z]{2}$/, 'Country code must be a two-letter code in CAPS')
        .required('Country is required'),
      postal: yup.string('Enter postal').required('Postal is required'),
      max_cameras: yup.number('Enter maximum cameras').required('Maximum cameras is required'),
      // available_cameras: yup
      //   .number('Enter available cameras')
      //   .required('Available cameras is required'),
      max_locations: yup
        .number('Enter maximum locations')
        .required('Maximum locations is required'),
      transcoder_endpoint: yup
        .string('Enter Transcoder endpoint')
        .required('Transcoder endpoint is required'),
      rtmp_transcoder_endpoint: yup
        .string('Enter RTMP Transcoder endpoint')
        .required('RTMP Transcoder endpoint is required'),
      timeout: yup.number('Enter timeout cameras').required('Timeout is required'),
      max_resolution: yup.number('Enter Max Resolution').required('Resolution is required'),
      max_record_time: yup
        .number('Enter Max Record Time')
        .required('Record time is required')
        .min(1, 'Record time must be at least 1 minute') // Minimum value constraint
        .max(120, 'Record time cannot exceed 120 minutes'), // Maximum value constraint,
      max_file_size: yup.number('Enter File Size').required('File size is required'),
      max_fps: yup.number('Enter FPS').required('FPS is required'),
      max_stream_live_license: yup
        .number('Enter maximum stream live license')
        .required('Maximum stream live license is required'),
      max_stream_live_license_zone: yup
        .number('Enter maximum stream live license')
        .required('Maximum stream live license is required')
    }),
    // yup.object().shape({
    //   // customer_locations: yup.array().required('Location Name is required')
    //   customer_locations: yup.array().min(1, 'Location Name is required').required('required')
    // }),
    yup.object().shape({
      customer_locations: yup.array().of(
        yup.object().shape({
          loc_name: yup.string().required('Location Name is required')
        })
      )
    }),

    yup.object().shape({
      first_name: yup.string('Enter first name').required('First name is required'),
      last_name: yup.string('Enter last name').required('Last name is required'),
      email: yup
        .string('Enter your email')
        .email('Enter a valid email')
        .required('Email is required'),
      role: yup.string('Enter role').required('Role is required'),
      location: yup.array().min(1, 'Select at least one location').required('Location is required')
      // zones:
      //   selectedRole === 'Teacher'
      //     ? yup
      //         .array()
      //         .of(yup.object().shape({ zone_id: yup.string(), zone_name: yup.string() }))
      //         .min(1, 'Select at least one zone')
      //         .required('required')
      //     : yup.array()
    })
  ];

  const authCtx = useContext(AuthContext);

  const handleCustomerSubmit = (data) => {
    const {
      customer_first_name,
      customer_last_name,
      first_name,
      last_name,
      email,
      role,
      location,
      zones,
      stream_live_license,
      ...details
    } = data;
    console.log('location==>', location);

    const payload = {
      ...details,
      billing_contact_first: customer_first_name,
      billing_contact_last: customer_last_name,
      cust_id: props.customer && props.customer.cust_id,
      user: {
        first_name: first_name,
        last_name: last_name,
        email: email,
        role: role,
        location: { locations: location },
        zones: zones,
        stream_live_license: stream_live_license,
        user_id: props.customer && props.customer?.users[0]?.user_id
      }
    };
    setSubmitLoading(true);
    if (props.customer) {
      API.put('customers/edit', payload).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getCustomersList();
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
      API.post('customers/create-customer', payload).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          handleFormDialogClose();
          props.getCustomersList();
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
    }
  };

  const handleSubmit = (data, { setTouched, setSubmitting }) => {
    switch (activeStep) {
      case 0:
      case 1:
        setSubmitting(true);
        setTouched({});
        setSubmitting(false);
        setActiveStep(activeStep + 1);
        break;
      case 2:
        setSubmitting(true);
        handleCustomerSubmit(data);
        setTouched({});
        setSubmitting(false);
        break;
    }
  };

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setCustomer();
    }
  };

  const handleDialogCancel = () => {
    setIsCloseDialog(!isCloseDialog);
  };
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  const renderStepContent = (step, values, setFieldValue, touched, errors) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
              <InputLabel id="first_name">First Name</InputLabel>
              <TextField
                labelId="first_name"
                name="first_name"
                value={values?.customer_first_name}
                onChange={(event) => {
                  setFieldValue('customer_first_name', event.target.value);
                }}
                helperText={touched.customer_first_name && errors.customer_first_name}
                error={touched.customer_first_name && Boolean(errors.customer_first_name)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="last_name">Last Name</InputLabel>
              <TextField
                labelId="last_name"
                name="last_name"
                value={values?.customer_last_name}
                onChange={(event) => {
                  setFieldValue('customer_last_name', event.target.value);
                }}
                helperText={touched.customer_last_name && errors.customer_last_name}
                error={touched.customer_last_name && Boolean(errors.customer_last_name)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="company_name">Company Name</InputLabel>
              <TextField
                labelId="company_name"
                name="company_name"
                value={values?.company_name}
                onChange={(event) => {
                  setFieldValue('company_name', event.target.value);
                }}
                helperText={touched.company_name && errors.company_name}
                error={touched.company_name && Boolean(errors.company_name)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="phone">Phone</InputLabel>
              <TextField
                labelId="phone"
                name={'phone'}
                value={values?.phone || ''}
                onChange={(event) => {
                  setFieldValue('phone', event.target.value ? event.target.value : '');
                }}
                helperText={touched.phone && errors.phone}
                error={touched.phone && Boolean(errors.phone)}
                InputProps={{ inputComponent: PhoneNumberInput }}
                fullWidth
              />
            </Grid>
            <Grid item md={12} xs={12}>
              <InputLabel id="address_1">Address 1</InputLabel>
              <TextField
                labelId="address_1"
                name="address_1"
                value={values?.address_1}
                onChange={(event) => {
                  setFieldValue('address_1', event.target.value);
                }}
                helperText={touched.address_1 && errors.address_1}
                error={touched.address_1 && Boolean(errors.address_1)}
                fullWidth
              />
            </Grid>
            <Grid item md={12} xs={12}>
              <InputLabel id="address_2">Address 2</InputLabel>
              <TextField
                labelId="address_2"
                name="address_2"
                value={values?.address_2}
                onChange={(event) => {
                  setFieldValue('address_2', event.target.value);
                }}
                helperText={touched.address_2 && errors.address_2}
                error={touched.address_2 && Boolean(errors.address_2)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="city">City</InputLabel>
              <TextField
                labelId="city"
                name="city"
                value={values?.city}
                onChange={(event) => {
                  setFieldValue('city', event.target.value);
                }}
                helperText={touched.city && errors.city}
                error={touched.city && Boolean(errors.city)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="country">Country</InputLabel>
              <TextField
                labelId="country"
                name="country"
                value={values?.country}
                onChange={(event) => {
                  setFieldValue('country', event.target.value);
                }}
                helperText={touched.country && errors.country}
                error={touched.country && Boolean(errors.country)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="postal">Postal</InputLabel>
              <TextField
                labelId="postal"
                name="postal"
                value={values?.postal}
                onChange={(event) => {
                  setFieldValue('postal', event.target.value);
                }}
                helperText={touched.postal && errors.postal}
                error={touched.postal && Boolean(errors.postal)}
                fullWidth
              />
            </Grid>
            {/* <Grid item md={4} xs={12}>
              <InputLabel id="available_cameras">Available Cameras</InputLabel>
              <TextField
                labelId="available_cameras"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="available_cameras"
                value={values?.available_cameras}
                onChange={(event) => {
                  setFieldValue('available_cameras', event.target.value);
                }}
                helperText={touched.available_cameras && errors.available_cameras}
                error={touched.available_cameras && Boolean(errors.available_cameras)}
                fullWidth
              />
            </Grid> */}

            <Grid item xs={12} md={12}>
              <InputLabel id="transcoder_endpoint">Tanscoder Endpoint</InputLabel>
              <TextField
                labelId="transcoder_endpoint"
                name="transcoder_endpoint"
                value={values?.transcoder_endpoint}
                onChange={(event) => {
                  setFieldValue('transcoder_endpoint', event.target.value);
                }}
                helperText={touched.transcoder_endpoint && errors.transcoder_endpoint}
                error={touched.transcoder_endpoint && Boolean(errors.transcoder_endpoint)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <InputLabel id="rtmp_transcoder_endpoint">RTMP Tanscoder Endpoint</InputLabel>
              <TextField
                labelId="rtmp_transcoder_endpoint"
                name="rtmp_transcoder_endpoint"
                value={values?.rtmp_transcoder_endpoint}
                onChange={(event) => {
                  setFieldValue('rtmp_transcoder_endpoint', event.target.value);
                }}
                helperText={touched.rtmp_transcoder_endpoint && errors.rtmp_transcoder_endpoint}
                error={touched.rtmp_transcoder_endpoint && Boolean(errors.rtmp_transcoder_endpoint)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_resolution">Max Resolution</InputLabel>
              <TextField
                labelId="max_resolution"
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_resolution"
                value={values?.max_resolution}
                onChange={(event) => {
                  setFieldValue('max_resolution', event.target.value);
                }}
                helperText={touched.max_resolution && errors.max_resolution}
                error={touched.max_resolution && Boolean(errors.timeout)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_file_size">Max File Size in kb</InputLabel>
              <TextField
                labelId="max_file_size"
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_file_size"
                value={values?.max_file_size}
                onChange={(event) => {
                  setFieldValue('max_file_size', event.target.value);
                }}
                helperText={touched.max_file_size && errors.max_file_size}
                error={touched.max_resolution && Boolean(errors.timeout)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_fps">Max FPS</InputLabel>
              <TextField
                labelId="max_fps"
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_fps"
                value={values?.max_fps}
                onChange={(event) => {
                  setFieldValue('max_fps', event.target.value);
                }}
                helperText={touched.max_fps && errors.max_fps}
                error={touched.max_resolution && Boolean(errors.timeout)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="timeout">Viewing Timeout</InputLabel>
              <TextField
                labelId="timeout"
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="timeout"
                value={values?.timeout}
                onChange={(event) => {
                  setFieldValue('timeout', event.target.value);
                }}
                helperText={touched.timeout && errors.timeout}
                error={touched.timeout && Boolean(errors.timeout)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_record_time">Max Record Time</InputLabel>
              <TextField
                labelId="max_record_time"
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_record_time"
                value={values?.max_record_time}
                onChange={(event) => {
                  setFieldValue('max_record_time', event.target.value);
                }}
                helperText={touched.max_record_time && errors.max_record_time}
                error={touched.max_record_time && Boolean(errors.max_record_time)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <Divider orientation="horizontal" variant="middle" flexItem />
            </Grid>
            <Grid item xs={12} md={12}>
              <Typography variant="subtitle2">Licensing</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <InputLabel id="from">No. of Trial Days</InputLabel>
              <TextField
                name={'trial_period_days'}
                type="number"
                value={values?.trial_period_days}
                // InputProps={{ inputProps: { min: 0, max: 30, step: 1 } }}
                onChange={(event) => {
                  setFieldValue('trial_period_days', event.target.value);
                  setFieldValue(
                    'recurring_charge_day',
                    moment(recurringChargeDate, 'MM/DD/YY').add(event.target.value, 'days')
                  );
                }}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <InputLabel id="recurring-charge-day">Next Charge Day</InputLabel>
                <DesktopDatePicker
                  disabled
                  disableOpenPicker
                  open={isDatePickerOpen}
                  maxDate={moment()}
                  labelId="recurring-charge-day"
                  autoOk={true}
                  value={values?.recurring_charge_day}
                  inputFormat="MM/DD/YY"
                  onClose={() => setIsDatePickerOpen(false)}
                  renderInput={(params) => (
                    <TextField onClick={() => setIsDatePickerOpen(true)} {...params} />
                  )}
                  components={{
                    OpenPickerIcon: !isDatePickerOpen ? ArrowDropDownIcon : ArrowDropUpIcon
                  }}
                  onChange={(value) => {
                    setRecurringChargeDate(value);
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_locations">Number of Locations</InputLabel>
              <TextField
                labelId="max_locations"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_locations"
                value={values?.max_locations}
                onChange={(event) => {
                  setFieldValue('max_locations', event.target.value);
                }}
                helperText={touched.max_locations && errors.max_locations}
                error={touched.max_locations && Boolean(errors.max_locations)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_cameras">Number of Fix Camera Licenses</InputLabel>
              <TextField
                labelId="max_cameras"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_cameras"
                value={values?.max_cameras}
                onChange={(event) => {
                  setFieldValue('max_cameras', event.target.value);
                }}
                helperText={touched.max_cameras && errors.max_cameras}
                error={touched.max_cameras && Boolean(errors.max_cameras)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_stream_live_license">
                Max Per-User Live Streaming Licenses
              </InputLabel>
              <TextField
                labelId="max_stream_live_license"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_stream_live_license"
                value={values?.max_stream_live_license}
                onChange={(event) => {
                  setFieldValue('max_stream_live_license', event.target.value);
                }}
                helperText={touched.max_stream_live_license && errors.max_stream_live_license}
                error={touched.max_stream_live_license && Boolean(errors.max_stream_live_license)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <InputLabel id="max_stream_live_license_zone">
                Max Per-Zone Live Streaming Licenses
              </InputLabel>
              <TextField
                labelId="max_stream_live_license_zone"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                name="max_stream_live_license_zone"
                value={values?.max_stream_live_license_zone}
                onChange={(event) => {
                  setFieldValue('max_stream_live_license_zone', event.target.value);
                }}
                helperText={
                  touched.max_stream_live_license_zone && errors.max_stream_live_license_zone
                }
                error={
                  touched.max_stream_live_license_zone &&
                  Boolean(errors.max_stream_live_license_zone)
                }
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={12}>
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.audio_permission}
                      onChange={(event) => {
                        setFieldValue('audio_permission', event.target.checked);
                      }}
                    />
                  }
                  label={`Allow Fixed Camera Audio`}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12}>
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.camera_recording}
                      onChange={(event) => {
                        setFieldValue('camera_recording', event.target.checked);
                      }}
                    />
                  }
                  label={`Allow Fixed Camera Recording`}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={12}>
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.invite_user}
                      onChange={(event) => {
                        setFieldValue('invite_user', event.target.checked);
                      }}
                    />
                  }
                  label={`Allow Families to Invite Users`}
                />
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <FieldArray
            name="customer_locations"
            render={(arrayHelpers) => {
              return (
                <>
                  {values.customer_locations &&
                    values.customer_locations.length > 0 &&
                    values.customer_locations.map((_, index) => (
                      <Box key={index}>
                        {index !== 0 && (
                          <Divider
                            textAlign="left"
                            sx={{
                              margin: '30px -48px'
                            }}>
                            LOCATION {index + 1}
                          </Divider>
                        )}
                        <Grid container spacing={2}>
                          <Grid item md={4} sm={12}>
                            <InputLabel id={`customer_locations.${index}.loc_name`}>
                              Location Name
                            </InputLabel>
                            <TextField
                              labelId={`customer_locations.${index}.loc_name`}
                              name={`customer_locations.${index}.loc_name`}
                              value={values?.customer_locations[index]?.loc_name}
                              onChange={(event) => {
                                setFieldValue(
                                  `customer_locations[${index}].loc_name`,
                                  event.target.value
                                );
                              }}
                              helperText={
                                touched &&
                                touched.customer_locations &&
                                touched.customer_locations[index] &&
                                touched.customer_locations[index].loc_name &&
                                errors &&
                                errors.customer_locations &&
                                errors.customer_locations[index] &&
                                errors.customer_locations[index].loc_name
                              }
                              error={
                                touched &&
                                touched.customer_locations &&
                                touched.customer_locations[index] &&
                                touched.customer_locations[index].loc_name &&
                                errors &&
                                errors.customer_locations &&
                                errors.customer_locations[index] &&
                                errors.customer_locations[index] &&
                                Boolean(errors.customer_locations[index].loc_name)
                              }
                              fullWidth
                            />
                          </Grid>
                          <Grid item md={4} sm={12}>
                            <InputLabel id={`customer_locations.${index}.transcoder_endpoint`}>
                              Transcoder Endpoint
                            </InputLabel>
                            <TextField
                              labelId={`customer_locations.${index}.transcoder_endpoint`}
                              name={`customer_locations.${index}.transcoder_endpoint`}
                              value={values?.customer_locations[index]?.transcoder_endpoint}
                              onChange={(event) => {
                                setFieldValue(
                                  `customer_locations[${index}].transcoder_endpoint`,
                                  event.target.value
                                );
                              }}
                              helperText={
                                touched &&
                                touched.customer_locations &&
                                touched.customer_locations[index] &&
                                touched.customer_locations[index].transcoder_endpoint &&
                                errors &&
                                errors.customer_locations &&
                                errors.customer_locations[index] &&
                                errors.customer_locations[index].transcoder_endpoint
                              }
                              error={
                                touched &&
                                touched.customer_locations &&
                                touched.customer_locations[index] &&
                                touched.customer_locations[index].transcoder_endpoint &&
                                errors &&
                                errors.customer_locations &&
                                errors.customer_locations[index] &&
                                errors.customer_locations[index] &&
                                Boolean(errors.customer_locations[index].transcoder_endpoint)
                              }
                              fullWidth
                            />
                          </Grid>
                          <Grid item md={2} sm={12}>
                            <Box className="row-button-wrapper">
                              <IconButton
                                aria-label="delete"
                                className="row-delete-btn"
                                onClick={() => arrayHelpers.remove(index)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  <Box className="row-button-wrapper" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      endIcon={<Plus />}
                      className="row-add-btn"
                      onClick={() => {
                        arrayHelpers.push({ loc_name: '' });
                      }}>
                      Add Customer Location
                    </Button>
                  </Box>
                </>
              );
            }}
          />
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
              <InputLabel id="first_name">First Name</InputLabel>
              <TextField
                labelId="first_name"
                name="first_name"
                value={values?.first_name}
                onChange={(event) => {
                  setFieldValue('first_name', event.target.value);
                }}
                helperText={touched && touched.first_name && errors && errors.first_name}
                error={touched && touched.first_name && errors && Boolean(errors.first_name)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="last_name">Last Name</InputLabel>
              <TextField
                labelId="last_name"
                name="last_name"
                value={values?.last_name}
                onChange={(event) => {
                  setFieldValue('last_name', event.target.value);
                }}
                helperText={touched.last_name && errors.last_name}
                error={touched.last_name && Boolean(errors.last_name)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="email">Email</InputLabel>
              <TextField
                labelId="email"
                name="email"
                value={values?.email}
                onChange={(event) => {
                  setFieldValue('email', event.target.value);
                }}
                helperText={touched.email && errors.email}
                error={touched.email && Boolean(errors.email)}
                fullWidth
              />
            </Grid>
            <Grid item md={6} xs={12}>
              <InputLabel id="user-role">Role</InputLabel>
              <TextField
                labelId="role"
                disabled
                name="role"
                value={values?.role}
                onChange={(event) => {
                  setFieldValue('role', event.target.value);
                }}
                helperText={touched.role && errors.role}
                error={touched.role && Boolean(errors.role)}
                fullWidth
              />
              {/* <FormControl fullWidth error={touched.role && Boolean(errors.role)}>
                <Select
                  labelId="user-role"
                  id="user-role"
                  value={values?.role}
                  label="Role"
                  name="role"
                  onChange={(event) => {
                    setFieldValue('role', event.target.value);
                    // setSelectedRole(event.target.value);
                  }}>
                  <MenuItem value={'Teacher'}>Teacher</MenuItem>
                  <MenuItem value={'User'}>User</MenuItem>
                  <MenuItem value={'Admin'}>Admin</MenuItem>
                </Select>
                {touched.role && Boolean(errors.role) && (
                  <FormHelperText sx={{ color: '#d32f2f' }}>
                    {touched.role && errors.role}
                  </FormHelperText>
                )}
              </FormControl> */}
            </Grid>
            <Grid item xs={12} md={values.role === 'Teacher' ? 6 : 12}>
              <InputLabel id="location">Location</InputLabel>
              <Autocomplete
                labelId="location"
                fullWidth
                multiple
                id="location"
                options={values?.customer_locations?.sort((a, b) =>
                  a.loc_name > b.loc_name ? 1 : -1
                )}
                getOptionLabel={(option) => option.loc_name}
                isOptionEqualToValue={(option, value) => option.loc_name === value.loc_name}
                onChange={(_, value) => {
                  setFieldValue('location', value);
                  setSelectedLocation(value);
                }}
                value={values?.location?.map((loc) => ({
                  loc_name: loc.loc_name
                }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={index}
                      label={option.loc_name}
                      {...getTagProps({ index })}
                      //disabled={authCtx.user?.location?.accessable_locations.indexOf(option) == -1}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    // placeholder="Location"
                    helperText={touched.location && errors.location}
                    error={touched.location && Boolean(errors.location)}
                    fullWidth
                  />
                )}
              />
            </Grid>
            {values.role === 'Teacher' && (
              <Grid item xs={12} md={6}>
                <InputLabel id="zones">Zone</InputLabel>
                <Autocomplete
                  labelId="zones"
                  fullWidth
                  multiple
                  id="zones"
                  noOptionsText={'Select location first'}
                  options={zoneList
                    .sort((a, b) => (a?.zone_name > b?.zone_name ? 1 : -1))
                    ?.filter((zone) => {
                      if (values?.location?.find((loc) => loc == zone?.location)) {
                        return zone;
                      }
                    })}
                  value={values.zones}
                  isOptionEqualToValue={(option, value) => option?.zone_id === value?.zone_id}
                  getOptionLabel={(option) => {
                    return option?.zone_name;
                  }}
                  onChange={(_, value) => {
                    setFieldValue('zones', value);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip key={index} label={option?.zone_name} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      // placeholder="Zone"
                      helperText={touched.zones && errors.zones}
                      error={touched.zones && Boolean(errors.zones)}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.stream_live_license}
                      onChange={(event) => {
                        setFieldValue('stream_live_license', event.target.checked);
                      }}
                    />
                  }
                  label={`Assign Live Streaming License (${
                    authCtx.user?.max_stream_live_license || 0
                  } Available)`}
                />
              </FormControl>
            </Grid>
          </Grid>
        );
      default:
        return <div>Not Found</div>;
    }
  };

  useEffect(() => {
    let zones = [];
    zoneList?.map((zone) => {
      let count = 0;
      selectedLocation?.forEach((location) => {
        if (zone.location === location) {
          count = count + 1;
        }
      });
      if (count > 0) {
        zones.push(zone);
      }
    });
    setZoneList(zones);
  }, [selectedLocation]);
  useEffect(() => {
    API.get('zones/list').then((response) => {
      if (response.status === 200) {
        setZoneList(response.data.Data);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    });
  }, []);
  return (
    <Dialog
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      open={props.open}
      onClose={handleDialogCancel}
      fullWidth
      className="add-customer-drawer">
      {/* <Divider /> */}
      {isCloseDialog ? (
        <ConfirmationDialog
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          onConfirm={() => {
            setIsCloseDialog(false);
            handleFormDialogClose();
            props.setOpen(false);
          }}
          handleFormDialogClose={handleDialogCancel}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            {props.customer ? 'Edit Customer' : 'Add Customer'}
            {/* <DialogContentText>Please add family member so they can watch stream</DialogContentText> */}
            <IconButton
              aria-label="close"
              onClick={handleDialogCancel}
              sx={{
                position: 'absolute',
                right: 18,
                top: 30
              }}>
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          <Formik
            enableReinitialize
            validateOnChange
            validationSchema={validationSchema[activeStep]}
            initialValues={{
              customer_first_name: props?.customer?.billing_contact_first || '',
              customer_last_name: props?.customer?.billing_contact_last || '',
              company_name: props?.customer?.company_name || '',
              phone: props?.customer?.phone || '',
              address_1: props?.customer?.address_1 || '',
              address_2: props?.customer?.address_2 || '',
              city: props?.customer?.city || '',
              country: props?.customer?.country || '',
              postal: props?.customer?.postal || '',
              max_cameras: props?.customer?.max_cameras || '',
              // available_cameras: props?.customer?.available_cameras || '',
              max_locations: props?.customer?.max_locations || '',
              trial_period_days: props?.customer?.trial_period_days || '',
              transcoder_endpoint: props?.customer?.transcoder_endpoint || '',
              rtmp_transcoder_endpoint: props?.customer?.rtmp_transcoder_endpoint || '',
              timeout: props?.customer?.timeout || '',
              max_resolution: props?.customer?.max_resolution || 720,
              max_record_time: props?.customer?.max_record_time || 15,
              max_file_size: props?.customer?.max_file_size || 40000,
              max_fps: props?.customer?.max_fps || 15,
              max_stream_live_license: props?.customer?.max_stream_live_license || '',
              max_stream_live_license_zone: props?.customer?.max_stream_live_license_zone || '',
              audio_permission: !_.isNil(props?.customer?.audio_permission)
                ? props?.customer?.audio_permission
                : true,
              camera_recording: !_.isNil(props?.customer?.camera_recording)
                ? props?.customer?.camera_recording
                : true,
              invite_user: !_.isNil(props?.customer?.invite_user)
                ? props?.customer?.invite_user
                : true,
              first_name: props?.customer?.users[0]?.first_name || '',
              last_name: props?.customer?.users[0]?.last_name || '',
              email: props?.customer?.users[0]?.email || '',
              role: props?.customer?.users[0]?.role || 'Admin',
              location: props?.customer?.users[0]?.locations
                ? props?.customer?.users[0]?.locations?.sort((a, b) =>
                    a.loc_name > b.loc_name ? 1 : -1
                  )
                : [],
              zones: props?.customer?.users[0]?.zonesInTeacher
                ? props.customer?.users[0]?.zonesInTeacher.map((zone) => {
                    return {
                      zone_name: zone.zone.zone_name,
                      location: zone.zone.location,
                      zone_id: zone.zone_id
                    };
                  })
                : [],
              stream_live_license: !_.isNil(props?.customer?.user?.stream_live_license)
                ? props?.customer?.user?.stream_live_license
                : true,
              customer_locations: props?.customer?.customer_locations
                ? props?.customer?.customer_locations
                : [{ loc_name: '' }],
              recurring_charge_day: props?.customer?.createdAt
                ? moment(props?.customer?.createdAt).format('MM/DD/YY')
                : recurringChargeDate
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors, isValidating, arrayHelpers }) => {
              return (
                <Form>
                  <DialogContent>
                    <Box sx={{ width: '100%' }}>
                      <Stepper activeStep={activeStep} alternativeLabel>
                        {STEPS.map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                    <Box p={3} mx="auto">
                      {renderStepContent(
                        activeStep,
                        values,
                        setFieldValue,
                        touched,
                        errors,
                        arrayHelpers
                      )}
                    </Box>
                  </DialogContent>
                  <Divider />
                  <DialogActions>
                    <Stack direction="row" justifyContent="space-between" width="100%">
                      {/* {activeStep > 0 && (
                      <Button
                        variant="text"
                        sx={{ marginLeft: '20px', color: '#00000042' }}
                        onClick={handleBack}>
                        BACK
                      </Button>
                    )} */}
                      <Stack direction="row" justifyContent="flex-end" width="100%">
                        {activeStep > 0 && (
                          <Button
                            className="log-btn"
                            variant="outlined"
                            sx={{ marginRight: 1.5 }}
                            disabled={submitLoading || isValidating}
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
                    </Stack>
                  </DialogActions>
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </Dialog>
  );
};

export default CustomerForm;

CustomerForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  customer: PropTypes.object,
  setCustomer: PropTypes.func,
  getCustomersList: PropTypes.func
};
