import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
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

  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [playing, setPlaying] = useState(true);
  const [userInfoSent, setUserInfoSent] = useState(false);

  const [timeOut, setTimeOut] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [cameraUrls, setCameraUrls] = useState([]);
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
          setSelectedCameras([rooms[0]?.cameras[0]?.cam_name]);
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
          setSelectedCameras([selectedCamera?.cam_name]);
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
    setSelectedCameras([roomsToSet?.[0]?.cameras[0].cam_name]);
  }, [selectedLocation]);

  useEffect(() => {
    const room = camerasPayload?.room?.find((room) => room?.room_name == selectedRoom);
    setCameras(room?.cameras);
    setSelectedCameras([room?.cameras[0]?.cam_name]);
  }, [selectedRoom]);

  useEffect(() => {
    const urls = cameras?.map((cam) => {
      return { camName: cam?.cam_name, url: cam?.stream_uri };
    });
    setCameraUrls(urls);
  }, [cameras]);

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

  const handleSetLCameras = () => {
    return rooms
      ?.find((room) => room.room_name === selectedRoom)
      ?.cameras?.map((cam) => {
        return (
          <MenuItem key={`${cam.cam_id}`} value={`${cam.cam_name}`}>
            {cam.cam_name}
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

  return (
    <>
      {' '}
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
              <Grid item md={3} sm={12}>
                <FormControl fullWidth>
                  <InputLabel id="cameraLabel">Camera</InputLabel>
                  <Select
                    multiple
                    labelId="cameraLabel"
                    id="cameras"
                    label="Camera"
                    name={'camera'}
                    value={selectedCameras.length !== 0 ? [...selectedCameras] : []}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            onDelete={() => {
                              const cams = selectedCameras?.filter((name) => name != value);
                              setSelectedCameras(cams);
                            }}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    onChange={(event) => {
                      if (event.target.value?.length <= 2) {
                        setSelectedCameras(event.target.value);
                      }
                    }}>
                    {handleSetLCameras()}
                  </Select>
                  {selectedCameras?.length == 2 && (
                    <FormHelperText sx={{ color: 'black' }}>
                      {'Maximum two cameras can be selected'}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            {(selectedCameras.length === 0 || !playing) && (
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

            <Grid container spacing={1}>
              <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                {selectedCameras.length === 1 && playing && (
                  <Box mt={2} height={'75%'} width="75%">
                    <CustomPlayer
                      streamUri={
                        cameraUrls?.filter((cam) => cam?.camName === selectedCameras?.[0])?.[0]?.url
                      }
                      timeOut={timeOut}
                      setTimeOut={setTimeOut}
                      setPlaying={setPlaying}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              {selectedCameras.length === 2 &&
                playing &&
                selectedCameras?.map((url, index) => (
                  <Grid key={index} item md={6} sm={12}>
                    <CustomPlayer
                      noOfCameras={2}
                      streamUri={
                        cameraUrls?.filter((cam) => cam?.camName === selectedCameras?.[index])?.[0]
                          ?.url
                      }
                      timeOut={timeOut}
                      setTimeOut={setTimeOut}
                      setPlaying={setPlaying}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    />
                  </Grid>
                ))}
            </Grid>
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
    </>
  );
};

export default WatchStream;
