import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  // FormControl,
  // InputLabel,
  // MenuItem,
  // Select,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import VideoOff from '../../assets/video-off.svg';
// import ReactPlayer from 'react-player';

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const [camerasPayload, setCamerasPayload] = useState({
    location: '',
    room: '',
    cameras: []
  });
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream']);
  }, []);

  const handleLocationChange = (_, value) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, location: value }));
  };
  const handleRoomChange = (_, value) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, room: value }));
  };
  const onSelect = useCallback((_, values) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, cameras: values }));
    setLimitReached(values.length >= 2);
  }, []);

  const checkDisable = useCallback(
    (option) => limitReached && !camerasPayload.cameras.includes(option),
    [limitReached, camerasPayload]
  );

  console.log(camerasPayload);

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
                noOptionsText={!camerasPayload.location ? 'Select loaction first' : 'No Options'}
                options={camerasPayload.location ? ['Room 1', 'Room 2'] : []}
                id="room"
                onChange={handleRoomChange}
                renderInput={(params) => <TextField {...params} label="Room" />}
              />
            </Grid>
            <Grid item md={3} sm={12}>
              <Autocomplete
                fullWidth
                multiple
                id="Camera"
                noOptionsText={
                  !camerasPayload.room && !camerasPayload.location
                    ? 'Select location and room first'
                    : !camerasPayload.room
                    ? 'Select room first'
                    : 'No Camera'
                }
                onChange={onSelect}
                getOptionDisabled={checkDisable}
                options={!camerasPayload.room ? [] : ['Cam 1', 'Cam 2', 'Cam 3']}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={index} label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cameras"
                    fullWidth
                    placeholder="Cameras"
                    helperText={limitReached && 'Maxmimum two cameras can be selected'}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Box mt={2} sx={{ height: '600px' }} className="no-camera-wrapper">
            <Stack
              className="no-camera-stack"
              spacing={1}
              alignItems="center"
              justifyContent="center">
              <img src={VideoOff} />
              <Typography>Camera not selected</Typography>
            </Stack>
            {/* <ReactPlayer
            url="http://localhost/stream/d7009e03-fdc6-4ca3-a58f-6d9565ba71df/index.m3u8"
            width={'100%'}
            controls={true}
            config={{
              file: {
                hlsOptions: {
                  forceHLS: true,
                  debug: false,
                  xhrSetup: function (xhr) {
                    xhr.setRequestHeader(
                      'Authorization',
                      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozMCwiaWF0IjoxNjY2MjY1ODUxLCJleHAiOjE2NjYzNTIyNTF9.VGFKTIB7MRc4aSdJDEduE0BOZDxm3yyanwMqZXxYX-0'
                    );
                  }
                }
              }
            }}
          /> */}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WatchStream;
