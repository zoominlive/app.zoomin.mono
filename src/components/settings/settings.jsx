import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField
} from '@mui/material';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import React, { useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import SettingsForm from './settingsform';
import SettingsActions from './settingsactions';
// import DeleteDialog from '../common/deletedialog';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
// import Loader from '../common/loader';
import debounce from 'lodash.debounce';
import NoDataDiv from '../common/nodatadiv';
import SearchIcon from '@mui/icons-material/Search';
import NewDeleteDialog from '../common/newdeletedialog';
import LinerLoader from '../common/linearLoader';
// import SchedulerDialog from '../families/scheduler';
import DefaultScheduler from '../families/defaultScheduler';

const Settings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [locationsList, setLocationsList] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [customerDetails, setCustomerDetails] = useState(null);
  const [totalLocations, setTotalLocations] = useState(0);
  const [location, setLocation] = useState();
  const [activeLocations, setActiveLocations] = useState(0);
  const [usersPayload, setUsersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    cust_id: localStorage.getItem('cust_id')
  });
  const [value, setValue] = useState('1');
  const [timer, setTimer] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  // console.log('authCTX==>', authCtx);
  useEffect(() => {
    layoutCtx.setActive(null);
    layoutCtx.setBreadcrumb(['Settings', 'Manage Settings']);
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
    getLocationsList();
  }, [usersPayload]);

  useEffect(() => {
    getDefaultScheduleSettings();
  }, []);

  // Method to fetch location list for table
  const getLocationsList = () => {
    setIsLoading(true);
    API.get('customers/all/locations', { params: usersPayload }).then((response) => {
      if (response.status === 200) {
        setLocationsList(response.data.Data.locations);
        setTotalLocations(response.data.Data.count);
        setCustomerDetails(response.data.Data.customer);
        setActiveLocations(response.data.Data.activeLocations);
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

  // Method to fetch Default Settings for Schedule
  const getDefaultScheduleSettings = () => {
    setIsLoading(true);
    API.get('family/child/schedule', {
      params: {
        cust_id: authCtx.user.cust_id || localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        console.log('res', response.data);
        setTimer(response.data.Data.schedule.timeRange);
        setSelectedDays(response.data.Data.schedule.timeRange[0][1]);
        // setLocationsList(response.data.Data.locations);
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

  // Method to delete location
  const handleLocationDelete = () => {
    setDeleteLoading(true);
    // console.log('location==>', location);
    let payload = {
      loc_id: location.loc_id
    };
    API.delete('customers/deleteCustomerLocation', {
      data: { ...payload }
    }).then((response) => {
      if (response.status === 200) {
        getLocationsList();
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
      setLocation();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to change the page in table
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

  // Method to handle Search for table
  const handleSearch = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  // Calls the search handler after 500ms
  const debouncedResults = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab
              sx={{ textTransform: 'none', fontSize: '16px' }}
              label="Customer Profile"
              value="1"
            />
            <Tab sx={{ textTransform: 'none', fontSize: '16px' }} label="Locations" value="2" />
            <Tab sx={{ textTransform: 'none', fontSize: '16px' }} label="Cameras" value="3" />
          </TabList>
        </Box>
        <TabPanel value="2">
          <Box className="listing-wrapper">
            <Card className="filter">
              <CardContent>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={9} sm={12}>
                      <Box>
                        <Grid container spacing={2}>
                          <Grid item md={4} sm={12}>
                            <InputLabel id="search">Search</InputLabel>
                            <TextField
                              labelId="search"
                              placeholder="Location"
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
                        </Grid>
                      </Box>
                    </Grid>
                    <Grid
                      item
                      md={3}
                      sm={12}
                      sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Box>
                        <Button
                          className="add-button"
                          variant="contained"
                          startIcon={<Plus />}
                          onClick={() => setIsUserFormDialogOpen(true)}>
                          {' '}
                          Add Location
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
                          <TableCell style={{ minWidth: '100px' }} align="left">
                            Location
                          </TableCell>
                          <TableCell align="left">Status</TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {locationsList?.length > 0
                          ? locationsList?.map((row, index) => (
                              <TableRow key={index} hover>
                                <TableCell align="left">
                                  <Stack direction="row">
                                    <Chip
                                      key={index}
                                      label={row.loc_name}
                                      color="primary"
                                      className="chip-color"
                                    />
                                  </Stack>
                                </TableCell>
                                <TableCell align="left">
                                  {row.status ? 'Active' : 'Inactive'}
                                </TableCell>
                                <TableCell align="right">
                                  <SettingsActions
                                    location={row}
                                    setLocation={setLocation}
                                    setIsUserFormDialogOpen={setIsUserFormDialogOpen}
                                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          : null}
                      </TableBody>
                    </Table>
                    {!isLoading && locationsList?.length == 0 ? <NoDataDiv /> : null}
                    {locationsList?.length > 0 ? (
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 25, 50]}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        component="div"
                        count={totalLocations}
                        rowsPerPage={usersPayload?.pageSize}
                        page={usersPayload?.pageNumber}
                        sx={{ flex: '1 1 auto' }}
                      />
                    ) : null}
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
            {isUserFormDialogOpen && (
              <SettingsForm
                open={isUserFormDialogOpen}
                location={location}
                locationsList={locationsList}
                customer={customerDetails}
                activeLocations={activeLocations}
                setOpen={setIsUserFormDialogOpen}
                getLocationsList={getLocationsList}
                setLocation={setLocation}
              />
            )}
            {/* <DeleteDialog
              open={isDeleteDialogOpen}
              title="Delete User"
              contentText={'Are you sure you want to delete this location?'}
              loading={deleteLoading}
              handleDialogClose={() => {
                setLocation();
                setIsDeleteDialogOpen(false);
              }}
              handleDelete={handleLocationDelete}
            /> */}

            <NewDeleteDialog
              open={isDeleteDialogOpen}
              title="Delete location"
              contentText="Are you sure you want to delete this location?"
              loading={deleteLoading}
              handleDialogClose={() => {
                setLocation();
                setIsDeleteDialogOpen(false);
              }}
              handleDelete={handleLocationDelete}
            />
          </Box>
        </TabPanel>
        <TabPanel value="3">
          <DefaultScheduler
            // settings={true}
            custId={authCtx.user.cust_id || localStorage.getItem('cust_id')}
            timer={timer}
            selectedDays={selectedDays}
            getDefaultScheduleSettings={getDefaultScheduleSettings}
          />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default Settings;
