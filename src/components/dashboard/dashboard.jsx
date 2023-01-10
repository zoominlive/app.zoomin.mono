import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  TableRow,
  TableHead,
  TableContainer,
  TableCell,
  TableBody,
  Table,
  TablePagination,
  // Menu,
  // MenuItem,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  IconButton,
  useMediaQuery
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
import ReactPlayer from 'react-player';
import { Video } from 'react-feather';
import _ from 'lodash';
import { useTheme } from '@mui/material/styles';

const Dashboard = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [statisticsData, setStatisticsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [mapsData, setMapsData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPayload, setUsersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All'
  });
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  // const [cameraOptions, setCameraOptions] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState({});
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [locations] = useState([]);
  const [selectedLocation] = useState('');
  const [selectedRoom] = useState([]);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (camera) => {
    setSelectedCamera(camera);
    console.log(selectedCamera);
    setAnchorEl(null);
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
        setTotalUsers(
          response.data.Data.enroledStreamsDetails
            ? response.data.Data.enroledStreamsDetails.length
            : 0
        );
        setMapsData(points);
        // setCameraOptions(
        //   response.data.Data.cameraDetails && response.data.Data.cameraDetails.length > 0
        //     ? response.data.Data.cameraDetails
        //     : []
        // );
        console.log(response.data.Data.cameraDetails);
        setSelectedCamera(response.data.Data.cameraDetails[0]);
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
  const handlePageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };
  return (
    <Box className="dashboard">
      <Loader loading={isLoading} />
      <Grid container rowSpacing={1} columnSpacing={{ xs: 3 }} className="dashboard-analytics">
        <Grid item xs={12} sm={4} md={4} lg={3.5}>
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
          <TableContainer component={Card}>
            <Table className="table-column">
              <TableHead>
                <TableRow>
                  <Typography>Gaining Access This Week</Typography>
                </TableRow>
                <TableRow>
                  <TableCell>Children</TableCell>
                  <TableCell>Room</TableCell>
                </TableRow>
              </TableHead>
            </Table>
            <div
              className={`table-content ${
                statisticsData.childrenWithEnableDate &&
                statisticsData.childrenWithEnableDate.length == 0
                  ? 'empty-data'
                  : ''
              }`}>
              <Table>
                <TableBody>
                  {statisticsData.childrenWithEnableDate &&
                  statisticsData.childrenWithEnableDate.length > 0 ? (
                    statisticsData.childrenWithEnableDate.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>{row.childFirstName + row.childLastName}</TableCell>
                        <TableCell>{row.rooms.toString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <div className="no-data-div">No Data Found</div>
                  )}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        </Grid>
        <Grid item xs={12} sm={4} md={4} lg={3.5}>
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
          <TableContainer component={Card}>
            <Typography>Losing Access This Week</Typography>
            <Table className="table-column">
              <TableHead>
                <TableRow>
                  <TableCell>Children</TableCell>
                  <TableCell>Room</TableCell>
                </TableRow>
              </TableHead>
            </Table>
            <div
              className={`table-content ${
                statisticsData.childrenWithDisableDate &&
                statisticsData.childrenWithDisableDate.length === 0
                  ? 'empty-data'
                  : ''
              }`}>
              <Table>
                <TableBody>
                  {statisticsData.childrenWithDisableDate &&
                  statisticsData.childrenWithDisableDate.length > 0 ? (
                    statisticsData.childrenWithDisableDate.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.childFirstName + row.childLastName}</TableCell>
                        <TableCell>{row.rooms.toString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <div className="no-data-div">No Data Found</div>
                  )}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        </Grid>
        <Grid item xs={12} sm={4} md={3} lg={5}>
          <Card className="watch-stream-card">
            <Grid container justifyContent={'space-between'} alignContent={'center'}>
              <Typography>Watch Stream</Typography>
              <IconButton
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}>
                <Video />
              </IconButton>

              {/* <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button'
                }}>
                {cameraOptions.map((camera) => (
                  <MenuItem key={camera.cam_id} onClick={() => handleClose(camera)}>
                    {camera.cam_name}
                  </MenuItem>
                ))}
              </Menu> */}
              <Dialog
                anchorEl={anchorEl}
                fullScreen={fullScreen}
                open={open}
                onClose={handleClose}
                aria-labelledby="responsive-dialog-title">
                <DialogTitle id="responsive-dialog-title">
                  {"Use Google's location service?"}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {/* Let Google help apps determine location. This means sending anonymous location
                    data to Google, even when no apps are running. */}
                    <Grid container spacing={2}>
              <Grid item md={3} sm={12}>
                <Autocomplete
                  multiple
                  limitTags={1}
                  id="tags-standard"
                  options={locations?.length !== 0 ? locations : []}
                  value={selectedLocation ? selectedLocation : []}
                  getOptionLabel={(option) => option}
                  onChange={(_, value, reason, option) => {
                    handleSetLocations(_, value, reason, option);
                  }}
                  renderTags={(value, getTagProps) =>
                    value?.map((option, index) => (
                      <Chip key={index} label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={allLocationChecked ? allLocationChecked : selected}
                      />
                      {option}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="location"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {dropdownLoading ? (
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
              <Grid item md={3} sm={12}>
                <Autocomplete
                  multiple
                  limitTags={1}
                  id="tags-standard"
                  options={rooms ? rooms : []}
                  value={selectedRoom?.length !== 0 ? selectedRoom : []}
                  getOptionLabel={(option) => option?.room_name}
                  isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                  onChange={(_, value, reason, option) => {
                    handleSetRooms(_, value, reason, option);
                  }}
                  renderTags={(value, getTagProps) =>
                    value?.map((option, index) => (
                      <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
                    ))
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={allRoomChecked ? allRoomChecked : selected}
                      />
                      {option?.room_name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="room"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {dropdownLoading ? (
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
              <Grid item md={4.7} sm={20}>
                <Autocomplete
                  multiple
                  limitTags={1}
                  disableCloseOnSelect
                  id="tags-standard"
                  options={cameras ? cameras : []}
                  value={selectedCameras?.length !== 0 ? selectedCameras : []}
                  getOptionLabel={(option) => option?.cam_name}
                  isOptionEqualToValue={(option, value) => option?.cam_id === value?.cam_id}
                  onChange={(_, values, situation, option) => {
                    handleChangeCameras(_, values, situation, option);
                  }}
                  renderTags={(value, getTagProps) =>
                    value?.map((option, index) => (
                      <Chip
                        key={index}
                        label={
                          option?.cam_name == 'Select All'
                            ? option?.cam_name
                            : option?.location + '/' + option?.room_name + ' - ' + option?.cam_name
                        }
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={allCamsChecked ? allCamsChecked : selected}
                      />
                      {option?.cam_name == 'Select All'
                        ? option?.cam_name
                        : option.location + '/' + option.room_name + ' - ' + option?.cam_name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cameras"
                      fullWidth
                      helperText={
                        limitReached &&
                        `Maxmimum ${
                          authCtx.user.role === 'Admin' ? 'sixteen' : 'two'
                        } cameras can be selected`
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {dropdownLoading ? (
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
              <Grid item md={1.2} sm={12} sx={{ marginTop: '6px' }}>
                <Button
                  className="add-btn"
                  variant="contained"
                  startIcon={<Play />}
                  onClick={() => setSubmitted(true)}>
                  {' '}
                  Play
                </Button>
              </Grid>
            </Grid>
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button autoFocus onClick={handleClose}>
                    Disagree
                  </Button>
                  <Button onClick={handleClose} autoFocus>
                    Agree
                  </Button>
                </DialogActions>
              </Dialog>
            </Grid>
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
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TableContainer component={Card}>
            <Typography>Viewers In The Last Hour</Typography>
            <Table className="table-column viewers-in-last-hours-columns">
              <TableHead>
                <TableRow>
                  <TableCell>Viewers</TableCell>
                  <TableCell>Children</TableCell>
                  <TableCell>Room</TableCell>
                </TableRow>
              </TableHead>
            </Table>
            <div
              className={`table-content viewers-in-last-hours-content ${
                (statisticsData.enroledStreamsDetails &&
                  statisticsData.enroledStreamsDetails.length == 0) ||
                (statisticsData.enroledStreamsDetails &&
                  statisticsData.enroledStreamsDetails.length > 0 &&
                  !statisticsData.enroledStreamsDetails.some((it) => !_.isNil(it.family)))
                  ? 'empty-data'
                  : ''
              }`}>
              <Table>
                <TableBody>
                  {statisticsData.enroledStreamsDetails &&
                  statisticsData.enroledStreamsDetails.length > 0 &&
                  statisticsData.enroledStreamsDetails.some((it) => !_.isNil(it.family)) ? (
                    statisticsData.enroledStreamsDetails.map((row, index) => (
                      <>
                        {row.family ? (
                          <TableRow key={index}>
                            <TableCell>{row.family.first_name + row.family.last_name}</TableCell>
                            <TableCell>
                              {row.family.children.length > 0
                                ? row.family.children.map((child) => child.first_name + ', ')
                                : ''}
                            </TableCell>
                            <TableCell>
                              {row.family.children.roomsInChild &&
                              row.family.children.roomsInChild.length > 0
                                ? row.family.children.roomsInChild.map((room) => room.name + `,`)
                                : ''}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </>
                    ))
                  ) : (
                    <div className="no-data-div">No Data Found</div>
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              {statisticsData.enroledStreamsDetails &&
              statisticsData.enroledStreamsDetails.length > 0 &&
              statisticsData.enroledStreamsDetails.some((it) => !_.isNil(it.family)) ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalUsers}
                  rowsPerPage={usersPayload?.pageSize}
                  page={usersPayload?.pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </div>
          </TableContainer>
        </Grid>
        <Grid item xs={4}>
          <TableContainer component={Card}>
            <Typography>Top 5 Viewers Last 7 Days</Typography>
            <Table className="table-column">
              <TableHead>
                <TableRow>
                  <TableCell>Children</TableCell>
                  <TableCell>Views</TableCell>
                </TableRow>
              </TableHead>
            </Table>

            <div
              className={`table-content ${
                statisticsData.topViewers && statisticsData.topViewers.length == 0
                  ? 'empty-data'
                  : ''
              }${
                statisticsData.enroledStreamsDetails &&
                statisticsData.enroledStreamsDetails.length > 0 &&
                statisticsData.enroledStreamsDetails.some((it) => !_.isNil(it.family))
                  ? 'top-reviewers'
                  : ''
              }`}>
              <Table>
                <TableBody>
                  {statisticsData.topViewers && statisticsData.topViewers.length > 0 ? (
                    statisticsData.topViewers.map((row, index) =>
                      row.user ? (
                        <TableRow
                          key={index}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            {row.user ? row.user.first_name + row.user.last_name : ''}
                          </TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ) : null
                    )
                  ) : (
                    <div className="no-data-div">No Data Found</div>
                  )}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
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
