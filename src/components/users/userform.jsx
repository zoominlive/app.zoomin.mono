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
import { Notification } from '../../hoc/notification';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';

const validationSchema = yup.object({
  first_name: yup.string('Enter first name').required('First name is required'),
  last_name: yup.string('Enter last name').required('Last name is required'),
  username: yup.string('Enter username').required('Username is required'),
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  role: yup.string('Enter role').required('Role is required'),
  locations: yup.array().min(1, 'Select at least one location').required('Location is required')
});

const UserForm = (props) => {
  const [image, setImage] = useState();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
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
        props.snackbarShowMessage('Only one file is allowed to be uploaded', 'error');
      } else {
        props.snackbarShowMessage('Only image file is allowed to be uploaded', 'error');
      }
    }
  });

  // Method to update the user profile
  const handleSubmit = (data) => {
    const payload = { ...data, location: { locations: data.locations } };
    delete payload.locations;
    setSubmitLoading(true);
    if (props.user) {
      // API.put('users', payload).then((response) => {
      //   if (response.status === 200) {
      //     props.snackbarShowMessage(response?.data?.Message, 'success');
      //   } else {
      //     props.snackbarShowMessage(response?.response?.data?.Message, 'error');
      //   }
      //   setSubmitLoading(false);
      // });
    } else {
      API.post('users/createUser', payload).then((response) => {
        if (response.status === 200) {
          props.snackbarShowMessage(response?.data?.Message, 'success');
          handleFormDialogClose();
        } else {
          props.snackbarShowMessage(response?.response?.data?.Message, 'error');
        }
        setSubmitLoading(false);
      });
    }
  };

  // Method to remove profile photo
  const handlePhotoDelete = () => {
    setIsImageDeleting(true);
    API.delete('users/deleteImage').then((response) => {
      if (response.status === 200) {
        props.snackbarShowMessage(response?.data?.Message, 'success');
        setImage();
      } else {
        props.snackbarShowMessage(response?.response?.data?.Message, 'error');
      }
      setIsImageDeleting(false);
    });
  };

  // Method to get image from input and upload it to BE
  async function handleImageUpload(acceptedFiles) {
    setIsImageUploading(true);
    setImage(URL.createObjectURL(acceptedFiles[0]));
    const bas64Image = await toBase64(acceptedFiles[0]);
    API.post('users/uploadImage', {
      image: bas64Image.split(',')[1]
    }).then((response) => {
      if (response.status === 200) {
        props.snackbarShowMessage(response?.data?.Message, 'success');
      } else {
        props.snackbarShowMessage(response?.response?.data?.Message, 'error');
        setImage();
      }
      setIsImageUploading(false);
    });
  }

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading && !isImageUploading && !isImageDeleting) {
      props.setOpen(false);
      props.setUser();
      setImage();
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
          username: props?.user?.username || '',
          email: props?.user?.email || '',
          role: props?.user?.role || '',
          locations: props?.user?.location ? props?.user?.location.locations : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
          return (
            <Form>
              <DialogContent>
                <Stack spacing={3} mb={3} mt={2} direction="row" alignItems="center">
                  <Avatar src={image} />

                  <LoadingButton
                    loading={isImageUploading}
                    disabled={isImageDeleting || submitLoading}
                    variant="contained"
                    color="primary"
                    component="span"
                    {...getRootProps({ className: 'dropzone' })}>
                    Upload
                    <input {...getInputProps()} />
                  </LoadingButton>
                  {image && !isImageUploading && (
                    <Tooltip title="Remove photo">
                      <LoadingButton
                        variant="outlined"
                        disabled={isImageUploading || submitLoading}
                        loading={isImageDeleting}
                        className="image-delete-btn"
                        aria-label="delete"
                        onClick={handlePhotoDelete}>
                        <DeleteIcon />
                      </LoadingButton>
                    </Tooltip>
                  )}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item md={4} xs={12}>
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
                  <Grid item md={4} xs={12}>
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
                  <Grid item md={4} xs={12}>
                    <TextField
                      label="Username"
                      name="username"
                      value={values?.username}
                      onChange={(event) => {
                        setFieldValue('username', event.target.value);
                      }}
                      helperText={touched.username && errors.username}
                      error={touched.username && Boolean(errors.username)}
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
                    <FormControl fullWidth>
                      <InputLabel id="user-role">Role</InputLabel>
                      <Select
                        labelId="user-role"
                        id="user-role"
                        value={values?.role}
                        label="Role"
                        name="role"
                        error={touched.role && Boolean(errors.role)}
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
                      options={['Location 1', 'Location 2', 'Location 3', 'surat']}
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
                <Button
                  disabled={isImageDeleting || isImageUploading || submitLoading}
                  variant="text"
                  onClick={handleFormDialogClose}>
                  CANCEL
                </Button>
                <LoadingButton
                  disabled={isImageDeleting || isImageUploading}
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

export default Notification(UserForm);

UserForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  user: PropTypes.object,
  snackbarShowMessage: PropTypes.func,
  setUser: PropTypes.func
};
