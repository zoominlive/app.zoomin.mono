import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  IconButton,
  Button,
  Divider,
  // Link,
  Paper,
  CardHeader
} from '@mui/material';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import LayoutContext from '../../context/layoutcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';
//import Loader from '../common/loader';
import Map from './map';
import { Video } from 'react-feather';
import _ from 'lodash';
import WatchStreamDialogBox from './watchstreamdialogbox';
import VideoOff from '../../assets/video-off.svg';
import Children from '../../assets/children-stats.svg';
import Users from '../../assets/users-stats.svg';
import Families from '../../assets/families-stats.svg';
import AddFamily from '../../assets/add-fam.svg';
import AddStaff from '../../assets/add-staff.svg';
import MultiCam from '../../assets/multi-cam.svg';
import Recordings from '../../assets/recordings.svg';
// import StickyHeadTable from './stickyheadtable';
import CustomPlayer from '../watchstream/customplayer';
import { LoadingButton } from '@mui/lab';
import StreamTable from './streamtable';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MapDialog from './mapDialog';
import { useNavigate } from 'react-router-dom';
// import OutboundIcon from '@mui/icons-material/Outbound';
import ViewersTable from './viewerstable';
import AccessTable from './accesstable';
// import moment from 'moment';
import FamilyDrawer from '../families/familydrawer';
import ParentsForm from '../families/parentform';
import ChildForm from '../families/childform';
import DisableDialog from '../families/disabledialog';
import ZoneAddForm from '../families/zoneaddform';
import FamilyForm from '../families/familyform';
import LinerLoader from '../common/linearLoader';
import UserForm from '../users/userform';

const AccessColumns = [
  { label: 'Child', width: '75%' },
  // { label: 'Rooms', width: '25%' },
  { label: 'Date', width: '25%' }
  // { label: 'Status', width: '25%' }
];
const topViewersColumns = [
  { label: 'Viewers', width: '50%' }
  // { label: 'Views', width: '45%' }
];
const lastHourViewersColumns = [
  { label: 'Viewers', width: '30%' },
  { label: 'Children', width: '30%' },
  { label: 'Zone', width: '30%' }
];
const streamColumns = ['Stream Name', 'Time', 'Zone'];

const Dashboard = () => {
  const navigate = useNavigate();
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [mapsData, setMapsData] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState({});
  const [openWatchStreamDialog, setOpenWatchStreamDialog] = useState(false);
  const [timeOut, setTimeOut] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [defaultWatchStream, setDefaultWatchStream] = useState(null);
  const [openMapDialog, setOpenMapDialog] = useState(false);

  const [family, setFamily] = useState();
  const [familyIndex, setFamilyIndex] = useState();

  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isZoneFormDialogOpen, setIsZoneFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [primaryParent, setPrimaryParent] = useState();
  const [secondaryParent, setSecondaryParent] = useState();
  const [child, setChild] = useState();
  const [parentType, setParentType] = useState('');
  const [zonesList, setZonesList] = useState([]);
  const [activeCameras, setActiveCameras] = useState([]);
  const [activeRecordings, setActiveRecordings] = useState([]);
  const [disableLoading, setDisableLoading] = useState(false);
  const [user, setUser] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [familiesPayload, setFamiliesPayload] = useState({
    page: 0,
    limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    zones: [],
    cust_id: localStorage.getItem('cust_id')
  });
  // eslint-disable-next-line no-unused-vars
  const [usersPayload, setUsersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    role: 'All',
    liveStreaming: 'All',
    cust_id: localStorage.getItem('cust_id')
  });

  // const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  useEffect(() => {
    if (authCtx.token) {
      let { user_id, family_member_id } = JSON.parse(localStorage.getItem('user'));

      let data = {};
      if (family_member_id) {
        data = { family_member_id: family_member_id };
      } else {
        data = { user_id: user_id };
      }
      //navigate('/dashboard');

      let socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);

      // Connection opened
      socket.addEventListener('open', (event) => {
        console.log('Connected', event);
        console.log('Date.now()', new Date().toLocaleString());
        // Send a ping message to the server
        const pingInterval = setInterval(() => {
          if (socket.readyState === socket.OPEN) {
            socket.send('ping');
          } else {
            clearInterval(pingInterval); // Stop sending pings if socket is not open
          }
        }, 120000); // Send a ping every 120 seconds
        socket.send(JSON.stringify(data), event);
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        let data = JSON.parse(event.data);
        if (data.message !== 'pong') console.log('===updateDashboardData', data);
        if (data?.message && data?.message !== 'pong') {
          enqueueSnackbar(data?.message, { variant: 'success' });
        } else {
          setStatisticsData((prevState) => ({
            ...prevState,
            ...data
          }));
        }
      });

      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);
        socket.addEventListener('open', (event) => {
          console.log('Reconnected');
          socket.send(JSON.stringify(data), event);
        });
      });

      socket.addEventListener('close', (event) => {
        console.log('==Disconnected==', new Date().toLocaleString());
        console.log('WebSocket connection closed with code:', event.code, 'reason:', event.reason);
        socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);
        socket.addEventListener('open', (event) => {
          console.log('Reconnected');
          socket.send(JSON.stringify(data), event);
        });
      });
    }
  }, [authCtx.token]);

  const handleFamilyDisable = (data) => {
    setDisableLoading(true);
    API.put('family/disable', {
      family_member_id: family.primary.family_member_id,
      member_type: 'primary',
      family_id: family.primary.family_id,
      scheduled_end_date:
        data.selectedOption === 'schedule' && dayjs(data.disableDate).format('YYYY-MM-DD')
    }).then((response) => {
      if (response.status === 200) {
        if (response?.data?.Data?.scheduled === true) {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = dayjs(data.disableDate).format('YYYY-MM-DD');
            return tempFamily;
          });
        }
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        //getFamiliesList();
        if (data.selectedOption === 'disable') {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.status = 'Disabled';
            tempFamily.secondary.length > 0 &&
              tempFamily.secondary.forEach((parent) => {
                parent.status = 'Disabled';
              });

            tempFamily.children.forEach((child) => {
              child.status = 'Disabled';
            });
            if (tempFamily.primary.scheduled_end_date) {
              tempFamily.primary.scheduled_end_date = null;
            }
            return tempFamily;
          });
        } else {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = data.disableDate;
            return tempFamily;
          });
        }
        setIsDisableFamilyDialogOpen(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setDisableLoading(false);
    });
  };

  useEffect(() => {
    // setRoomsDropdownLoading(true);
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
        // setRoomsDropdownLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    API.get('cams/list-record-tags').then((response) => {
      if (response.status === 200) {
        authCtx.setTags(response.data.Data.recordTags);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    });
    getRecordingsByUser();
  }, []);

  const handleOpen = () => {
    setOpenWatchStreamDialog(true);
  };
  const handleClose = () => {
    setOpenWatchStreamDialog(false);
  };
  const handleSubmit = (camLabel) => {
    setSelectedCamera(
      !_.isEmpty(camLabel?.current?.cameras) &&
        camLabel?.current?.locations?.length > 0 &&
        !_.isEmpty(camLabel?.current?.zones) > 0
        ? {
            ...camLabel?.current?.zones,
            ...camLabel.current.cameras
          }
        : {}
    );
    setOpenWatchStreamDialog(false);
    API.post('dashboard/setPreference', {
      cameras: camLabel.current.cameras,
      locations: camLabel.current.locations,
      zones: camLabel.current.zones,
      cust_id: localStorage.getItem('cust_id')
    });
  };
  // function greeting() {
  //   const hour = moment().hour();

  //   if (hour > 16) {
  //     return 'Good evening';
  //   }

  //   if (hour > 11) {
  //     return 'Good afternoon';
  //   }

  //   return 'Good morning';
  // }

  useEffect(() => {
    layoutCtx.setActive(1);
    layoutCtx.setBreadcrumb([
      // `${greeting()}, ${authCtx?.user?.first_name}!`,
      // `${days[dayjs().day()]}, ${dayjs().format('DD MMMM YYYY')}`,
      // `${authCtx?.user?.profile_image}`
    ]);

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getDashboardData();
  }, [authCtx.location, localStorage.getItem('updateDashboardData'), authCtx.updateDashboardData]);

  const getDashboardData = () => {
    // console.log(
    //   '========dashboard======',
    //   localStorage.getItem('updateDashboardData'),
    //   localStorage.getItem('updateDashboardData') == undefined ? true : false
    // );
    setIsLoading(true);
    let locations = authCtx?.location.map((item) => item.loc_id);
    API.get('dashboard', {
      params: {
        cust_id: localStorage.getItem('cust_id'),
        location:
          authCtx.user?.locations?.length == 1 && authCtx.user.role !== 'Super Admin'
            ? authCtx.user?.locations.map((item) => item.loc_id)
            : locations
      }
    }).then((response) => {
      if (response.status === 200) {
        localStorage.setItem('updateDashboardData', false);
        authCtx.setUpdateDashboardData(false);
        setStatisticsData(response.data.Data);
        const points = response?.data?.Data?.enroledStreamsDetails.map((point) => ({
          type: 'Feature',
          properties: { cluster: false, rv_id: point.rv_id, label: point.location_name },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(point.long), parseFloat(point.lat)]
          }
        }));
        setMapsData(points);
        if (
          response?.data?.Data?.defaultWatchStream?.locations?.length > 0 &&
          response?.data?.Data?.defaultWatchStream?.zones &&
          response?.data?.Data?.defaultWatchStream?.cameras
        ) {
          setDefaultWatchStream(response?.data?.Data?.defaultWatchStream);
          setSelectedCamera(
            response?.data?.Data?.defaultWatchStream?.cameras
              ? response?.data?.Data?.defaultWatchStream?.cameras
              : {}
          );
        } else {
          setDefaultWatchStream({
            locations: [response?.data?.Data?.watchStreamDetails?.location],
            zones: [response?.data?.Data?.watchStreamDetails],
            cameras: response?.data?.Data?.watchStreamDetails?.cameras[0]
          });
          setSelectedCamera(
            response?.data?.Data?.watchStreamDetails?.cameras[0]
              ? {
                  ...response?.data?.Data?.watchStreamDetails,
                  ...response?.data?.Data?.watchStreamDetails?.cameras[0]
                }
              : {}
          );
        }
        setTimeOut(response?.data?.Data?.watchStreamDetails?.timeout);
        // setFamily((prevState) => {
        //   const tempFamily = { ...prevState };
        //   if (tempFamily) {
        //     let obj = response?.data?.Data?.childrenWithEnableDate?.find(
        //       (o) => o?.primary?.family_id === tempFamily?.primary?.family_id
        //     );
        //     return obj;
        //   } else {
        //     return null;
        //   }
        // });
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

  // Method to fetch families list
  const getFamiliesList = () => {
    setIsLoading(true);
    API.get('family', { params: familiesPayload }).then((response) => {
      if (response.status === 200) {
        navigate('/families');
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

  const getUsersList = () => {
    setIsLoading(true);
    API.get('users/all', { params: usersPayload }).then((response) => {
      if (response.status === 200) {
        navigate('/users');
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
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    });
  };

  return (
    <>
      <Box className="dashboard">
        <LinerLoader loading={isLoading} />
        <Grid container spacing={3} mt={2} alignItems={'stretch'}>
          <Grid item md={12} sm={12} xs={12} lg={7} style={{ paddingTop: 0 }}>
            <Card sx={{ borderRadius: 5, background: '#5A53DD', height: '100%' }}>
              <CardContent
                className="live-stream-stats"
                style={{
                  padding: '0px 16px 0px 16px',
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <Grid
                  container
                  rowSpacing={1}
                  columnSpacing={{ xs: 3 }}
                  className="dashboard-analytics">
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <Card sx={{ borderRadius: 5 }}>
                      <CardContent className="analytics-card">
                        <Grid container spacing={1} alignItems={'center'}>
                          <Grid item xs={12} className="mounted-cam-section">
                            <Typography className="stream-labels" style={{ paddingTop: 0 }}>
                              Live <br /> Mobile <br /> Streams
                            </Typography>
                          </Grid>
                          <Grid item xs={12} className="stats-circle-section">
                            <Box className="report-circle">
                              {statisticsData?.activeLiveStreams !== undefined
                                ? statisticsData?.activeLiveStreams?.length
                                : ' '}
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                className="stream-sub-title">
                                Number of Streams
                              </Typography>
                            </Box>
                            <Box
                              className="report-circle number-of-viewers"
                              style={{ borderColor: '#FFAB01', marginLeft: '15px' }}>
                              {statisticsData?.numberofActiveStreamViewers}
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                className="stream-sub-title">
                                Number of Viewers
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <Card sx={{ borderRadius: 5 }}>
                      <CardContent className="p-10">
                        <Grid container spacing={1} alignItems={'center'}>
                          <Grid item xs={12} className="mounted-cam-section">
                            <Typography className="stream-labels" style={{ paddingTop: 0 }}>
                              Live <br /> Mounted <br /> Cameras
                            </Typography>
                          </Grid>
                          <Grid item xs={12} className="stats-circle-section">
                            <Box className="report-circle" style={{ borderColor: '#F755D3' }}>
                              {statisticsData?.enrolledStreams !== undefined
                                ? statisticsData?.enrolledStreams
                                : ' '}
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                className="stream-sub-title">
                                Number of Streams
                              </Typography>
                            </Box>
                            <Box
                              className="report-circle number-of-viewers"
                              style={{ borderColor: '#01A4FF', marginLeft: '15px' }}>
                              {statisticsData?.numberofMountedCameraViewers}
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                className="stream-sub-title">
                                Number of Viewers
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid
            item
            md={12}
            sm={12}
            xs={12}
            lg={5}
            style={{ paddingTop: 0 }}
            className="family-div">
            <Card>
              <CardContent>
                <Grid container direction={'row'} alignItems={'center'}>
                  <Grid item lg={5} md={5} sm={5} xs={12}>
                    <Stack direction={'column'}>
                      <Typography>Enrolled Families</Typography>
                      <Typography variant="body1" className="subtitle">
                        Your activity enrolled families
                      </Typography>
                      <Button
                        onClick={() => navigate('/families')}
                        className="add-btn dashboard-btn"
                        sx={{
                          borderRadius: 20,
                          background: '#5A53DD',
                          color: '#fff',
                          textTransform: 'capitalize',
                          maxWidth: 150
                        }}>
                        View Families
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid item lg={7} md={7} sm={7} xs={12}>
                    <Stack
                      direction={'row'}
                      spacing={1}
                      className="family-circle-wrap"
                      gap={0}
                      justifyContent={'flex-end'}>
                      <Box className="familiy-circle">
                        <Stack
                          className=""
                          style={{ borderColor: '#A855F7' }}
                          direction={'column'}
                          gap={2.5}
                          alignItems={'center'}>
                          <img src={Children} alt="Children" width={32} height={32} />
                          <Stack direction={'column'} textAlign={'center'}>
                            <Box component={'span'}>Children</Box>
                            {statisticsData?.childrens !== undefined
                              ? statisticsData?.childrens
                              : ' '}
                          </Stack>
                        </Stack>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box className="familiy-circle">
                        <Stack
                          className=""
                          style={{ borderColor: '#FAD203' }}
                          direction={'column'}
                          gap={3}
                          alignItems={'center'}>
                          <img src={Users} alt="Users" width={32} height={32} />
                          <Stack direction={'column'} textAlign={'center'}>
                            <Box component={'span'}>Staff</Box>
                            {statisticsData?.users !== undefined ? statisticsData?.users : ' '}
                          </Stack>
                        </Stack>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box className="familiy-circle">
                        <Stack
                          className=""
                          style={{ borderColor: '#FF8762' }}
                          direction={'column'}
                          gap={3}
                          alignItems={'center'}>
                          <img src={Families} alt="Families" width={32} height={32} />
                          <Stack direction={'column'} textAlign={'center'}>
                            <Box component={'span'}>Families</Box>
                            {statisticsData?.families !== undefined
                              ? statisticsData?.families
                              : ' '}
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={3} mt={2} className="stream-table-main">
          <Grid item md={12} sm={12} xs={12} lg={7} style={{ paddingTop: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <StreamTable
                  style={{ borderRadius: 5 }}
                  columns={streamColumns}
                  rows={
                    statisticsData?.activeLiveStreams?.length > 0
                      ? statisticsData?.activeLiveStreams
                      : []
                  }
                  title={'Mobile Live Streams'}
                  isLoading={isLoading}
                />

                <StreamTable
                  style={{ borderRadius: 5, marginTop: 20 }}
                  columns={streamColumns}
                  rows={
                    statisticsData?.recentLiveStreams?.length > 0
                      ? statisticsData?.recentLiveStreams
                      : []
                  }
                  title={'Recent Streams'}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid
            item
            md={12}
            sm={12}
            xs={12}
            lg={5}
            style={{ paddingTop: 0 }}
            className="watch-stream-main">
            <Stack direction={'column'} gap={2.2} className="watch-stream-main-stack">
              <Card className="watch-stream-card">
                <Grid
                  container
                  justifyContent={'space-between'}
                  alignContent={'center'}
                  sx={{ backgroundColor: '#fff', padding: '8px 24px' }}>
                  <Stack direction={'row'} alignItems={'center'}>
                    <Typography style={{ paddingTop: 10 }}> Watch Stream </Typography>
                    {!_.isEmpty(selectedCamera) ? (
                      <label style={{ color: '#000', paddingTop: 5 }}>
                        {console.log('selectedCamera=>', selectedCamera)}
                        {' | ' +
                          selectedCamera?.location +
                          '/' +
                          selectedCamera?.zone_name +
                          ' - ' +
                          selectedCamera?.cam_name}
                      </label>
                    ) : null}
                  </Stack>
                  <IconButton id="video-button" onClick={handleOpen}>
                    <Video style={{ padding: '3px', color: '#5a53dd' }} />
                  </IconButton>

                  <WatchStreamDialogBox
                    open={openWatchStreamDialog}
                    close={handleClose}
                    submit={handleSubmit}
                    defaultWatchStream={defaultWatchStream}
                  />
                </Grid>
                {/* <Box sx={{ marginBottom: '10px', marginTop: '-10px' }}>
                  {!_.isEmpty(selectedCamera) ? (
                    <label
                      className="watching-stream-under-watch-stream"
                      style={{ color: '#000', paddingLeft: 30 }}>
                      {'Watching - ' +
                        selectedCamera?.location +
                        '/' +
                        selectedCamera?.zone_name +
                        ' - ' +
                        selectedCamera?.cam_name}
                    </label>
                  ) : null}
                </Box> */}
                <Box className={`video-wrap ${isDeleteDialogOpen ? 'modal-overlay' : ''}`}>
                  {_.isEmpty(selectedCamera) || !playing ? (
                    <Stack
                      height={'85%'}
                      color={'#fff'}
                      spacing={1}
                      alignItems="center"
                      justifyContent="center">
                      <img src={VideoOff} />
                      <Typography>
                        {!playing ? 'Stream stopped due to Inactivity' : `Camera not selected`}
                      </Typography>
                    </Stack>
                  ) : (
                    <>
                      <CustomPlayer
                        noOfCameras={2}
                        streamUri={selectedCamera?.stream_uri}
                        camDetails={selectedCamera}
                        activeRecordingCameras={activeCameras}
                        isRecording={activeCameras.includes(selectedCamera?.cam_id)}
                        startTime={
                          activeRecordings.find((item) => item.cam_id === selectedCamera?.cam_id)
                            ?.start_time || 'Not Found'
                        }
                        tagName={
                          activeRecordings.find((item) => item.cam_id === selectedCamera?.cam_id)
                            ?.record_tag?.tag_name || 'Not Found'
                        }
                        setActiveCameras={setActiveCameras}
                        timeOut={timeOut}
                        setTimeOut={setTimeOut}
                        setPlaying={setPlaying}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      />
                    </>
                  )}

                  {isDeleteDialogOpen ? (
                    <Box id="open-modal" className="modal-window">
                      <Box>
                        <Typography variant="h2">Are you still watching?</Typography>
                        <Divider />
                        <Box className="modal-content">Press Yes to continue watching</Box>
                        <Divider />
                        <Box className="modal-button-wrap">
                          <Button
                            variant="text"
                            onClick={() => {
                              setIsDeleteDialogOpen(false);
                            }}>
                            NO
                          </Button>
                          <LoadingButton
                            onClick={() => {
                              setPlaying(true);
                              setIsDeleteDialogOpen(false);
                            }}>
                            YES
                          </LoadingButton>
                        </Box>
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </Card>
              <Card className="camera-viewing-card">
                <CardHeader
                  sx={{ padding: '20px 24px 0 24px' }}
                  title={
                    <>
                      <Stack
                        direction="row"
                        spacing={2}
                        justifyContent={'space-between'}
                        className="">
                        <Typography>Quick Links</Typography>
                      </Stack>
                    </>
                  }
                />
                <CardContent sx={{ display: 'flex' }}>
                  <Stack direction={'row'} gap={1} sx={{ flexGrow: 1 }}>
                    <Stack
                      justifyContent={'center'}
                      alignItems={'center'}
                      gap={1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsAddFamilyDialogOpen(true);
                      }}
                      className="quick-link-wrap quick-links-add-fam">
                      <img src={AddFamily} alt="add-fam" className="quick-link-img" />
                      <Typography className="link-text">{'Add Family'}</Typography>
                    </Stack>
                    <Stack
                      justifyContent={'center'}
                      alignItems={'center'}
                      gap={1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setIsUserFormDialogOpen(true);
                      }}
                      className="quick-link-wrap quick-links-add-staff">
                      <img src={AddStaff} alt="add-fam" className="quick-link-img" />
                      <Typography className="link-text">{'Add Staff'}</Typography>
                    </Stack>
                    <Stack
                      justifyContent={'center'}
                      alignItems={'center'}
                      gap={1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        navigate('/watch-stream');
                      }}
                      className="quick-link-wrap quick-links-multi-cam">
                      <img src={MultiCam} alt="add-fam" className="quick-link-img" />
                      <Typography className="link-text">{'Multi-Cam'}</Typography>
                    </Stack>
                    <Stack
                      justifyContent={'center'}
                      alignItems={'center'}
                      gap={1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        navigate('/recordings');
                      }}
                      className="quick-link-wrap quick-links-recordings">
                      <img src={Recordings} alt="recordings" className="quick-link-img" />
                      <Typography className="link-text">{'Recordings'}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
              {/* <Card className="camera-viewing-card">
                <Stack
                  direction={'row'}
                  justifyContent={'space-around'}
                  alignItems={'center'}
                  padding={2}>
                  <Box>
                    <Typography>Multi-Camera Viewing</Typography>
                    <Typography variant="p" sx={{ color: '#828282' }}>
                      Watch multiple cameras at once
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => navigate('/watch-stream')}
                    className="add-btn dashboard-btn dashboard-cam-btn"
                    sx={{
                      borderRadius: 20,
                      background: '#5A53DD',
                      color: '#fff',
                      textTransform: 'capitalize',
                      height: '49px'
                    }}>
                    Multiple Cameras
                  </Button>
                </Stack>
              </Card> */}
            </Stack>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item md={12} sm={12} xs={12} lg={3.5}>
            <Paper sx={{ marginTop: 2 }} className="zl__table-res">
              <AccessTable
                rows={statisticsData?.childrenWithEnableDate || []}
                columns={AccessColumns}
                title={'Gaining Access'}
                isLoading={isLoading}
                getDashboardData={getDashboardData}
                setFamily={setFamily}
                setIsFamilyDrawerOpen={setIsFamilyDrawerOpen}
                setFamilyIndex={setFamilyIndex}
                familyIndex={familyIndex}
              />
            </Paper>
          </Grid>
          <Grid item md={12} sm={12} xs={12} lg={3.5}>
            <Paper sx={{ marginTop: 2 }} className="zl__table-res">
              <AccessTable
                rows={statisticsData?.childrenWithDisableDate || []}
                columns={AccessColumns}
                title={'Losing Access'}
                isLoading={isLoading}
                getDashboardData={getDashboardData}
                setFamily={setFamily}
                setIsFamilyDrawerOpen={setIsFamilyDrawerOpen}
                setFamilyIndex={setFamilyIndex}
                familyIndex={familyIndex}
              />
            </Paper>
          </Grid>
          <Grid item md={12} sm={12} xs={12} lg={5}>
            <Paper sx={{ marginTop: 2 }} className="zl__table-res">
              <ViewersTable
                rows={
                  statisticsData?.enroledStreamsDetails?.length > 0 &&
                  statisticsData?.enroledStreamsDetails?.some((it) => !_.isNil(it?.family))
                    ? statisticsData?.enroledStreamsDetails
                    : []
                }
                columns={lastHourViewersColumns}
                title={'Recent Viewers'}
                pagination={true}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={3} mt={2}>
          <Grid item md={12} sm={12} xs={12} lg={7} style={{ paddingTop: 0 }}>
            <Box className="location" style={{ height: '100%' }}>
              <Card className="map-card-wrapper">
                <CardHeader
                  title={
                    <>
                      <Stack
                        direction="row"
                        spacing={2}
                        justifyContent={'space-between'}
                        className="">
                        <Typography>Location of Recent Viewers</Typography>
                        <Stack direction={'row'} alignItems={'center'} justifyContent={'center'}>
                          <Typography
                            style={{ color: '#5A53DD', fontWeight: 500, fontSize: 15 }}
                            variant="h6">
                            <FiberManualRecordIcon fontSize={'13'} /> Recent
                          </Typography>
                        </Stack>
                      </Stack>
                    </>
                  }
                />
                <CardContent>
                  <Map
                    data={mapsData}
                    height={600}
                    isMapIcon={true}
                    onOpen={() => setOpenMapDialog(true)}
                  />
                  <MapDialog
                    open={openMapDialog}
                    onClose={() => setOpenMapDialog(false)}
                    mapsData={mapsData}
                  />
                </CardContent>
              </Card>
            </Box>
          </Grid>
          <Grid item md={12} sm={12} xs={12} lg={5} style={{ paddingTop: 0 }}>
            <Paper sx={{ marginTop: 0 }} className="zl__table-res">
              <ViewersTable
                rows={
                  statisticsData?.topViewers?.length > 0
                    ? //statisticsData?.topViewers?.some((it) => !_.isNil(it?.family) && )
                      statisticsData?.topViewers?.filter(
                        (it) => !_.isNil(it.family) || !_.isNil(it.user)
                      )
                    : []
                }
                columns={topViewersColumns}
                title={'Top 5 Viewers'}
                pagination={false}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {isDisableFamilyDialogOpen && (
        <DisableDialog
          open={isDisableFamilyDialogOpen}
          setOpen={setIsDisableFamilyDialogOpen}
          loading={disableLoading}
          title="Disable Family"
          contentText="This action will disable access for all children."
          handleDisable={handleFamilyDisable}
          handleDialogClose={() => setIsDisableFamilyDialogOpen(false)}
        />
      )}

      {isZoneFormDialogOpen && (
        <ZoneAddForm
          open={isZoneFormDialogOpen}
          setOpen={setIsZoneFormDialogOpen}
          zonesList={zonesList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getDashboardData}
        />
      )}
      {isChildFormDialogOpen && (
        <ChildForm
          open={isChildFormDialogOpen}
          setOpen={setIsChildFormDialogOpen}
          zonesList={zonesList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getDashboardData}
        />
      )}

      {isParentFormDialogOpen && (
        <ParentsForm
          open={isParentFormDialogOpen}
          setOpen={setIsParentFormDialogOpen}
          primaryParent={primaryParent}
          setPrimaryParent={setPrimaryParent}
          secondaryParent={secondaryParent}
          setSecondaryParent={setSecondaryParent}
          family={family}
          setFamily={setFamily}
          getFamiliesList={getDashboardData}
          setParentType={setParentType}
          parentType={parentType}
        />
      )}

      {isAddFamilyDialogOpen && (
        <FamilyForm
          open={isAddFamilyDialogOpen}
          setOpen={setIsAddFamilyDialogOpen}
          zonesList={zonesList}
          getFamiliesList={getFamiliesList}
        />
      )}
      {isUserFormDialogOpen && (
        <UserForm
          open={isUserFormDialogOpen}
          setOpen={setIsUserFormDialogOpen}
          user={user}
          setUser={setUser}
          getUsersList={getUsersList}
        />
      )}
      <FamilyDrawer
        open={isFamilyDrawerOpen}
        setOpen={setIsFamilyDrawerOpen}
        family={family}
        setFamily={setFamily}
        setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        setIsZoneFormDialogOpen={setIsZoneFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
        getFamiliesList={getDashboardData}
        setParentType={setParentType}
        zonesList={zonesList}
        parentType={parentType}
      />
    </>
  );
};

export default Dashboard;
