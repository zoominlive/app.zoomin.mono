import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import OutboundIcon from '@mui/icons-material/Outbound';
import AuthContext from '../../context/authcontext';
import PlayArrowSharpIcon from '@mui/icons-material/PlayArrowSharp';
// import Loader from '../common/loader';
//import VideoOff from '../../assets/video-off.svg';
import PropTypes from 'prop-types';
// import _ from 'lodash';
import { Maximize } from 'react-feather';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  InputLabel,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import StreamTable from './streamtable';
import moment from 'moment';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import NoDataDiv from '../common/nodatadiv';
import CustomPlayer from '../watchstream/customplayer';
//import { LoadingButton } from '@mui/lab';
//import CustomPlayer from '../watchstream/customplayer';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import FullScreenDialog from '../watchstream/fullscreendialog';
import LinerLoader from '../common/linearLoader';
//import FullScreenDialog from '../watchstream/fullscreendialog';
const streamColumns = ['Stream Name', 'Time', 'Room'];

const Recordings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerOpen1, setIsDatePickerOpen1] = useState(false);
  const [isDatePickerOpen2, setIsDatePickerOpen2] = useState(false);
  const [fromDate, setFromDate] = useState(moment().subtract(7, 'days'));
  const [toDate, setToDate] = useState(moment());
  const [location, setLocation] = useState('All');
  const [roomsList, setRoomsList] = useState([]);
  const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  //const [selectedRoom, setSelectedRoom] = useState([]);
  // const [timeOut, setTimeOut] = useState(2);
  // const [selectedCamera] = useState({
  //   camLabel: '',
  //   stream_uri: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
  //   cam_id: null,
  //   location: '',
  //   room_name: '',
  //   cam_name: ''
  // });
  // const [submitted] = useState(true);
  // const [playing, setPlaying] = useState(true);
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);
  // const [streamData] = useState([
  //   {
  //     date: '12-05-2023',
  //     location: 'Location 1',
  //     room: 'Room 1',
  //     status: 'Live Stream',
  //     url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U'
  //   }
  // ]);
  const [recordingsPayload, setRecordingsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id'),
    live: true,
    vod: true,
    from: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD')
  });
  const [activeLiveStreamList, setActiveLivestreamList] = useState([]);
  const [recentLiveStreamList, setRecentLivestreamList] = useState([]);
  const [recordedStreamList, setRecordedStreamList] = useState([]);

  useEffect(() => {
    layoutCtx.setActive(7);
    layoutCtx.setBreadcrumb([
      'Recordings',
      'Explore Past Streams: Welcome to the Recording Archives'
    ]);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);
  useEffect(() => {
    setRoomsDropdownLoading(true);
    API.get('rooms/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setRoomsList(response.data.Data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setRoomsDropdownLoading(false);
      }
    );
  }, []);
  const handleLocationChange = (event) => {
    setLocation(event.target.value);
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      location: event.target.value,
      pageNumber: 0
    }));
  };
  const handleRoomChange = (_, value) => {
    const roomsArr = [];
    value.forEach((room) => roomsArr.push(room.room_name));
    setSelectedRooms(roomsArr);
    setRecordingsPayload((prevPayload) => ({ ...prevPayload, rooms: roomsArr, pageNumber: 0 }));
    //setFamiliesPayload((prevPayload) => ({ ...prevPayload, rooms: roomsArr, page: 0 }));
  };
  const handlePageChange = (_, newPage) => {
    setRecordingsPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
    getRecordingData();
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
    getRecordingData();
  };

  const Row = ({ row }) => {
    const { created_at, room, presigned_url, stream_running } = row;
    const handle = useFullScreenHandle();
    const [open, setOpen] = useState(false);
    const [timeOut, setTimeOut] = useState(2);
    const [selectedCamera, setSelectedCamera] = useState({
      camLabel: '',
      stream_uri: presigned_url || room?.live_stream_cameras[0].stream_uri,
      cam_id: null,
      location: room?.location,
      room_name: room?.room_name,
      cam_name: presigned_url ? room?.live_stream_cameras[0]?.cam_name : ''
    });
    const [submitted] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);
    console.log('=isDeleteDialogOpen=', isDeleteDialogOpen, selectedRooms);
    return (
      <>
        <TableRow hover>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${moment(created_at).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="left">
            <Stack direction="row">
              <Chip label={room?.location} color="primary" className="chip-color" />
            </Stack>
          </TableCell>
          <TableCell align="left">
            <Stack direction="row">
              <Chip label={room?.room_name} color="primary" className="room-chip" />
            </Stack>
          </TableCell>
          <TableCell align="left">
            <Stack direction="row">
              <Chip
                label={`${stream_running ? 'Live' : 'VOD'} Stream`}
                color="primary"
                className={`${stream_running ? 'green' : 'red'}-chip-color`}
              />
            </Stack>
          </TableCell>
          <TableCell>
            <Button
              className="add-button stream-btn btn-radius"
              variant="contained"
              startIcon={<PlayArrowSharpIcon />}
              onClick={() => {
                setOpen(!open);
                setSelectedCamera({
                  location: room?.location,
                  room_name: room?.room_name,
                  ...room?.live_stream_cameras[0]
                });
              }}>
              {' '}
              Play Stream
            </Button>
          </TableCell>
        </TableRow>
        <TableRow className="video-in-table">
          <TableCell colSpan={5}>
            <Box>
              {open && (
                <>
                  <Card>
                    <CardContent>
                      <Box
                        className="no-camera-wrapper"
                        pt={2}
                        sx={{
                          height: 300,
                          backgroundColor: '#C8C6F1',
                          borderRadius: 4
                        }}>
                        <CustomPlayer
                          noOfCameras={2}
                          streamUri={presigned_url || room?.live_stream_cameras[0].stream_uri}
                          camDetails={selectedCamera}
                          timeOut={timeOut}
                          setTimeOut={setTimeOut}
                          setPlaying={setPlaying}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                  <Button
                    className="full-screen-button"
                    onClick={() => {
                      setIsFullScreenDialogOpen(true);
                      handle.enter();
                    }}>
                    <Maximize />
                  </Button>
                </>
              )}
            </Box>
          </TableCell>
        </TableRow>
        <FullScreen
          handle={handle}
          onChange={(state) => {
            if (state == false) {
              setIsFullScreenDialogOpen(false);
            }
          }}>
          {isFullScreenDialogOpen && (
            <FullScreenDialog
              isFullScreenDialogOpen={isFullScreenDialogOpen}
              selectedCameras={[selectedCamera]}
              playing={playing}
              submitted={submitted}
              camLabel={[selectedCamera]}
              timeOut={timeOut}
              setTimeOut={setTimeOut}
              setPlaying={setPlaying}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />
          )}
        </FullScreen>
      </>
    );
  };
  Row.propTypes = {
    row: PropTypes.shape({
      created_at: PropTypes.string,
      stream_running: PropTypes.bool,
      room: PropTypes.object,
      presigned_url: PropTypes.string
    })
  };

  const getRecordingData = () => {
    setIsLoading(true);
    API.get('recordings', {
      params: {
        ...recordingsPayload,
        cust_id: localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        setActiveLivestreamList(response.data.Data.activeLiveStreams);
        setRecentLivestreamList(response.data.Data.recentLiveStreams);
        setRecordedStreamList(response.data.Data.recordedStreams);
        setIsLoading(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    getRecordingData();
  }, []);

  useEffect(() => {
    setRecordingsPayload({
      ...recordingsPayload,
      from: moment(fromDate).format('YYYY-MM-DD'),
      to: moment(toDate).format('YYYY-MM-DD')
    });
  }, [fromDate, toDate]);

  return (
    // <Box style={{ height: '80vh' }}>
    //   <Card style={{ height: '100%' }}>
    //     <iframe
    //       src="https://www.zoominlive.com/recording-request"
    //       height="100%"
    //       style={{ border: 'none' }}
    //       width="100%"></iframe>
    //   </Card>
    // </Box>
    <>
      <Grid container spacing={3} className="stream-details-wraper ">
        <Grid item lg={3} md={3} sm={12} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent className="p-30">
              <Typography variant="subtitle1">Live Mobile Streams</Typography>

              <Stack direction={'column'} gap={15} py={5}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom className="sub-title">
                    Number of Streams
                  </Typography>
                  <Grid container spacing={3} alignItems={'end'}>
                    <Grid item className="report-div">
                      <Stack
                        direction={'row'}
                        spacing={2}
                        alignItems={'center'}
                        className="strem-report">
                        <Box className="icon">
                          {' '}
                          <OutboundIcon />{' '}
                        </Box>{' '}
                        <Box component={'span'}>+15%</Box>
                      </Stack>
                      <Link href="#">View Report</Link>
                    </Grid>
                    <Grid item>
                      <Box className="report-circle">{activeLiveStreamList?.length}</Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom className="stream-sub-title">
                    Number of Viewers
                  </Typography>
                  <Grid container spacing={3} alignItems={'end'}>
                    <Grid item className="report-div" spacing={2}>
                      <Stack
                        direction={'row'}
                        alignItems={'center'}
                        spacing={2}
                        className="strem-report viewers-report">
                        <Box className="icon">
                          <OutboundIcon />{' '}
                        </Box>{' '}
                        <Box component={'span'}>-3.5%</Box>
                      </Stack>
                      <Link href="#">View Report</Link>
                    </Grid>
                    <Grid item>
                      <Box className="report-circle" style={{ borderColor: '#FFAB01' }}>
                        {recentLiveStreamList?.length}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={9} md={9} sm={12} xs={12}>
          <Card>
            <CardContent>
              <StreamTable
                style={{ borderRadius: 5 }}
                columns={streamColumns}
                rows={activeLiveStreamList}
                title={'Active Stream'}
                isLoading={isLoading}
              />

              <StreamTable
                style={{ borderRadius: 5, marginTop: 20 }}
                columns={streamColumns}
                rows={recentLiveStreamList}
                title={'Recent Stream'}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box className="listing-wrapper">
        <Card className="filter">
          <CardContent>
            <Grid container alignContent={'center'}>
              <Grid item lg={7} md={7} sm={12} xs={12}>
                <Grid container spacing={2}>
                  {/* <Grid item md={3.5} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <InputLabel id="from">Date</InputLabel>
                      <DesktopDatePicker
                        open={isDatePickerOpen1}
                        maxDate={moment()}
                        labelId="from"
                        autoOk={true}
                        value={fromDate}
                        inputFormat="MM/DD/YY"
                        onClose={() => setIsDatePickerOpen1(false)}
                        renderInput={(params) => (
                          <TextField onClick={() => setIsDatePickerOpen1(true)} {...params} />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen1 ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setFromDate(value);
                        }}
                      />
                    </LocalizationProvider>
                  </Grid> */}
                  <Grid item md={2}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <InputLabel id="from">From</InputLabel>
                      <DesktopDatePicker
                        open={isDatePickerOpen1}
                        maxDate={moment()}
                        labelId="from"
                        autoOk={true}
                        value={fromDate}
                        inputFormat="MM/DD/YY"
                        onClose={() => setIsDatePickerOpen1(false)}
                        renderInput={(params) => (
                          <TextField onClick={() => setIsDatePickerOpen1(true)} {...params} />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen1 ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setFromDate(value);
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item md={2}>
                    <InputLabel id="to">To</InputLabel>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DesktopDatePicker
                        labelId="to"
                        open={isDatePickerOpen2}
                        maxDate={moment()}
                        value={toDate}
                        inputFormat="MM/DD/YY"
                        onClose={() => setIsDatePickerOpen2(false)}
                        renderInput={(params) => (
                          <TextField onClick={() => setIsDatePickerOpen2(true)} {...params} />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen2 ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setToDate(value);
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item md={3.5} sm={6}>
                    <InputLabel id="location">Location</InputLabel>
                    <FormControl fullWidth className="location-select">
                      <Select
                        labelId="location"
                        id="location"
                        value={location}
                        onChange={handleLocationChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        {authCtx?.user?.location?.accessable_locations
                          ?.sort((a, b) => (a > b ? 1 : -1))
                          ?.map((location, index) => (
                            <MenuItem key={index} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={4.5} sm={12}>
                    <InputLabel id="rooms">Rooms</InputLabel>
                    <Autocomplete
                      labelId="rooms"
                      fullWidth
                      multiple
                      id="rooms"
                      options={roomsList.sort((a, b) => (a?.room_name > b?.room_name ? 1 : -1))}
                      isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                      getOptionLabel={(option) => {
                        return option?.room_name;
                      }}
                      onChange={handleRoomChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          // label="Room"
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
                  </Grid>
                </Grid>
              </Grid>
              <Grid item lg={1} md={1} sm={1} sx={{ textAlign: 'center' }}>
                <Box component={'span'} className="seprator"></Box>
              </Grid>
              <Grid item lg={4} md={4} sm={12} xs={12}>
                <>
                  <Grid container spacing={2}>
                    <Grid item md={6} sm={6}>
                      <FormGroup
                        onChange={(e) => {
                          setRecordingsPayload(
                            e.target.value === 'Live'
                              ? { ...recordingsPayload, live: e.target.checked }
                              : { ...recordingsPayload, vod: e.target.checked }
                          );
                        }}>
                        <InputLabel>Status</InputLabel>
                        <Stack direction={'row'}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                value={'Live'}
                                checked={recordingsPayload.live}
                                color="primary"
                              />
                            }
                            label="Live"
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                value={'VOD'}
                                checked={recordingsPayload.vod}
                                color="primary"
                              />
                            }
                            label="VOD"
                          />
                        </Stack>
                      </FormGroup>
                    </Grid>

                    <Grid item md={6} sm={6} sx={{ textAlign: 'right' }}>
                      <Button
                        className="add-button"
                        variant="contained"
                        onClick={() => getRecordingData()}>
                        {' '}
                        Submit
                      </Button>
                    </Grid>
                  </Grid>
                </>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box mt={2} position="relative">
              <LinerLoader loading={isLoading} />
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="left">Location</TableCell>
                      <TableCell align="left">Rooms</TableCell>
                      <TableCell align="left">Status</TableCell>
                      <TableCell align="left">Stream</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recordedStreamList?.length > 0
                      ? recordedStreamList?.map((row, index) => <Row row={row} key={index} />)
                      : null}
                  </TableBody>
                </Table>
                {!isLoading && recordedStreamList?.length == 0 ? <NoDataDiv /> : null}
                {recordedStreamList?.length > 0 ? (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    component="div"
                    count={recordedStreamList.length}
                    rowsPerPage={recordingsPayload?.pageSize}
                    page={recordingsPayload?.pageNumber}
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : null}
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Recordings;
