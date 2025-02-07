import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputLabel,
  Stack,
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
import CloseIcon from '@mui/icons-material/Close';

const SettingsFormZone = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const validationSchema = yup.object({
    zone_type: yup
      .string('Enter zone type')
      .required('Zone type is required')
      .max(10, 'Zone type must be at most 10 characters')
  });
  // console.log('props', props);

  const handleSubmit = (data, { setSubmitting }) => {
    const { zone_type } = data;
    const payload = {
      zone_type: zone_type,
      cust_id:
        authCtx.user.role === 'Super Admin' ? localStorage.getItem('cust_id') : authCtx.user.cust_id
    };
    if (props.zone !== undefined && props.zone?.zone_type) {
      API.put('zone-type/edit', {
        zone_type: data.zone_type,
        zone_type_id: props.zone.zone_type_id
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getZonesList();
          props.setZone();
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
      API.post('zone-type/add', payload).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getZonesList();
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
    props.setZone();
  };
  // console.log('props', props.location);
  return (
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-user-drawer">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.zone?.zone_type !== undefined ? 'Edit Zone Type' : 'Add Zone Type'}
        <DialogContentText></DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleClose}
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
                  handleFormDialogClose();
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </>
      ) : (
        <Formik
          enableReinitialize
          validateOnChange
          validationSchema={validationSchema}
          initialValues={{
            zone_type: props?.zone?.zone_type || ''
          }}
          onSubmit={handleSubmit}>
          {({ values, setFieldValue, touched, errors }) => {
            return (
              <Form>
                <DialogContent>
                  <InputLabel id="zone_type">Zone Type</InputLabel>
                  <TextField
                    labelId="zone_type"
                    name="zone_type"
                    value={values?.zone_type}
                    onChange={(event) => {
                      setFieldValue('zone_type', event.target.value);
                    }}
                    helperText={touched.zone_type && errors.zone_type}
                    error={touched.zone_type && Boolean(errors.zone_type)}
                    fullWidth
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
                    loadingPosition={submitLoading ? 'start' : undefined}
                    startIcon={submitLoading && <SaveIcon />}
                    variant="text"
                    type={'submit'}>
                    Save Changes
                  </LoadingButton>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      )}
    </Dialog>
  );
};

export default SettingsFormZone;

SettingsFormZone.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  zone: PropTypes.object,
  zonesList: PropTypes.object,
  customer: PropTypes.object,
  getZonesList: PropTypes.func,
  setZone: PropTypes.func,
  zone_type: PropTypes.string
};
