import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
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

const Dashboard = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [mapsData, setMapsData] = useState([]);

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
  }, []);

  return (
    <Box className="dashboard">
      <Loader loading={isLoading} />
      <Grid container rowSpacing={1} columnSpacing={{ xs: 3 }} className="dashboard-analytics">
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent className="p-16">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">
                  {statisticsData?.activeStreams !== undefined
                    ? statisticsData?.activeStreams
                    : 'N/A'}
                </Typography>
                <Stack className="name">
                  <Typography>Active</Typography>
                  <Typography>Streams</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">
                  {statisticsData?.recentViewers !== undefined
                    ? statisticsData?.recentViewers
                    : 'N/A'}
                </Typography>
                <Stack className="name">
                  <Typography>Recent</Typography>
                  <Typography>Viewers</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">
                  {statisticsData?.enrolledStreams !== undefined
                    ? statisticsData?.enrolledStreams
                    : 'N/A'}
                </Typography>
                <Stack className="name">
                  <Typography>Enrolled</Typography>
                  <Typography>Streams</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">
                  {statisticsData?.SEAMembers !== undefined ? statisticsData?.SEAMembers : 'N/A'}
                </Typography>
                <Stack className="name">
                  <Typography>Scheduled To</Typography>
                  <Typography>End Access</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
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
  );
};

export default Dashboard;
