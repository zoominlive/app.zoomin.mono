import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
  Checkbox,
  Button
} from '@mui/material';
import { CSVLink } from 'react-csv';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import Loader from '../common/loader';
import moment from 'moment';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LoadingButton from '@mui/lab/LoadingButton';
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const Logs = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [logsList, setLogsList] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedType, setSelectedType] = useState('Access Log');
  const [selectedFunction, setSelectedFunction] = useState(['Watch_Stream']);
  const [fromDate, setFromDate] = useState(moment().subtract(7, 'days'));
  const [toDate, setToDate] = useState(moment());
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(process.env.REACT_APP_PAGINATION_LIMIT);
  const [users, setUsers] = useState([
    { user_id: 'Select All', first_name: 'Select', last_name: 'All' }
  ]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsersSelected, setAllUsersSelected] = useState(false);
  const [families, setFamilies] = useState([
    { family_member_id: 'Select All', first_name: 'Select', last_name: 'All' }
  ]);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [allFamiliesSelected, setAllFamiliesSelected] = useState(false);
  const [responseData, setResponseData] = useState();
  const [csvGenerated, setcsvGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [allLocationChecked, setAllLocationChecked] = useState(false);
  const [allFunctionChecked, setAllFunctionChecked] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const [logsPayload, setLogsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    from: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
    type: 'Access Log',
    functions: ['Watch_Stream'],
    users: [],
    locations: [],
    familyMemberIds: []
  });
  const [isDatePickerOpen1, setIsDatePickerOpen1] = useState(false);
  const [isDatePickerOpen2, setIsDatePickerOpen2] = useState(false);
  const types = ['Access Log', 'Change Log'];
  const functions = [
    'Select All',
    'Watch_Stream',
    'Primary_Family',
    'Second_Family',
    'Child',
    'Room',
    'Camera',
    'Users',
    'Profile_Photo',
    'User_Change_Email',
    'User_Forgot_Password',
    'User_Change_Password',
    'User_Reg_Accout'
  ];

  useEffect(() => {
    layoutCtx.setActive(8);
    layoutCtx.setBreadcrumb(['Logs']);
    if (authCtx?.user?.location?.accessable_locations) {
      API.get('users/location/', {
        params: { locations: [authCtx.user.location.accessable_locations[0]] }
      }).then((response) => {
        if (response.status === 200) {
          let userToAdd = response.data.Data?.map((user) => user?.user_id);
          setSelectedUsers(response.data.Data);
          setUsers([users[0], ...response.data.Data]);
          API.get('family/location/', {
            params: { locations: [authCtx.user.location.accessable_locations[0]] }
          }).then((response) => {
            if (response.status === 200) {
              let familyToAdd = response.data.Data?.map((user) => user?.family_member_id);
              setSelectedFamilies(response.data.Data);
              setFamilies([families[0], ...response.data.Data]);

              API.get('logs/', {
                params: {
                  ...logsPayload,
                  locations: [authCtx.user.location.accessable_locations[0]],
                  users: userToAdd,
                  familyMemberIds: familyToAdd
                }
              }).then((response) => {
                if (response.status === 200) {
                  setResponseData(response.data.Data.logs);
                  setcsvGenerated(false);
                  setLogsList(response.data.Data.logs);
                  setTotalLogs(response.data.Data.count);
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
    }
    // eslint-disable-next-line no-unsafe-optional-chaining
    setLocations(['Select All', ...authCtx?.user?.location?.accessable_locations]);
    setSelectedLocation([authCtx?.user?.location?.accessable_locations[0]]);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    let userIds = selectedUsers?.map((user) => user.user_id);
    let FamilyMemberIds = selectedFamilies?.map((user) => user.family_member_id);
    setLogsPayload({
      ...logsPayload,
      from: moment(fromDate).format('YYYY-MM-DD'),
      to: moment(toDate).format('YYYY-MM-DD'),
      type: selectedType,
      functions: selectedFunction,
      users: userIds,
      locations: selectedLocation,
      familyMemberIds: FamilyMemberIds
    });
  }, [
    selectedLocation,
    fromDate,
    toDate,
    selectedType,
    selectedFunction,
    selectedUsers,
    selectedFamilies
  ]);

  useEffect(() => {
    setLogsPayload({ ...logsPayload, pageNumber: pageNumber, pageSize: pageSize });
    if (pageReady) {
      getLogsList();
    } else {
      setPageReady(true);
    }
  }, [pageNumber, pageSize]);

  useEffect(() => {
    if (selectedLocation?.length !== 0) {
      API.get('users/location/', {
        params: { locations: selectedLocation }
      }).then((response) => {
        if (response.status === 200) {
          setSelectedUsers(response.data.Data);
          setUsers([users[0], ...response.data.Data]);
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

      API.get('family/location/', {
        params: { locations: selectedLocation }
      }).then((response) => {
        if (response.status === 200) {
          setSelectedFamilies(response.data.Data);
          setFamilies([families[0], ...response.data.Data]);
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
    }
  }, [selectedLocation]);

  //   Method to fetch user list for table
  const getLogsList = () => {
    if (
      selectedFamilies?.length == 0 ||
      selectedFunction?.length == 0 ||
      selectedLocation?.length == 0 ||
      selectedUsers?.length == 0
    ) {
      errorMessageHandler(enqueueSnackbar, 'Please Select All the filters');
    } else {
      setIsLoading(true);
      API.get('logs/', {
        params: { ...logsPayload, pageNumber, pageSize }
      }).then((response) => {
        if (response.status === 200) {
          setResponseData(response.data.Data.logs);
          setcsvGenerated(false);
          setLogsList(response.data.Data.logs);
          setTotalLogs(response.data.Data.count);
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
    }
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setPageNumber(newPage);
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setPageNumber(0);
    setPageSize(event.target.value);
  };

  //   Method to handle location change for table
  const handleLocationChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option == 'Select All' && !allLocationChecked) {
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (option?.option == 'Select All' && reason === 'removeOption') {
      setSelectedLocation([]);
      setAllLocationChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option == 'Select All' &&
      allLocationChecked == true
    ) {
      setAllLocationChecked(false);
      setSelectedLocation([]);
    } else {
      setAllLocationChecked(false);
      setSelectedLocation(value);
    }
  };

  const handleFunctionChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option == 'Select All' && !allFunctionChecked) {
      setSelectedFunction(reason === 'selectOption' ? functions.slice(1, functions.length) : []);
      setAllFunctionChecked(true);
    } else if (option?.option == 'Select All' && reason === 'removeOption') {
      setSelectedFunction([]);
      setAllFunctionChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option == 'Select All' &&
      allFunctionChecked == true
    ) {
      setAllFunctionChecked(false);
      setSelectedFunction([]);
    } else {
      setAllFunctionChecked(false);
      setSelectedFunction(value);
    }
  };

  const handleUserChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option?.user_id == 'Select All' && !allUsersSelected) {
      setSelectedUsers(reason === 'selectOption' ? users.slice(1, users.length) : []);
      setAllUsersSelected(true);
    } else if (option?.option?.user_id == 'Select All' && reason === 'removeOption') {
      setSelectedUsers([]);
      setAllUsersSelected(false);
    } else if (
      reason === 'selectOption' &&
      option?.option?.user_id == 'Select All' &&
      allUsersSelected == true
    ) {
      setAllUsersSelected(false);
      setSelectedUsers([]);
    } else {
      setAllUsersSelected(false);
      setSelectedUsers(value);
    }
  };

  const handleFamilyChange = (_, value, reason, option) => {
    if (
      reason == 'selectOption' &&
      option?.option?.family_member_id == 'Select All' &&
      !allFamiliesSelected
    ) {
      setSelectedFamilies(reason === 'selectOption' ? families.slice(1, families.length) : []);
      setAllFamiliesSelected(true);
    } else if (option?.option?.family_member_id == 'Select All' && reason === 'removeOption') {
      setSelectedFamilies([]);
      setAllFamiliesSelected(false);
    } else if (
      reason === 'selectOption' &&
      option?.option?.family_member_id == 'Select All' &&
      allFamiliesSelected == true
    ) {
      setAllFamiliesSelected(false);
      setSelectedFamilies([]);
    } else {
      setAllFamiliesSelected(false);
      setSelectedFamilies(value);
    }
  };

  const fetchAllLogsToGenerateCSV = async () => {
    setLoading(true);
    let response = await API.get('logs/', {
      params: {
        ...logsPayload,
        pageNumber: 0,
        pageSize: totalLogs
      }
    });
    setcsvGenerated(true);
    setLoading(false);
    if (response.status === 200) {
      let formattedResponse = response.data.Data.logs.map((log) => {
        return { ...log, user: log.user.first_name + ' ' + log.user.last_name };
      });
      setResponseData(formattedResponse);

      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      {' '}
      <Box className="listing-wrapper">
        <Card>
          <CardContent>
            <Box>
              <Grid container spacing={2}>
                <Grid item md={18} sm={16}>
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item md={3} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                          <DesktopDatePicker
                            open={isDatePickerOpen1}
                            maxDate={moment()}
                            label="From"
                            autoOk={true}
                            value={fromDate}
                            inputFormat="MM/DD/YYYY"
                            onClose={() => setIsDatePickerOpen1(false)}
                            renderInput={(params) => (
                              <TextField onClick={() => setIsDatePickerOpen1(true)} {...params} />
                            )}
                            components={{
                              OpenPickerIcon: !isDatePickerOpen1
                                ? ArrowDropDownIcon
                                : ArrowDropUpIcon
                            }}
                            onChange={(value) => {
                              setFromDate(value);
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                          <DesktopDatePicker
                            open={isDatePickerOpen2}
                            maxDate={moment()}
                            label="To"
                            value={toDate}
                            inputFormat="MM/DD/YYYY"
                            onClose={() => setIsDatePickerOpen2(false)}
                            renderInput={(params) => (
                              <TextField onClick={() => setIsDatePickerOpen2(true)} {...params} />
                            )}
                            components={{
                              OpenPickerIcon: !isDatePickerOpen2
                                ? ArrowDropDownIcon
                                : ArrowDropUpIcon
                            }}
                            onChange={(value) => {
                              setToDate(value);
                            }}
                          />
                        </LocalizationProvider>
                        <Grid />
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <Autocomplete
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={
                            authCtx.user.location.accessable_locations?.length !== 0
                              ? locations
                              : []
                          }
                          value={selectedLocation ? selectedLocation : []}
                          getOptionLabel={(option) => option}
                          onChange={(_, value, reason, option) => {
                            handleLocationChange(_, value, reason, option);
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
                              error={selectedLocation?.length == 0 ? true : false}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {/* {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null} */}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <Autocomplete
                          limitTags={1}
                          id="tags-standard"
                          options={types}
                          value={selectedType ? selectedType : []}
                          getOptionLabel={(option) => option}
                          onChange={(_, value) => {
                            setSelectedType(value);
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
                                checked={selected}
                              />
                              {option}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="type"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {/* {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null} */}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                    <Grid></Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Box style={{ marginTop: '20px' }}>
              <Grid container spacing={2}>
                <Grid item md={18} sm={16}>
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item md={3} sm={6}>
                        <Autocomplete
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={functions}
                          value={selectedFunction ? selectedFunction : []}
                          getOptionLabel={(option) => option}
                          onChange={(_, value, reason, option) => {
                            handleFunctionChange(_, value, reason, option);
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
                                checked={allFunctionChecked ? allFunctionChecked : selected}
                              />
                              {option}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="function"
                              fullWidth
                              error={selectedFunction?.length == 0 ? true : false}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {/* {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null} */}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <Autocomplete
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={users}
                          value={selectedUsers ? selectedUsers : []}
                          getOptionLabel={(option) => option?.first_name + ' ' + option?.last_name}
                          onChange={(_, value, reason, option) => {
                            handleUserChange(_, value, reason, option);
                          }}
                          renderTags={(value, getTagProps) =>
                            value?.map((option, index) => (
                              <Chip
                                key={index}
                                label={option?.first_name + ' ' + option?.last_name}
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
                                checked={allUsersSelected ? allUsersSelected : selected}
                              />
                              {option?.first_name + ' ' + option?.last_name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="User name"
                              fullWidth
                              error={selectedUsers?.length == 0 ? true : false}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {/* {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null} */}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <Autocomplete
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={families}
                          value={selectedFamilies ? selectedFamilies : []}
                          getOptionLabel={(option) => option?.first_name + ' ' + option?.last_name}
                          onChange={(_, value, reason, option) => {
                            handleFamilyChange(_, value, reason, option);
                          }}
                          renderTags={(value, getTagProps) =>
                            value?.map((option, index) => (
                              <Chip
                                key={index}
                                label={option.first_name + ' ' + option.last_name}
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
                                checked={allFamiliesSelected ? allFamiliesSelected : selected}
                              />
                              {option.first_name + ' ' + option.last_name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Families"
                              fullWidth
                              error={selectedFamilies?.length == 0 ? true : false}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {/* {dropdownLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null} */}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item md={1.5} sm={6} sx={{ marginTop: '6px' }}>
                        <Button
                          className="add-btn"
                          variant="outlined"
                          onClick={() => getLogsList()}>
                          Submit
                        </Button>
                      </Grid>
                    </Grid>
                    <Grid></Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Box mt={2} position="relative">
              <Loader loading={isLoading} />
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ minWidth: '20px' }}>No</TableCell>
                      <TableCell style={{ minWidth: '100px' }} align="left">
                        Date
                      </TableCell>
                      <TableCell style={{ minWidth: '100px' }} align="left">
                        Time
                      </TableCell>
                      <TableCell align="left">User</TableCell>
                      <TableCell align="left">Function</TableCell>
                      <TableCell align="left">Event</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logsList?.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell component="th" scope="row">
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Typography>{`${
                              logsPayload.pageNumber * logsPayload.pageSize + index + 1
                            }`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="left">
                          <Stack direction="row">
                            <Typography>{`${moment(row.createdAt).format(
                              'MM-DD-YYYY'
                            )}`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="left">
                          <Stack direction="row">
                            <Typography>{`${moment(row.createdAt).format('hh:mm A')}`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Typography>{`${
                              row?.user?.first_name
                                ? row?.user?.first_name + ' ' + row?.user?.last_name
                                : 'Not Found'
                            }`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Typography>{`${row.function}`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Typography>{`${row.function_type}`}</Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalLogs}
                  rowsPerPage={pageSize}
                  page={pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              </TableContainer>
            </Box>
            {!csvGenerated && (
              <LoadingButton
                loading={loading}
                variant="outlined"
                onClick={() => {
                  fetchAllLogsToGenerateCSV();
                }}>
                generate CSV
              </LoadingButton>
            )}
            {csvGenerated && (
              <>
                <CSVLink data={responseData ? responseData : []}>
                  <LoadingButton variant="outlined">DownLoad CSV</LoadingButton>
                </CSVLink>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Logs;
