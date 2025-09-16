/* eslint-disable no-unused-vars */
/* eslint-disable-next-line no-unsafe-optional-chaining */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { ErrorMessage, Field, FieldArray, Form, Formik, useFormik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { Plus } from 'react-feather';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import CloseIcon from '@mui/icons-material/Close';
import { timezones } from '../../utils/constants';
import closeicon from '../../assets/closeicon.svg';
import CautionIcon from '../../assets/caution.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const SettingsForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [statusChecked, setStatusChecked] = useState(props.location?.status);
  const [maxLocationAlert, setMaxLocationAlert] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const validationSchema = yup.object({
    customer_locations: yup
      .array()
      .of(yup.string('Enter location').required('Location Name is required')),
    time_zone: yup
      .array()
      .of(yup.string('Enter timezone').required('Location Timezone is required'))
  });
  const mappedTimezones = timezones.map((item) => item.timezone);
  // console.log('props', props);

  const handleSubmit = (data, { setSubmitting }) => {
    const { customer_locations, time_zone } = data;
    const payload = {
      user:
        authCtx.user && authCtx.user.cust_id !== null
          ? authCtx.user.cust_id
          : localStorage.getItem('cust_id'),
      customer_locations: customer_locations,
      time_zone: time_zone
    };
    if (props.location !== undefined && props.location?.loc_name) {
      setSubmitLoading(true);
      API.put('customers/edit-customer-location', {
        loc_name: data.customer_locations[0],
        time_zone: data.time_zone[0],
        loc_id: props.location.loc_id,
        status: statusChecked
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getLocationsList();
          props.setLocation();
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
      let new_locations = [];
      let mappedLocations = props.locationsList.map((item) => item.loc_name);
      new_locations = [...mappedLocations, ...data.customer_locations];
      if (new_locations.length > props.customer?.max_locations) {
        setMaxLocationAlert(true);
      } else {
        setSubmitLoading(true);
        API.post('customers/create-customer-location', payload).then((response) => {
          if (response.status === 201) {
            enqueueSnackbar(response?.data?.Message, {
              variant: 'success'
            });
            props.getLocationsList();
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
      }
    }
    // let new_locations = [];
    // let mappedLocations = props.locationsList.map((item) => item.loc_name);
    // new_locations = [...mappedLocations, ...data.customer_locations];
    // if (new_locations.length > props.customer?.max_locations) {
    //   setMaxLocationAlert(true);
    // } else {
    //   setSubmitLoading(true);
    //   console.log('payload==>', payload);
    //   props.location !== undefined && props.location?.loc_name
    //     ? API.put('customers/editCustomerLocation', {
    //         loc_name: data.customer_locations[0],
    //         loc_id: props.location.loc_id,
    //         status: statusChecked
    //       }).then((response) => {
    //         if (response.status === 200) {
    //           enqueueSnackbar(response?.data?.Message, {
    //             variant: 'success'
    //           });
    //           props.getLocationsList();
    //           props.setLocation();
    //           handleFormDialogClose();
    //         } else {
    //           errorMessageHandler(
    //             enqueueSnackbar,
    //             response?.response?.data?.Message || 'Something Went Wrong.',
    //             response?.response?.status,
    //             authCtx.setAuthError
    //           );
    //         }
    //         setSubmitLoading(false);
    //       })
    //     : API.post('customers/createCustomerLocation', payload).then((response) => {
    //         if (response.status === 201) {
    //           enqueueSnackbar(response?.data?.Message, {
    //             variant: 'success'
    //           });
    //           props.getLocationsList();
    //           handleFormDialogClose();
    //         } else {
    //           errorMessageHandler(
    //             enqueueSnackbar,
    //             response?.response?.data?.Message || 'Something Went Wrong.',
    //             response?.response?.status,
    //             authCtx.setAuthError
    //           );
    //         }
    //         setSubmitLoading(false);
    //       });
    // }
    setSubmitting(false);
  };

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
    }
    props.setLocation();
  };
  // console.log('props', props.location);
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
      onClose={handleClose}
      fullWidth
      className="add-user-drawer">
      {/* <Divider /> */}
      {isCloseDialog ? (
        <ConfirmationDialog
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          onConfirm={() => {
            setIsCloseDialog(false);
            handleFormDialogClose();
          }}
          handleFormDialogClose={handleClose}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            {props.location?.loc_name !== undefined ? 'Edit Location' : 'Add Location'}
            <DialogContentText></DialogContentText>
            <IconButton
              aria-label="close"
              onClick={handleClose}
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
            validationSchema={validationSchema}
            initialValues={{
              customer_locations:
                props.location?.loc_name !== undefined ? [props.location?.loc_name] : [''],
              time_zone:
                props.location?.time_zone !== undefined
                  ? [props.location?.time_zone]
                  : [timezones[168].timezone]
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors }) => {
              return (
                <Form>
                  {props.locationsList?.length === props.customer.max_locations &&
                  props.location?.loc_name === undefined ? (
                    <DialogContent>
                      <p>
                        You have exceeded the maximum number of allowed locations. <br /> Please
                        contact <a href="support@zoominlive.com">support@zoominlive.com</a> to
                        activate more locations. Alternatively you may also choose to delete a
                        location.
                      </p>
                    </DialogContent>
                  ) : (
                    <>
                      <DialogContent>
                        <FieldArray
                          name="customer_locations"
                          render={(arrayHelpers) => {
                            return (
                              <>
                                {values.customer_locations &&
                                  values.customer_locations?.length > 0 &&
                                  values.customer_locations?.map((_, index) => (
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
                                          <InputLabel id={`customer_locations.${index}`}>
                                            Location Name
                                          </InputLabel>
                                          <TextField
                                            // disabled={props.location?.loc_name}
                                            labelId={`customer_locations.${index}`}
                                            name={`customer_locations.${index}`}
                                            value={values?.customer_locations[index]}
                                            onChange={(event) => {
                                              // console.log('val=> ', event.target.value);
                                              setFieldValue(
                                                `customer_locations[${index}]`,
                                                event.target.value
                                              );
                                            }}
                                            helperText={
                                              touched &&
                                              touched.customer_locations &&
                                              touched.customer_locations[index] &&
                                              errors &&
                                              errors.customer_locations &&
                                              errors.customer_locations[index]
                                            }
                                            error={
                                              touched &&
                                              touched.customer_locations &&
                                              touched.customer_locations[index] &&
                                              errors &&
                                              errors.customer_locations &&
                                              errors.customer_locations[index]
                                            }
                                            fullWidth
                                          />
                                        </Grid>
                                        <Grid item md={4} sm={12}>
                                          <InputLabel id={`time_zone.${index}`}>
                                            Timezone
                                          </InputLabel>
                                          <Autocomplete
                                            labelId={`time_zone.${index}`}
                                            fullWidth
                                            id={`time_zone.${index}`}
                                            options={mappedTimezones}
                                            onChange={(_, value) => {
                                              setFieldValue(`time_zone[${index}]`, value);
                                            }}
                                            value={
                                              values?.time_zone[index]
                                                ? values?.time_zone[index]
                                                : timezones[168].timezone
                                            }
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                helperText={touched.time_zone && errors.time_zone}
                                                error={
                                                  touched.time_zone && Boolean(errors.time_zone)
                                                }
                                                fullWidth
                                              />
                                            )}
                                          />
                                        </Grid>
                                        {props.location?.loc_name !== undefined && (
                                          <Grid item md={2} sm={12}>
                                            <Box className="row-button-wrapper">
                                              <InputLabel>
                                                {statusChecked ? 'Disable' : 'Enable'}
                                              </InputLabel>
                                              <Switch
                                                disabled={
                                                  authCtx.user.role === 'Admin' &&
                                                  props.activeLocations === 1 &&
                                                  props.location.status === true
                                                }
                                                className={`switch-disable`}
                                                checked={statusChecked}
                                                onChange={() => {
                                                  setStatusChecked(!statusChecked);
                                                }}
                                                inputProps={{ 'aria-label': 'controlled' }}
                                              />
                                            </Box>
                                          </Grid>
                                        )}
                                        {props.location?.loc_name !== undefined ? (
                                          <></>
                                        ) : (
                                          <Grid item md={2} sm={12}>
                                            <Box className="row-button-wrapper">
                                              <IconButton
                                                aria-label="delete"
                                                className="row-delete-btn"
                                                onClick={() => {
                                                  arrayHelpers.remove(index);
                                                  if (maxLocationAlert) {
                                                    setMaxLocationAlert(false);
                                                  }
                                                }}>
                                                <DeleteIcon />
                                              </IconButton>
                                            </Box>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Box>
                                  ))}
                                {maxLocationAlert && (
                                  <p>You have reached the max allowed location limit</p>
                                )}
                                {props.location?.loc_name !== undefined ? (
                                  <></>
                                ) : (
                                  <Box
                                    className="row-button-wrapper"
                                    justifyContent="flex-end"
                                    mt={2}>
                                    <Button
                                      variant="contained"
                                      endIcon={<Plus />}
                                      disabled={maxLocationAlert}
                                      className="row-add-btn"
                                      onClick={() => {
                                        arrayHelpers.push('');
                                      }}>
                                      Add Customer Location
                                    </Button>
                                  </Box>
                                )}
                              </>
                            );
                          }}
                        />
                      </DialogContent>
                      <Divider />
                      <DialogActions
                        sx={{
                          paddingRight: 4,
                          paddingBottom: 3,
                          justifyContent: 'end'
                        }}>
                        <LoadingButton
                          className="add-btn save-changes-btn"
                          loading={submitLoading}
                          disabled={maxLocationAlert}
                          loadingPosition={submitLoading ? 'start' : undefined}
                          startIcon={submitLoading && <SaveIcon />}
                          variant="text"
                          type={'submit'}>
                          Save Changes
                        </LoadingButton>
                      </DialogActions>
                    </>
                  )}
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </Dialog>
  );
};

export default SettingsForm;

SettingsForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  location: PropTypes.object,
  locationsList: PropTypes.object,
  customer: PropTypes.object,
  getLocationsList: PropTypes.func,
  setLocation: PropTypes.func,
  loc_name: PropTypes.string,
  activeLocations: PropTypes.number
};
