import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
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

  console.log(camerasPayload);

  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream']);
  }, []);

  useEffect(() => {
    if (camerasPayload.location) {
      setDropdownLoading(true);
      API.get('watchstream', { params: { location: camerasPayload.location } }).then((response) => {
        if (response.status === 200) {
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
  }, [camerasPayload.location]);

  useEffect(() => {
    if (selectedRoom) {
      const cameras = rooms
        .find((room) => room.room_id === selectedRoom.room_id)
        .cameras.filter((camera) => camera.stream_uri);
      setCameras(cameras);
    }
  }, [selectedRoom]);

  const handleLocationChange = (_, value) => {
    setCamerasPayload({ cameras: [], location: value, room: '' });
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
  const onSelect = useCallback((_, values) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, cameras: values }));
    setLimitReached(values.length >= 2);
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
                onChange={handleLocationChange}
                renderInput={(params) => <TextField {...params} label="Location" />}
              />
            </Grid>
            <Grid item md={3} sm={12}>
              <Autocomplete
                disableClearable
                value={camerasPayload.room}
                noOptionsText={
                  !camerasPayload.location
                    ? 'Select loaction first'
                    : dropdownLoading
                    ? 'Loading'
                    : 'No Options'
                }
                options={camerasPayload.location ? rooms : []}
                getOptionLabel={(option) => (option?.room_name ? option.room_name : '')}
                isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                id="room"
                onChange={handleRoomChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Room"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {dropdownLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item md={3} sm={12}>
              <Autocomplete
                fullWidth
                multiple
                id="Camera"
                value={camerasPayload.cameras}
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
                options={!camerasPayload.room ? [] : cameras}
                getOptionLabel={(option) => (option?.cam_name ? option.cam_name : '')}
                isOptionEqualToValue={(option, value) => option.cam_id === value.cam_id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={index} label={option.cam_name} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cameras"
                    fullWidth
                    placeholder="Cameras"
                    helperText={limitReached && 'Maxmimum two cameras can be selected'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {dropdownLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
          {camerasPayload.cameras.length === 0 && (
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
          {camerasPayload.cameras.length === 1 && (
            <Box mt={2}>
              <CustomPlayer streamUri={camerasPayload.cameras[0]?.stream_uri} />
            </Box>
          )}
          <Grid container spacing={2}>
            {camerasPayload.cameras.length === 2 &&
              camerasPayload.cameras.map((camera, index) => (
                <Grid key={index} item md={6} sm={12}>
                  <CustomPlayer noOfCameras={2} streamUri={camera[index]?.stream_uri} />
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WatchStream;
