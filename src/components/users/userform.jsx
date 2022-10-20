import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { toBase64 } from '../../utils/base64converter';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';

const validationSchema = yup.object({
  first_name: yup.string('Enter first name').required('First name is required'),
  last_name: yup.string('Enter last name').required('Last name is required'),
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  role: yup.string('Enter role').required('Role is required'),
  locations: yup.array().min(1, 'Select at least one location').required('Location is required')
});

const UserForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [image, setImage] = useState(props.user && props.user.profile_image);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [base64Image, setBase64Image] = useState();
  const authCtx = useContext(AuthContext);
  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg'],
      'image/jpg': ['.jpg']
    },
    onDropAccepted: handleImageUpload,
    onDropRejected: (fileRejections) => {
      if (fileRejections.length > 1) {
        enqueueSnackbar('Only one file is allowed to be uploaded', {
          variant: 'error'
        });
      } else {
        enqueueSnackbar('Only image file is allowed to be uploaded', {
          variant: 'error'
        });
      }
    }
  });

  // Method to update the user profile
  const handleSubmit = (data) => {
    const payload = {
      ...data,
      userId: props.user && props.user.user_id,
      location: {
        selected_locations: data.locations,
        accessable_locations: props.user ? props.user.location.accessable_locations : data.locations
      },
      image: !props.user ? base64Image : image ? (base64Image ? base64Image : image) : null,
      cust_id: authCtx.user.cust_id
    };
    delete payload.locations;
    setSubmitLoading(true);
    if (props.user) {
      API.put('users/edit', payload).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getUsersList();
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
      API.post('users/createUser', payload).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          handleFormDialogClose();
          props.getUsersList();
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

  // Method to remove profile photo
  const handlePhotoDelete = () => {
    setBase64Image();
    setImage();
  };

  // Method to get image from input and upload it to BE
  async function handleImageUpload(acceptedFiles) {
    setImage(URL.createObjectURL(acceptedFiles[0]));
    const bas64Image = await toBase64(acceptedFiles[0]);
    setBase64Image(bas64Image.split(',')[1]);
  }

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setUser();
      setImage();
      setBase64Image();
    }
  };

  return (
    <Dialog open={props.open} onClose={handleFormDialogClose} fullWidth className="add-user-drawer">
      <DialogTitle>{props.user ? 'Edit User' : 'Add User'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: props?.user?.first_name || '',
          last_name: props?.user?.last_name || '',
          email: props?.user?.email || '',
          role: props?.user?.role || '',
          locations: props?.user?.location
            ? props?.user?.location.selected_locations.sort((a, b) => (a > b ? 1 : -1))
            : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
          return (
            <Form>
              <DialogContent>
                <Stack spacing={3} mb={3} mt={2} direction="row" alignItems="center">
                  <Avatar src={image} />

                  <LoadingButton
                    disabled={submitLoading}
                    variant="contained"
                    color="primary"
                    component="span"
                    {...getRootProps({ className: 'dropzone' })}>
                    Upload
                    <input {...getInputProps()} />
                  </LoadingButton>

                  {image && (
                    <Tooltip title="Remove photo">
                      <LoadingButton
                        variant="outlined"
                        disabled={submitLoading}
                        className="image-delete-btn"
                        aria-label="delete"
                        onClick={handlePhotoDelete}>
                        <DeleteIcon />
                      </LoadingButton>
                    </Tooltip>
                  )}
                </Stack>
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
                        }}>
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
                  <Grid item xs={12} md={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="locations"
                      options={
                        props?.user
                          ? props?.user?.location?.accessable_locations.sort((a, b) =>
                              a > b ? 1 : -1
                            )
                          : authCtx.user?.location?.accessable_locations.sort((a, b) =>
                              a > b ? 1 : -1
                            )
                      }
                      onChange={(_, value) => {
                        setFieldValue('locations', value);
                      }}
                      value={values?.locations}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Location"
                          placeholder="Location"
                          helperText={touched.locations && errors.locations}
                          error={touched.locations && Boolean(errors.locations)}
                          fullWidth
                        />
                      )}
                    />
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

export default UserForm;

UserForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  user: PropTypes.object,
  setUser: PropTypes.func,
  getUsersList: PropTypes.func
};
