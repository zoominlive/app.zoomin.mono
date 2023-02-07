import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  Autocomplete,
  Checkbox,
  CircularProgress,
  Button
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PropTypes from 'prop-types';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const WatchStreamDialogBox = (props) => {
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [locations, setLocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [camerasPayload, setCamerasPayload] = useState({
    locations: [],
    rooms: [],
    cameras: []
  });
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState([]);
  const [cameras, setCameras] = useState();
  const [allCamsChecked, setAllCamsChecked] = useState(false);
  const [allRoomChecked, setAllRoomChecked] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [allLocationChecked, setAllLocationChecked] = useState(false);
  const [selectedCameras, setSelectedCameras] = useState(null);
  const camLabel = useRef([]);
  const locs = ['Select All'];
  authCtx?.user?.location?.accessable_locations.forEach((loc) => locs.push(loc));

  useEffect(() => {
    setSelectedLocation(props?.defaultWatchStream?.locations);
    setSelectedRoom(props?.defaultWatchStream?.rooms);
    setSelectedCameras(props?.defaultWatchStream?.cameras);
  }, [props?.defaultWatchStream]);

  const getAvailableStreams = () => {
    API.get('watchstream').then((response) => {
      if (response.status === 200) {
        setCamerasPayload({
          location: [response?.data?.Data.streamDetails[0].location],
          room: response?.data?.Data.streamDetails
        });
        if (!location.state) {
          !selectedLocation.length &&
            setSelectedLocation([authCtx?.user?.location?.accessable_locations[0]]);
        } else {
          setSelectedLocation([location?.state?.location]);
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
  };
  const handleSetLocations = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option == 'Select All' && !allLocationChecked) {
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (option?.option == 'Select All' && reason === 'removeOption') {
      setSelectedLocation([]);
      setAllLocationChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option == 'Select All' &&
      allLocationChecked == true
    ) {
      setAllLocationChecked(false);
      setSelectedLocation([]);
    } else {
      setAllLocationChecked(false);
      setSelectedLocation(value);
    }
  };
  const handleSetRooms = (_, value, reason, option) => {
    const rooms2 = camerasPayload?.room?.filter((room) => {
      let count = 0;
      selectedRoom?.forEach((room1) => {
        if (room1?.room_id == room?.room_id) {
          count = 1;
        }
      });

      return count == 1;
    });

    let cameras = [{ cam_id: 'select-all', cam_name: 'Select All' }];
    rooms2?.forEach((room) => {
      room?.cameras?.forEach((cam) =>
        cameras?.push({
          ...cam,
          room_id: room.room_id,
          room_name: room.room_name,
          location: room.location
        })
      );
    });

    setCameras(cameras);

    if (reason == 'selectOption' && option?.option?.room_name == 'Select All' && !allRoomChecked) {
      setSelectedRoom(reason === 'selectOption' ? rooms.slice(1, rooms.length) : []);
      setAllRoomChecked(true);
    } else if (option?.option?.room_name == 'Select All' && reason === 'removeOption') {
      setSelectedRoom([]);
      setAllRoomChecked(false);
    } else if ((reason === 'removeOption' && selectedRoom?.length === 1) || reason === 'clear') {
      setSelectedRoom([]);
      setAllRoomChecked(false);
      setSelectedCameras(null);
    } else if (
      reason === 'selectOption' &&
      option.option.room_name == 'Select All' &&
      allRoomChecked == true
    ) {
      setAllRoomChecked(false);
      setSelectedRoom([]);
    } else {
      setAllRoomChecked(false);
      setSelectedRoom(value);
    }
  };
  const handleChangeCameras = (_, values, reason, option) => {
    if (option?.option?.cam_name == 'Select All' && reason === 'removeOption') {
      setSelectedCameras([]);
      setAllCamsChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option?.cam_name == 'Select All' &&
      allCamsChecked == true
    ) {
      setAllCamsChecked(false);
      setSelectedCameras([]);
    } else {
      setAllCamsChecked(false);
      setSelectedCameras(values);
    }
  };

  useEffect(() => {
    setLimitReached(false);
    setDropdownLoading(true);
    const locs = ['Select All'];
    authCtx?.user?.location?.accessable_locations.forEach((loc) => locs.push(loc));
    setLocations(locs);
    getAvailableStreams();
    setDropdownLoading(false);
  }, []);

  useEffect(() => {
    const roomsToSet = camerasPayload?.room?.filter((room) => {
      let count = 0;
      selectedLocation?.forEach((loc) => {
        if (loc == room?.location) {
          count = 1;
        }
      });
      return count == 1;
    });
    let roomsToAdd = [{ room_name: 'Select All', room_id: 'select-all' }];
    roomsToSet?.forEach((room) => roomsToAdd.push(room));
    setRooms(roomsToAdd);
    if (selectedRoom.length == 0) {
      setSelectedRoom([roomsToSet?.[0]]);
      let camsToAdd = [];
      roomsToSet?.[0]?.cameras.forEach((cam) =>
        camsToAdd.push({
          ...cam,
          room_id: roomsToSet?.[0]?.room_id,
          room_name: roomsToSet?.[0]?.room_name
        })
      );
      setCameras(camsToAdd);
    }

    setAllCamsChecked(false);
    setAllRoomChecked(false);
    camLabel.current.locations = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    const rooms = camerasPayload?.room?.filter((room) => {
      let count = 0;
      selectedRoom?.forEach((room1) => {
        if (room1?.room_id == room?.room_id) {
          count = 1;
        }
      });

      return count == 1;
    });

    let cameras1 = [];
    rooms?.forEach((room) => {
      room?.cameras?.forEach((cam) => {
        cameras1?.push({
          ...cam,
          room_name: room.room_name,
          room_id: room.room_id,
          location: room.location
        });
      });
    });

    setCameras(cameras1);
    setAllCamsChecked(false);
    camLabel.current.rooms = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    camLabel.current.cameras = selectedCameras;
  }, [selectedCameras]);

  return (
    <Dialog open={props.open} onClose={props.close} maxWidth={'md'} fullWidth={true}>
      <DialogTitle id="responsive-dialog-title">{'Please select.....'}</DialogTitle>
      <DialogContent>
        <div>
          <Autocomplete
            sx={{ padding: 1 }}
            multiple
            limitTags={1}
            id="tags-standard"
            options={locations?.length !== 0 ? locations : []}
            onChange={(_, value, reason, option) => {
              handleSetLocations(_, value, reason, option);
            }}
            value={selectedLocation ? selectedLocation : []}
            getOptionLabel={(option) => option}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip key={index} label={option} {...getTagProps({ index })} />
              ))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={allLocationChecked ? allLocationChecked : selected}
                />
                {option}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="location"
                fullWidth
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
          <Autocomplete
            sx={{ padding: 1 }}
            multiple
            limitTags={1}
            id="tags-standard"
            options={rooms}
            value={selectedRoom}
            getOptionLabel={(option) => option?.room_name}
            isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
            onChange={(_, value, reason, option) => {
              handleSetRooms(_, value, reason, option);
            }}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
              ))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={allRoomChecked ? allRoomChecked : selected}
                />
                {option?.room_name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="room"
                fullWidth
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
          <Autocomplete
            sx={{ padding: 1 }}
            limitTags={1}
            id="tags-standard"
            options={cameras ? cameras : []}
            value={selectedCameras}
            getOptionLabel={(option) => option?.cam_name}
            isOptionEqualToValue={(option, value) => option?.cam_id === value?.cam_id}
            onChange={(_, values, situation, option) => {
              handleChangeCameras(_, values, situation, option);
            }}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip
                  key={index}
                  label={
                    option?.cam_name == 'Select All'
                      ? option?.cam_name
                      : option?.location + '/' + option?.room_name + ' - ' + option?.cam_name
                  }
                  {...getTagProps({ index })}
                />
              ))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={allCamsChecked ? allCamsChecked : selected}
                />
                {option?.cam_name == 'Select All'
                  ? option?.cam_name
                  : option.location + '/' + option.room_name + ' - ' + option?.cam_name}
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
                      {dropdownLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  )
                }}
              />
            )}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.close}>Cancel</Button>
        <Button onClick={() => props.submit(camLabel)} autoFocus>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WatchStreamDialogBox;
WatchStreamDialogBox.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
  submit: PropTypes.func,
  defaultWatchStream: PropTypes.object
};
