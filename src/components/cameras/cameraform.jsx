import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Button,
  // Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  // Divider,
  Grid,
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

const validationSchema = yup.object({
  cam_name: yup.string('Enter camera name').required('Camera name is required'),
  cam_uri: yup.string('Enter camera url').required('URL is required'),
  description: yup.string('Enter camera description').required('Description is required'),
  location: yup.string('Select Location').required('Location is required')
});

const CameraForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const authCtx = useContext(AuthContext);

  // Method to update the user profile
  const handleSubmit = (data) => {
    const payload = {
      ...data
    };
    delete payload.locations;
    setSubmitLoading(true);
    if (props.camera) {
      API.put('users/edit', payload).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getCamerasList();
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
      API.post('cams/add', { ...payload, cust_id: localStorage.getItem('cust_id') }).then(
        (response) => {
          if (response.status === 201) {
            enqueueSnackbar(response?.data?.Message, {
              variant: 'success'
            });
            handleFormDialogClose();
            props.getCamerasList();
          } else {
            errorMessageHandler(
              enqueueSnackbar,
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
          setSubmitLoading(false);
        }
      );
    }
  };

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setCamera();
    }
  };

  const handleClose = () => setIsCloseDialog(!isCloseDialog);
  return (
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-user-drawer">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.camera ? 'Edit Camera' : 'Add Camera'}
        {/* <DialogContentText>
          Please select which stream you want to watch on your dashboard
        </DialogContentText> */}
        <IconButton
          aria-label="close"
          onClick={() => {
            //handleFormDialogClose();
            handleClose();
          }}
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
            cam_name: props?.camera?.cam_name || '',
            cam_uri: props?.camera?.cam_uri || '',
            description: props?.camera?.description || '',
            location: props?.camera?.location || ''
          }}
          onSubmit={handleSubmit}>
          {({ values, setFieldValue, touched, errors }) => {
            return (
              <Form>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item md={6} xs={12}>
                      <InputLabel id="cam_name">Camera Name</InputLabel>
                      <TextField
                        labelId="cam_name"
                        name="cam_name"
                        value={values?.cam_name}
                        onChange={(event) => {
                          setFieldValue('cam_name', event.target.value);
                        }}
                        helperText={touched.cam_name && errors.cam_name}
                        error={touched.cam_name && Boolean(errors.cam_name)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <InputLabel id="cam_uri">URL</InputLabel>
                      <TextField
                        labelId="cam_uri"
                        name="cam_uri"
                        value={values?.cam_uri}
                        onChange={(event) => {
                          setFieldValue('cam_uri', event.target.value);
                        }}
                        helperText={touched.cam_uri && errors.cam_uri}
                        error={touched.cam_uri && Boolean(errors.cam_uri)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <InputLabel id="description">description</InputLabel>
                      <TextField
                        labelId="description"
                        name="description"
                        value={values?.description}
                        onChange={(event) => {
                          setFieldValue('description', event.target.value);
                        }}
                        helperText={touched.description && errors.description}
                        error={touched.description && Boolean(errors.description)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <InputLabel id="location">Location</InputLabel>
                      <Autocomplete
                        labelId="location"
                        fullWidth
                        id="location"
                        options={
                          authCtx?.user?.location?.accessable_locations
                            ? authCtx?.user?.location?.accessable_locations?.sort((a, b) =>
                                a > b ? 1 : -1
                              )
                            : []
                        }
                        onChange={(_, value) => {
                          setFieldValue('location', value);
                        }}
                        value={values?.location}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option} {...getTagProps({ index })} />
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
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
                  {/* <Button disabled={submitLoading} variant="text" onClick={handleFormDialogClose}>
                  CANCEL
                </Button> */}
                  <LoadingButton
                    className="add-btn save-changes-btn"
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
      )}
    </Dialog>
  );
};

export default CameraForm;

CameraForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  camera: PropTypes.object,
  setCamera: PropTypes.func,
  getCamerasList: PropTypes.func
};
