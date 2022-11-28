import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useContext } from 'react';
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

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [camerasPayload, setCamerasPayload] = useState({
    location: '',
    room: '',
    cameras: []
  });
  const [limitReached, setLimitReached] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [cameras, setCameras] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState();
  const [userInfoSent, setUserInfoSent] = useState(false);
  const [streamDetails, setStreamDetails] = useState();
  const [textFocus, setTextFocus] = useState({ location: false, room: false, cameras: false });
  const [timeOut, setTimeOut] = useState(10);

  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream']);
    setStreamDetails(location.state);

    if (!location.state) {
      setDropdownLoading(true);
      API.get('watchstream', {
        params: { location: authCtx?.user?.location?.accessable_locations[0] }
      }).then((response) => {
        if (response.status === 200) {
          setTimeOut(response.data.Data[0].timeout);
          setStreamDetails({
            camName: response?.data?.Data[0]?.cameras[0]?.cam_name,
            location: response?.data?.Data[0]?.location,
            roomName: response?.data?.Data[0]?.room_name,
            streamUrl: response?.data?.Data[0]?.cameras[0]?.stream_uri
          });
          setCamerasPayload({
            cameras: response?.data?.Data[0]?.cameras,
            location: response?.data?.Data[0].location,
            room: response?.data?.Data[0]
          });
          setRooms(response.data.Data);
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
    }

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    if (camerasPayload.location) {
      setDropdownLoading(true);
      API.get('watchstream', { params: { location: camerasPayload.location } }).then((response) => {
        if (response.status === 200) {
          setDropdownLoading(false);
          setTimeOut(response.data.Data[0].timeout);
          setCamerasPayload({
            cameras: [],
            location: response?.data?.Data[0].location,
            room: response?.data?.Data[0]
          });
          setRooms(response.data.Data);
          setCameras(response?.data?.Data[0]?.cameras);
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
    }
  }, [camerasPayload.location]);

  useEffect(() => {});

  useEffect(() => {
    if (selectedRoom) {
      const cameras = rooms
        .find((room) => room.room_id === selectedRoom.room_id)
        .cameras.filter((camera) => camera.stream_uri);
      setCameras(cameras);
      setStreamDetails('');
    }
  }, [selectedRoom]);

  const handleLocationChange = (_, value) => {
    setCamerasPayload({ cameras: [], location: value, room: '' });
    setStreamDetails('');
    setCameras([]);
    setRooms([]);
    setLimitReached(false);
  };
  const handleRoomChange = (_, value) => {
    if (value !== camerasPayload.room) {
      setCamerasPayload((prevPayload) => ({ ...prevPayload, room: value, cameras: [] }));
    } else {
      setCamerasPayload((prevPayload) => ({ ...prevPayload, room: value }));
    }
    setSelectedRoom(value);
    setLimitReached(false);
  };
  const onSelect = useCallback(async (_, values) => {
    try {
      setCamerasPayload((prevPayload) => ({ ...prevPayload, cameras: values }));
      setLimitReached(values.length >= 2);
      if (values.length > 0 && !userInfoSent) {
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

  const checkDisable = useCallback(
    (option) => limitReached && !camerasPayload.cameras.includes(option),
    [limitReached, camerasPayload]
  );

  return (
    <Box>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item md={3} sm={12}>
              <Autocomplete
                disableClearable
                options={authCtx.user.location.accessable_locations}
                id="location"
                defaultValue={authCtx.user.location.accessable_locations[0]}
                onChange={handleLocationChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      streamDetails?.location && !textFocus.location
                        ? streamDetails?.location
                        : 'Location'
                    }
                    InputLabelProps={{
                      style: { color: streamDetails?.location ? 'black' : 'grey' }
                    }}
                    onClick={() => {
                      setTextFocus({ ...textFocus, location: true });
                    }}
                    onBlur={() => {
                      setTextFocus({ ...textFocus, location: false });
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item md={3} sm={12}>
              <Autocomplete
                disableClearable
                value={camerasPayload.room || ''}
                noOptionsText={
                  !camerasPayload.location
                    ? 'Select loaction first'
                    : dropdownLoading
                    ? 'Loading'
                    : 'No Options'
                }
                options={camerasPayload.location ? rooms : []}
                getOptionLabel={(option) => (option?.room_name ? option.room_name : '')}
                isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                id="room"
                onChange={handleRoomChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      streamDetails?.roomName && !textFocus.room ? streamDetails?.roomName : 'Room'
                    }
                    InputLabelProps={{
                      style: { color: streamDetails?.roomName ? 'black' : 'grey' }
                    }}
                    onClick={() => {
                      setTextFocus({ ...textFocus, room: true });
                    }}
                    onBlur={() => {
                      setTextFocus({ ...textFocus, room: false });
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>{params.InputProps.endAdornment}</React.Fragment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item md={3} sm={12}>
              <Autocomplete
                disableClearable
                fullWidth
                multiple
                disableCloseOnSelect
                id="Camera"
                noOptionsText={
                  !camerasPayload.room && !camerasPayload.location
                    ? 'Select location and room first'
                    : !camerasPayload.room
                    ? 'Select room first'
                    : dropdownLoading
                    ? 'Loading'
                    : 'No Camera'
                }
                onChange={onSelect}
                getOptionDisabled={checkDisable}
                options={!camerasPayload?.room ? [] : cameras}
                getOptionLabel={(option) => (option?.cam_name ? option.cam_name : '')}
                isOptionEqualToValue={(option, value) => option.cam_id === value.cam_id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={index} label={option?.cam_name} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      streamDetails?.camName && !textFocus.cameras
                        ? streamDetails?.camName
                        : 'Cameras'
                    }
                    InputLabelProps={{
                      style: { color: streamDetails?.camName ? 'black' : 'grey' }
                    }}
                    onClick={() => {
                      setTextFocus({ ...textFocus, cameras: true });
                    }}
                    onBlur={() => {
                      setTextFocus({ ...textFocus, cameras: false });
                    }}
                    placeholder="Cameras"
                    helperText={limitReached && 'Maxmimum two cameras can be selected'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>{params.InputProps.endAdornment}</React.Fragment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
          {camerasPayload.cameras.length === 0 && !streamDetails?.streamUrl && (
            <Box mt={2} sx={{ height: '600px' }} className="no-camera-wrapper">
              <Stack
                className="no-camera-stack"
                spacing={1}
                alignItems="center"
                justifyContent="center">
                <img src={VideoOff} />
                <Typography>Camera not selected</Typography>
              </Stack>
            </Box>
          )}
          {streamDetails?.streamUrl && camerasPayload.cameras.length === 0 && (
            <Box mt={2}>
              <CustomPlayer
                streamUri={streamDetails?.streamUrl}
                timeOut={timeOut}
                setTimeOut={setTimeOut}
              />
            </Box>
          )}
          <Grid container spacing={1}>
            <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              {camerasPayload.cameras.length === 1 && (
                <Box mt={2} height={'75%'} width="75%">
                  <CustomPlayer
                    streamUri={camerasPayload.cameras[0]?.stream_uri}
                    timeOut={timeOut}
                    setTimeOut={setTimeOut}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {camerasPayload.cameras.length === 2 &&
              camerasPayload.cameras.map((camera, index) => (
                <Grid key={index} item md={6} sm={12}>
                  <CustomPlayer
                    noOfCameras={2}
                    streamUri={camera?.stream_uri}
                    timeOut={timeOut}
                    setTimeOut={setTimeOut}
                  />
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WatchStream;
