/* eslint-disable-next-line no-unsafe-optional-chaining */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Avatar,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
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
import { useDropzone } from 'react-dropzone';
import { toBase64 } from '../../utils/base64converter';
import { Form, Formik, useFormik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import _ from 'lodash';
import CloseIcon from '@mui/icons-material/Close';

const UserForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [image, setImage] = useState(props.user && props.user.profile_image);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [base64Image, setBase64Image] = useState();
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [liveStreamLicense, setLiveStreamLicense] = useState(
    authCtx?.user?.max_stream_live_license || 0
  );
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const validationSchema = yup.object({
    first_name: yup.string('Enter first name').required('First name is required'),
    last_name: yup.string('Enter last name').required('Last name is required'),
    email: yup
      .string('Enter your email')
      .email('Enter a valid email')
      .required('Email is required'),
    role: yup.string('Enter role').required('Role is required'),
    locations: yup.array().min(1, 'Select at least one location').required('Location is required'),
    rooms:
      selectedRole === 'Teacher'
        ? yup
            .array()
            .of(yup.object().shape({ room_id: yup.string(), room_name: yup.string() }))
            .min(1, 'Select at least one room')
            .required('required')
        : yup.array()
  });
  let isUserVerified = props.user?.is_verified;
  const formik = useFormik({
    initialValues: {
      first_name: props?.user?.first_name || '',
      last_name: props?.user?.last_name || '',
      email: props?.user?.email || '',
      role: props?.user?.role || '',
      locations: props?.user?.locations
        ? props?.user?.locations?.sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
        : [],
      rooms: props?.user?.roomsInTeacher
        ? props.user?.roomsInTeacher.map((room) => {
            return {
              room_name: room?.room?.room_name,
              location: room?.room?.location,
              room_id: room?.room_id
            };
          })
        : [],
      stream_live_license: !_.isNil(props?.user?.stream_live_license)
        ? props?.user?.stream_live_license
        : false
    }
  });

  useEffect(() => {
    let rooms = [];
    roomList?.map((room) => {
      let count = 0;
      selectedLocation?.forEach((location) => {
        if (room.loc_id === location.loc_id) {
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
    API.get('rooms/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
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
      }
    );
  }, []);

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

  const handleLivestream = () => {
    authCtx.setUser({
      ...authCtx.user,
      max_stream_live_license: liveStreamLicense
    });
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...authCtx.user,
        max_stream_live_license: liveStreamLicense
      })
    );
  };
  // Method to update the user profile
  const handleSubmit = (data) => {
    console.log('data==>', data);

    const payload = {
      ...data,
      userId: props.user && props.user.user_id,
      // location: {
      //   selected_locations: data.locations,
      //   accessable_locations: props.user ? props.user.location.accessable_locations : data.locations
      // },
      location: {
        locations: data.locations
      },
      image: !props.user ? base64Image : image ? (base64Image ? base64Image : image) : null,
      max_stream_live_license: liveStreamLicense,
      cust_id: props.user && props.user.cust_id
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
          handleLivestream();
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
      API.post('users/create-user', {
        ...payload,
        cust_id: localStorage.getItem('cust_id'),
        tenant_id: localStorage.getItem('tenant_id')
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          handleFormDialogClose();
          props.getUsersList();
          handleLivestream();
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
  const resendInvite = (newData) => {
    const payload = {
      ...newData,
      inviteUser: true,
      userId: props.user && props.user.user_id,
      cust_id: props.user && props.user.cust_id
    };
    setSubmitLoading(true);
    API.put('users/edit', payload).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        props.getUsersList();
        handleFormDialogClose();
        handleLivestream();
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
  let disable_locs = props?.user?.locations
    ? props?.user?.locations
        ?.map((item) => item.loc_id)
        .filter((o) => authCtx?.user?.locations?.map((item) => item.loc_id).indexOf(o) === -1)
    : [];
  console.log('disable_loc==>', disable_locs);
  console.log('user locations==>', authCtx.user.locations);

  return (
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-user-drawer">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.user ? 'Edit Staff' : 'Add Staff'}
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
          initialValues={formik.initialValues}
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
                      <InputLabel id="first_name">First Name</InputLabel>
                      <TextField
                        labelId="first_name"
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
                      <InputLabel id="first_name">Last Name</InputLabel>
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
                      <FormControl fullWidth error={touched.role && Boolean(errors.role)}>
                        <Select
                          labelId="user-role"
                          id="user-role"
                          value={values?.role}
                          label="Role"
                          name="role"
                          onChange={(event) => {
                            setFieldValue('role', event.target.value);
                            setSelectedRole(event.target.value);
                          }}>
                          <MenuItem value={'Teacher'}>Teacher</MenuItem>
                          <MenuItem value={'User'}>Staff</MenuItem>
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
                      <InputLabel id="locations">Location</InputLabel>
                      <Autocomplete
                        labelId="locations"
                        fullWidth
                        multiple
                        id="locations"
                        options={
                          props?.user?.locations
                            ? props?.user?.locations?.sort((a, b) =>
                                a.loc_name > b.loc_name ? 1 : -1
                              )
                            : authCtx.user?.locations?.sort((a, b) =>
                                a.loc_name > b.loc_name ? 1 : -1
                              )
                        }
                        getOptionLabel={(option) => option.loc_name}
                        // options={authCtx?.user?.location?.accessable_locations.sort((a, b) =>
                        //   a > b ? 1 : -1
                        // )}
                        onChange={(_, value) => {
                          console.log('_', _);
                          console.log('value', value);
                          let flag = disable_locs.every((i) => value.includes(i));
                          setFieldValue('locations', flag ? value : value.concat(disable_locs));
                          setSelectedLocation(flag ? value : value.concat(disable_locs));
                        }}
                        value={values?.locations}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={index}
                              label={option.loc_name}
                              {...getTagProps({ index })}
                              disabled={
                                authCtx.user?.locations
                                  ?.map((item) => item.loc_name)
                                  .indexOf(option.loc_name) == -1
                              }
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            // placeholder="Location"
                            helperText={touched.locations && errors.locations}
                            error={touched.locations && Boolean(errors.locations)}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    {values.role === 'Teacher' && (
                      <Grid item xs={12} md={6}>
                        <InputLabel id="rooms">Rooms</InputLabel>
                        <Autocomplete
                          labelId="rooms"
                          fullWidth
                          multiple
                          id="rooms"
                          noOptionsText={'Select location first'}
                          options={roomList
                            .sort((a, b) => (a?.room_name > b?.room_name ? 1 : -1))
                            ?.filter((room) => {
                              if (
                                values?.locations
                                  ?.map((_) => _.loc_id)
                                  .find((loc) => loc == room?.loc_id)
                              ) {
                                return room;
                              }
                            })}
                          value={values.rooms}
                          isOptionEqualToValue={(option, value) =>
                            option?.room_id === value?.room_id
                          }
                          getOptionLabel={(option) => {
                            return option?.room_name;
                          }}
                          onChange={(_, value) => {
                            setFieldValue('rooms', value);
                          }}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={index}
                                label={option?.room_name}
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              // placeholder="Room"
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
                          disabled={
                            (props?.user &&
                              liveStreamLicense === 0 &&
                              !values.stream_live_license) ||
                            (!props?.user && liveStreamLicense === 0)
                              ? true
                              : false
                          }
                          control={
                            <Checkbox
                              checked={values.stream_live_license}
                              onChange={(event) => {
                                setFieldValue('stream_live_license', event.target.checked);
                                setLiveStreamLicense(
                                  event.target.checked
                                    ? liveStreamLicense - 1
                                    : liveStreamLicense + 1
                                );
                              }}
                            />
                          }
                          label={`Assign Live Streaming License (${liveStreamLicense} Available)`}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </DialogContent>

                <DialogActions
                  sx={{
                    paddingRight: 4,
                    paddingBottom: 3,
                    justifyContent:
                      isUserVerified || isUserVerified === undefined ? 'flex-end' : 'space-between'
                  }}>
                  {/* <Button disabled={submitLoading} variant="text" onClick={handleFormDialogClose}>
                  CANCEL
                </Button> */}
                  {props.user && isUserVerified === false && (
                    <LoadingButton
                      loadingPosition={submitLoading ? 'start' : undefined}
                      startIcon={submitLoading && <SaveIcon />}
                      loading={submitLoading}
                      onClick={() => resendInvite(formik.values)}>
                      {submitLoading === false && 'Resend Invite'}
                    </LoadingButton>
                  )}
                  <LoadingButton
                    className="add-btn save-changes-btn"
                    loading={submitLoading}
                    loadingPosition={submitLoading ? 'start' : undefined}
                    startIcon={submitLoading && <SaveIcon />}
                    variant="text"
                    type="submit">
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

export default UserForm;

UserForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  user: PropTypes.object,
  setUser: PropTypes.func,
  getUsersList: PropTypes.func
};
