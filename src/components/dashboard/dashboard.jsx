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
import Loader from '../common/loader';
import Map from './map';
import { Video } from 'react-feather';
import _ from 'lodash';
import WatchStreamDialogBox from './watchstreamdialogbox';
import VideoOff from '../../assets/video-off.svg';
import StickyHeadTable from './stickyheadtable';
import CustomPlayer from '../watchstream/customplayer';
import { LoadingButton } from '@mui/lab';
import StreamTable from './streamtable';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MapDialog from './mapDialog';
import { useNavigate } from 'react-router-dom';
import OutboundIcon from '@mui/icons-material/Outbound';

const AccessColumns = ['Children', 'Room'];
const topViewersColumns = ['Viewers', 'Views'];
const lastHourViewersColumns = ['Viewers', 'Children', 'Room'];
const streamColumns = ['Stream Name', 'Time', 'Rooms'];

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
  const [timeOut, setTimeOut] = useState(10);
  const [playing, setPlaying] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [defaultWatchStream, setDefaultWatchStream] = useState(null);
  const [openMapDialog, setOpenMapDialog] = useState(false);

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

  useEffect(() => {
    layoutCtx.setActive(1);
    layoutCtx.setBreadcrumb([
      `Welcome back, ${authCtx?.user?.first_name}`,
      `${days[dayjs().day()]}, ${dayjs().format('DD MMMM YYYY')}`
    ]);

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    API.get('dashboard', {
      params: { cust_id: localStorage.getItem('cust_id'), location: authCtx?.location || 'All' }
    }).then((response) => {
      if (response.status === 200) {
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
  }, [authCtx.location]);

  return (
    <>
      <Box className="dashboard">
        <Loader loading={isLoading} />

        <Grid container spacing={3} mt={2} alignItems={'stretch'}>
          <Grid item md={7} sm={12} xs={12} style={{ paddingTop: 0 }}>
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
                          <Grid item xs={12} sm={12} md={6} lg={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Number of Streams
                            </Typography>
                            <Grid container spacing={1}>
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
                                  <span>+15%</span>
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
                          <Grid item xs={12} sm={12} md={6} lg={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Number of Viewers
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  spacing={0.7}
                                  className="strem-report viewers-report">
                                  <Box className="icon">
                                    <OutboundIcon />{' '}
                                  </Box>{' '}
                                  <span>-3.5%</span>
                                </Stack>
                                <Link href="#">View Report</Link>
                              </Grid>
                              <Grid item>
                                <Box className="report-circle" style={{ borderColor: '#FFAB01' }}>
                                  20
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
                          <Grid item xs={12} sm={12} md={6} lg={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Number of Streams
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item className="report-div">
                                <Stack
                                  direction={'row'}
                                  alignItems={'center'}
                                  spacing={0.7}
                                  className="strem-report">
                                  <Box className="icon">
                                    <OutboundIcon />{' '}
                                  </Box>{' '}
                                  <span>+15%</span>
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
                          <Grid item xs={12} sm={12} md={6} lg={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Number of Viewers
                            </Typography>
                            <Grid container spacing={1}>
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
                                  <span>-3.5%</span>
                                </Stack>

                                <Link href="#">View Report</Link>
                              </Grid>
                              <Grid item>
                                <Box className="report-circle" style={{ borderColor: '#01A4FF' }}>
                                  20
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
          <Grid item md={5} sm={12} xs={12} style={{ paddingTop: 0 }}>
            <Card style={{ height: '100%' }}>
              <CardContent>
                <Grid container>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
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
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <Stack direction={'row'} spacing={1}>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#A855F7' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <span>Children</span>
                          {statisticsData?.families !== undefined ? statisticsData?.families : ' '}
                        </Stack>
                      </Box>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#FAD203' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <span>Users</span>
                          {statisticsData?.childrens !== undefined
                            ? statisticsData?.childrens
                            : ' '}
                        </Stack>
                      </Box>
                      <Box
                        className="report-circle familiy-circle"
                        style={{ borderColor: '#FF8762' }}>
                        <Stack direction={'column'} alignItems={'center'}>
                          <span>Famillies</span>
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
        <Grid container spacing={3} mt={2}>
          <Grid item md={7} sm={12} xs={12} style={{ paddingTop: 0 }}>
            <Card>
              <CardContent>
                {/* <StickyHeadTable
                  style={{ borderRadius: 5 }}
                  key={3}
                  rows={
                    statisticsData?.activeLiveStreams?.length > 0
                      ? statisticsData?.activeLiveStreams
                      : []
                  }
                  columns={streamColumns}
                  title={'Active Stream'}
                  topViewers={false}
                  pagination={false}
                  height={160}
                  isLoading={isLoading}
                /> */}
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

                {/* <StickyHeadTable
                  style={{ borderRadius: 5 }}
                  key={3}
                  rows={statisticsData?.activeLiveStreams?.length > 0 ? [] : []}
                  columns={streamColumns}
                  title={'Recent Stream'}
                  topViewers={false}
                  pagination={false}
                  height={160}
                  isLoading={isLoading}
                /> */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item md={5} sm={12} xs={12} style={{ paddingTop: 0 }}>
            <Card className="watch-stream-card">
              <Grid
                container
                justifyContent={'space-between'}
                alignContent={'center'}
                sx={{ backgroundColor: '#fff', padding: 1 }}>
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

              <div className={`video-wrap ${isDeleteDialogOpen ? 'modal-overlay' : ''}`}>
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
                  <div id="open-modal" className="modal-window" style={{ backgroundColor: '#fff' }}>
                    <div>
                      <h2>Are you still watching?</h2>
                      <Divider />
                      <div className="modal-content">Press Yes to continue watching</div>
                      <Divider />
                      <div className="modal-button-wrap">
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
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item md={3.5} sm={12} xs={12}>
            <Paper sx={{ marginTop: 2 }}>
              <StickyHeadTable
                key={1}
                rows={
                  statisticsData?.childrenWithEnableDate?.length > 0
                    ? statisticsData?.childrenWithEnableDate
                    : []
                }
                columns={AccessColumns}
                title={'Weekly Gaining Access'}
                topViewers={false}
                pagination={false}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
          <Grid item md={3.5} sm={12} xs={12}>
            <Paper sx={{ marginTop: 2 }}>
              <StickyHeadTable
                key={1}
                rows={
                  statisticsData?.childrenWithEnableDate?.length > 0
                    ? statisticsData?.childrenWithEnableDate
                    : []
                }
                columns={AccessColumns}
                title={'Weekly Loosing Access'}
                topViewers={false}
                pagination={false}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
          <Grid item md={5} sm={12} xs={12}>
            <Paper sx={{ marginTop: 2 }}>
              <StickyHeadTable
                key={4}
                rows={
                  statisticsData?.enroledStreamsDetails?.length > 0 &&
                  statisticsData?.enroledStreamsDetails?.some((it) => !_.isNil(it?.family))
                    ? statisticsData?.enroledStreamsDetails
                    : []
                }
                columns={lastHourViewersColumns}
                title={'Viewers In The Last Hour'}
                topViewers={true}
                pagination={true}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={3} mt={1}>
          <Grid item md={7} sm={12} xs={12}>
            <Box className="location">
              <Card>
                <CardHeader
                  title={
                    <>
                      {/* <Typography style={{ padding: 15 }}>Location of Recent Viewers</Typography>
                      <Typography>Recent</Typography> */}
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
                  <Map data={mapsData} height={600} onOpen={() => setOpenMapDialog(true)} />
                  <MapDialog
                    open={openMapDialog}
                    onClose={() => setOpenMapDialog(false)}
                    mapsData={mapsData}
                  />
                </CardContent>
              </Card>
            </Box>
          </Grid>
          <Grid item md={5} sm={12} xs={12} style={{ paddingTop: 9 }}>
            <Paper sx={{ marginTop: 2 }}>
              <StickyHeadTable
                style={{ minHeight: 350 }}
                key={4}
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
                topViewers={true}
                pagination={false}
                isLoading={isLoading}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Dashboard;
