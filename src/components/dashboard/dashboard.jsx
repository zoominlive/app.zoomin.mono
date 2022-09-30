import { Box, Card, CardContent, CardMedia, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import map from '../../assets/map.svg';
import LayoutContext from '../../context/layoutcontext';

const Dashboard = () => {
  const layoutCtx = useContext(LayoutContext);

  useEffect(() => {
    layoutCtx.setActive(0);
    layoutCtx.setBreadcrumb(['Welcome back, John', 'Monday, 29 April 2022']);
  }, []);

  return (
    <Box className="dashboard">
      <Grid container rowSpacing={1} columnSpacing={{ xs: 3 }} className="dashboard-analytics">
        <Grid item sm={6} md={6} lg={3}>
          <Card>
            <CardContent className="p-16">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">06</Typography>
                <Stack className="name">
                  <Typography>Active</Typography>
                  <Typography>Streams</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">12</Typography>
                <Stack className="name">
                  <Typography>Current</Typography>
                  <Typography>Viewers</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">04</Typography>
                <Stack className="name">
                  <Typography>Enrolled </Typography>
                  <Typography>Streams</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item sm={6} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="count">12</Typography>
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
            <Typography>Location of Active Viewers</Typography>
            <CardMedia component="img" src={map} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
