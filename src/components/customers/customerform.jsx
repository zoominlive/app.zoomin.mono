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
  Select,
  MenuItem,
  FormHelperText,
  IconButton
} from '@mui/material';
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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const STEPS = ['Customer', 'Customer Locations', 'User'];

const CustomerForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  // const [selectedRole, setSelectedRole] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [roomList, setRoomList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);

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
      country: yup.string('Enter country').required('Country is required'),
      postal: yup.string('Enter postal').required('Postal is required'),
      max_cameras: yup.number('Enter maximum cameras').required('Maximum cameras is required'),
      available_cameras: yup
        .number('Enter available cameras')
        .required('Available cameras is required'),
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
      max_stream_live_license: yup
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
      // rooms:
      //   selectedRole === 'Teacher'
      //     ? yup
      //         .array()
      //         .of(yup.object().shape({ room_id: yup.string(), room_name: yup.string() }))
      //         .min(1, 'Select at least one room')
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
      rooms,
      stream_live_license,
      ...details
    } = data;

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
        location: { selected_locations: location, accessable_locations: location },
        rooms: rooms,
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
      API.post('customers/createCustomer', payload).then((response) => {
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
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  const renderStepContent = (step, values, setFieldValue, touched, errors) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
              <TextField
                label="First Name"
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
              <TextField
                label="Last Name"
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
              <TextField
                label="Company Name"
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
              <TextField
                name={'phone'}
                label="Phone"
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
              <TextField
                label="Address 1"
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
              <TextField
                label="Address 2"
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
              <TextField
                label="City"
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
              <TextField
                label="Country"
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
              <TextField
                label="Postal"
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
            <Grid item md={4} xs={12}>
              <TextField
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                label="Maximum Cameras"
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
              <TextField
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                label="Available Cameras"
                name="available_cameras"
                value={values?.available_cameras}
                onChange={(event) => {
                  setFieldValue('available_cameras', event.target.value);
                }}
                helperText={touched.available_cameras && errors.available_cameras}
                error={touched.available_cameras && Boolean(errors.available_cameras)}
                fullWidth
              />
            </Grid>
            <Grid item md={4} xs={12}>
              <TextField
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                label="Maximum Locations"
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

            <Grid item xs={12} md={12}>
              <TextField
                label="Tanscoder Endpoint"
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
              <TextField
                label="RTMP Tanscoder Endpoint"
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
            <Grid item md={6} xs={12}>
              <TextField
                type="number"
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                label="Timeout"
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
            <Grid item md={6} xs={12}>
              <TextField
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                onKeyPress={(event) => {
                  if (event?.key === '-' || event?.key === '+') {
                    event.preventDefault();
                  }
                }}
                label="Maximum Stream Live License"
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
                  label={`Audio Permission`}
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
                            <TextField
                              name={`customer_locations.${index}.loc_name`}
                              value={values?.customer_locations[index]?.loc_name}
                              onChange={(event) => {
                                setFieldValue(
                                  `customer_locations[${index}].loc_name`,
                                  event.target.value
                                );
                              }}
                              label="Location Name"
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
                      endIcon={<AddIcon />}
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
              <TextField
                label="First Name"
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
              <TextField
                label="Last Name"
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
              <TextField
                label="Email"
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
              <FormControl fullWidth error={touched.role && Boolean(errors.role)}>
                <InputLabel id="user-role">Role</InputLabel>
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
              </FormControl>
            </Grid>
            <Grid item xs={12} md={values.role === 'Teacher' ? 6 : 12}>
              <Autocomplete
                fullWidth
                multiple
                id="location"
                options={values?.customer_locations
                  ?.flatMap((i) => i.loc_name)
                  ?.sort((a, b) => (a > b ? 1 : -1))}
                onChange={(_, value) => {
                  setFieldValue('location', value);
                  setSelectedLocation(value);
                }}
                value={values?.location}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={index}
                      label={option}
                      {...getTagProps({ index })}
                      //disabled={authCtx.user?.location?.accessable_locations.indexOf(option) == -1}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    placeholder="Location"
                    helperText={touched.location && errors.location}
                    error={touched.location && Boolean(errors.location)}
                    fullWidth
                  />
                )}
              />
            </Grid>
            {values.role === 'Teacher' && (
              <Grid item xs={12} md={6}>
                <Autocomplete
                  fullWidth
                  multiple
                  id="rooms"
                  noOptionsText={'Select location first'}
                  options={roomList
                    .sort((a, b) => (a?.room_name > b?.room_name ? 1 : -1))
                    ?.filter((room) => {
                      if (values?.location?.find((loc) => loc == room?.location)) {
                        return room;
                      }
                    })}
                  value={values.rooms}
                  isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                  getOptionLabel={(option) => {
                    return option?.room_name;
                  }}
                  onChange={(_, value) => {
                    setFieldValue('rooms', value);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Room"
                      placeholder="Room"
                      helperText={touched.rooms && errors.rooms}
                      error={touched.rooms && Boolean(errors.rooms)}
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
    let rooms = [];
    roomList?.map((room) => {
      let count = 0;
      selectedLocation?.forEach((location) => {
        if (room.location === location) {
          count = count + 1;
        }
      });
      if (count > 0) {
        rooms.push(room);
      }
    });
    setRoomList(rooms);
  }, [selectedLocation]);
  useEffect(() => {
    API.get('rooms/list').then((response) => {
      if (response.status === 200) {
        setRoomList(response.data.Data);
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
      open={props.open}
      onClose={handleFormDialogClose}
      fullWidth
      className="add-customer-drawer">
      <DialogTitle>{props.customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>

      <Divider />
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
          available_cameras: props?.customer?.available_cameras || '',
          max_locations: props?.customer?.max_locations || '',
          transcoder_endpoint: props?.customer?.transcoder_endpoint || '',
          rtmp_transcoder_endpoint: props?.customer?.rtmp_transcoder_endpoint || '',
          timeout: props?.customer?.timeout || '',
          max_stream_live_license: props?.customer?.max_stream_live_license || '',
          audio_permission: !_.isNil(props?.customer?.audio_permission)
            ? props?.customer?.audio_permission
            : true,
          first_name: props?.customer?.users[0]?.first_name || '',
          last_name: props?.customer?.users[0]?.last_name || '',
          email: props?.customer?.users[0]?.email || '',
          role: props?.customer?.users[0]?.role || '',
          location: props?.customer?.users[0]?.location?.selected_locations
            ? props?.customer?.users[0]?.location?.selected_locations?.sort((a, b) =>
                a > b ? 1 : -1
              )
            : [],
          rooms: props?.customer?.users[0]?.roomsInTeacher
            ? props.customer?.users[0]?.roomsInTeacher.map((room) => {
                return {
                  room_name: room.room.room_name,
                  location: room.room.location,
                  room_id: room.room_id
                };
              })
            : [],
          stream_live_license: !_.isNil(props?.customer?.user?.stream_live_license)
            ? props?.customer?.user?.stream_live_license
            : true,
          customer_locations: props?.customer?.customer_locations
            ? props?.customer?.customer_locations
            : [{ loc_name: '' }]
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
          );
        }}
      </Formik>
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
