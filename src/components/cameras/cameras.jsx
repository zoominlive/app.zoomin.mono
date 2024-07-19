import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import CameraForm from './cameraform';
import CameraActions from './cameraactions';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
// import Loader from '../common/loader';
import debounce from 'lodash.debounce';
// import DeleteCamDialog from './deletecamdialog';
import NoDataDiv from '../common/nodatadiv';
import SearchIcon from '@mui/icons-material/Search';
// import NewDeleteDialog from '../common/newdeletedialog';
import DeleteCamDialog from './deletecamdialog';
import LinerLoader from '../common/linearLoader';
import FixIssueDialog from './fixissuedialog';
const Cameras = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isCameraFormDialogOpen, setIsCameraFormDialogOpen] = useState(false);
  const [isFixIssueDialogOpen, setIsFixIssueDialogOpen] = useState(false);
  const [isCameraDeleteDialogOpen, setIsCameraDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [camerasList, setCamerasList] = useState([]);
  const [totalCameras, setTotalCameras] = useState(0);
  const [camera, setCamera] = useState();

  const [camerasPayload, setCamerasPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id')
  });

  useEffect(() => {
    layoutCtx.setActive(6);
    layoutCtx.setBreadcrumb(['Cameras', 'Manage rooms and their camera authorization']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
  });

  useEffect(() => {
    getCamerasList();
  }, [camerasPayload]);

  // Method to fetch user list for table
  const getCamerasList = () => {
    setIsLoading(true);
    API.get('cams/', { params: camerasPayload }).then((response) => {
      if (response.status === 200) {
        setCamerasList(response.data.Data.cams);
        setTotalCameras(response.data.Data.count);
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

  // Method to delete camera
  const handleCameraDelete = (wait = false) => {
    setDeleteLoading(true);
    API.delete('cams/delete', {
      data: {
        cam_id: camera.cam_id,
        wait: wait,
        streamId: camera.stream_uuid,
        location: camera.location
      }
    }).then((response) => {
      if (response.status === 200) {
        getCamerasList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setCamera();
      setDeleteLoading(false);
      setIsCameraDeleteDialogOpen(false);
    });
  };

  // Method to fix camera
  const handleCameraFix = (wait = false) => {
    console.log('camera-->', camera);
    setDeleteLoading(true);
    API.post('cams/fix-camera', {
      cam_uri: camera.cam_uri,
      cam_id: camera.cam_id,
      wait: wait,
      streamId: camera.stream_uuid,
      location: camera.location,
      on_screen_display: camera?.privacy_areas
    }).then((response) => {
      if (response.status === 200) {
        getCamerasList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setCamera();
      setDeleteLoading(false);
      setIsFixIssueDialogOpen(false);
    });
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setCamerasPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setCamerasPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setCamerasPayload((prevPayload) => ({ ...prevPayload, location: event.target.value }));
  };

  // Calls the search handler after 500ms
  const debouncedResults = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  return (
    <Box className="listing-wrapper">
      <Card className="filter">
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={8} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={5} sm={12}>
                      <InputLabel id="search">Search</InputLabel>
                      <TextField
                        labelId="search"
                        placeholder="Camera Name, Description"
                        onChange={debouncedResults}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item md={3} sm={12}>
                      <InputLabel id="location">Location</InputLabel>
                      <FormControl fullWidth className="location-select">
                        <Select
                          labelId="location"
                          id="location"
                          value={camerasPayload?.location}
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
                  </Grid>
                </Box>
              </Grid>
              <Grid
                item
                md={4}
                sm={12}
                sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Box>
                  <Button
                    className="add-button"
                    variant="contained"
                    startIcon={<Plus />}
                    onClick={() => setIsCameraFormDialogOpen(true)}>
                    {' '}
                    Add Camera
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
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
                    <TableCell style={{ minWidth: '100px' }}>Camera</TableCell>
                    <TableCell style={{ minWidth: '100px' }} align="left">
                      Location
                    </TableCell>
                    <TableCell align="left">Description</TableCell>
                    <TableCell align="left">URL</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {camerasList?.length > 0
                    ? camerasList?.map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              <Typography>{`${row.cam_name.toUpperCase()}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">
                            <Stack direction="row">
                              <Chip
                                key={index}
                                label={row.location}
                                color="primary"
                                className="chip-color"
                              />
                            </Stack>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              <Typography>{`${row.description}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              {/* <Typography>{`${row.cam_uri}`}</Typography> */}

                              <Typography>{`${row.cam_uri.replace(
                                row.cam_uri.substring(
                                  row.cam_uri.indexOf('//') + 2,
                                  row.cam_uri.indexOf('@')
                                ),
                                '************'
                              )}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <CameraActions
                              camera={row}
                              setCamera={setCamera}
                              setIsDeleteDialogOpen={(e) => {
                                setIsCameraDeleteDialogOpen(e);
                              }}
                              setIsCameraFormDialogOpen={setIsCameraFormDialogOpen}
                              setIsFixIssueDialogOpen={(e) => {
                                setIsFixIssueDialogOpen(e);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
              {!isLoading && camerasList?.length == 0 ? <NoDataDiv /> : null}
              {camerasList?.length > 0 ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalCameras}
                  rowsPerPage={camerasPayload?.pageSize}
                  page={camerasPayload?.pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {isCameraFormDialogOpen && (
        <CameraForm
          open={isCameraFormDialogOpen}
          setOpen={setIsCameraFormDialogOpen}
          camera={camera}
          setCamera={setCamera}
          getCamerasList={getCamerasList}
        />
      )}

      <DeleteCamDialog
        open={isCameraDeleteDialogOpen}
        loading={deleteLoading}
        handleDialogClose={() => {
          setCamera();
          setIsCameraDeleteDialogOpen(false);
        }}
        handleCamDelete={(e) => handleCameraDelete(e)}></DeleteCamDialog>
      <FixIssueDialog
        open={isFixIssueDialogOpen}
        loading={deleteLoading}
        handleDialogClose={() => {
          setCamera();
          setIsFixIssueDialogOpen(false);
        }}
        handleCameraFix={(e) => handleCameraFix(e)}></FixIssueDialog>

      {/* <NewDeleteDialog
        open={isCameraDeleteDialogOpen}
        title="Delete Camera"
        contentText="Wait until no one is watching the stream before removing."
        loading={deleteLoading}
        handleDialogClose={() => {
          setCamera();
          setIsCameraDeleteDialogOpen(false);
        }}
        handleDelete={(e) => handleCameraDelete(e)}
      /> */}
    </Box>
  );
};

export default Cameras;
