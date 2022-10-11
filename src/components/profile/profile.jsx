import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
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
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import DeleteUserDialog from './deleteuserdialog';
import AuthContext from '../../context/authcontext';
import API from '../../api';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';
import { toBase64 } from '../../utils/base64converter';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
const validationSchema = yup.object({
  first_name: yup.string('Enter first name').required('First name is required'),
  last_name: yup.string('Enter last name').required('Last name is required'),
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  role: yup.string('Enter role').required('Role is required'),
  locations: yup.array().min(1, 'Select at least one location').required('Location is required')
});

const Profile = () => {
  const layoutCtx = useContext(LayoutContext);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [image, setImage] = useState();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
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

  useEffect(() => {
    layoutCtx.setActive();
    layoutCtx.setBreadcrumb(['Profile']);
  }, []);

  useEffect(() => {
    if (authCtx.user.profile_image) {
      setImage(authCtx.user.profile_image);
    }
  }, [authCtx.user]);

  // Method to update the user profile
  const handleSubmit = (data) => {
    const payload = {
      ...data,
      location: {
        selected_locations: data.locations,
        accessable_locations: authCtx.user.location.accessable_locations
      }
    };
    delete payload.locations;
    setSubmitLoading(true);
    API.put('users', payload).then((response) => {
      if (response.status === 200) {
        authCtx.setUser({
          ...response.data.Data,
          location: response.data.Data.location
        });
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...response.data.Data,
            location: response.data.Data.location
          })
        );
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
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
  };

  // Method to remove profile photo
  const handlePhotoDelete = () => {
    setIsImageDeleting(true);
    API.delete('users/deleteImage').then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        authCtx.setUser((prevUser) => ({ ...prevUser, profile_image: '' }));
        setImage();
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
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
        authCtx.setUser((prevUser) => ({
          ...prevUser,
          profile_image: response?.data?.Data?.uploadImage
        }));
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
        setImage();
      }
      setIsImageUploading(false);
    });
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Card>
        <CardHeader title="User Profile"></CardHeader>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={3} mb={3}>
            <Avatar src={image} />

            <LoadingButton
              loading={isImageUploading}
              disabled={isImageDeleting || submitLoading || deleteLoading}
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
                  disabled={isImageUploading || submitLoading || deleteLoading}
                  loading={isImageDeleting}
                  className="image-delete-btn"
                  aria-label="delete"
                  onClick={handlePhotoDelete}>
                  <DeleteIcon />
                </LoadingButton>
              </Tooltip>
            )}
          </Stack>
          <Formik
            enableReinitialize
            validateOnChange
            validationSchema={validationSchema}
            initialValues={{
              first_name: authCtx.user.first_name || '',
              last_name: authCtx.user.last_name || '',
              email: authCtx.user.email || '',
              role: authCtx.user.role || '',
              locations: authCtx.user.location ? authCtx.user.location.selected_locations : []
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors }) => {
              return (
                <Form>
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
                      <FormControl fullWidth disabled>
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
                        options={authCtx?.user?.location?.accessable_locations}
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
                    <Grid item xs={12} md={12}>
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        spacing={3}>
                        <Button
                          disabled={isImageUploading || isImageDeleting || submitLoading}
                          variant="outlined"
                          className="disabled-btn"
                          onClick={() => setIsDeleteUserDialogOpen(true)}>
                          Delete User
                        </Button>
                        <LoadingButton
                          disabled={isImageUploading || isImageDeleting || deleteLoading}
                          loading={submitLoading}
                          loadingPosition={submitLoading ? 'start' : undefined}
                          startIcon={submitLoading && <SaveIcon />}
                          variant="contained"
                          type="submit">
                          SAVE
                        </LoadingButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </Form>
              );
            }}
          </Formik>
        </CardContent>
      </Card>
      <DeleteUserDialog
        open={isDeleteUserDialogOpen}
        setOpen={setIsDeleteUserDialogOpen}
        deleteLoading={deleteLoading}
        setDeleteLoading={setDeleteLoading}
      />
    </Box>
  );
};

export default Profile;
