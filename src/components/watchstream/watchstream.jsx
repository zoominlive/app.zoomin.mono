import {
  Box,
  Card,
  CardContent,
  // Chip,
  Grid,
  Stack,
  Typography,

  // FormHelperText,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Button,
  Checkbox,
  InputLabel
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import React, { useEffect, useState, useRef } from 'react';
import { useContext, useCallback } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import VideoOff from '../../assets/video-off.svg';
// import CustomPlayer from './customplayer';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import { publicIpv4 } from 'public-ip';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DeleteDialog from '../common/deletedialog';
import PlayArrowSharpIcon from '@mui/icons-material/PlayArrowSharp';
import FullScreenDialog from './fullscreendialog';
import { Maximize } from 'react-feather';
import _ from 'lodash';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import CustomPlayer from './customplayer';

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [camerasPayload, setCamerasPayload] = useState({
    locations: [],
    zones: [],
    cameras: []
  });

  const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [activeCameras, setActiveCameras] = useState([]);
  const [activeRecordings, setActiveRecordings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedZone, setSelectedZone] = useState([]);
  const [playing, setPlaying] = useState(true);
  const [userInfoSent, setUserInfoSent] = useState(false);
  const [submitted, setSubmitted] = useState(true);
  const [allLocationChecked, setAllLocationChecked] = useState(false);
  const [allZoneChecked, setAllZoneChecked] = useState(false);
  const [allCamsChecked, setAllCamsChecked] = useState(false);
  const [timeOut, setTimeOut] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const camLabel = useRef([]);
  const userToken = localStorage.getItem('token');
  const handle = useFullScreenHandle();

  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream', 'Manage zones and their camera authorization']);
    const locs = [{ loc_id: 'select-all', loc_name: 'Select All' }];
    authCtx?.user?.locations?.map((item) => item).forEach((loc) => locs.push(loc));
    setLocations(locs);
    setSelectedLocation(locs);
    setDropdownLoading(true);
    onSelect();
    getAvailableStreams();
    getRecordingsByUser();
    window.addEventListener('pagehide', saveCameraPreference);
    return () => {
      window.removeEventListener('pagehide', saveCameraPreference);
      API.post('watchstream/setPreference', {
        cameras: camLabel.current.cameras,
        locations: camLabel.current.locations,
        zones: camLabel.current.zones,
        cust_id: localStorage.getItem('cust_id')
      });
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  const saveCameraPreference = () => {
    fetch(process.env.REACT_APP_BE_ENDPOINT + `watchstream/setPreference`, {
      keepalive: true,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + userToken.replace(/^"|"$/g, '')
      },
      body: JSON.stringify({
        cameras: camLabel.current.cameras,
        locations: camLabel.current.locations,
        zones: camLabel.current.zones
      })
    });
  };

  useEffect(() => {
    if (location.state?.streamUrl?.includes('zoomin-recordings-rtsp')) {
      return;
    } else {
      const zonesToSet = camerasPayload?.zones?.filter((zone) => {
        let count = 0;
        selectedLocation?.forEach((loc) => {
          if (loc.loc_id == zone?.location.loc_id) {
            count = 1;
          }
        });
        return count == 1;
      });
      let zonesToAdd = [{ zone_name: 'Select All', zone_id: 'select-all' }];
      zonesToSet?.forEach((zone) => zonesToAdd.push(zone));
      setZones(zonesToAdd);
      setSelectedZone(zonesToAdd);
      if (selectedZone.length == 0) {
        setSelectedZone([zonesToSet]);
        let camsToAdd = [
          {
            cam_id: 'select-all',
            cam_name: 'Select All',
            zone_id: 'zoneid',
            zone_name: 'zone_name'
          }
        ];
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
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (location.state?.streamUrl?.includes('zoomin-recordings-rtsp')) {
      return;
    } else {
      const zones = camerasPayload?.zones?.filter((zone) => {
        let count = 0;
        selectedZone?.forEach((zone1) => {
          if (zone1?.zone_id == zone?.zone_id) {
            count = 1;
          }
        });

        return count == 1;
      });

      let cameras1 = [{ cam_id: 'select-all', cam_name: 'Select All' }];
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

      //setAllCamsChecked(false);
      // setSelectedCameras(cameras1.length > 0 ? cameras1.slice(1, cameras1.length) : []);
      //setAllCamsChecked(true);

      camLabel.current.zones = selectedZone;
    }
  }, [selectedZone]);

  useEffect(() => {
    camLabel.current.cameras = selectedCameras;
  }, [selectedCameras]);

  useEffect(() => {
    let liveStreamCameras = _.filter(cameras, { cam_name: 'Live Stream' });
    if (
      (authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin') &&
      cameras.length > 17
    ) {
      setSelectedCameras(location?.state?.livStream ? liveStreamCameras : cameras.slice(1, 17));
    } else if (
      !(authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin') &&
      cameras.length > 3
    ) {
      setSelectedCameras(location?.state?.livStream ? liveStreamCameras : cameras.slice(1, 3));
    } else {
      setSelectedCameras(
        location?.state?.livStream ? liveStreamCameras : cameras.slice(1, cameras.length)
      );
    }
    setSubmitted(true);
    // if (location?.state?.livStream && liveStreamCameras.length == 1) {
    //   setAllCamsChecked(true);
    // } else {
    //   setAllCamsChecked(false);
    // }
  }, [cameras]);

  useEffect(() => {
    console.log(selectedCameras);
    setAllCamsChecked(selectedCameras.length == cameras.length ? true : false);
  }, [selectedCameras]);

  useEffect(() => {
    API.get('cams/list-record-tags', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          authCtx.setTags(response.data.Data.recordTags);
        } else {
          if (response.message === 'Network Error') {
            enqueueSnackbar('Please refresh the page.', {
              variant: 'info',
              action: (key) => (
                <Button
                  onClick={() => {
                    window.location.reload();
                    closeSnackbar(key);
                  }}
                  sx={{ color: '#fff', textTransform: 'none' }}>
                  Refresh
                </Button>
              )
            });
          } else {
            errorMessageHandler(
              enqueueSnackbar,
              response?.response?.data.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
        }
      }
    );
  }, []);

  const getRecordingsByUser = () => {
    API.get('recordings/recordings-by-user', {
      params: {
        cust_id: localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        setActiveCameras(response.data.Data.activeCameras);
        setActiveRecordings(response.data.Data.fixedCameraRecordingsByUser.data);
      } else {
        if (response.message === 'Network Error') {
          enqueueSnackbar('Please refresh the page.', {
            variant: 'info',
            action: (key) => (
              <Button
                onClick={() => {
                  window.location.reload();
                  closeSnackbar(key);
                }}
                sx={{ color: '#fff', textTransform: 'none' }}>
                Refresh
              </Button>
            )
          });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      }
      setDropdownLoading(false);
    });
  };

  const getAvailableStreams = () => {
    API.get('watchstream', {
      params: {
        cust_id: localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        setTimeOut(response?.data?.Data?.streamDetails[0]?.timeout);
        setPlaying(true);
        setCamerasPayload({
          location: response?.data?.Data?.streamDetails[0]?.location.loc_id,
          zones: response?.data?.Data?.streamDetails
        });

        if (!location?.state) {
          setSelectedLocation([authCtx?.user?.locations?.map((item) => item)[0]]);
          const zones = response?.data?.Data.streamDetails?.filter(
            (zone) =>
              zone.location.loc_id === authCtx?.user?.locations?.map((item) => item.loc_id)[0]
          );
          let zonesToAdd = [{ zone_name: 'Select All', zone_id: 'select-all' }];
          zones?.forEach((zone) => zonesToAdd.push(zone));
          setZones(zonesToAdd);
          setSelectedZone(zones);
          let camsToAdd = [{ cam_id: 'select-all', cam_name: 'Select All' }];
          zones[0]?.cameras?.forEach((cam) =>
            camsToAdd.push({
              ...cam,
              zone_id: zones[0].zone_id,
              zone_name: zones[0].zone_name,
              location: zones[0].location
            })
          );
          setCameras(camsToAdd);
          if (response?.data?.Data?.defaultCams?.cameras) {
            // const camsToAdd = response?.data?.Data?.defaultCams?.cameras.map((cam) => cam);
            // let defaultLocations = response?.data?.Data?.defaultCams?.locations
            //   ? response?.data?.Data?.defaultCams?.locations
            //   : [];
            // let defaultRooms = response?.data?.Data?.defaultCams?.zones
            //   ? response?.data?.Data?.defaultCams?.zones
            //   : [];
            // setSelectedZone(defaultRooms);
            // setSelectedLocation(defaultLocations);
            // setSelectedCameras(camsToAdd);
          } else {
            setSelectedCameras([
              {
                ...zones[0]?.cameras[0],
                zone_id: zones[0].zone_id,
                zone_name: zones[0].zone_name,
                location: zones[0].location
              }
            ]);
          }
        } else {
          setSelectedLocation([location?.state?.location]);
          const zones = response.data.Data.streamDetails?.filter(
            (zone) => zone.location.loc_id === location?.state?.location
          );
          let zonesToAdd = [{ zone_name: 'Select All', zone_id: 'select-all' }];
          zones?.forEach((zone) => zonesToAdd.push(zone));
          setZones(zonesToAdd);
          const selectedZone1 = zones.find((zone) => zone.zone_id === location.state.zoneId);
          setSelectedZone([selectedZone1]);
          let camsToAdd = [{ cam_id: 'select-all', cam_name: 'Select All' }];
          selectedZone1?.cameras?.forEach((cam) =>
            camsToAdd.push({
              ...cam,
              zone_name: selectedZone1.zone_name,
              zone_id: selectedZone1.zone_id,
              location: selectedZone1.location
            })
          );
          setCameras(camsToAdd);
          const selectedCamera1 = selectedZone1?.cameras?.find(
            (cam) => cam.cam_id === location.state.camId
          );
          setSelectedCameras([
            {
              ...selectedCamera1,
              zone_name: selectedZone1.zone_name,
              zone_id: selectedZone1.zone_id,
              location: selectedZone1.location
            }
          ]);
        }
      } else {
        if (response.message === 'Network Error') {
          enqueueSnackbar('Please refresh the page.', {
            variant: 'info',
            action: (key) => (
              <Button
                onClick={() => {
                  window.location.reload();
                  closeSnackbar(key);
                }}
                sx={{ color: '#fff', textTransform: 'none' }}>
                Refresh
              </Button>
            )
          });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      }
      setDropdownLoading(false);
    });
  };

  const handleSetLocations = (_, value, reason, option) => {
    if (
      reason == 'selectOption' &&
      option?.option.loc_name == 'Select All' &&
      !allLocationChecked
    ) {
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (option?.option.loc_name == 'Select All' && reason === 'removeOption') {
      setSelectedLocation([]);
      setAllLocationChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option.loc_name == 'Select All' &&
      allLocationChecked == true
    ) {
      setAllLocationChecked(false);
      setSelectedLocation([]);
    } else if (reason === 'clear') {
      setAllLocationChecked(false);
      setSelectedLocation([]);
      setSelectedZone([]);
      setAllZoneChecked(false);
      setSelectedCameras([]);
    } else {
      setAllLocationChecked(false);
      setSelectedLocation(value);
    }
  };

  const handleSetZones = (_, value, reason, option) => {
    const zones2 = camerasPayload?.zones?.filter((zone) => {
      let count = 0;
      selectedZone?.forEach((zone1) => {
        if (zone1?.zone_id == zone?.zone_id) {
          count = 1;
        }
      });

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
    } else if (option?.option?.zone_name == 'Select All' && reason === 'removeOption') {
      setSelectedZone([]);
      setAllZoneChecked(false);
    } else if (
      reason === 'selectOption' &&
      option.option.zone_name == 'Select All' &&
      allZoneChecked == true
    ) {
      setAllZoneChecked(false);
      setSelectedZone([]);
    } else if ((reason === 'removeOption' && selectedZone?.length === 1) || reason === 'clear') {
      setSelectedZone([]);
      setAllZoneChecked(false);
      setSelectedCameras([]);
    } else {
      setAllZoneChecked(false);
      setSelectedZone(value);
    }
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
          if (component.types.includes('administrative_area_level_3')) {
            location_name = component.long_name;
          }
        });

        API.post('watchstream/addviewer', {
          source_ip: ip,
          lat: location.lat,
          long: location.lng,
          location_name: location_name,
          cust_id: localStorage.getItem('cust_id')
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

  const handleChangeCameras = (_, values, reason, option) => {
    if (!(authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin')) {
      if (values.length < 3) {
        setPlaying(true);
        setSubmitted(false);
        setLimitReached(false);
      } else if (values.length == 3) {
        setPlaying(true);
        setSubmitted(false);
        setLimitReached(true);
      } else if (values.length > 3) {
        errorMessageHandler(enqueueSnackbar, 'Max 2 cameras allowed');
      }
    } else {
      if (values.length < 16) {
        setPlaying(true);
        setSubmitted(false);

        setLimitReached(false);
      } else if (values.length == 16) {
        setPlaying(true);
        setSubmitted(false);
        setLimitReached(true);
      } else if (values.length > 16) {
        errorMessageHandler(enqueueSnackbar, 'Max 16 cameras allowed');
      }
    }

    if (reason == 'selectOption' && option?.option?.cam_name == 'Select All' && !allCamsChecked) {
      if (
        ((authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin') &&
          cameras.length > 17) ||
        (!(authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin') &&
          cameras.length > 3)
      ) {
        errorMessageHandler(
          enqueueSnackbar,
          `Max ${
            authCtx.user.role == 'Admin' || authCtx.user.role == 'Super Admin' ? 16 : 2
          } cameras allowed.`
        );
      } else {
        setSelectedCameras(reason === 'selectOption' ? cameras.slice(1, cameras.length) : []);
        setAllCamsChecked(true);
      }
    } else if (option?.option?.cam_name == 'Select All' && reason === 'removeOption') {
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

  return (
    <>
      <Box className="listing-wrapper">
        {location.state?.streamUrl?.includes('zoomin-recordings-rtsp') ? (
          <FullScreen
            handle={handle}
            onChange={(state) => {
              if (state == false) {
                setIsFullScreenDialogOpen(false);
              }
            }}>
            <Grid
              container
              alignContent={'center'}
              spacing={isFullScreenDialogOpen ? 0 : 1}
              sx={{ border: isFullScreenDialogOpen ? '' : '16px solid white' }}
              className="player-grid-container">
              <Grid
                item
                md={12}
                sm={12}
                sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
                <CustomPlayer
                  streamUri={location.state?.streamUrl}
                  camDetails={{}}
                  timeOut={timeOut}
                  setTimeOut={setTimeOut}
                  setPlaying={setPlaying}
                  setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  cam_id={null}
                />
              </Grid>
            </Grid>
          </FullScreen>
        ) : !location.state?.streamUrl?.includes('zoomin-recordings-rtmp') ? (
          <Card className="filter">
            <CardContent>
              <Grid container spacing={2} alignItems={'self-end'}>
                <Grid item md={3} sm={12}>
                  <InputLabel id="locations">Locations</InputLabel>
                  <Autocomplete
                    labelId="locations"
                    multiple
                    limitTags={1}
                    id="tags-standard"
                    options={locations?.length !== 0 ? locations : []}
                    value={selectedLocation ? selectedLocation : []}
                    getOptionLabel={(option) => option.loc_name || option}
                    onChange={(_, value, reason, option) => {
                      handleSetLocations(_, value, reason, option);
                    }}
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
                <Grid item md={3} sm={12}>
                  <InputLabel id="zones">Zones</InputLabel>
                  <Autocomplete
                    labelId="zones"
                    multiple
                    limitTags={1}
                    id="tags-standard"
                    options={zones ? zones : []}
                    value={selectedZone?.length !== 0 ? selectedZone : []}
                    getOptionLabel={(option) => option?.zone_name}
                    isOptionEqualToValue={(option, value) => option?.zone_id === value?.zone_id}
                    onChange={(_, value, reason, option) => {
                      handleSetZones(_, value, reason, option);
                    }}
                    renderTags={(value, getTagProps) =>
                      value?.map((option, index) => (
                        <Chip key={index} label={option?.zone_name} {...getTagProps({ index })} />
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
                <Grid item md={3} sm={20}>
                  <InputLabel id="cameras">Cameras</InputLabel>
                  <Autocomplete
                    labelId="cameras"
                    multiple
                    limitTags={1}
                    disableCloseOnSelect
                    id="tags-standard"
                    options={cameras ? cameras : []}
                    value={selectedCameras?.length !== 0 ? selectedCameras : []}
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
                              : option?.location.loc_name +
                                '/' +
                                option?.zone_name +
                                ' - ' +
                                option?.cam_name
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
                          : option.location.loc_name +
                            '/' +
                            option.zone_name +
                            ' - ' +
                            option?.cam_name}
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
                <Grid
                  item
                  md={3}
                  sm={12}
                  sx={{ marginTop: '6px', display: 'flex', justifyContent: 'center' }}>
                  <Button
                    className="add-button stream-btn"
                    variant="contained"
                    startIcon={<PlayArrowSharpIcon />}
                    onClick={() => setSubmitted(true)}>
                    {' '}
                    Play Stream
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : null}
        {location.state?.streamUrl?.includes('zoomin-recordings-rtmp') ? (
          <FullScreen
            handle={handle}
            onChange={(state) => {
              if (state == false) {
                setIsFullScreenDialogOpen(false);
              }
            }}>
            <Grid
              container
              alignContent={'center'}
              spacing={isFullScreenDialogOpen ? 0 : 1}
              sx={{ border: isFullScreenDialogOpen ? '' : '16px solid white' }}
              className="player-grid-container">
              <Grid
                item
                md={12}
                sm={12}
                sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
                <CustomPlayer
                  streamUri={location.state?.streamUrl}
                  camDetails={{}}
                  recordedPlayback={true}
                  cam_id={null}
                />
              </Grid>
            </Grid>
          </FullScreen>
        ) : (
          <>
            {(selectedCameras.length == 0 || !playing) &&
              location.state?.streamUrl?.includes('zoomin-recordings-rtmp') && (
                <Card>
                  <CardContent>
                    <Box mt={2} sx={{ height: '600px' }} className="no-camera-wrapper">
                      <Stack
                        className="no-camera-stack"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center">
                        <img src={VideoOff} />
                        <Typography>
                          {!playing ? 'Stream stopped due to Inactivity' : `Camera not selected`}
                        </Typography>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              )}
            {!submitted && selectedCameras.length != 0 && (
              <Card>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
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
            getAvailableStreams();
            // setPlaying(true);
            setIsDeleteDialogOpen(false);
          }}
        />
        {!location.state?.streamUrl?.includes('zoomin-recordings-rtmp') ? (
          <FullScreen
            handle={handle}
            onChange={(state) => {
              if (state == false) {
                setIsFullScreenDialogOpen(false);
              }
            }}>
            <FullScreenDialog
              isFullScreenDialogOpen={isFullScreenDialogOpen}
              selectedCameras={selectedCameras}
              playing={playing}
              submitted={submitted}
              cameraIdsWithRecording={activeCameras.length > 0 ? activeCameras : []}
              activeRecordings={activeRecordings}
              setActiveCameras={setActiveCameras}
              camLabel={selectedCameras}
              timeOut={timeOut}
              setTimeOut={setTimeOut}
              setPlaying={setPlaying}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />
          </FullScreen>
        ) : null}
      </Box>
      <Button
        // style={{ position: 'sticky', bottom: '5%', marginLeft: '95%' }}
        className="full-screen-button"
        onClick={() => {
          setIsFullScreenDialogOpen(true);
          handle.enter();
        }}>
        <Maximize />
      </Button>
    </>
  );
};

export default WatchStream;
