import {
  // Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  // CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  //Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useContext } from 'react';
// import { Video } from 'react-feather';
import { useState } from 'react';
import { Plus, Video } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import ZoneForm from './zoneform';
import ZoneActions from './zoneactions';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
// import DeleteDialog from '../common/deletedialog';
// import Loader from '../common/loader';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import debounce from 'lodash.debounce';
import { Link } from 'react-router-dom';
import NoDataDiv from '../common/nodatadiv';
import NewDeleteDialog from '../common/newdeletedialog';
import SearchIcon from '@mui/icons-material/Search';
import LinerLoader from '../common/linearLoader';
import CustomPlayer from '../watchstream/customplayer';

const Row = (props) => {
  const { row } = props;
  const [open, setOpen] = useState(false);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null); // Track clicked camera
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = (camRow) => {
    setSelectedCamera(camRow);
    setDialogOpen(true);
    setIsStreamDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setIsStreamDialogOpen(false);
    setSelectedCamera(null);
  };

  return (
    <React.Fragment>
      <TableRow hover>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.zone_name}</TableCell>
        <TableCell>{row.zone_type?.zone_type}</TableCell>
        <TableCell>{row.loc_name}</TableCell>
        <TableCell style={{ lineHeight: 2.5 }}>
          {/* <Stack direction={'row'} justifyContent="flex-start" alignItems="center"> */}
          {row?.cameras?.map((camRow, index) => (
            // <Link
            //   key={index}
            //   to="/watch-stream"
            //   state={{
            //     roomName: row?.zone_name,
            //     // eslint-disable-next-line react/prop-types
            //     roomId: row?.zone_id,
            //     location: row?.location,
            //     camName: camRow?.cam_name,
            //     camId: camRow?.cam_id,
            //     streamUrl: camRow?.stream_uri
            //   }}
            //   onClick={() => handleClick(camRow)}
            //   className="cam-link">
            // </Link>
            <Chip
              key={index}
              color="primary"
              className="chip-color"
              label={camRow?.cam_name}
              onClick={() => handleClick(camRow)}
              icon={<Video />}
            />
          ))}
          {/* </Stack> */}
        </TableCell>
        <TableCell align="left">{row.stream_live_license ? 'Yes' : 'No'}</TableCell>
        <TableCell align="right">
          <ZoneActions
            zone={row}
            setZone={props.setZone}
            setIsZoneFormDialogOpen={props.setIsZoneFormDialogOpen}
            setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
          />
        </TableCell>
      </TableRow>
      <TableRow className={`expandable-row ${!open ? 'border-bottom-none' : ''}`}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Table size="small" aria-label="cameras">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '120px' }}>Camera Name</TableCell>
                    <TableCell sx={{ width: '360px' }}>Description</TableCell>
                    <TableCell>Stream Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row?.cameras?.map((camRow, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{camRow?.cam_name}</TableCell>
                      <TableCell>
                        <Typography>{camRow?.description} </Typography>
                      </TableCell>
                      <TableCell>
                        <Link
                          // to="/watch-stream"
                          // state={{
                          //   roomName: row?.zone_name,
                          //   // eslint-disable-next-line react/prop-types
                          //   roomId: row?.zone_id,
                          //   location: row?.location,
                          //   camName: camRow?.cam_name,
                          //   camId: camRow?.cam_id,
                          //   streamUrl: camRow?.stream_uri
                          // }}
                          onClick={() => handleClick(camRow)}>
                          <Video />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {isStreamDialogOpen && (
        <Dialog open={dialogOpen} onClose={handleClose} fullWidth>
          <DialogTitle>
            {`${selectedCamera?.cam_name}`}
            <IconButton
              aria-label="close"
              onClick={() => {
                handleClose();
              }}
              sx={{
                position: 'absolute',
                right: 18
              }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <CustomPlayer
              noOfCameras={2}
              streamUri={selectedCamera?.stream_uri_seckey}
              camDetails={selectedCamera}
            />
          </DialogContent>
        </Dialog>
      )}
    </React.Fragment>
  );
};

Row.propTypes = {
  row: PropTypes.shape({
    zone_name: PropTypes.string,
    location: PropTypes.string,
    loc_name: PropTypes.string,
    number_of_cam: PropTypes.number,
    cameras: PropTypes.array,
    stream_live_license: PropTypes.string,
    zone_type: PropTypes.object
  }),
  setZone: PropTypes.func,
  setIsZoneFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};

const Zones = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isZoneFormDialogOpen, setIsZoneFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  // const [dropdownList, setDropdownList] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [zonesList, setZoneList] = useState([]);
  const [totalZones, setTotalZones] = useState(0);
  const [zone, setZone] = useState();
  const [zones, setZones] = useState();

  const [zonesPayload, setZonesPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    type: 'All',
    zones: [],
    cust_id: localStorage.getItem('cust_id')
  });

  useEffect(() => {
    layoutCtx.setActive(3);
    layoutCtx.setBreadcrumb(['Zones', 'Manage zones and their camera authorization']);

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  // useEffect(() => {
  //   getDropDownRoomList();
  // }, []);

  useEffect(() => {
    return () => {
      zonesListDebounce.cancel();
    };
  });

  useEffect(() => {
    getZonesList();
  }, [zonesPayload]);

  useEffect(() => {
    getZoneTypesList();
  }, []);

  // Method to fetch the zones list for table
  const getZonesList = () => {
    setIsLoading(true);
    API.get('zones', { params: zonesPayload }).then((response) => {
      if (response.status === 200) {
        setZoneList(response.data.Data.finalZoneDetails);
        setTotalZones(response.data.Data.count);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  // Method to fetch the zone types list for table
  const getZoneTypesList = () => {
    setIsLoading(true);
    API.get('zone-type', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setZones(response.data.Data.zoneTypes);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setIsLoading(false);
      }
    );
  };

  // Method to fetch the zones list for dropdown
  // const getDropDownRoomList = () => {
  //   setRoomsDropdownLoading(true);
  //   API.get('zones/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
  //     (response) => {
  //       if (response.status === 200) {
  //         setDropdownList(response.data.Data);
  //       } else {
  //         errorMessageHandler(
  //           enqueueSnackbar,
  //           response?.response?.data?.Message || 'Something Went Wrong.',
  //           response?.response?.status,
  //           authCtx.setAuthError
  //         );
  //       }
  //       setRoomsDropdownLoading(false);
  //     }
  //   );
  // };

  // Method to delete zone
  const handleZoneDelete = () => {
    setDeleteLoading(true);
    let payload = {
      zone_id: zone.zone_id
    };
    if (zone.stream_live_license) {
      payload = {
        ...payload,
        custId: authCtx.user.cust_id || localStorage.getItem('cust_id'),
        max_stream_live_license_zone: authCtx.user.max_stream_live_license_zone + 1
      };
    }
    API.delete('zones/delete', { data: { ...payload } }).then((response) => {
      if (response.status === 200) {
        // setDropdownList((prevList) => {
        //   let tempList = [...prevList];
        //   tempList = tempList.filter((item) => item.zone_id !== zone.zone_id);
        //   return tempList;
        // });
        setZonesPayload((prev) => {
          let temp = { ...prev };
          temp.zones = temp.zones.filter((item) => item.zone_id !== zone.zone_id);
          return temp;
        });
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
        setDeleteLoading(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setZone();
      //setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setZonesPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setZonesPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 0
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setZonesPayload((prevPayload) => ({
      ...prevPayload,
      searchBy: event.target.value,
      pageNumber: 0
    }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setZonesPayload((prevPayload) => ({
      ...prevPayload,
      location: event.target.value,
      pageNumber: 0
    }));
  };

  // Method to handle zone type change for table
  const handleZoneTypeChange = (event) => {
    setZonesPayload((prevPayload) => ({
      ...prevPayload,
      type: event.target.value,
      pageNumber: 0
    }));
  };

  // Method to handle zone change for table
  // const handleRoomChange = (_, value) => {
  //   const roomsArr = [];
  //   value.forEach((zone) => roomsArr.push(zone.zone_name));
  //   setZonesPayload((prevPayload) => ({ ...prevPayload, zones: roomsArr, pageNumber: 0 }));
  // };

  // Calls the search handler after 500ms
  const zonesListDebounce = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  return (
    <Box className="listing-wrapper">
      <Card className="filter">
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={8} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={5} sm={12}>
                      <InputLabel id="search">Search</InputLabel>
                      <TextField
                        labelId="search"
                        placeholder="Zone Name, Location"
                        onChange={zonesListDebounce}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      <InputLabel id="location">Location</InputLabel>
                      <FormControl fullWidth className="location-select">
                        <Select
                          labelId="location"
                          id="location"
                          value={zonesPayload?.location}
                          onChange={handleLocationChange}>
                          <MenuItem value={'All'}>All</MenuItem>
                          {authCtx.user.locations
                            ?.sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
                            .map((item) => (
                              <MenuItem key={item.loc_id} value={item.loc_id}>
                                {item.loc_name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      <InputLabel id="type">Type</InputLabel>
                      <FormControl fullWidth className="location-select">
                        <Select
                          labelId="type"
                          id="type"
                          value={zonesPayload?.type}
                          onChange={handleZoneTypeChange}>
                          <MenuItem value={'All'}>All</MenuItem>
                          {zones
                            ?.sort((a, b) => (a.zone_type > b.zone_type ? 1 : -1))
                            .map((item) => (
                              <MenuItem key={item.zone_type_id} value={item.zone_type_id}>
                                {item.zone_type}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    {/* <Grid item md={3.5} sm={12}>
                      <InputLabel id="zones">Select Rooms</InputLabel>
                      <Autocomplete
                        labelId="zones"
                        loading={roomsDropdownLoading}
                        fullWidth
                        multiple
                        id="zones"
                        options={dropdownList.sort((a, b) => (a.zone_name > b.zone_name ? 1 : -1))}
                        isOptionEqualToValue={(option, value) => option.zone_id === value.zone_id}
                        getOptionLabel={(option) => {
                          return option.zone_name;
                        }}
                        onChange={handleRoomChange}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={index}
                              label={option.zone_name}
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            placeholder="Rooms"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <React.Fragment>
                                  {roomsDropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </React.Fragment>
                              )
                            }}
                          />
                        )}
                      />
                    </Grid> */}
                  </Grid>
                </Box>
              </Grid>
              <Grid
                item
                md={4}
                sm={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                <Box>
                  <Button
                    className="add-button"
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => setIsZoneFormDialogOpen(true)}>
                    {' '}
                    Add Zone
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Box mt={2} sx={{ position: 'relative' }}>
            <LinerLoader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '50px' }} />
                    <TableCell sx={{ width: '200px' }}>Zone Name</TableCell>
                    <TableCell sx={{ width: '200px' }}>Type</TableCell>
                    <TableCell sx={{ width: '200px' }}>Location</TableCell>
                    <TableCell>Cams</TableCell>
                    <TableCell align="left">Live Streaming</TableCell>
                    <TableCell align="right" sx={{ width: '50px' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zonesList?.length > 0
                    ? zonesList?.map((zone) => (
                        <Row
                          setZone={setZone}
                          setIsZoneFormDialogOpen={setIsZoneFormDialogOpen}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                          key={zone.zone_id}
                          row={zone}
                        />
                      ))
                    : null}
                </TableBody>
              </Table>
              {!isLoading && zonesList?.length == 0 ? <NoDataDiv /> : null}
              {zonesList?.length > 0 ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalZones}
                  rowsPerPage={zonesPayload?.pageSize}
                  page={zonesPayload?.pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {isZoneFormDialogOpen && (
        <ZoneForm
          zone={zone}
          zoneType={zones}
          setZone={setZone}
          open={isZoneFormDialogOpen}
          setOpen={setIsZoneFormDialogOpen}
          getZonesList={getZonesList}
          // getDropDownRoomList={getDropDownRoomList}
          zonesPayload={zonesPayload}
          setZonesPayload={setZonesPayload}
          // setDropdownList={setDropdownList}
        />
      )}
      <NewDeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Zone"
        contentText="Are you sure you want to delete this zone?"
        loading={deleteLoading}
        handleDialogClose={() => {
          setZone();
          setIsDeleteDialogOpen(false);
        }}
        handleDelete={handleZoneDelete}
      />
    </Box>
  );
};

export default Zones;
