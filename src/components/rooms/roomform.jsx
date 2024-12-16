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
  IconButton,
  Button,
  Stack,
  FormControlLabel,
  Checkbox
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
import _ from 'lodash';
import CloseIcon from '@mui/icons-material/Close';

const validationSchema = yup.object({
  room_name: yup.string('Enter Zone name').required('Zone name is required'),
  location: yup.string('Select Location').required('Location is required'),
  zone: yup.string('Select Zone').required('Zone is required')
  // cameras: yup.array().min(1, 'Select at least one Camera').required('Camera is required')
});

const RoomForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [initialState, setInitialState] = useState({
    room_name: props?.room?.room_name ? props?.room?.room_name : '',
    location: props?.room?.location ? props?.room?.location : '',
    zone: props?.room?.zone ? props?.room?.zone.zone_id : '',
    cameras: props?.room?.cameras ? props?.room?.cameras : [],
    stream_live_license: !_.isNil(props?.room?.stream_live_license)
      ? props?.room?.stream_live_license
      : false
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [cameraSaveLoading, setCameraSaveLoading] = useState([]);
  const [disableActions, setDisableActions] = useState(false);
  const formikRef = useRef(null);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [liveStreamLicense, setLiveStreamLicense] = useState(
    authCtx?.user?.max_stream_live_license_room || 0
  );
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

  const handleLivestream = () => {
    authCtx.setUser({
      ...authCtx.user,
      max_stream_live_license_room: liveStreamLicense
    });
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...authCtx.user,
        max_stream_live_license_room: liveStreamLicense
      })
    );
  };

  // Method to add/edit room
  const handleSubmit = (data) => {
    console.log('data==>', data);

    setSubmitLoading(true);
    let customer_id =
      authCtx.user.role === 'Super Admin' ? localStorage.getItem('cust_id') : authCtx.user.cust_id;
    if (props.room) {
      API.put('rooms/edit', {
        ...data,
        room_id: props.room.room_id,
        loc_id: data.location,
        camerasToAdd: data.cameras,
        max_stream_live_license_room: liveStreamLicense,
        cust_id: customer_id
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          const index = props.roomsPayload.rooms.findIndex(
            (room) => room.room_id === props.room.room_id
          );
          if (index !== -1) {
            // props.getDropDownRoomList();
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
            // props.getDropDownRoomList();
          }
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
        handleFormDialogClose();
      });
    } else {
      API.post('rooms/add', {
        ...data,
        loc_id: data.location,
        cust_id: localStorage.getItem('cust_id'),
        max_stream_live_license_room: liveStreamLicense
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getRoomsList();
          // props.getDropDownRoomList();
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
        handleFormDialogClose();
      });
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
  const handleOnClose = () => {
    setIsCloseDialog(!isCloseDialog);
  };

  return (
    <Dialog
      open={props.open}
      // onClose={() => {
      //   if (!submitLoading && !disableActions) {
      //     handleFormDialogClose();
      //   }
      // }}
      onClose={handleOnClose}
      fullWidth
      className="edit-family-dialog">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.room ? 'Edit Zone' : 'Add Zone'}
        <DialogContentText>Quickly add zones to your account</DialogContentText>
        <IconButton
          aria-label="close"
          // onClick={() => {
          //   if (!submitLoading && !disableActions) {
          //     handleFormDialogClose();
          //   }
          // }}
          onClick={handleOnClose}
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
                  props.setOpen(false);
                  props.setRoom();
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
                        <InputLabel id="room_name">Zone Name</InputLabel>
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
                            {authCtx.user.locations
                              ?.sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
                              .map((item) => (
                                <MenuItem key={item.loc_id} value={item.loc_id}>
                                  {item.loc_name}
                                </MenuItem>
                              ))}
                          </Select>
                          {touched.location && errors.location && (
                            <FormHelperText sx={{ color: '#d32f2f' }}>
                              {errors.location}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={12}>
                        <InputLabel id="zone-type-select">Type</InputLabel>
                        <FormControl fullWidth error={touched.zone && Boolean(errors.zone)}>
                          <Select
                            name="zone-type"
                            labelId="zone-type-select"
                            id="zone-type-select"
                            value={values?.zone}
                            onChange={(event) => {
                              setFieldValue('zone', event.target.value);
                            }}>
                            {props.zone
                              ?.sort((a, b) => (a.zone_name > b.zone_name ? 1 : -1))
                              .map((item) => (
                                <MenuItem key={item.zone_id} value={item.zone_id}>
                                  {item.zone_name}
                                </MenuItem>
                              ))}
                          </Select>
                          {touched.location && errors.location && (
                            <FormHelperText sx={{ color: '#d32f2f' }}>{errors.zone}</FormHelperText>
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
                          noOptionsText={!locationSelected ? 'Select location first' : 'No Cameras'}
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
                              <Chip
                                key={index}
                                label={option.cam_name}
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
                              // helperText={touched.cameras && errors.cameras}
                              // error={touched.cameras && Boolean(errors.cameras)}
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
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
                    Save Zone
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

export default RoomForm;

RoomForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  room: PropTypes.object,
  zone: PropTypes.array,
  setRoom: PropTypes.func,
  getRoomsList: PropTypes.func,
  getDropDownRoomList: PropTypes.func,
  setRoomsPayload: PropTypes.func,
  setDropdownList: PropTypes.func,
  roomsPayload: PropTypes.object,
  user: PropTypes.object
};
