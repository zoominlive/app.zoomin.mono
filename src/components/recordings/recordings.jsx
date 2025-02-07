/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import AuthContext from '../../context/authcontext';
import PlayArrowSharpIcon from '@mui/icons-material/PlayArrowSharp';
import PropTypes from 'prop-types';
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
  Button,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import moment from 'moment';
import dayjs from 'dayjs';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import CustomPlayer from '../watchstream/customplayer';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import FullScreenDialog from '../watchstream/fullscreendialog';
import LinerLoader from '../common/linearLoader';
import NewStreamTable from './newstreamtable';
import { DesktopDateRangePicker } from '@mui/x-date-pickers-pro';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { SingleInputDateRangeField } from '@mui/x-date-pickers-pro/SingleInputDateRangeField';
import NoLiveStreamDiv from '../common/nolivestreams';
import { Link } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PlayRecording from '../../assets/play-recording.svg';
import ShareRecording from '../../assets/share-recording.svg';
import EditRecording from '../../assets/edit-recording.svg';
import RecordingForm from './recordingForm';
import MobileStreamEditForm from './mobilestreameditform';
import DeleteRecordingDialog from './deleterecordingdialog';

const streamColumns = ['Date & Time', 'Zone', 'Event Name', 'Actions'];
const FixedCameraRecordingsColumns = [
  'Camera Name',
  'Date & Time',
  'Zone',
  'Event Name',
  'Tag',
  'Actions'
];
const shortcutsItems = [
  {
    label: 'Today',
    getValue: () => {
      const today = dayjs();
      return [today, today];
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const today = dayjs();
      const yesterday = today.subtract(1, 'day');
      return [yesterday, yesterday];
    }
  },
  {
    label: 'Last Week',
    getValue: () => {
      const today = dayjs();
      const prevWeek = today.subtract(7, 'day');
      return [prevWeek.startOf('week'), prevWeek.endOf('week')];
    }
  },
  {
    label: 'Last Month',
    getValue: () => {
      const today = dayjs();
      const startOfLastMonth = today.startOf('month').subtract(1, 'day');
      return [startOfLastMonth.startOf('month'), startOfLastMonth.endOf('month')];
    }
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const today = dayjs();
      return [today.subtract(30, 'day'), today];
    }
  },
  {
    label: 'Current Month',
    getValue: () => {
      const today = dayjs();
      return [today.startOf('month'), today.endOf('month')];
    }
  },
  {
    label: 'Next Month',
    getValue: () => {
      const today = dayjs();
      const startOfNextMonth = today.endOf('month').add(1, 'day');
      return [startOfNextMonth, startOfNextMonth.endOf('month')];
    }
  },
  { label: 'Reset', getValue: () => [dayjs(), dayjs()] }
];

const Recordings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('All');
  const [zonesList, setZonesList] = useState([]);
  const [zonesDropdownLoading, setZonesDropdownLoading] = useState(false);
  const [tagsDropdownLoading, setTagsDropdownLoading] = useState(false);
  const [tagsList, setTagsList] = useState([]);
  const [recordingsList, setRecordingsList] = useState([]);
  const [lastTenRecordings, setLastTenRecordings] = useState([]);
  const [rangeDate, setRangeDate] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  //const [selectedRoom, setSelectedRoom] = useState([]);
  // const [timeOut, setTimeOut] = useState(2);
  // const [selectedCamera] = useState({
  //   camLabel: '',
  //   stream_uri: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
  //   cam_id: null,
  //   location: '',
  //   zone_name: '',
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
  //     zone: 'Room 1',
  //     status: 'Live Stream',
  //     url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U'
  //   }
  // ]);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [recordingsPayload, setRecordingsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    sortBy: order,
    location: 'All',
    zones: 'All',
    tags: 'All',
    cust_id: localStorage.getItem('cust_id'),
    type: 'Fixed Camera',
    from: moment().format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD')
  });
  const [activeLiveStreamList, setActiveLivestreamList] = useState([]);
  const [recentLiveStreamList, setRecentLivestreamList] = useState([]);
  const [recordedStreamList, setRecordedStreamList] = useState([]);
  const [count, setCount] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fixedCamRecordingsCount, setFixedCamRecordingsCount] = useState(0);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [recordingData, setRecordingData] = useState();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMobileStreamDialogOpen, setIsEditMobileStreamDialogOpen] = useState(false);

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
    setZonesDropdownLoading(true);
    setTagsDropdownLoading(true);
    API.get('zones/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setZonesList(response.data.Data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setZonesDropdownLoading(false);
      }
    );

    API.get('cams/list-record-tags', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setTagsList(response.data.Data.recordTags);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setTagsDropdownLoading(false);
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

  const handleRecordingTypeChange = (event) => {
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      type: event.target.value,
      pageNumber: 0
    }));
  };

  const handleZoneChange = (_, value) => {
    const zonesArr = [];
    value.forEach((zone) => zonesArr.push(zone.zone_name));
    setRecordingsPayload((prevPayload) => ({ ...prevPayload, zones: zonesArr, pageNumber: 0 }));
  };

  const handleTagChange = (_, value) => {
    const tagsArr = [];
    value.forEach((tag) => tagsArr.push(tag.tag_id));
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      tags: tagsArr.length <= 0 ? 'All' : tagsArr,
      pageNumber: 0
    }));
  };

  const handlePageChange = (_, newPage) => {
    setRecordingsPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
    // getRecordingData();
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
    // getRecordingData();
  };

  const handleClick = (camRow) => {
    console.log('camRow==>', camRow);
    setSelectedCamera(camRow);
    setDialogOpen(true);
    setIsStreamDialogOpen(true);
  };

  const handleEditRecording = (data) => {
    console.log('data==>', data);
    setRecordingData(data);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRecording = (data) => {
    setRecordingData(data);
    setIsDeleteDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setIsStreamDialogOpen(false);
    setSelectedCamera(null);
  };

  const handleEditMobileStreamRecording = (data) => {
    console.log('data==>', data);
    setRecordingData(data);
    setIsEditMobileStreamDialogOpen(true);
  };

  const Row = ({ row }) => {
    const { created_at, zone, presigned_url, stream_running, stream_name } = row;
    const handle = useFullScreenHandle();
    const [open, setOpen] = useState(false);
    const [timeOut, setTimeOut] = useState(2);
    const [selectedCamera, setSelectedCamera] = useState({
      camLabel: '',
      stream_uri: presigned_url || zone?.live_stream_cameras[0]?.stream_uri,
      cam_id: null,
      location: zone?.location,
      zone_name: zone?.zone_name,
      cam_name: presigned_url ? zone?.live_stream_cameras[0]?.cam_name : ''
    });
    const [submitted] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);

    return (
      <>
        <TableRow hover>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${moment(created_at).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip
              label={stream_name ? stream_name : 'Unnamed'}
              color="primary"
              className="chip-color"
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip label={zone?.customer_location.loc_name} color="primary" className="chip-color" />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip label={zone?.zone_name} color="primary" className="zone-chip" />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip
              label={`Mobile Stream`}
              color="primary"
              className={`${stream_running ? 'green' : 'red'}-chip-color`}
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            <IconButton color="primary">
              <Link
                onClick={() =>
                  handleClick(row?.presigned_url || row?.zone?.live_stream_cameras[0]?.stream_uri)
                }>
                <img src={PlayRecording} />
              </Link>
            </IconButton>
            <IconButton color="primary" onClick={() => handleEditMobileStreamRecording(row)}>
              <img src={EditRecording} alt="share-recording" />
            </IconButton>
            <IconButton>
              <img src={ShareRecording} />
            </IconButton>
            <IconButton
              sx={{ '.MuiSvgIcon-root': { color: '#DD5853 !important' } }}
              onClick={() => handleDeleteRecording(row)}>
              <DeleteOutlineOutlinedIcon />
            </IconButton>
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

  const FixedCameraRecordingsRow = ({ row }) => {
    const {
      createdAt,
      zone,
      zone_name,
      video_url,
      stream_running,
      event_name,
      record_camera_tag,
      record_tag
    } = row;
    const handle = useFullScreenHandle();
    const [open, setOpen] = useState(false);
    const [timeOut, setTimeOut] = useState(2);
    const [selectedCamera, setSelectedCamera] = useState({
      camLabel: '',
      stream_uri: video_url || zone?.live_stream_cameras[0]?.stream_uri,
      cam_id: null,
      location: zone?.location,
      zone_name: zone_name,
      cam_name: video_url ? zone?.live_stream_cameras[0]?.cam_name : ''
    });
    const [submitted] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isFullScreenDialogOpen, setIsFullScreenDialogOpen] = useState(false);

    return (
      <>
        <TableRow hover>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${moment(createdAt).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip
              label={event_name ? event_name : 'Unnamed'}
              color="primary"
              className="chip-color"
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip
              label={record_camera_tag?.customer_location.loc_name}
              color="primary"
              className="chip-color"
            />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip label={zone_name} color="primary" className="zone-chip" />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            {/* <Stack direction="row"> */}
            <Chip
              label={`Fixed Camera Stream`}
              color="primary"
              className={`${stream_running ? 'green' : 'red'}-chip-color`}
            />
            {/* </Stack> */}
          </TableCell>
          {recordingsPayload.type == 'Fixed Camera' && (
            <TableCell align="center">
              <Chip
                label={`${record_tag?.tag_name ? record_tag?.tag_name : 'Unselected'}`}
                color="primary"
              />
            </TableCell>
          )}
          <TableCell align="center">
            <IconButton color="primary">
              <Link
                onClick={() => handleClick(video_url || zone?.live_stream_cameras[0].stream_uri)}>
                <img src={PlayRecording} />
              </Link>
            </IconButton>
            <IconButton color="primary" onClick={() => handleEditRecording(row)}>
              <img src={EditRecording} alt="share-recording" />
            </IconButton>
            <IconButton>
              <img src={ShareRecording} />
            </IconButton>
            <IconButton
              sx={{ '.MuiSvgIcon-root': { color: '#DD5853 !important' } }}
              onClick={() => handleDeleteRecording(row)}>
              <DeleteOutlineOutlinedIcon />
            </IconButton>
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
      stream_name: PropTypes.string,
      zone: PropTypes.object,
      presigned_url: PropTypes.string
    })
  };

  FixedCameraRecordingsRow.propTypes = {
    row: PropTypes.shape({
      createdAt: PropTypes.string,
      stream_running: PropTypes.bool,
      event_name: PropTypes.string,
      zone: PropTypes.object,
      zone_name: PropTypes.string,
      record_camera_tag: PropTypes.object,
      record_tag: PropTypes.object,
      video_url: PropTypes.string
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
        setRecordingsList(response.data.Data.recentFixedCameraRecordings.data);
        setLastTenRecordings(response.data.Data.lastTenFixedCameraRecordings);
        setRecordedStreamList(response.data.Data.recordedStreams.data);
        setCount(response.data.Data.recordedStreams.count);
        setFixedCamRecordingsCount(response.data.Data.recentFixedCameraRecordings.count);
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

  const handleSorting = () => {
    const newOrder = order === 'desc' ? 'asc' : 'desc';
    setOrder(newOrder);
    setRecordingsPayload({ ...recordingsPayload, sortBy: newOrder });
  };

  useEffect(() => {
    getRecordingData();
  }, [recordingsPayload]);

  useEffect(() => {
    setRecordingsPayload({
      ...recordingsPayload,
      from: dayjs(rangeDate[0]).format('YYYY-MM-DD'),
      to: dayjs(rangeDate[1]).format('YYYY-MM-DD')
    });
  }, [rangeDate]);

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
        <Grid item xl={6} lg={6} md={6} sm={12} xs={12} className="active-stream">
          <Card>
            <CardContent sx={{ padding: '24px' }}>
              <NewStreamTable
                style={{ borderRadius: 5 }}
                columns={FixedCameraRecordingsColumns}
                rows={lastTenRecordings}
                type={'FIXED_CAMERA'}
                title={'Recent Fixed Camera Recordings'}
                subtitle={'User recorded video'}
                isLoading={isLoading}
                getRecordingData={getRecordingData}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xl={6} lg={6} md={6} sm={12} xs={12} className="active-stream">
          <Card>
            <CardContent sx={{ padding: '24px' }}>
              <NewStreamTable
                style={{ borderRadius: 5 }}
                columns={streamColumns}
                rows={recentLiveStreamList}
                type={'MOBILE_LIVE_CAMERA'}
                title={'Recent Mobile Live Stream Recordings'}
                subtitle={'Mobile live streams available on demand'}
                isLoading={isLoading}
                getRecordingData={getRecordingData}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box className="listing-wrapper">
        <Card className="filter">
          <CardContent>
            <Grid container alignContent={'center'}>
              <Grid item lg={12} md={12} sm={12} xs={12}>
                <Grid container spacing={2}>
                  <Grid item md={2}>
                    <InputLabel id="date-range">Date Range</InputLabel>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DesktopDateRangePicker
                        slots={{ field: SingleInputDateRangeField }}
                        localeText={{ start: 'From', end: 'To' }}
                        value={rangeDate}
                        onChange={(newVal) => setRangeDate(newVal)}
                        slotProps={{
                          shortcuts: {
                            items: shortcutsItems
                          },
                          actionBar: { actions: [] }
                        }}
                        calendars={2}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item md={2} sm={6}>
                    <InputLabel id="location">Location</InputLabel>
                    <FormControl fullWidth className="location-select">
                      <Select
                        labelId="location"
                        id="location"
                        value={location}
                        onChange={handleLocationChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        {authCtx?.user?.locations
                          ?.sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
                          ?.map((item) => (
                            <MenuItem key={item.loc_id} value={item.loc_id}>
                              {item.loc_name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={2} sm={12}>
                    <InputLabel id="zones">Zones</InputLabel>
                    <Autocomplete
                      labelId="zones"
                      fullWidth
                      multiple
                      id="zones"
                      options={zonesList.sort((a, b) => (a?.zone_name > b?.zone_name ? 1 : -1))}
                      isOptionEqualToValue={(option, value) => option?.zone_id === value?.zone_id}
                      getOptionLabel={(option) => {
                        return option?.zone_name;
                      }}
                      onChange={handleZoneChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.zone_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          // label="Room"
                          fullWidth
                          placeholder="Zones"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {zonesDropdownLoading ? (
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
                  <Grid item md={2} sm={12}>
                    <InputLabel id="recording_type">Recording Type</InputLabel>
                    <FormControl fullWidth>
                      <Select
                        labelId="recording_type"
                        id="recording_type"
                        value={recordingsPayload?.type}
                        onChange={handleRecordingTypeChange}>
                        <MenuItem value={'Fixed Camera'}>Fixed Camera</MenuItem>
                        <MenuItem value={'Mobile Stream'}>Mobile Stream</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={2} sm={12}>
                    <InputLabel id="tags">Tags</InputLabel>
                    <Autocomplete
                      disabled={recordingsPayload.type == 'Mobile Stream'}
                      labelId="tags"
                      fullWidth
                      multiple
                      id="tags"
                      options={tagsList.sort((a, b) => (a?.tag_name > b?.tag_name ? 1 : -1))}
                      isOptionEqualToValue={(option, value) => option?.tag_id === value?.tag_id}
                      getOptionLabel={(option) => {
                        return option?.tag_name;
                      }}
                      onChange={handleTagChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.tag_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          // label="Room"
                          fullWidth
                          placeholder="Tags"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {tagsDropdownLoading ? (
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
                  <Grid item md={2} display={'flex'} alignItems={'end'} justifyContent={'center'}>
                    <Button
                      className="add-button"
                      variant="contained"
                      onClick={() => getRecordingData()}>
                      {' '}
                      Apply Filter
                    </Button>
                  </Grid>
                </Grid>
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
                      <TableCell>
                        <TableSortLabel
                          active={orderBy}
                          key={'date'}
                          align={'left'}
                          padding={'default'}
                          direction={order}
                          onClick={handleSorting}>
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Event Name</TableCell>
                      <TableCell align="center">Location</TableCell>
                      <TableCell align="center">Zones</TableCell>
                      <TableCell align="center">Type</TableCell>
                      {recordingsPayload.type == 'Fixed Camera' && (
                        <TableCell align="center">Tag</TableCell>
                      )}
                      <TableCell align="center">Stream</TableCell>
                    </TableRow>
                  </TableHead>
                  {recordingsPayload.type == 'Fixed Camera' ? (
                    <TableBody>
                      {recordingsList?.length > 0
                        ? recordingsList?.map((row, index) => (
                            <FixedCameraRecordingsRow row={row} key={index} />
                          ))
                        : null}
                    </TableBody>
                  ) : (
                    <TableBody>
                      {recordedStreamList?.length > 0
                        ? recordedStreamList?.map((row, index) => <Row row={row} key={index} />)
                        : null}
                    </TableBody>
                  )}
                </Table>
                {!isLoading &&
                recordedStreamList?.length == 0 &&
                recordingsPayload.type == 'Mobile Stream' ? (
                  <NoLiveStreamDiv />
                ) : null}
                {!isLoading &&
                recordingsList?.length == 0 &&
                recordingsPayload.type == 'Fixed Camera' ? (
                  <NoLiveStreamDiv />
                ) : null}
                {recordingsList?.length > 0 && recordingsPayload.type == 'Fixed Camera' ? (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    component="div"
                    count={fixedCamRecordingsCount}
                    rowsPerPage={recordingsPayload?.pageSize}
                    page={recordingsPayload?.pageNumber}
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : null}
                {recordedStreamList?.length > 0 && recordingsPayload.type == 'Mobile Stream' ? (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 25, 50]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    component="div"
                    count={count}
                    rowsPerPage={recordingsPayload?.pageSize}
                    page={recordingsPayload?.pageNumber}
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : null}
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
        {isEditDialogOpen && (
          <RecordingForm
            open={isEditDialogOpen}
            setOpen={setIsEditDialogOpen}
            recordingData={recordingData}
            setRecordingData={setRecordingData}
            getRecordingData={getRecordingData}
          />
        )}
        {isEditMobileStreamDialogOpen && (
          <MobileStreamEditForm
            open={isEditMobileStreamDialogOpen}
            setOpen={setIsEditMobileStreamDialogOpen}
            recordingData={recordingData}
            setRecordingData={setRecordingData}
            getRecordingData={getRecordingData}
          />
        )}
        <DeleteRecordingDialog
          open={isDeleteDialogOpen}
          title="Delete Recording"
          contentText="Are you sure you want to delete this?"
          recordingData={recordingData}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          handleDialogClose={() => {
            setRecordingData();
            setIsDeleteDialogOpen(false);
            getRecordingData();
          }}
        />
        {isStreamDialogOpen && (
          <Dialog open={dialogOpen} onClose={handleClose} fullWidth>
            <DialogTitle>
              {`Recording`}
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
                streamUri={
                  (selectedCamera !== null || selectedCamera !== undefined) && selectedCamera
                }
                camDetails={{}}
                recordedPlayback={true}
                dialogOpen={true}
              />
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </>
  );
};

export default Recordings;
