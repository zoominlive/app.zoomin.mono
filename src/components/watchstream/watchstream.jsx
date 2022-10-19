import {
  Autocomplete,
  Card,
  CardContent,
  Chip,
  Grid,
  // FormControl,
  // InputLabel,
  // MenuItem,
  // Select,
  TextField
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
// import ReactPlayer from 'react-player';

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const [camerasPayload, setCamerasPayload] = useState({
    location: '',
    room: '',
    cameras: []
  });
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

  return (
    <Card className="empty-content-placeholder">
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
              options={[]}
              isOptionEqualToValue={(option, value) => option.camera_id === value.camera_id}
              getOptionLabel={(option) => {
                return option.camera_name;
              }}
              // onChange={handleRoomChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip key={index} label={option.room_name} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cameras"
                  fullWidth
                  placeholder="Cameras"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {/* {roomsDropdownLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment} */}
                      </React.Fragment>
                    )
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
        {/* <ReactPlayer
          url="http://localhost/stream/d2b06a13-4608-46db-a090-0dcf49e54829/index.m3u8"
          controls={true}
          config={{
            file: {
              hlsOptions: {
                forceHLS: true,
                debug: false,
                xhrSetup: function (xhr) {
                  xhr.setRequestHeader(
                    'Authorization',
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0MCwiaWF0IjoxNjY2MTYxOTc4LCJleHAiOjE2NjYyNDgzNzh9.uSKW_86tePt2XTL4Rk99szLACfM_rUCGtJ-eiZdgndg'
                  );
                }
              }
            }
          }}
        /> */}
      </CardContent>
    </Card>
  );
};

export default WatchStream;
