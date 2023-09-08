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
  Link,
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
// import StickyHeadTable from './stickyheadtable';
import CustomPlayer from '../watchstream/customplayer';
import { LoadingButton } from '@mui/lab';
import StreamTable from './streamtable';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MapDialog from './mapDialog';
import { useNavigate } from 'react-router-dom';
import OutboundIcon from '@mui/icons-material/Outbound';
import ViewersTable from './viewerstable';
import AccessTable from './accesstable';
import moment from 'moment';
import FamilyDrawer from '../families/familydrawer';
import ParentsForm from '../families/parentform';
import ChildForm from '../families/childform';
import DisableDialog from '../families/disabledialog';
import RoomAddForm from '../families/roomaddform';
import LinerLoader from '../common/linearLoader';

const AccessColumns = [
  { label: 'Children', width: '70%' },
  { label: 'Rooms', width: '30%' }
];
const topViewersColumns = [
  { label: 'Viewers', width: '50%' },
  { label: 'Views', width: '45%' }
];
const lastHourViewersColumns = [
  { label: 'Viewers', width: '30%' },
  { label: 'Children', width: '20%' },
  { label: 'Room', width: '40%' }
];
const streamColumns = ['Stream Name', 'Time', 'Room'];

const Dashboard = () => {
  const navigate = useNavigate();
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isRoomFormDialogOpen, setIsRoomFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [primaryParent, setPrimaryParent] = useState();
  const [secondaryParent, setSecondaryParent] = useState();
  const [child, setChild] = useState();
  const [parentType, setParentType] = useState('');
  const [roomsList, setRoomsList] = useState([]);
  const [disableLoading, setDisableLoading] = useState(false);

  // const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);

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
        // setRoomsDropdownLoading(false);
      }
    );
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
        !_.isEmpty(camLabel?.current?.rooms) > 0
        ? {
            ...camLabel?.current?.rooms,
            ...camLabel.current.cameras
          }
        : {}
    );
    setOpenWatchStreamDialog(false);
    API.post('dashboard/setPreference', {
      cameras: camLabel.current.cameras,
      locations: camLabel.current.locations,
      rooms: camLabel.current.rooms,
      cust_id: localStorage.getItem('cust_id')
    });
  };
  function greeting() {
    const hour = moment().hour();

    if (hour > 16) {
      return 'Good evening';
    }

    if (hour > 11) {
      return 'Good afternoon';
    }

    return 'Good morning';
  }

  useEffect(() => {
    layoutCtx.setActive(1);
    layoutCtx.setBreadcrumb([
      `${greeting()}, ${authCtx?.user?.first_name}!`,
      `${days[dayjs().day()]}, ${dayjs().format('DD MMMM YYYY')}`,
      `${authCtx?.user?.profile_image}`
    ]);

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getDashboardData();
  }, [authCtx.location, localStorage.getItem('updateDashboardData'), authCtx.updateDashboardData]);

  const getDashboardData = () => {
    setIsLoading(true);
    API.get('dashboard', {
      params: {
        cust_id: localStorage.getItem('cust_id'),
        location: authCtx?.location
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
          response?.data?.Data?.defaultWatchStream?.rooms &&
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
            rooms: [response?.data?.Data?.watchStreamDetails],
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

  return (
    <>
      <Box className="dashboard">
        <LinerLoader loading={isLoading} />

        <Grid container spacing={3} mt={2} alignItems={'stretch'}>
          <Grid item md={12} sm={12} xs={12} lg={7} style={{ paddingTop: 0 }}>
            <Card sx={{ borderRadius: 5, background: '#5A53DD' }}>
              <CardContent style={{ padding: '6px 16px 6px 16px' }}>
                <Grid
                  container
                  rowSpacing={1}
                  columnSpacing={{ xs: 3 }}
                  className="dashboard-analytics">
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <Card sx={{ borderRadius: 5 }}>
                      <CardContent className="p-10">
                        <Typography className="label" variant="subtitle1" style={{ paddingTop: 0 }}>
                          Live Mobile Streams
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6} md={6} lg={6}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              className="stream-sub-title">
                              Number of Streams
                            </Typography>
                            <Grid container spacing={1} alignItems={'end'}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  spacing={0.7}
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
                                <Box className="report-circle">
                                  {statisticsData?.activeLiveStreams !== undefined
                                    ? statisticsData?.activeLiveStreams?.length
                                    : ' '}
                                </Box>
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={6} md={6} lg={6}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              className="stream-sub-title">
                              Number of Viewers
                            </Typography>
                            <Grid container spacing={1} alignItems={'end'}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  alignItems={'center'}
                                  spacing={0.7}
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
                                  {statisticsData?.numberofActiveStreamViewers}
                                </Box>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <Card sx={{ borderRadius: 5 }}>
                      <CardContent className="p-10">
                        <Typography className="label" variant="subtitle1" style={{ paddingTop: 0 }}>
                          Live Mounted Cameras
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6} md={6} lg={6}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              className="stream-sub-title">
                              Number of Streams
                            </Typography>
                            <Grid container spacing={1} alignItems={'end'}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  alignItems={'center'}
                                  spacing={0.7}
                                  className="strem-report">
                                  <Box className="icon">
                                    <OutboundIcon />{' '}
                                  </Box>{' '}
                                  <Box component={'span'}>+15%</Box>
                                </Stack>
                                <Link href="#">View Report</Link>
                              </Grid>
                              <Grid item>
                                <Box className="report-circle" style={{ borderColor: '#F755D3' }}>
                                  {statisticsData?.enrolledStreams !== undefined
                                    ? statisticsData?.enrolledStreams
                                    : ' '}
                                </Box>
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={6} md={6} lg={6}>
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              className="stream-sub-title">
                              Number of Viewers
                            </Typography>
                            <Grid container spacing={1} alignItems={'end'}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  alignItems={'center'}
                                  spacing={0.7}
                                  className="strem-report viewers-report">
                                  <Box className="icon">
                                    {' '}
                                    <OutboundIcon />{' '}
                                  </Box>{' '}
                                  <Box component={'span'}>-3.5%</Box>
                                </Stack>

                                <Link href="#">View Report</Link>
                              </Grid>
                              <Grid item>
                                <Box className="report-circle" style={{ borderColor: '#01A4FF' }}>
                                  {statisticsData?.numberofMountedCameraViewers}
                                </Box>
                              </Grid>
                            </Grid>
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
                    <Stack direction={'row'} spacing={1} className="family-circle-wrap" gap={0}>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#A855F7' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <Box component={'span'}>Children</Box>
                          {statisticsData?.families !== undefined ? statisticsData?.families : ' '}
                        </Stack>
                      </Box>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#FAD203' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <Box component={'span'}>Users</Box>
                          {statisticsData?.childrens !== undefined
                            ? statisticsData?.childrens
                            : ' '}
                        </Stack>
                      </Box>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#FF8762' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <Box component={'span'}>Famillies</Box>
                          {statisticsData?.familyMembers !== undefined
                            ? statisticsData?.familyMembers
                            : ' '}
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
            <Card>
              <CardContent>
                <StreamTable
                  style={{ borderRadius: 5 }}
                  columns={streamColumns}
                  rows={
                    statisticsData?.activeLiveStreams?.length > 0
                      ? statisticsData?.activeLiveStreams
                      : []
                  }
                  title={'Active Stream'}
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
                  title={'Recent Stream'}
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
            <Card className="watch-stream-card">
              <Grid
                container
                justifyContent={'space-between'}
                alignContent={'center'}
                sx={{ backgroundColor: '#fff', padding: '8px 24px' }}>
                <Typography style={{ paddingTop: 10 }}>Watch Stream</Typography>
                <IconButton id="video-button" onClick={handleOpen}>
                  <Video />
                </IconButton>

                <WatchStreamDialogBox
                  open={openWatchStreamDialog}
                  close={handleClose}
                  submit={handleSubmit}
                  defaultWatchStream={defaultWatchStream}
                />
              </Grid>

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
                  <CustomPlayer
                    noOfCameras={2}
                    streamUri={selectedCamera?.stream_uri}
                    camDetails={selectedCamera}
                    timeOut={timeOut}
                    setTimeOut={setTimeOut}
                    setPlaying={setPlaying}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  />
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
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item md={12} sm={12} xs={12} lg={3.5}>
            <Paper sx={{ marginTop: 2 }}>
              <AccessTable
                rows={statisticsData?.childrenWithEnableDate || []}
                columns={AccessColumns}
                title={'Gaining Access This Week'}
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
            <Paper sx={{ marginTop: 2 }}>
              <AccessTable
                rows={statisticsData?.childrenWithDisableDate || []}
                columns={AccessColumns}
                title={'Loosing Access This Week'}
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
            <ViewersTable
              rows={
                statisticsData?.enroledStreamsDetails?.length > 0 &&
                statisticsData?.enroledStreamsDetails?.some((it) => !_.isNil(it?.family))
                  ? statisticsData?.enroledStreamsDetails
                  : []
              }
              columns={lastHourViewersColumns}
              title={'Viewers In The Last Hour'}
              pagination={true}
              isLoading={isLoading}
            />
          </Grid>
        </Grid>
        <Grid container spacing={3} mt={1}>
          <Grid item md={12} sm={12} xs={12} lg={7}>
            <Box className="location">
              <Card>
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
          <Grid item md={12} sm={12} xs={12} lg={5} style={{ paddingTop: 9 }}>
            <Paper sx={{ marginTop: 2 }}>
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
                title={'Top 5 Viewers Last 7 Days'}
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

      {isRoomFormDialogOpen && (
        <RoomAddForm
          open={isRoomFormDialogOpen}
          setOpen={setIsRoomFormDialogOpen}
          roomsList={roomsList}
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
          roomsList={roomsList}
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

      <FamilyDrawer
        open={isFamilyDrawerOpen}
        setOpen={setIsFamilyDrawerOpen}
        family={family}
        setFamily={setFamily}
        setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
        getFamiliesList={getDashboardData}
        setParentType={setParentType}
        roomsList={roomsList}
        parentType={parentType}
      />
    </>
  );
};

export default Dashboard;
