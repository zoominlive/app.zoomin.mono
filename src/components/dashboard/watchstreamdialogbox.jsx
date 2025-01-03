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
  Button,
  DialogContentText,
  IconButton,
  InputLabel,
  Divider
} from '@mui/material';
import { useLocation } from 'react-router-dom';
//import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PropTypes from 'prop-types';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const icon = <RadioButtonUncheckedIcon fontSize="small" />;
const checkedIcon = <CheckCircleOutlineIcon fontSize="small" style={{ color: '#5A53DD' }} />;

const WatchStreamDialogBox = (props) => {
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [camerasPayload, setCamerasPayload] = useState({
    locations: [],
    zones: [],
    cameras: []
  });
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedZone, setSelectedZone] = useState({});
  const [cameras, setCameras] = useState();
  const [allCamsChecked, setAllCamsChecked] = useState(false);
  const [allZoneChecked, setAllZoneChecked] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [allLocationChecked, setAllLocationChecked] = useState(false);
  const [selectedCameras, setSelectedCameras] = useState(null);
  const camLabel = useRef([]);
  const locs = [{ loc_id: 'select-all', loc_name: 'Select All' }];
  authCtx?.user?.locations?.map((item) => item.loc_name).forEach((loc) => locs.push(loc));

  useEffect(() => {
    setSelectedLocation(props?.defaultWatchStream?.locations);
    setSelectedZone(props?.defaultWatchStream?.zones);
    setSelectedCameras(props?.defaultWatchStream?.cameras);
  }, [props?.defaultWatchStream]);

  const getAvailableStreams = () => {
    API.get('watchstream', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setCamerasPayload({
            location: [response?.data?.Data.streamDetails[0]?.location],
            zones: response?.data?.Data.streamDetails
          });
          if (!location.state) {
            !selectedLocation.length &&
              setSelectedLocation([authCtx?.user?.locations?.map((item) => item.loc_name)[0]]);
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
      }
    );
  };

  const handleSetLocations = (_, value, reason, option) => {
    if (
      reason == 'selectOption' &&
      option?.option?.loc_name == 'Select All' &&
      !allLocationChecked
    ) {
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (
      (option?.option?.loc_name == 'Select All' && reason === 'removeOption') ||
      reason === 'clear'
    ) {
      setSelectedLocation([]);
      setAllLocationChecked(false);
      setSelectedZone(null);
      setSelectedCameras(null);
    } else if (
      reason === 'selectOption' &&
      option?.option?.loc_name == 'Select All' &&
      allLocationChecked == true
    ) {
      setAllLocationChecked(false);
      setSelectedLocation([]);
    } else {
      setAllLocationChecked(false);
      setSelectedLocation(value);
    }
  };
  const handleSetZones = (_, value, reason, option) => {
    const zones2 = camerasPayload?.zones?.filter((zone) => {
      let count = 0;
      if (selectedZone && Object.values(selectedZone).includes(zone?.zone_id)) {
        count = 1;
      }
      return count == 1;
    });

    let cameras = [{ cam_id: 'select-all', cam_name: 'Select All' }];
    zones2?.forEach((zone) => {
      zone?.cameras?.forEach((cam) =>
        cameras?.push({
          ...cam,
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
          location: zone.location
        })
      );
    });

    setCameras(cameras);

    if (reason == 'selectOption' && option?.option?.zone_name == 'Select All' && !allZoneChecked) {
      setSelectedZone(reason === 'selectOption' ? zones.slice(1, zones.length) : []);
      setAllZoneChecked(true);
    } else if ((reason === 'removeOption' && selectedZone?.length === 1) || reason === 'clear') {
      setSelectedZone(null);
      setAllZoneChecked(false);
      setSelectedCameras(null);
    } else {
      setAllZoneChecked(false);
      setSelectedZone(value);
    }
  };
  const handleChangeCameras = (_, values) => {
    setAllCamsChecked(false);
    setSelectedCameras(values);
  };

  useEffect(() => {
    setLimitReached(false);
    setDropdownLoading(true);
    const locs = [{ loc_id: 'select-all', loc_name: 'Select All' }];
    authCtx?.user?.locations?.forEach((loc) => locs.push(loc));
    setLocations(locs);
    getAvailableStreams();
    setDropdownLoading(false);
  }, []);

  useEffect(() => {
    console.log('camerasPayload==>', camerasPayload);
    console.log('selectedLocation==>', selectedLocation);
    const zonesToSet = camerasPayload?.zones?.filter((zone) => {
      let count = 0;
      selectedLocation?.forEach((loc) => {
        console.log('loc==>', loc);
        if (loc.loc_id == zone?.location) {
          count = 1;
        }
      });
      return count == 1;
    });
    let zonesToAdd = [];
    zonesToSet?.forEach((zone) => zonesToAdd.push(zone));
    setZones(zonesToAdd);
    if (selectedZone) {
      setSelectedZone(zonesToSet?.[0]);
      let camsToAdd = [];
      zonesToSet?.[0]?.cameras.forEach((cam) =>
        camsToAdd.push({
          ...cam,
          zone_id: zonesToSet?.[0]?.zone_id,
          zone_name: zonesToSet?.[0]?.zone_name
        })
      );
      setCameras(camsToAdd);
    }

    setAllCamsChecked(false);
    setAllZoneChecked(false);
    camLabel.current.locations = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    const zones = camerasPayload?.zones?.filter((zone) => {
      let count = 0;
      if (selectedZone && Object.values(selectedZone).includes(zone?.zone_id)) {
        count = 1;
      }
      return count == 1;
    });

    let cameras1 = [];
    zones?.forEach((zone) => {
      zone?.cameras?.forEach((cam) => {
        cameras1?.push({
          ...cam,
          zone_name: zone.zone_name,
          zone_id: zone.zone_id,
          location: zone.location
        });
      });
    });

    setCameras(cameras1);
    setAllCamsChecked(false);
    camLabel.current.zones = selectedZone;
  }, [selectedZone]);

  useEffect(() => {
    camLabel.current.cameras = selectedCameras;
  }, [selectedCameras]);

  return (
    <Dialog open={props.open} onClose={props.close} maxWidth={'md'} fullWidth={true}>
      <DialogTitle id="responsive-dialog-title" sx={{ paddingTop: 3.5 }}>
        {'Watch Stream'}
        <DialogContentText>
          Please select which stream you want to watch on your dashboard
        </DialogContentText>
        <IconButton
          aria-label="close"
          onClick={props.close}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <div>
          <InputLabel id="location" className="label">
            Location
          </InputLabel>
          <Autocomplete
            labelId="location"
            sx={{ padding: '5px 12px 12px 12px', '& fieldset': { borderRadius: 4 } }}
            multiple
            limitTags={1}
            id="tags-standard"
            labelI
            options={locations?.length !== 0 ? locations : []}
            onChange={(_, value, reason, option) => {
              handleSetLocations(_, value, reason, option);
            }}
            value={selectedLocation ? selectedLocation : []}
            isOptionEqualToValue={(option, value) => option.loc_id === value.loc_id} // Ensure correct equality
            getOptionLabel={(option) => option.loc_name}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip key={index} label={option.loc_name} {...getTagProps({ index })} />
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
                {option.loc_name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
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
          <InputLabel id="zone" className="label">
            Zone
          </InputLabel>
          <Autocomplete
            labelId="zone"
            sx={{ padding: '5px 12px 12px 12px', '& fieldset': { borderRadius: 4 } }}
            limitTags={1}
            id="tags-standard"
            options={zones}
            value={selectedZone}
            getOptionLabel={(option) => option?.zone_name}
            isOptionEqualToValue={(option, value) => option?.zone_id === value?.zone_id}
            onChange={(_, value, reason, option) => {
              handleSetZones(_, value, reason, option);
            }}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip
                  style={{ backgroundColor: 'red' }}
                  key={index}
                  label={option?.zone_name}
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
                  checked={allZoneChecked ? allZoneChecked : selected}
                />
                {option?.zone_name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
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
          <InputLabel id="cameras" className="label">
            Cameras
          </InputLabel>
          <Autocomplete
            labelId="cameras"
            sx={{ padding: '5px 12px 12px 12px', '& fieldset': { borderRadius: 4 } }}
            limitTags={1}
            id="tags-standard"
            options={cameras ? cameras : []}
            value={selectedCameras}
            getOptionLabel={(option) => option?.cam_name}
            isOptionEqualToValue={(option, value) => option?.cam_id === value?.cam_id}
            onChange={(_, values) => {
              handleChangeCameras(_, values);
            }}
            renderTags={(value, getTagProps) =>
              value?.map((option, index) => (
                <Chip
                  key={index}
                  label={
                    option?.cam_name == 'Select All'
                      ? option?.cam_name
                      : option?.location + '/' + option?.zone_name + ' - ' + option?.cam_name
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
                  : option.location + '/' + option.zone_name + ' - ' + option?.cam_name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                helperText={
                  limitReached &&
                  `Maxmimum ${
                    authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin'
                      ? 'sixteen'
                      : 'two'
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
      <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
        {/* <Button onClick={props.close}>Cancel</Button> */}
        {/* <Button onClick={() => props.submit(camLabel)} autoFocus>
          Save Stream
        </Button> */}
        {/* <Button
          className="add-btn stream-btn"
          onClick={() => props.submit(camLabel)}
          // style={{
          //   borderRadius: 20,
          //   background: '#5A53DD',
          //   color: '#fff',
          //   textTransform: 'capitalize',
          //   maxWidth: 150,
          //   margin: 2
          // }}
        >
          Save Stream
        </Button> */}
        <Button
          className="add-btn dashboard-btn"
          onClick={() => props.submit(camLabel)}
          autoFocus
          // variant="contained"
          sx={{
            borderRadius: 20,
            background: '#5A53DD',
            color: '#fff',
            textTransform: 'capitalize',
            maxWidth: 150
          }}>
          Save Stream
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
