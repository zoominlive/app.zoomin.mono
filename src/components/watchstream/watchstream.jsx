import {
  Box,
  Card,
  CardContent,
  // Chip,
  Grid,
  Stack,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  // FormHelperText,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Button,
  Checkbox
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import React, { useEffect, useState } from 'react';
import { useContext, useCallback } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import VideoOff from '../../assets/video-off.svg';
import CustomPlayer from './customplayer';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import { publicIpv4 } from 'public-ip';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DeleteDialog from '../common/deletedialog';
import { Play } from 'react-feather';
import FullScreenDialog from './fullscreendialog';
import { Maximize } from 'react-feather';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [camerasPayload, setCamerasPayload] = useState({
    locations: [],
    rooms: [],
    cameras: []
  });

  const [camLabel, setCamLabel] = useState([]);
  const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [playing, setPlaying] = useState(true);
  const [userInfoSent, setUserInfoSent] = useState(false);
  const [submitted, setSubmitted] = useState(true);

  const [timeOut, setTimeOut] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  // const [cameraUrls, setCameraUrls] = useState([]);
  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream']);
    setLocations(authCtx?.user?.location?.accessable_locations);
    setDropdownLoading(true);
    onSelect();
    API.get('watchstream').then((response) => {
      if (response.status === 200) {
        setTimeOut(response.data.Data[0].timeout);

        setCamerasPayload({
          location: response?.data?.Data[0].location,
          room: response?.data?.Data
        });

        if (!location.state) {
          setSelectedLocation(authCtx?.user?.location?.accessable_locations[0]);
          const rooms = response.data.Data.filter(
            (room) => room.location === authCtx?.user?.location?.accessable_locations[0]
          );
          setRooms(rooms);
          setSelectedRoom(rooms[0]?.room_name);
          setCameras(rooms[0]?.cameras);
          setSelectedCameras([rooms[0]?.cameras[0]]);
          let label = camLabel;
          label.push({
            location: authCtx?.user?.location?.accessable_locations[0],
            room_name: rooms[0]?.room_name,
            cam_name: rooms[0]?.cameras[0]?.cam_name,
            cam_id: rooms[0]?.cameras[0]?.cam_id
          });
          setCamLabel(label);
        } else {
          setSelectedLocation(location?.state?.location);
          const rooms = response.data.Data.filter(
            (room) => room.location === location?.state?.location
          );
          setRooms(rooms);
          const selectedRoom = rooms.find((room) => room.room_id === location.state.roomId);
          setSelectedRoom(selectedRoom?.room_name);
          setCameras(selectedRoom?.cameras);
          const selectedCamera = selectedRoom?.cameras?.find(
            (cam) => cam.cam_id === location.state.camId
          );
          setSelectedCameras([selectedCamera]);
          let label = camLabel;
          label.push({
            location: location?.state?.location,
            room_name: selectedRoom?.room_name,
            cam_name: selectedCamera?.cam_name,
            cam_id: selectedCamera?.cam_id
          });
          setCamLabel(label);
        }
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setDropdownLoading(false);
    });

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    const roomsToSet = camerasPayload?.room?.filter((room) => {
      return room.location === selectedLocation;
    });
    setRooms(roomsToSet);
    setSelectedRoom(roomsToSet?.[0]?.room_name);
    setCameras(roomsToSet?.[0]?.cameras);
  }, [selectedLocation]);

  useEffect(() => {
    const room = camerasPayload?.room?.find((room) => room?.room_name == selectedRoom);
    setCameras(room?.cameras);
  }, [selectedRoom]);

  const handleSetLocations = () => {
    return locations?.map((location) => {
      return (
        <MenuItem key={`${location}`} value={`${location}`}>
          {location}
        </MenuItem>
      );
    });
  };

  const handleSetRooms = () => {
    return rooms?.map((room) => {
      return (
        <MenuItem key={`${room.room_id}`} value={`${room.room_name}`}>
          {room.room_name}
        </MenuItem>
      );
    });
  };

  const onSelect = useCallback(async () => {
    try {
      if (!userInfoSent) {
        const ip = await publicIpv4();
        const response = await axios.post(
          `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_API_KEY}`
        );
        const location = response.data.location;
        const locationResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&sensor=false&key=AIzaSyDn-DZI5-5xknrwgTGIhbFc2abDFXULWro`
        );
        const locationComponents = locationResponse.data.results[0].address_components;
        let location_name = '';
        locationComponents.forEach((component) => {
          if (component.types.includes('administrative_area_level_2')) {
            location_name = component.long_name;
          }
        });
        API.post('watchstream/addviewer', {
          source_ip: ip,
          lat: location.lat,
          long: location.lng,
          location_name
        }).then((response) => {
          if (response.status === 200) {
            setUserInfoSent(true);
          } else {
            errorMessageHandler(
              enqueueSnackbar,
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
        });
      }
    } catch (error) {
      enqueueSnackbar('Something went wrong while fetching the location', { variant: 'error' });
    }
  }, []);

  const handleChangeCameras = (_, values) => {
    if (values.length < 2) {
      setPlaying(true);
      setSubmitted(false);
      setSelectedCameras(values);
      setLimitReached(false);
    }
    if (values.length == 2 && authCtx.user.role !== 'Admin') {
      setPlaying(true);
      setSubmitted(false);
      setLimitReached(true);
      setSelectedCameras(values);
    } else if (values.length == 16) {
      setPlaying(true);
      setSubmitted(false);
      setLimitReached(true);
      setSelectedCameras(values);
    } else {
      setPlaying(true);
      setSubmitted(false);
      setSelectedCameras(values);
      setLimitReached(false);
    }
  };

  const handleLabelSet = (_, values, situation, option) => {
    if (situation == 'removeOption') {
      const label = camLabel.filter((cam) => cam.cam_id != option.option.cam_id);
      setCamLabel(label);
    } else if (situation == 'selectOption') {
      const label = camLabel;
      label.push({
        location: selectedLocation,
        room_name: selectedRoom,
        cam_name: option.option.cam_name,
        cam_id: option.option.cam_id
      });
      setCamLabel(label);
    } else if (situation == 'clear') {
      setCamLabel([]);
    }
  };

  return (
    <>
      <Box>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item md={3} sm={12}>
                <FormControl fullWidth>
                  <InputLabel id="locationLabel">Location</InputLabel>
                  <Select
                    labelId="locationLabel"
                    id="location"
                    name={'location'}
                    label={'Location'}
                    value={selectedLocation ? selectedLocation : ''}
                    onChange={(event) => {
                      setSelectedLocation(event.target.value);
                    }}>
                    {handleSetLocations()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={3} sm={12}>
                <FormControl fullWidth loading={dropdownLoading}>
                  <InputLabel id="roomLabel">Room</InputLabel>
                  <Select
                    labelId="roomLabel"
                    id="room"
                    label="Room"
                    name={'room'}
                    value={selectedRoom ? selectedRoom : ''}
                    onChange={(event) => {
                      const cameras = rooms?.find((room) => room.room_name === selectedRoom);
                      setCameras(cameras.cameras);
                      setSelectedRoom(event.target.value);
                    }}>
                    {handleSetRooms()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={4.7} sm={20}>
                <Autocomplete
                  multiple
                  limitTags={2}
                  disableCloseOnSelect
                  id="tags-standard"
                  options={cameras ? cameras : []}
                  value={selectedCameras}
                  getOptionLabel={(option) => option?.cam_name}
                  isOptionEqualToValue={(option, value) => option?.cam_id === value?.cam_id}
                  onChange={(_, values, situation, option) => {
                    handleLabelSet(_, values, situation, option);
                    handleChangeCameras(_, values, situation, option);
                  }}
                  onClear
                  renderTags={(value, getTagProps) =>
                    value?.map((option, index) => (
                      <Chip key={index} label={option?.cam_name} {...getTagProps({ index })} />
                    ))
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {selectedLocation + '/' + selectedRoom + ' - ' + option?.cam_name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cameras"
                      fullWidth
                      helperText={
                        limitReached &&
                        `Maxmimum ${
                          authCtx.user.role === 'Admin' ? 'sixteen' : 'two'
                        } cameras can be selected`
                      }
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
                    />
                  )}
                />
              </Grid>
              <Grid item md={1.2} sm={12} sx={{ marginTop: '6px' }}>
                <Button
                  className="add-btn"
                  variant="contained"
                  startIcon={<Play />}
                  onClick={() => setSubmitted(true)}>
                  {' '}
                  Play
                </Button>
              </Grid>
            </Grid>

            {(selectedCameras.length == 0 || !playing) && (
              <Box mt={2} sx={{ height: '600px' }} className="no-camera-wrapper">
                <Stack
                  className="no-camera-stack"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center">
                  <img src={VideoOff} />
                  <Typography>
                    {!playing ? 'Stream stopped due to no activity' : `Camera not selected`}
                  </Typography>
                </Stack>
              </Box>
            )}
            {!submitted && selectedCameras.length != 0 && (
              <Box mt={2} sx={{ height: '600px' }} className="no-camera-wrapper">
                <Stack
                  className="no-camera-stack"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center">
                  <img src={VideoOff} />
                  <Typography>{'Submit selected cams to start the stream'}</Typography>
                </Stack>
              </Box>
            )}

            {!isFullScreenDialogOpen && (
              <>
                <Grid container spacing={1} sx={{ marginTop: '2px' }}>
                  <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {selectedCameras.length === 1 && playing && submitted && (
                      <Box mt={2} height={'75%'} width="75%">
                        <CustomPlayer
                          streamUri={selectedCameras[0]?.stream_uri}
                          camDetails={camLabel[0]}
                          timeOut={timeOut}
                          setTimeOut={setTimeOut}
                          setPlaying={setPlaying}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ marginTop: '2px' }}>
                  {selectedCameras.length === 2 &&
                    playing &&
                    submitted &&
                    selectedCameras?.map((value, index) => (
                      <Grid key={index} item md={6} sm={12}>
                        <CustomPlayer
                          noOfCameras={2}
                          camDetails={camLabel[index]}
                          streamUri={value?.stream_uri}
                          timeOut={timeOut}
                          setTimeOut={setTimeOut}
                          setPlaying={setPlaying}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        />
                      </Grid>
                    ))}
                </Grid>
                <Grid container spacing={2} sx={{ marginTop: '2px' }}>
                  {selectedCameras.length > 2 &&
                    selectedCameras.length <= 4 &&
                    playing &&
                    submitted &&
                    selectedCameras?.map((value, index) => (
                      <Grid key={index} item md={6} sm={12}>
                        <CustomPlayer
                          noOfCameras={2}
                          camDetails={camLabel[index]}
                          streamUri={value?.stream_uri}
                          timeOut={timeOut}
                          setTimeOut={setTimeOut}
                          setPlaying={setPlaying}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        />
                      </Grid>
                    ))}
                </Grid>
                <Grid container spacing={2} sx={{ marginTop: '2px' }}>
                  {selectedCameras.length > 4 &&
                    selectedCameras.length <= 16 &&
                    playing &&
                    submitted &&
                    selectedCameras?.map((value, index) => (
                      <Grid key={index} item md={3} sm={6}>
                        <CustomPlayer
                          noOfCameras={2}
                          camDetails={camLabel[index]}
                          streamUri={value?.stream_uri}
                          timeOut={timeOut}
                          setTimeOut={setTimeOut}
                          setPlaying={setPlaying}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        />
                      </Grid>
                    ))}
                </Grid>
              </>
            )}

            <DeleteDialog
              open={isDeleteDialogOpen}
              title="Are you still watching?"
              from="watchstream"
              contentText="Press Yes to continue watching "
              handleDialogClose={() => {
                setIsDeleteDialogOpen(false);
              }}
              handleDelete={() => {
                setPlaying(true);
                setIsDeleteDialogOpen(false);
              }}
            />
          </CardContent>
        </Card>
      </Box>
      <Button
        style={{ position: 'sticky', bottom: '5%', marginLeft: '95%' }}
        onClick={() => {
          setIsFullScreenDialogOpen(true);
        }}>
        <Maximize />
      </Button>
      <FullScreenDialog
        open={isFullScreenDialogOpen}
        setOpen={setIsFullScreenDialogOpen}
        handleDialogClose={() => setIsFullScreenDialogOpen(false)}
        selectedCameras={selectedCameras}
        playing={playing}
        submitted={submitted}
        camLabel={camLabel}
        timeOut={timeOut}
        setTimeOut={setTimeOut}
        setPlaying={setPlaying}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
      />
    </>
  );
};

export default WatchStream;
