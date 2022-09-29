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
  IconButton,
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
import base64 from 'base-64';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import DeleteUserDialog from './deleteuserdialog';
import AuthContext from '../../context/authcontext';
import API from '../../api';
import { Notification } from '../../hoc/notification';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';

const validationSchema = yup.object({
  first_name: yup.string('Enter first name').required('First name is required'),
  last_name: yup.string('Enter last name').required('Last name is required'),
  username: yup.string('Enter username').required('Username is required'),
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  role: yup.string('Enter role').required('Role is required'),
  location: yup.array().min(1, 'Select at least one location').required('Location is required')
});

const Profile = (props) => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const [image, setImage] = useState();
  const [imageS3URL, setImageS3URL] = useState();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const { acceptedFiles, fileRejections, getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg'],
      'image/jpg': ['.jpg']
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

  useEffect(() => {
    if (fileRejections.length > 0) {
      if (fileRejections.length > 1) {
        props.snackbarShowMessage('Only one file is allowed to be uploaded', 'error');
      } else {
        props.snackbarShowMessage('Only image file is allowed to be uploaded', 'error');
      }
    }
    if (acceptedFiles.length > 0) {
      setImage(URL.createObjectURL(acceptedFiles[0]));
      setIsImageUploading(true);
      API.post('users/uploadImage', {
        image: base64.encode(acceptedFiles[0])
      }).then((response) => {
        if (response.status === 200) {
          setImageS3URL(response.data.uploadImage);
          props.snackbarShowMessage(response.data.Message, 'success');
        } else {
          props.snackbarShowMessage(response?.response?.data?.Message, 'error');
        }
        setIsImageUploading(false);
      });
    }
  }, [acceptedFiles, fileRejections]);

  // Method to update the user profile
  const handleSubmit = (data) => {
    setSubmitLoading(true);
    API.put('users', {
      ...data,
      profile_image: imageS3URL ? imageS3URL : image ? data.profile_image : ''
    }).then((response) => {
      if (response.status === 200) {
        props.snackbarShowMessage(response?.data?.Message, 'success');
      } else {
        props.snackbarShowMessage(response?.response?.data?.Message, 'error');
      }
      setSubmitLoading(false);
    });
  };

  // Method to remove profile photo
  const handlePhotoDelete = () => {
    setImage();
    setImageS3URL();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Card>
        <CardHeader title="User Profile"></CardHeader>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={3} mb={3}>
            <Avatar src={image} />

            <Button
              variant="contained"
              color="primary"
              component="span"
              {...getRootProps({ className: 'dropzone' })}>
              Upload
              <input {...getInputProps()} />
            </Button>
            {image && (
              <Tooltip title="Remove photo">
                <IconButton
                  aria-label="delete"
                  className="row-delete-btn"
                  onClick={handlePhotoDelete}
                  sx={{ color: 'red' }}>
                  <DeleteIcon />
                </IconButton>
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
              username: authCtx.user.username || '',
              email: authCtx.user.email || '',
              role: authCtx.user.role || '',
              location: authCtx.user.location ? [authCtx.user.location] : []
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors }) => {
              return (
                <Form>
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
                    <Grid item md={12}>
                      <Autocomplete
                        multiple
                        id="location"
                        options={['Location 1', 'Location 2', 'Location 3', 'surat']}
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
                            label="Location"
                            placeholder="Location"
                            helperText={touched.location && errors.location}
                            error={touched.location && Boolean(errors.location)}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={12}>
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        spacing={3}>
                        <Button
                          disabled={isImageUploading}
                          variant="outlined"
                          className="disabled-btn"
                          onClick={() => setIsDeleteUserDialogOpen(true)}>
                          Delete User
                        </Button>
                        <LoadingButton
                          disabled={isImageUploading}
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
      <DeleteUserDialog open={isDeleteUserDialogOpen} setOpen={setIsDeleteUserDialogOpen} />
    </Box>
  );
};

export default Notification(Profile);

Profile.propTypes = {
  snackbarShowMessage: PropTypes.func
};
