import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  Button,
  // Button,
  Chip,
  CircularProgress,
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
  TextField,
  Tooltip,
  Typography
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
import DeleteIcon from '@mui/icons-material/Delete';
import { useDropzone } from 'react-dropzone';
import { toBase64 } from '../../utils/base64converter';
import noimg from '../../assets/ic_no_image.png';

const validationSchema = yup.object({
  cam_name: yup.string('Enter camera name').required('Camera name is required'),
  cam_uri: yup
    .string('Enter camera url')
    .matches(
      /^(rtsp:\/\/)(\w+:\S+@)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/\S*)*$/,
      'Invalid RTSP URL'
    )
    .required('URL is required'),
  description: yup.string('Enter camera description').required('Description is required'),
  location: yup.string('Select Location').required('Location is required')
});

const CameraForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [base64Image, setBase64Image] = useState();
  const [image, setImage] = useState();
  const [S3Uri, setS3Uri] = useState();
  const [locationSelected, setLocationSelected] = useState(false);
  const [roomOptions, setRoomOptions] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    if (props.camera !== undefined) {
      setImage(
        props.camera && props.camera.thumbnailPresignedUrl
          ? props.camera.thumbnailPresignedUrl
          : props.camera.thumbnail
      );
    }
  }, []);

  useEffect(() => {
    setDropdownLoading(true);
    API.get(props?.camera?.location ? `rooms?location=${props?.camera?.location}` : `rooms/`, {
      params: { cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      setDropdownLoading(true);
      if (response.status === 200) {
        const rooms = response.data.Data.finalRoomDetails;
        setRoomOptions(rooms);
        setDropdownLoading(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
        setDropdownLoading(false);
      }
    });
  }, []);

  // Method to update the user profile
  const handleSubmit = (data) => {
    console.log('called==>');
    const payload = {
      cam_id: props?.camera?.cam_id,
      thumbnail: !props.camera ? base64Image : image ? (base64Image ? base64Image : image) : null,
      s3Uri: S3Uri,
      stream_id: props?.camera?.stream_uuid,
      alias: props.camera?.cam_alias,
      cust_id: localStorage.getItem('cust_id')
        ? localStorage.getItem('cust_id')
        : props?.camera?.cust_id,
      location: props?.camera?.location,
      ...data
    };
    delete payload.locations;
    setSubmitLoading(true);
    if (props.camera) {
      API.put('cams/edit', payload).then((response) => {
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
      API.post('cams/add', {
        ...payload,
        loc_id: data.location,
        cust_id: localStorage.getItem('cust_id')
      }).then((response) => {
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
      });
    }
  };

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setCamera();
    }
  };

  // Method to remove profile photo
  const handlePhotoDelete = () => {
    setBase64Image();
    setImage();
  };

  // Method to generate thumbnail
  const handleGenerateThumbnail = () => {
    console.log('reached', props.camera);
    setSubmitLoading(true);
    API.get('cams/generate-thumbnail', {
      // 221
      // '/stream/fb05fb2c-41a8-4c87-a464-489b79ef915a/index.m3u8'
      params: {
        sid: props.camera?.cam_id,
        stream_uri: props.camera?.stream_uri
      }
    }).then((response) => {
      if (response.status === 200) {
        console.log('success', response.data.Data.thumbnailUrl);
        setImage(response.data.Data.thumbnailUrl);
        setS3Uri(response.data.Data.s3Uri);
        enqueueSnackbar('Thumbnail generated', { variant: 'success' });
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

  // Method to get image from input and upload it to BE
  async function handleImageUpload(acceptedFiles) {
    setImage(URL.createObjectURL(acceptedFiles[0]));
    const bas64Image = await toBase64(acceptedFiles[0]);
    setBase64Image(bas64Image.split(',')[1]);
  }

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

  const handleGetRoomsForSelectedLocation = (location) => {
    setDropdownLoading(true);
    API.get(`rooms`, {
      params: { location: location, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        const rooms = response.data.Data.finalRoomDetails;
        setRoomOptions(rooms);
        setDropdownLoading(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
        setDropdownLoading(false);
      }
    });
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
            location: props?.camera?.customer_location?.loc_name || '',
            rooms: props?.camera?.cameras_assigned_to_rooms
              ? props?.camera?.cameras_assigned_to_rooms
              : []
          }}
          onSubmit={handleSubmit}>
          {({ values, setFieldValue, touched, errors }) => {
            return (
              <Form>
                <DialogContent>
                  <Stack
                    display={props.camera == undefined && 'none'}
                    spacing={3}
                    mb={3}
                    mt={2}
                    direction="row"
                    alignItems="center">
                    <Box
                      component="img"
                      sx={{
                        height: 133,
                        width: 250,
                        maxHeight: { xs: 233, md: 167 },
                        maxWidth: { xs: 350, md: 250 }
                      }}
                      alt="Thumbnail"
                      src={image ? image : noimg}
                    />
                    <LoadingButton
                      disabled={submitLoading}
                      variant="contained"
                      color="primary"
                      component="span"
                      {...getRootProps({ className: 'dropzone' })}>
                      Upload
                      <input {...getInputProps()} />
                    </LoadingButton>
                    <Typography>or</Typography>
                    <LoadingButton
                      disabled={submitLoading}
                      variant="contained"
                      color="primary"
                      onClick={handleGenerateThumbnail}
                      component="span">
                      Generate
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
                        disabled={props.camera}
                        value={
                          props.camera &&
                          values?.cam_uri.replace(
                            values?.cam_uri.substring(
                              values?.cam_uri.indexOf('//') + 2,
                              values?.cam_uri.indexOf('@')
                            ),
                            '************'
                          )
                        }
                        onChange={(event) => {
                          setFieldValue('cam_uri', event.target.value);
                        }}
                        helperText={touched.cam_uri && errors.cam_uri}
                        error={touched.cam_uri && Boolean(errors.cam_uri)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} xs={12} display={props.camera && 'none'}>
                      <InputLabel id="description">Description</InputLabel>
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
                    <Grid item md={6} xs={12} display={props.camera && 'none'}>
                      <InputLabel id="location">Location</InputLabel>
                      <Autocomplete
                        labelId="location"
                        fullWidth
                        id="location"
                        options={
                          authCtx?.user?.locations?.sort((a, b) =>
                            a.loc_name > b.loc_name ? 1 : -1
                          ) || []
                        }
                        getOptionLabel={(option) => option.loc_name} // Display loc_name in dropdown
                        onChange={(_, value) => {
                          setFieldValue('location', value ? value.loc_id : null); // Set loc_id in form value
                          setLocationSelected(!!value); // Handle selection state
                          handleGetRoomsForSelectedLocation(value ? value.loc_id : null); // Pass loc_id to handler
                        }}
                        value={
                          authCtx?.user?.locations?.find((loc) => loc.loc_id === values.location) ||
                          null
                        }
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option.loc_name} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            helperText={touched.location && errors.location}
                            error={touched.location && Boolean(errors.location)}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <InputLabel id="rooms">Rooms</InputLabel>
                      <Autocomplete
                        labelId="rooms"
                        fullWidth
                        multiple
                        id="rooms"
                        options={roomOptions && locationSelected ? roomOptions : []}
                        noOptionsText={!locationSelected ? 'Select location first' : 'No Room'}
                        isOptionEqualToValue={(option, value) =>
                          option.room_id === value.room?.room_id || option.room_id === value.room_id
                        }
                        getOptionLabel={(option) => {
                          return option.room_name;
                        }}
                        onMouseEnter={() => {
                          if (values?.location) {
                            setLocationSelected(true);
                          }
                        }}
                        value={values?.rooms}
                        onChange={(_, value) => {
                          console.log('value==>', value);
                          setFieldValue('rooms', value);
                        }}
                        //defaultValue={props?.room?.rooms ? props?.room?.rooms : []}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={index}
                              label={option.room?.room_name || option?.room_name}
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            disabled={!locationSelected}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <React.Fragment>
                                  {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </React.Fragment>
                              )
                            }}
                            // placeholder="Camera"
                            helperText={touched.rooms && errors.rooms}
                            error={touched.rooms && Boolean(errors.rooms)}
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
