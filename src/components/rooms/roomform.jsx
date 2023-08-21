import {
  Box,
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
  CircularProgress,
  Select,
  Chip,
  TextField,
  Autocomplete,
  DialogContentText,
  IconButton
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useRef } from 'react';
import API from '../../api';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';

const validationSchema = yup.object({
  room_name: yup.string('Enter Room name').required('Room name is required'),
  location: yup.string('Select Location').required('Location is required'),
  cameras: yup.array().min(1, 'Select at least one Camera').required('Camera is required')
});

const RoomForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [initialState, setInitialState] = useState({
    room_name: props?.room?.room_name ? props?.room?.room_name : '',
    location: props?.room?.location ? props?.room?.location : '',
    cameras: props?.room?.cameras ? props?.room?.cameras : []
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [cameraSaveLoading, setCameraSaveLoading] = useState([]);
  const [disableActions, setDisableActions] = useState(false);
  const formikRef = useRef(null);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [cameraOptions, setCameraOptions] = useState([]);
  // const [isInitialLocation, setIsInitialLocation] = useState(false);
  // const maximumCams = 15;

  useEffect(() => {
    const tempCameraSaveLoading = props?.room?.cameras?.map(() => false);
    setCameraSaveLoading(tempCameraSaveLoading || []);
    setDropdownLoading(true);
    API.get(props?.room?.location ? `cams?location=${props?.room?.location}` : `cams/`, {
      params: { cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      setDropdownLoading(true);
      if (response.status === 200) {
        const cameras = response.data.Data.cams;
        setCameraOptions(cameras);
        //setInitialState({ ...initialState, cameras: cameras });
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

  useEffect(() => {
    if (cameraSaveLoading.length > 0) {
      const tempCameraSaveLoading = cameraSaveLoading.some((loading) => loading);
      if (tempCameraSaveLoading) {
        setDisableActions(true);
      } else {
        setDisableActions(false);
      }
    }
  }, [cameraSaveLoading]);

  // Method to add/edit room
  const handleSubmit = (data) => {
    setSubmitLoading(true);

    if (props.room) {
      API.put('rooms/edit', {
        ...data,
        room_id: props.room.room_id,
        camerasToAdd: data.cameras
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          const index = props.roomsPayload.rooms.findIndex(
            (room) => room.room_id === props.room.room_id
          );
          if (index !== -1) {
            props.getDropDownRoomList();
            props.setRoomsPayload((prev) => {
              const tempPayload = { ...prev };
              const index = tempPayload.rooms.findIndex(
                (item) => item.room_id === props.room.room_id
              );
              if (index !== -1) {
                tempPayload.rooms[index].room_name = data.room_name;
              }
              return tempPayload;
            });
          } else {
            props.getRoomsList();
            props.getDropDownRoomList();
          }
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setSubmitLoading(false);
        handleFormDialogClose();
      });
    } else {
      API.post('rooms/add', { ...data, cust_id: localStorage.getItem('cust_id') }).then(
        (response) => {
          if (response.status === 201) {
            enqueueSnackbar(response.data.Message, { variant: 'success' });
            props.getRoomsList();
            props.getDropDownRoomList();
          } else {
            errorMessageHandler(
              enqueueSnackbar,
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
          setSubmitLoading(false);
          handleFormDialogClose();
        }
      );
    }
  };

  // Method to close form dialog
  const handleFormDialogClose = () => {
    props.setOpen(false);
    props.setRoom();
  };

  const handleGetCamerasForSelectedLocation = (location) => {
    setDropdownLoading(true);
    API.get(`cams`, {
      params: { location: location, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        const cameras = response.data.Data.cams;
        setCameraOptions(cameras);
        //setInitialState({ ...initialState, cameras: cameras, location: location });
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

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        if (!submitLoading && !disableActions) {
          handleFormDialogClose();
        }
      }}
      fullWidth
      className="edit-family-dialog">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.room ? 'Edit Room' : 'Add Room'}
        <DialogContentText>
          Please select which stream you want to watch on your dashboard
        </DialogContentText>
        <IconButton
          aria-label="close"
          onClick={() => {
            if (!submitLoading && !disableActions) {
              handleFormDialogClose();
            }
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
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        innerRef={formikRef}
        initialValues={initialState}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
          return (
            <Form>
              <DialogContent>
                <Box px={4}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                      <InputLabel id="room_name">Room Name</InputLabel>
                      <TextField
                        labelId="room_name"
                        name="room_name"
                        value={values?.room_name}
                        onChange={(event) => {
                          setFieldValue('room_name', event.target.value);
                          setInitialState({ ...initialState, room_name: event.target.value });
                        }}
                        helperText={touched.room_name && errors.room_name}
                        error={touched.room_name && Boolean(errors.room_name)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <InputLabel id="location-select">Location</InputLabel>
                      <FormControl fullWidth error={touched.location && Boolean(errors.location)}>
                        <Select
                          name="location"
                          labelId="location-select"
                          id="location-select"
                          value={values?.location}
                          onChange={(event) => {
                            setFieldValue('location', event.target.value);
                            setLocationSelected(true);
                            handleGetCamerasForSelectedLocation(event.target.value);
                          }}>
                          {authCtx.user &&
                            authCtx.user.location &&
                            authCtx.user.location.selected_locations &&
                            authCtx.user.location.selected_locations.length > 0 &&
                            authCtx.user.location.selected_locations
                              .sort((a, b) => (a > b ? 1 : -1))
                              .map((location, index) => {
                                return (
                                  <MenuItem key={index} value={location}>
                                    {location}
                                  </MenuItem>
                                );
                              })}
                        </Select>
                        {touched.location && errors.location && (
                          <FormHelperText sx={{ color: '#d32f2f' }}>
                            {errors.location}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <InputLabel id="cameras">Cameras</InputLabel>
                      <Autocomplete
                        labelId="cameras"
                        fullWidth
                        multiple
                        id="cameras"
                        options={cameraOptions && locationSelected ? cameraOptions : []}
                        noOptionsText={!locationSelected ? 'Select location first' : 'No Camera'}
                        isOptionEqualToValue={(option, value) => option.cam_id === value.cam_id}
                        getOptionLabel={(option) => {
                          return option.cam_name + ' - ' + option?.description;
                        }}
                        onMouseEnter={() => {
                          if (values?.location) {
                            setLocationSelected(true);
                          }
                        }}
                        value={values?.cameras}
                        onChange={(_, value) => {
                          setFieldValue('cameras', value);
                        }}
                        //defaultValue={props?.room?.cameras ? props?.room?.cameras : []}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option.cam_name} {...getTagProps({ index })} />
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
                            helperText={touched.cameras && errors.cameras}
                            error={touched.cameras && Boolean(errors.cameras)}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>

              <Divider />
              <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
                {/* <Button
                  disabled={disableActions || submitLoading}
                  variant="text"
                  onClick={() => {
                    if (!submitLoading && !disableActions) {
                      handleFormDialogClose();
                    }
                  }}>
                  CANCEL
                </Button> */}
                <LoadingButton
                  className="add-btn save-changes-btn"
                  disabled={disableActions}
                  loading={submitLoading}
                  loadingPosition={submitLoading ? 'start' : undefined}
                  startIcon={submitLoading && <SaveIcon />}
                  variant="text"
                  type="submit">
                  {/* {props?.room?.room_id ? 'Save Changes' : 'Save Room'} */}
                  Save Room
                </LoadingButton>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default RoomForm;

RoomForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  room: PropTypes.object,
  setRoom: PropTypes.func,
  getRoomsList: PropTypes.func,
  getDropDownRoomList: PropTypes.func,
  setRoomsPayload: PropTypes.func,
  setDropdownList: PropTypes.func,
  roomsPayload: PropTypes.object
};
