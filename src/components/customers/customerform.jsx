/* eslint-disable-next-line no-unsafe-optional-chaining */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
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
  TextField
} from '@mui/material';
import { Form, Formik } from 'formik';
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

const CustomerForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const validationSchema = yup.object({
    first_name: yup.string('Enter first name').required('First name is required'),
    last_name: yup.string('Enter last name').required('Last name is required'),
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
    max_locations: yup.number('Enter maximum locations').required('Maximum locations is required'),
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
  });

  const authCtx = useContext(AuthContext);

  const handleSubmit = (data) => {
    const { first_name, last_name, ...details } = data;
    const payload = {
      ...details,
      billing_contact_first: first_name,
      billing_contact_last: last_name,
      cust_id: props.customer && props.customer.cust_id
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

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setCustomer();
    }
  };
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
        validationSchema={validationSchema}
        initialValues={{
          first_name: props?.customer?.billing_contact_first || '',
          last_name: props?.customer?.billing_contact_last || '',
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
            : true
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item md={6} xs={12}>
                    <TextField
                      label="First Name"
                      name="first_name"
                      value={values?.first_name}
                      onChange={(event) => {
                        setFieldValue('first_name', event.target.value);
                      }}
                      helperText={touched.first_name && errors.first_name}
                      error={touched.first_name && Boolean(errors.first_name)}
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
                      helperText={
                        touched.rtmp_transcoder_endpoint && errors.rtmp_transcoder_endpoint
                      }
                      error={
                        touched.rtmp_transcoder_endpoint && Boolean(errors.rtmp_transcoder_endpoint)
                      }
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
                      label="Maximum Stream Live License"
                      name="max_stream_live_license"
                      value={values?.max_stream_live_license}
                      onChange={(event) => {
                        setFieldValue('max_stream_live_license', event.target.value);
                      }}
                      helperText={touched.max_stream_live_license && errors.max_stream_live_license}
                      error={
                        touched.max_stream_live_license && Boolean(errors.max_stream_live_license)
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
                        label={`Audio Permission`}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <Divider />
              <DialogActions>
                <Button disabled={submitLoading} variant="text" onClick={handleFormDialogClose}>
                  CANCEL
                </Button>
                <LoadingButton
                  loading={submitLoading}
                  loadingPosition={submitLoading ? 'start' : undefined}
                  startIcon={submitLoading && <SaveIcon />}
                  variant="text"
                  type="submit">
                  SAVE CHANGES
                </LoadingButton>
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
