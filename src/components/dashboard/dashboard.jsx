import { Box, Card, CardContent, Grid, Stack, Typography, IconButton } from '@mui/material';
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
import ReactPlayer from 'react-player';
import { Video } from 'react-feather';
import _ from 'lodash';
import WatchStreamDialogBox from './watchstreamdialogbox';
import VideoOff from '../../assets/video-off.svg';
import StickyHeadTable from './stickyheadtable';

const Dashboard = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [mapsData, setMapsData] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState({});
  const [openWatchStreamDialog, setOpenWatchStreamDialog] = useState(false);
  const [defaultWatchStream, setDefaultWatchStream] = useState(null);

  const handleOpen = () => {
    setOpenWatchStreamDialog(true);
  };
  const handleClose = () => {
    setOpenWatchStreamDialog(false);
  };
  const handleSubmit = (camera, camLabel) => {
    setSelectedCamera(camera);
    setOpenWatchStreamDialog(false);
    API.post('dashboard/setPreference', {
      cameras: camLabel.current.cameras,
      locations: camLabel.current.locations,
      rooms: camLabel.current.rooms
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
    API.get('dashboard').then((response) => {
      if (response.status === 200) {
        setStatisticsData(response.data.Data);
        const points = response.data.Data.enroledStreamsDetails.map((point) => ({
          type: 'Feature',
          properties: { cluster: false, rv_id: point.rv_id, label: point.location_name },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(point.long), parseFloat(point.lat)]
          }
        }));
        setMapsData(points);
        setSelectedCamera(
          response?.data?.Data?.defaultWatchStream?.cameras
            ? response?.data?.Data?.defaultWatchStream?.cameras
            : {}
        );
        setDefaultWatchStream(response?.data?.Data?.defaultWatchStream ?? {});
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
  }, []);
  const AccessColumns = ['Children', 'Room'];
  const topViewersColumns = ['Viewers', 'Views'];
  const lastHourViewersColumns = ['Viewers', 'Children', 'Room'];
  return (
    <>
      <Box className="dashboard">
        <Loader loading={isLoading} />
        <Grid container rowSpacing={1} columnSpacing={{ xs: 3 }} className="dashboard-analytics">
          <Grid item xs={12} sm={12} md={4} lg={3.5}>
            <Card>
              <CardContent className="p-10">
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography className="count">
                    {statisticsData?.enrolledStreams !== undefined
                      ? statisticsData?.enrolledStreams
                      : ' '}
                  </Typography>
                  <Stack className="name">
                    <Typography>Registered Cameras</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <StickyHeadTable
              rows={
                statisticsData?.childrenWithEnableDate?.length > 0
                  ? statisticsData?.childrenWithEnableDate
                  : []
              }
              columns={AccessColumns}
              title={'Gaining Access This Week'}
              topViewers={false}
              pagination={false}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={3.5}>
            <Card>
              <CardContent>
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography className="count">
                    {statisticsData?.activeStreams !== undefined
                      ? statisticsData?.activeStreams
                      : ' '}
                  </Typography>
                  <Stack className="name">
                    <Typography>Currently Watched Cameras</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <StickyHeadTable
              rows={
                statisticsData?.childrenWithDisableDate?.length > 0
                  ? statisticsData?.childrenWithDisableDate
                  : []
              }
              columns={AccessColumns}
              title={'Loosing Access This Week'}
              topViewers={false}
              pagination={false}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={5}>
            <Card className="watch-stream-card">
              <Grid container justifyContent={'space-between'} alignContent={'center'}>
                <Typography>Watch Stream</Typography>
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
              {_.isEmpty(selectedCamera) ? (
                <Stack height={'85%'} spacing={1} alignItems="center" justifyContent="center">
                  <img src={VideoOff} />
                  <Typography>Camera not selected</Typography>
                </Stack>
              ) : (
                <ReactPlayer
                  url={
                    !_.isEmpty(selectedCamera)
                      ? `${authCtx.user.transcoderBaseUrl}${selectedCamera.stream_uri}`
                      : ``
                  }
                  controls={true}
                  className="watch-stream"
                  stopOnUnmount={true}
                  config={{
                    file: {
                      hlsOptions: {
                        forceHLS: true,
                        debug: false,
                        xhrSetup: function (xhr) {
                          xhr.setRequestHeader('Authorization', `Bearer ${authCtx.token}`);
                        }
                      }
                    }
                  }}
                />
              )}
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item md={8} sm={12} xs={12}>
            <StickyHeadTable
              rows={
                statisticsData?.enroledStreamsDetails?.length > 0 &&
                statisticsData?.enroledStreamsDetails?.some((it) => !_.isNil(it?.family))
                  ? statisticsData?.enroledStreamsDetails
                  : []
              }
              columns={lastHourViewersColumns}
              title={'Viewers In The Last Hour'}
              topViewers={false}
              pagination={true}
            />
          </Grid>
          <Grid item md={4} sm={12} xs={12}>
            <StickyHeadTable
              rows={
                statisticsData?.topViewers?.length > 0 &&
                statisticsData?.topViewers?.some((it) => !_.isNil(it?.family))
                  ? statisticsData?.topViewers
                  : []
              }
              columns={topViewersColumns}
              title={'Top 5 Viewers Last 7 Days'}
              topViewers={true}
              pagination={false}
            />
          </Grid>
        </Grid>
        <Box mt={4} className="location">
          <Card>
            <CardContent>
              <Typography>Location of Recent Viewers</Typography>
              <Map data={mapsData} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
