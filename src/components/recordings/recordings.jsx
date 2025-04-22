/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  DialogContent,
  Checkbox
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
import ShareRecordingForm from './sharerecordingform';

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
const defaultFromDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
const defaultToDate = dayjs().format('YYYY-MM-DD');

// Constants for cache
const RECORDINGS_CACHE_KEY = 'recordings_cache';
const CACHE_EXPIRY_KEY = 'record_uuids_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const getRecordingsLocalCache = () => {
  const data = localStorage.getItem(RECORDINGS_CACHE_KEY);
  return data ? JSON.parse(data) : [];
};

const isCacheExpired = () => {
  const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
  return !expiry || Date.now() > Number(expiry);
};

const Recordings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('All');
  const [zonesList, setZonesList] = useState([{ zone_id: 'All', zone_name: 'All' }]);
  const [selectedZonesList, setSelectedZonesList] = useState([]);
  const [uncheckedZonesList, setUncheckedZonesList] = useState([]);
  const [zonesDropdownLoading, setZonesDropdownLoading] = useState(false);
  const [tagsDropdownLoading, setTagsDropdownLoading] = useState(false);
  const [tagsList, setTagsList] = useState([{ tag_id: 'All', tag_name: 'All' }]);
  const [selectedTagsList, setSelectedTagsList] = useState([]);
  const [uncheckedTagsList, setUncheckedTagsList] = useState([]);
  const [recordingsList, setRecordingsList] = useState([]);
  const [lastTenRecordings, setLastTenRecordings] = useState([]);
  const [rangeDate, setRangeDate] = useState([dayjs(defaultFromDate), dayjs(defaultToDate)]);
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
    location: ['All'],
    zones: 'All',
    tags: 'All',
    cust_id: localStorage.getItem('cust_id'),
    type: 'Fixed Camera',
    from: defaultFromDate,
    to: defaultToDate
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMobileStreamDialogOpen, setIsEditMobileStreamDialogOpen] = useState(false);
  const [recordingsLocalCache, setRecordingsLocalCache] = useState(() => {
    return isCacheExpired() ? [] : getRecordingsLocalCache();
  });
  const [mergedRows, setMergedRows] = useState([]);
  const [mergedRowsForLastTenRecords, setMergedRowsForLastTenRecords] = useState([]);
  const isFirstRun = useRef(true);
  const cacheClearTimer = useRef(null);

  // Merge rows with cache data
  const mergeRowsWithCache = useCallback(() => {
    const updatedRows = recordingsList.map((row) => {
      console.log('recordingsLocalCache==>', recordingsLocalCache);
      const cached = recordingsLocalCache.find((item) => item.record_uuid === row.record_uuid);
      return cached
        ? {
            ...row,
            thumbnail_url: cached.thumbnail,
            video_url: cached.recording,
            unsigned_url: row?.video_url
          }
        : row;
    });
    setMergedRows(updatedRows);
    const updatedRowsforLastTenRecordings = lastTenRecordings.map((row) => {
      const cached = recordingsLocalCache.find((item) => item.record_uuid === row.record_uuid);
      return cached
        ? {
            ...row,
            thumbnail_url: cached.thumbnail,
            video_url: cached.recording,
            unsigned_url: row?.video_url
          }
        : row;
    });
    setMergedRowsForLastTenRecords(updatedRowsforLastTenRecordings);
  }, [recordingsList, recordingsLocalCache, lastTenRecordings]);

  // Clear cache and reset React state
  const clearCache = useCallback(() => {
    localStorage.removeItem(RECORDINGS_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    setRecordingsLocalCache([]);
  }, []);

  const scheduleCacheClear = useCallback(() => {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (expiry) {
      const delay = Number(expiry) - Date.now();
      if (delay > 0) {
        cacheClearTimer.current = setTimeout(clearCache, delay);
      } else {
        clearCache();
      }
    }
  }, [clearCache]);
  // Merge on component mount and whenever rows or cache change
  useEffect(() => {
    mergeRowsWithCache();
  }, [recordingsLocalCache, recordingsList, mergeRowsWithCache]);

  // Listen for localStorage cache updates
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === RECORDINGS_CACHE_KEY) {
        setRecordingsLocalCache(getRecordingsCache());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    scheduleCacheClear();
    return () => clearTimeout(cacheClearTimer.current);
  }, [scheduleCacheClear]);

  useEffect(() => {
    const cachedData = getRecordingsCache();
    setRecordingsLocalCache(cachedData); // Ensure cache is applied on reload

    // Ensure merging occurs after cache is updated
    mergeRowsWithCache();
  }, []);

  useEffect(() => {
    const updateCacheWithPagination = () => {
      const currentUuids = recordingsList.map((rec) => rec.record_uuid);
      const cachedUuids = getCachedRecordUuids();

      const missingUuids = currentUuids.filter((uuid) => !cachedUuids.includes(uuid));
      const missingRecords = recordingsList.filter((rec) => missingUuids.includes(rec.record_uuid));

      if (missingRecords.length > 0) {
        setRecordingsCache([...recordingsLocalCache, ...missingRecords]);
      }
    };

    updateCacheWithPagination();
  }, [recordingsList]);

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
          setZonesList([zonesList[0], ...response.data.Data]);
          setSelectedZonesList(response.data.Data);
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
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
        }
        setZonesDropdownLoading(false);
      }
    );

    API.get('cams/list-record-tags', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setTagsList([tagsList[0], ...response.data.Data.recordTags]);
          setSelectedTagsList(response.data.Data.recordTags);
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
              response?.response?.data?.Message || 'Something Went Wrong.',
              response?.response?.status,
              authCtx.setAuthError
            );
          }
        }
        setTagsDropdownLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return; //Skip first run to prevent double call
    }
    getRecordingData();
  }, [recordingsPayload]);

  useEffect(() => {
    if (!rangeDate[0] || !rangeDate[1]) return;
    setRecordingsPayload((prev) => ({
      ...prev,
      from: dayjs(rangeDate[0]).format('YYYY-MM-DD'),
      to: dayjs(rangeDate[1]).format('YYYY-MM-DD')
    }));
  }, [rangeDate]);

  const handleLocationChange = (event) => {
    const { value } = event.target;
    setLocation(value);
    if (value.includes('All')) {
      // If 'All' is selected, only keep 'All' in the state
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        location: value.length === 1 ? ['All'] : value.filter((loc) => loc !== 'All')
      }));
    } else {
      // Check if all other locations are selected
      const allLocationIds = authCtx.user.locations.map((loc) => loc.loc_id);
      const isAllLocationsSelected = allLocationIds.every((locId) => value.includes(locId));
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        location: isAllLocationsSelected ? ['All'] : value
      }));
    }
  };

  const handleRecordingTypeChange = (event) => {
    setRecordingsPayload((prevPayload) => ({
      ...prevPayload,
      type: event.target.value,
      pageNumber: 0
    }));
  };

  const handleZoneChange = (_, value, reason, option) => {
    if (reason === 'selectOption' && option?.option?.zone_id === 'All') {
      // Select all tags visually, but payload gets 'All'
      setSelectedZonesList(zonesList.slice(1)); // Exclude the "All" option itself
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        zones: 'All',
        pageNumber: 0
      }));
    } else if (reason === 'removeOption' && option?.option?.zone_id === 'All') {
      setSelectedZonesList([]);
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        zones: 'All',
        pageNumber: 0
      }));
    } else {
      setSelectedZonesList(value);
      setUncheckedZonesList(true);
      const zonesArr = value.filter((zone) => zone.zone_id !== 'All').map((zone) => zone.zone_id);
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        zones: zonesArr.length === 0 ? 'All' : zonesArr,
        pageNumber: 0
      }));
    }
  };

  const handleTagChange = (_, value, reason, option) => {
    if (reason === 'selectOption' && option?.option?.tag_id === 'All') {
      // Select all tags visually, but payload gets 'All'
      setSelectedTagsList(tagsList.slice(1)); // Exclude the "All" option itself
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        tags: 'All',
        pageNumber: 0
      }));
    } else if (reason === 'removeOption' && option?.option?.tag_id === 'All') {
      setSelectedTagsList([]);
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        tags: 'All',
        pageNumber: 0
      }));
    } else {
      setSelectedTagsList(value);
      setUncheckedTagsList(true);
      const tagsArr = value.filter((tag) => tag.tag_id !== 'All').map((tag) => tag.tag_id);
      setRecordingsPayload((prevPayload) => ({
        ...prevPayload,
        tags: tagsArr.length === 0 ? 'All' : tagsArr,
        pageNumber: 0
      }));
    }
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

  const handleShareRecording = (data) => {
    console.log('data==>', data);
    setRecordingData(data);
    setIsShareDialogOpen(true);
  };

  const Row = ({ row }) => {
    const { created_at, zone, presigned_url, stream_running, stream_name } = row;
    const handle = useFullScreenHandle();
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
        <TableRow className="fixed-camera-recordings-table" hover>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${moment(created_at).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={stream_name ? stream_name : 'Unnamed'} />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={zone?.customer_location.loc_name} />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={zone?.zone_name} className="zone-chip" />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={`Mobile Stream`} />
            {/* </Stack> */}
          </TableCell>
          <TableCell align="center">
            <IconButton color="primary" sx={{ padding: '4px' }}>
              <Link
                onClick={() =>
                  handleClick(row?.presigned_url || row?.zone?.live_stream_cameras[0]?.stream_uri)
                }>
                <img src={PlayRecording} />
              </Link>
            </IconButton>
            <IconButton
              color="primary"
              sx={{ padding: '4px' }}
              onClick={() => handleEditMobileStreamRecording(row)}>
              <img src={EditRecording} alt="share-recording" />
            </IconButton>
            <IconButton onClick={() => handleShareRecording(row)} sx={{ padding: '4px' }}>
              <img src={ShareRecording} />
            </IconButton>
            <IconButton
              sx={{ '.MuiSvgIcon-root': { color: '#DD5853 !important' }, padding: '4px' }}
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
        <TableRow hover className="fixed-camera-recordings-table">
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <img
                src={row.thumbnail_url}
                width={'88px'}
                height={'64px'}
                style={{ borderRadius: '10px', cursor: 'pointer' }}
                onClick={() => handleClick(row?.video_url)}
              />
              <Typography>{`${moment(createdAt).format('MM-DD-YYYY')}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={event_name ? event_name : 'Unnamed'} />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={record_camera_tag?.customer_location.loc_name} />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip label={zone_name} className="zone-chip" />
            {/* </Stack> */}
          </TableCell>
          <TableCell>
            {/* <Stack direction="row"> */}
            <Chip
              label={`Fixed Camera Stream`}
              className={`${stream_running ? 'green' : 'red'}-chip-color`}
            />
            {/* </Stack> */}
          </TableCell>
          {recordingsPayload.type == 'Fixed Camera' && (
            <TableCell>
              <Chip label={`${record_tag?.tag_name ? record_tag?.tag_name : 'Unselected'}`} />
            </TableCell>
          )}
          <TableCell align="center">
            <IconButton color="primary" sx={{ padding: '4px' }}>
              <Link
                onClick={() => handleClick(video_url || zone?.live_stream_cameras[0].stream_uri)}>
                <img src={PlayRecording} />
              </Link>
            </IconButton>
            <IconButton
              sx={{ padding: '4px' }}
              color="primary"
              onClick={() => handleEditRecording(row)}>
              <img src={EditRecording} alt="share-recording" />
            </IconButton>
            {recordingsPayload.type == 'Fixed Camera' && (
              <IconButton sx={{ padding: '4px' }} onClick={() => handleShareRecording(row)}>
                <img src={ShareRecording} />
              </IconButton>
            )}
            <IconButton
              sx={{ '.MuiSvgIcon-root': { color: '#DD5853 !important' }, padding: '4px' }}
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
      video_url: PropTypes.string,
      thumbnail_url: PropTypes.string
    })
  };

  // Get UUIDs from cache
  const getRecordingsCache = () => {
    const data = localStorage.getItem(RECORDINGS_CACHE_KEY);
    if (!data) return [];

    const now = Date.now();
    const parsedData = JSON.parse(data);

    // Filter out expired items
    const validData = parsedData.filter((item) => item.expiry > now);

    // Update cache if some records were expired
    if (validData.length !== parsedData.length) {
      localStorage.setItem(RECORDINGS_CACHE_KEY, JSON.stringify(validData));
      setRecordingsLocalCache(validData); // Update state
    }

    return validData;
  };

  // Set/update UUIDs in cache
  const setRecordingsCache = (newRecords) => {
    const now = Date.now();
    const cache = getRecordingsCache();

    // Merge existing and new, updating expiry for new records
    const updatedCache = [...cache];

    newRecords.forEach((record) => {
      const existingIndex = updatedCache.findIndex(
        (item) => item.record_uuid === record.record_uuid
      );

      if (existingIndex > -1) {
        // If record exists, don't update expiry
        updatedCache[existingIndex] = {
          ...updatedCache[existingIndex],
          ...record
        };
      } else {
        // If record is new, set expiry
        updatedCache.push({
          ...record,
          expiry: now + CACHE_DURATION
        });
      }
    });

    localStorage.setItem(RECORDINGS_CACHE_KEY, JSON.stringify(updatedCache));
    setRecordingsLocalCache(updatedCache); // Update state to reflect changes
  };

  // Add new UUIDs, avoiding duplicates
  // const addRecordUuidsToCache = (newUuids) => {
  //   const existingUuids = getRecordUuidsCache();
  //   const updatedUuids = Array.from(new Set([...existingUuids, ...newUuids]));
  //   setRecordUuidsCache(updatedUuids);
  //   return updatedUuids;
  // };

  const getCachedRecordUuids = () => {
    const cachedData = getRecordingsCache();
    return cachedData.map((rec) => rec.record_uuid);
  };

  const handleRecordingsCache = async (response) => {
    const recordings = response?.data?.Data?.lastTenFixedCameraRecordings?.data || [];
    const paginatedRecordings = response?.data?.Data?.recentFixedCameraRecordings?.data || [];
    const allNewRecords = [...recordings, ...paginatedRecordings];

    const newUuids = allNewRecords.map((rec) => rec.record_uuid);

    const cachedRecordings = getRecordingsCache();
    const cachedUuids = getCachedRecordUuids();

    const isCacheEmpty = cachedRecordings.length === 0;
    const newUniqueUuids = newUuids.filter((uuid) => !cachedUuids.includes(uuid));

    // Decide which UUIDs to send to the API
    const uuidsToSend = isCacheEmpty ? newUuids : newUniqueUuids;

    if (uuidsToSend.length > 0) {
      try {
        const s3Response = await API.post('recordings/s3-to-cloudfront', {
          record_uuids: uuidsToSend
        });

        if (s3Response.status === 200) {
          const s3Data = s3Response.data.Data;

          // Merge and update cache
          const updatedCache = isCacheEmpty
            ? s3Data
            : [
                ...cachedRecordings,
                ...s3Data.filter((item) => !cachedUuids.includes(item.record_uuid))
              ];

          setRecordingsCache(updatedCache); // Update cache and React state
        } else {
          console.error('Error fetching from s3-to-cloudfront:', s3Response);
        }
      } catch (error) {
        console.error('Error in s3-to-cloudfront API:', error);
      }
    }
  };

  const getRecordingData = () => {
    setIsLoading(true);
    let tagsToAdd;
    let zonesToAdd;

    if (recordingsPayload.tags === 'All') {
      tagsToAdd = 'All';
    } else if (selectedTagsList?.length === 0 && !uncheckedTagsList) {
      tagsToAdd = tagsList.slice(1).map((tag) => tag.tag_id);
    } else {
      tagsToAdd = recordingsPayload.tags;
    }

    if (recordingsPayload.zones === 'All') {
      zonesToAdd = 'All';
    } else if (selectedZonesList?.length === 0 && !uncheckedZonesList) {
      zonesToAdd = zonesList.slice(1).map((zone) => zone.zone_id);
    } else {
      zonesToAdd = recordingsPayload.zones;
    }
    API.get('recordings', {
      params: {
        ...recordingsPayload,
        tags: tagsToAdd,
        zones: zonesToAdd,
        cust_id: localStorage.getItem('cust_id')
      }
    }).then(async (response) => {
      if (response.status === 200) {
        await handleRecordingsCache(response);

        // Other state updates...
        setActiveLivestreamList(response.data.Data.activeLiveStreams);
        setRecentLivestreamList(response.data.Data.recentLiveStreams);
        setRecordingsList(response.data.Data.recentFixedCameraRecordings.data);
        setLastTenRecordings(response.data.Data.lastTenFixedCameraRecordings.data);
        setRecordedStreamList(response.data.Data.recordedStreams.data);
        setCount(response.data.Data.recordedStreams.count);
        setFixedCamRecordingsCount(response.data.Data.recentFixedCameraRecordings.count);
        setIsLoading(false);
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
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setIsLoading(false);
      }
    });
  };

  const handleSorting = () => {
    const newOrder = order === 'desc' ? 'asc' : 'desc';
    setOrder(newOrder);
    setRecordingsPayload({ ...recordingsPayload, sortBy: newOrder });
  };

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
                rows={mergedRowsForLastTenRecords}
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
                        multiple
                        value={recordingsPayload.location}
                        onChange={handleLocationChange}
                        renderValue={(selected) => {
                          if (selected.length === 0) return 'Select Locations';
                          if (selected.includes('All')) return 'All';

                          const selectedNames = authCtx.user.locations
                            .filter((loc) => selected.includes(loc.loc_id))
                            .map((loc) => loc.loc_name)
                            .join(', ');

                          return (
                            <Box
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                              {selectedNames}
                            </Box>
                          );
                        }}>
                        <MenuItem value="All">
                          <Checkbox checked={recordingsPayload.location.includes('All')} />
                          All
                        </MenuItem>
                        {authCtx?.user?.locations
                          ?.sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
                          ?.map((item) => (
                            <MenuItem key={item.loc_id} value={item.loc_id}>
                              <Checkbox
                                checked={
                                  recordingsPayload.location.includes(item.loc_id) ||
                                  recordingsPayload.location.includes('All')
                                }
                              />

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
                      limitTags={1}
                      multiple
                      id="zones"
                      options={zonesList.sort((a, b) => {
                        if (a.zone_name === 'All') return -1;
                        if (b.zone_name === 'All') return 1;
                        return a.zone_name.localeCompare(b.zone_name, undefined, { numeric: true });
                      })}
                      value={selectedZonesList ? selectedZonesList : []}
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
                      limitTags={1}
                      multiple
                      id="tags"
                      options={tagsList.sort((a, b) => (a?.tag_name > b?.tag_name ? 1 : -1))}
                      value={selectedTagsList ? selectedTagsList : []}
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
                      <TableCell>Event Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Zones</TableCell>
                      <TableCell>Type</TableCell>
                      {recordingsPayload.type == 'Fixed Camera' && <TableCell>Tag</TableCell>}
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  {recordingsPayload.type == 'Fixed Camera' ? (
                    <TableBody>
                      {mergedRows?.length > 0
                        ? mergedRows?.map((row, index) => (
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
                mergedRows?.length == 0 &&
                recordingsPayload.type == 'Fixed Camera' ? (
                  <NoLiveStreamDiv />
                ) : null}
                {mergedRows?.length > 0 && recordingsPayload.type == 'Fixed Camera' ? (
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
        {isShareDialogOpen && (
          <ShareRecordingForm
            open={isShareDialogOpen}
            setOpen={setIsShareDialogOpen}
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
