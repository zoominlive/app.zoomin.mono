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
  Button,
  Radio,
  IconButton,
  Collapse,
  InputLabel
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
// import Loader from '../common/loader';
import moment from 'moment';
import dayjs from 'dayjs';
import LoadingButton from '@mui/lab/LoadingButton';
import NoDataDiv from '../common/nodatadiv';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import LinerLoader from '../common/linearLoader';
import Logger from '../../utils/logger';
import { DesktopDateRangePicker } from '@mui/x-date-pickers-pro';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import _ from 'lodash';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const shortcutsItems = [
  {
    label: 'Today',
    getValue: () => {
      const today = dayjs();
      return [today, today];
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const today = dayjs();
      const yesterday = today.subtract(1, 'day');
      return [yesterday, yesterday];
    }
  },
  {
    label: 'Last Week',
    getValue: () => {
      const today = dayjs();
      const prevWeek = today.subtract(7, 'day');
      return [prevWeek.startOf('week'), prevWeek.endOf('week')];
    }
  },
  {
    label: 'Last Month',
    getValue: () => {
      const today = dayjs();
      const startOfLastMonth = today.startOf('month').subtract(1, 'day');
      return [startOfLastMonth.startOf('month'), startOfLastMonth.endOf('month')];
    }
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const today = dayjs();
      return [today.subtract(30, 'day'), today];
    }
  },
  {
    label: 'Current Month',
    getValue: () => {
      const today = dayjs();
      return [today.startOf('month'), today.endOf('month')];
    }
  },
  {
    label: 'Next Month',
    getValue: () => {
      const today = dayjs();
      const startOfNextMonth = today.endOf('month').add(1, 'day');
      return [startOfNextMonth, startOfNextMonth.endOf('month')];
    }
  },
  { label: 'Reset', getValue: () => [dayjs(), dayjs()] }
];

const Logs = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [logsList, setLogsList] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedType, setSelectedType] = useState('Access Log');
  const [selectedAction, setSelectedAction] = useState([
    'Add',
    'Edit',
    'Delete',
    'Disable',
    'Enable',
    'Watch',
    'Login',
    'Start',
    'Stop'
  ]);
  const [selectedloginWatchAction, setSelectedloginWatchAction] = useState('Watch');
  const [selectedFunction, setSelectedFunction] = useState([
    { id: 'Watch_Stream', name: 'Mounted Camera' },
    { id: 'Primary_Family', name: 'Family' },
    { id: 'Child', name: 'Child' },
    { id: 'Room', name: 'Room' },
    { id: 'Camera', name: 'Camera' },
    { id: 'Users', name: 'Users' },
    { id: 'Profile_Photo', name: 'Profile Photo' },
    { id: 'User_Change_Email', name: 'Change Email' },
    { id: 'User_Forgot_Password', name: 'Forgot Password' },
    { id: 'User_Change_Password', name: 'Change Password' },
    { id: 'User_Reg_Accout', name: 'Accout Registration' },
    { id: 'Live_Stream', name: 'Live Stream' }
  ]);
  const [fromDate, setFromDate] = useState(moment().subtract(7, 'days'));
  const [toDate, setToDate] = useState(moment());
  const [rangeDate, setRangeDate] = useState([dayjs(), dayjs()]);
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
  const [allActionsChecked, setAllActionsChecked] = useState(false);
  const [allFunctionChecked, setAllFunctionChecked] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [uncheckedUsers, setUncheckedUsers] = useState(false);
  const [uncheckedFamilies, setUncheckedFamilies] = useState(false);

  const [logsPayload, setLogsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    from: moment().format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
    type: 'Access Log',
    functions: [
      'Watch_Stream',
      // 'Primary_Family',
      // 'Child',
      // 'Room',
      // 'Camera',
      // 'Users',
      // 'Profile_Photo',
      // 'User_Change_Email',
      // 'User_Forgot_Password',
      // 'User_Change_Password',
      // 'User_Reg_Accout',
      'Live_Stream'
    ],
    users: [],
    locations: [],
    familyMemberIds: [],
    actions: [
      // 'Select All',
      // 'Watch',
      // 'Login',
      'Get'
      // 'Add',
      // 'Edit',
      // 'Delete',
      // 'Disable',
      // 'Enable',
      // 'Start',
      // 'Stop'
    ]
  });
  const types = ['Access Log', 'Change Log'];
  const actions = [
    'Select All',
    'Watch',
    'Login',
    'Add',
    'Edit',
    'Delete',
    'Disable',
    'Enable',
    'Start Live Stream',
    'Stop Live Stream'
  ];
  const loginWatchActions = ['Watch', 'Login'];
  const functions = [
    { id: 'Profile_Photo', name: 'Profile Photo' },
    { id: 'Staff', name: 'Staff' },
    { id: 'Primary_Family', name: 'Family' },
    { id: 'Watch_Stream', name: 'Mounted Camera' },
    { id: 'Live_Stream', name: 'Live Stream' },
    { id: 'Select All', name: 'Select All' },
    { id: 'Child', name: 'Child' },
    { id: 'Room', name: 'Room' },
    { id: 'Camera', name: 'Camera' },
    { id: 'User_Change_Email', name: 'Change Email' },
    { id: 'User_Forgot_Password', name: 'Forgot Password' },
    { id: 'User_Change_Password', name: 'Change Password' }
  ];
  Logger.log('location?.state==>', location?.state);
  useEffect(() => {
    Logger.log('inside');
    if (location?.state?.lastHoursUsers) {
      setFromDate(moment());
      setToDate(moment());
      setSelectedAction(location?.state?.action);
      setSelectedFunction(location?.state?.function);
    }
  }, [location?.state?.lastHoursUsers]);

  useEffect(() => {
    layoutCtx.setActive(8);
    layoutCtx.setBreadcrumb(['Logs', 'Review Access and Change Logs']);
    if (authCtx?.user?.locations?.map((item) => item.loc_name)) {
      setIsLoading(true);
      API.get('users/location/', {
        params: {
          locations: authCtx.user.locations.map((item) => item.loc_id),
          cust_id: localStorage.getItem('cust_id')
        }
      }).then((response) => {
        if (response.status === 200) {
          let userToAdd;
          if (location?.state?.user) {
            userToAdd = location?.state?.user?.map((user) => user?.user_id);
          } else {
            userToAdd = response.data.Data?.map((user) => user?.user_id);
          }
          setUsers([users[0], ...response.data.Data]);
          setSelectedUsers(
            location?.state
              ? response.data.Data.filter((user) => userToAdd.includes(user.user_id))
              : response.data.Data
          );
          // eslint-disable-next-line no-unsafe-optional-chaining
          //setUsers([users[0]], ...location?.state?.user);
          API.get('family/location/', {
            params: {
              locations: authCtx.user.locations.map((item) => item.loc_id),
              cust_id: localStorage.getItem('cust_id')
            }
          }).then((response) => {
            if (response.status === 200) {
              let familyToAdd;
              if (location?.state?.family) {
                familyToAdd = location?.state?.family.map((user) => user?.family_member_id);
                console.log('familyToAdd in if', families);
              } else {
                familyToAdd = response.data.Data?.map((user) => user?.family_member_id);
                console.log('familyToAdd in else', families);
              }
              setFamilies([families[0], ...response.data.Data]);
              Logger.log('location->', location);
              setSelectedFamilies(
                location?.state
                  ? response.data.Data.filter((user) => familyToAdd.includes(user.family_member_id))
                  : response.data.Data
              );
              Logger.log('logsPayload==>', logsPayload);
              if (location?.state?.lastHoursUsers || location?.state?.viewMore) {
                if (location?.state?.viewMore) {
                  setRangeDate([dayjs().startOf('week'), dayjs().endOf('week')]);
                }
                API.post('logs/', {
                  ...logsPayload,
                  from: moment().startOf('week').format('YYYY-MM-DD'),
                  to: moment().endOf('week').format('YYYY-MM-DD'),
                  locations: [authCtx.user.location.accessable_locations[0]],
                  users: userToAdd,
                  familyMemberIds: familyToAdd
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
                API.post('logs/', {
                  ...logsPayload,
                  locations: [authCtx.user.locations.map((item) => item.loc_id)[0]],
                  users: userToAdd,
                  familyMemberIds: familyToAdd
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
            } else {
              setIsLoading(false);
              errorMessageHandler(
                enqueueSnackbar,
                response?.response?.data?.Message || 'Something Went Wrong.',
                response?.response?.status,
                authCtx.setAuthError
              );
            }
          });
        } else {
          setIsLoading(false);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    }
    if (authCtx.user.role !== 'Super Admin') {
      API.get('customers/all/locations', {
        params: {
          location: 'All',
          cust_id: authCtx.user.cust_id || localStorage.getItem('cust_id')
        }
      }).then((response) => {
        if (response.status === 200) {
          let locations = response.data.Data.locations.map(({ loc_id, loc_name }) => ({
            loc_id,
            loc_name
          }));
          setLocations(['Select All', ...locations]);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    }
    // eslint-disable-next-line no-unsafe-optional-chaining
    setLocations(['Select All', ...authCtx?.user?.locations]);
    // setSelectedLocation(authCtx?.user?.location?.accessable_locations);
    console.log('location?.state==>', location?.state);
    if (location?.state) {
      setSelectedLocation(location?.state?.location);
      setAllLocationChecked(true);
    } else {
      console.log('in else==', authCtx?.user?.locations);
      setSelectedLocation(authCtx?.user?.locations);
    }
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    let userIds = selectedUsers?.map((user) => user.user_id);
    let FamilyMemberIds = selectedFamilies?.map((user) => user.family_member_id);
    let familySelected = false;
    let functionList = selectedFunction.map((fun) => {
      if (fun.id === 'Primary_Family') {
        familySelected = true;
      }
      return fun.id;
    });
    // Items to find and replace
    let itemsToReplace = ['Start Live Stream', 'Stop Live Stream'];

    // New values
    let newValues = ['Start', 'Stop'];
    if (familySelected) {
      functionList.push('Second_Family');
    }
    // Create a new array with replaced values
    let newArray = selectedAction.map((item) => {
      // Check if the current item is in the itemsToReplace array
      let index = itemsToReplace.indexOf(item);

      // If the item is found, replace it with the corresponding new value
      if (index !== -1) {
        return newValues[index];
      }

      // If the item is not in the itemsToReplace array, keep it unchanged
      return item;
    });
    Logger.log('==reached==');
    if (selectedType == 'Access Log') {
      setLogsPayload({
        ...logsPayload,
        from: dayjs(rangeDate[0]).format('YYYY-MM-DD'),
        to: dayjs(rangeDate[1]).format('YYYY-MM-DD'),
        type: selectedType,
        functions: functionList,
        users: userIds,
        locations: selectedLocation,
        familyMemberIds: FamilyMemberIds,
        actions: selectedloginWatchAction === 'Watch' ? 'Get' : 'Login'
      });
    } else {
      setLogsPayload({
        ...logsPayload,
        from: dayjs(rangeDate[0]).format('YYYY-MM-DD'),
        to: dayjs(rangeDate[1]).format('YYYY-MM-DD'),
        type: selectedType,
        functions: functionList,
        users: userIds,
        locations: selectedLocation,
        familyMemberIds: FamilyMemberIds,
        actions: newArray
      });
    }
    Logger.log('logsPayload after update', logsPayload);
  }, [
    selectedLocation,
    fromDate,
    toDate,
    rangeDate,
    selectedType,
    selectedFunction,
    selectedUsers,
    selectedFamilies,
    selectedAction,
    selectedloginWatchAction
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
    console.log('*-*-*', selectedLocation);
    if (selectedLocation?.length !== 0) {
      API.get('users/location/', {
        params: {
          locations: selectedLocation.map((item) => item.loc_id),
          cust_id: localStorage.getItem('cust_id')
        }
      }).then((response) => {
        if (response.status === 200) {
          //setSelectedUsers(location?.state?.user || response.data.Data);
          setUsers([users[0], ...response.data.Data]);
          setSelectedUsers(location?.state ? location?.state.user : response.data.Data);

          // eslint-disable-next-line no-unsafe-optional-chaining
          // setUsers([users[0]], ...location?.state?.user);
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
        params: {
          locations: selectedLocation.map((item) => item.loc_id),
          cust_id: localStorage.getItem('cust_id')
        }
      }).then((response) => {
        if (response.status === 200) {
          setFamilies([families[0], ...response.data.Data]);
          setSelectedFamilies(location?.state?.family || response.data.Data);
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

  useEffect(() => {
    if (selectedType === 'Change Log') {
      setSelectedAction(actions.slice(3, actions.length));
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedloginWatchAction === 'Login' && selectedType === 'Access Log') {
      setSelectedFunction(functions.slice(1, 3));
    } else if (selectedloginWatchAction === 'Watch' && selectedType === 'Access Log') {
      setSelectedFunction(functions.slice(3, 5));
    } else {
      setSelectedFunction(functions.slice(1, 5));
    }
  }, [selectedloginWatchAction]);

  useEffect(() => {
    if (locations.length > 1 && selectedLocation.length === locations.length - 1) {
      setAllLocationChecked(true);
    }
  }, [selectedLocation, locations]);

  //   Method to fetch user list for table
  const getLogsList = () => {
    if (
      selectedFunction?.length == 0 ||
      selectedLocation?.length == 0 ||
      selectedAction?.length == 0
    ) {
      errorMessageHandler(enqueueSnackbar, 'Please select required filters');
    } else {
      setIsLoading(true);
      let familiesToAdd;
      let usersToAdd;
      if (selectedFamilies?.length == 0 && !uncheckedFamilies) {
        familiesToAdd = families.slice(1, families.length);
        familiesToAdd = familiesToAdd?.map((user) => user.family_member_id);
      } else {
        familiesToAdd = null;
      }
      if (selectedUsers?.length == 0 && !uncheckedUsers) {
        usersToAdd = users.slice(1, users.length);
        usersToAdd = usersToAdd?.map((user) => user.user_id);
      } else {
        usersToAdd = null;
      }
      console.log('logsPayload', logsPayload);
      const newFunctions = _.map(logsPayload.functions, (item) =>
        item === 'Staff' ? 'Users' : item
      );
      logsPayload.functions = newFunctions;
      API.post('logs/', {
        ...logsPayload,
        pageNumber,
        pageSize,
        users: usersToAdd ? usersToAdd : logsPayload.users,
        familyMemberIds: familiesToAdd ? familiesToAdd : logsPayload.familyMemberIds
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
    console.log('reason, option', reason, option);
    if (reason == 'selectOption' && option?.option == 'Select All' && !allLocationChecked) {
      console.log('1');
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (
      (option?.option == 'Select All' && reason === 'removeOption') ||
      reason === 'clear'
    ) {
      console.log('2');
      setSelectedLocation([]);
      setAllLocationChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option == 'Select All' &&
      allLocationChecked == true
    ) {
      console.log('3');
      setAllLocationChecked(false);
      setSelectedLocation([]);
    } else {
      console.log('4', value);
      console.log('option', option);
      // Toggle selection logic
      const isSelected = selectedLocation.some((loc) => loc.loc_id === option.option.loc_id);
      let newSelectedLocations;

      if (isSelected) {
        // If the option is already selected, remove it
        newSelectedLocations = selectedLocation.filter(
          (loc) => loc.loc_id !== option.option.loc_id
        );
      } else {
        // Otherwise, add it
        newSelectedLocations = [...selectedLocation, option.option];
      }

      setAllLocationChecked(false);
      setSelectedLocation(newSelectedLocations);
    }
  };
  console.log('selectedLocation outside the scope==', selectedLocation);

  const handleActionTypeChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option == 'Select All' && !allActionsChecked) {
      setSelectedAction(
        reason === 'selectOption'
          ? selectedType == 'Access Log'
            ? loginWatchActions[0]
            : actions.slice(3, actions.length)
          : []
      );
      setAllActionsChecked(true);
    } else if (option?.option == 'Select All' && reason === 'removeOption') {
      setSelectedAction([]);
      setAllActionsChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option == 'Select All' &&
      allActionsChecked == true
    ) {
      setAllActionsChecked(false);
      setSelectedAction([]);
    } else {
      setAllActionsChecked(false);
      setSelectedAction(value);
    }
  };

  const handleFunctionChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option?.id == 'Select All' && !allFunctionChecked) {
      setSelectedFunction(reason === 'selectOption' ? functions.slice(1, functions.length) : []);
      setAllFunctionChecked(true);
    } else if (option?.option?.id == 'Select All' && reason === 'removeOption') {
      setSelectedFunction([]);
      setAllFunctionChecked(false);
    } else if (
      reason === 'selectOption' &&
      option?.option?.id == 'Select All' &&
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
      setUncheckedUsers(true);
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
      setUncheckedFamilies(true);
    }
  };

  const fetchAllLogsToGenerateCSV = async () => {
    setLoading(true);
    let response = await API.post('logs/', {
      ...logsPayload,
      pageNumber: 0,
      pageSize: totalLogs
    });
    setcsvGenerated(true);
    setLoading(false);
    if (response.status === 200) {
      let formattedResponse = response.data.Data.logs.map((log) => {
        console.log('log==>', log);
        // eslint-disable-next-line no-unused-vars
        const { createdAt, function_type, updatedAt, family, user, ...rest } = log;
        return {
          ...rest,
          date: moment(log.createdAt).format('MM-DD-YYYY'),
          time: moment(log.createdAt).format('hh:mm A'),
          name: log.user
            ? log.user?.first_name + ' ' + log.user?.last_name
            : log.family
            ? log.family?.first_name + ' ' + log.family?.last_name
            : '-',
          type: log.user ? 'User' : log.family ? 'Family' : '',
          event: log.function_type
        };
      });
      setResponseData(formattedResponse);

      return true;
    } else {
      return false;
    }
  };
  const Row = (props) => {
    const { row, logsPayload, index } = props;
    const [open, setOpen] = useState(false);
    return (
      <>
        <TableRow hover>
          <TableCell>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${
                logsPayload.pageNumber * logsPayload.pageSize + index + 1
              }`}</Typography>
            </Stack>
          </TableCell>
          <TableCell align="left">
            <Stack direction="row">
              <Typography>{`${moment(row.createdAt).format('MM-DD-YYYY')}`}</Typography>
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
                row?.user
                  ? row?.user?.first_name + ' ' + row?.user?.last_name
                  : row.family
                  ? row?.family?.first_name + ' ' + row?.family?.last_name
                  : 'Not Found'
              }`}</Typography>
            </Stack>
          </TableCell>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${row?.user ? 'Staff' : row.family ? 'Family' : '--'}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${row.function_type}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell component="th" scope="row">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography>{`${row.function}`}</Typography>
            </Stack>
          </TableCell>
          <TableCell component="th" scope="row">
            - -
          </TableCell>
        </TableRow>
        <TableRow className={`expandable-row ${!open ? 'border-bottom-none' : ''}`}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                <Table size="small" aria-label="cameras">
                  <TableHead>
                    <TableRow>
                      <TableCell>{row?.request ? 'Request' : 'Response'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'break-spaces' }}>
                        {JSON.stringify(row?.request ? row.request : row.response, undefined, '\t')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };
  Row.propTypes = {
    row: PropTypes.shape({
      createdAt: PropTypes.string,
      user: PropTypes.obj,
      family: PropTypes.obj,
      function_type: PropTypes.string,
      function: PropTypes.string,
      request: PropTypes.object,
      response: PropTypes.object
    }),
    logsPayload: PropTypes.obj,
    index: PropTypes.number
  };
  return (
    <>
      {' '}
      <Box className="listing-wrapper">
        <Card className="filter">
          <CardContent>
            <Box>
              <Grid container spacing={2}>
                <Grid item md={18} sm={16}>
                  <Box>
                    <Grid container spacing={2}>
                      {/* <Grid item md={1.5} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                          <InputLabel id="from">From</InputLabel>
                          <DesktopDatePicker
                            open={isDatePickerOpen1}
                            maxDate={moment()}
                            labelId="from"
                            autoOk={true}
                            value={fromDate}
                            inputFormat="MM/DD/YY"
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
                      <Grid item md={1.5} sm={6}>
                        <InputLabel id="to">To</InputLabel>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                          <DesktopDatePicker
                            labelId="to"
                            open={isDatePickerOpen2}
                            maxDate={moment()}
                            value={toDate}
                            inputFormat="MM/DD/YY"
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
                      </Grid> */}
                      <Grid item md={3} sm={6}>
                        <Box sx={{ marginTop: '20px' }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DesktopDateRangePicker
                              localeText={{ start: 'From', end: 'To' }}
                              value={rangeDate}
                              onChange={(newVal) => setRangeDate(newVal)}
                              slotProps={{
                                shortcuts: {
                                  items: shortcutsItems
                                },
                                actionBar: { actions: [] }
                              }}
                              calendars={2}
                            />
                          </LocalizationProvider>
                        </Box>
                      </Grid>
                      <Grid item md={3} sm={6}>
                        <InputLabel id="location">Location</InputLabel>
                        {console.log('locations==>', locations)}
                        {console.log('selectedLocation==>', selectedLocation)}
                        <Autocomplete
                          labelId="location"
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={authCtx.user.locations?.length !== 0 ? locations : []}
                          value={selectedLocation ? selectedLocation : []}
                          getOptionLabel={(option) => option.loc_name || option}
                          onChange={(_, value, reason, option) => {
                            console.log('value onChange==>', value);
                            handleLocationChange(_, value, reason, option);
                          }}
                          renderTags={(value, getTagProps) =>
                            value?.map((option, index) => (
                              <Chip
                                key={index}
                                label={option?.loc_name}
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                          // eslint-disable-next-line no-unused-vars
                          renderOption={(props, option, { selected }) => (
                            <li {...props}>
                              <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={
                                  allLocationChecked ||
                                  selectedLocation.some((loc) => loc.loc_id === option.loc_id)
                                }
                                // checked={allLocationChecked ? allLocationChecked : selected}
                              />
                              {option.loc_name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
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
                        <InputLabel id="type">Type</InputLabel>
                        <Autocomplete
                          labelId="type"
                          limitTags={1}
                          id="tags-standard"
                          options={types}
                          disableClearable
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
                              <Radio style={{ marginRight: 8 }} checked={selected} />
                              {option}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
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
                      {selectedType == 'Access Log' ? (
                        <Grid item md={3} sm={6}>
                          <InputLabel id="loginWatchAction">Action</InputLabel>
                          <Autocomplete
                            labelId="loginWatchAction"
                            limitTags={1}
                            id="tags-standard"
                            options={loginWatchActions}
                            disableClearable
                            value={selectedloginWatchAction}
                            getOptionLabel={(option) => option}
                            onChange={(_, value) => {
                              setSelectedloginWatchAction(value);
                            }}
                            renderTags={(value, getTagProps) =>
                              value?.map((option, index) => (
                                <Chip key={index} label={option} {...getTagProps({ index })} />
                              ))
                            }
                            renderOption={(props, option, { selected }) => (
                              <li {...props}>
                                <Radio style={{ marginRight: 8 }} checked={selected} />
                                {option}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
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
                      ) : (
                        <Grid item md={3} sm={6}>
                          {console.log('selecetedAction==>', selectedAction)}
                          <InputLabel id="action">Action</InputLabel>
                          <Autocomplete
                            labelId="action"
                            multiple
                            limitTags={1}
                            id="tags-standard"
                            options={[actions[0], ...actions.slice(3, actions.length)]}
                            value={selectedAction ? selectedAction : []}
                            getOptionLabel={(option) => {
                              if (option === 'Watch') {
                                return 'Request';
                              } else {
                                return option;
                              }
                            }}
                            onChange={(_, value, reason, option) => {
                              handleActionTypeChange(_, value, reason, option);
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
                                  checked={allActionsChecked ? allActionsChecked : selected}
                                />
                                {option}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                error={selectedAction?.length == 0 ? true : false}
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
                      )}
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
                        <InputLabel id="function">Function</InputLabel>
                        <Autocomplete
                          labelId="function"
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={
                            selectedType == 'Access Log' && selectedloginWatchAction === 'Login'
                              ? functions.slice(1, 3)
                              : selectedType == 'Access Log' && selectedloginWatchAction === 'Watch'
                              ? functions.slice(3, 5)
                              : functions.slice(1, 5)
                          }
                          value={selectedFunction ? selectedFunction : []}
                          getOptionLabel={(option) => option?.name}
                          onChange={(_, value, reason, option) => {
                            handleFunctionChange(_, value, reason, option);
                          }}
                          renderTags={(value, getTagProps) =>
                            value?.map((option, index) => (
                              <Chip key={index} label={option?.name} {...getTagProps({ index })} />
                            ))
                          }
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          renderOption={(props, option, state) => (
                            <li {...props}>
                              <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={allFunctionChecked ? allFunctionChecked : state.selected}
                              />
                              {option?.name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
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
                        <InputLabel id="user_name">Staff</InputLabel>
                        <Autocomplete
                          labelId="user_name"
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
                      {selectedType == 'Access Log' ? (
                        <Grid item md={3} sm={6}>
                          <InputLabel id="families">Families</InputLabel>
                          <Autocomplete
                            labelId="families"
                            multiple
                            limitTags={1}
                            id="tags-standard"
                            options={families}
                            value={selectedFamilies ? selectedFamilies : []}
                            getOptionLabel={(option) =>
                              option?.first_name + ' ' + option?.last_name
                            }
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
                      ) : null}
                      <Grid item md={1.5} sm={6} sx={{ marginTop: '20px' }}>
                        <Button
                          className="log-btn"
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
                      <TableCell></TableCell>
                      <TableCell style={{ minWidth: '20px' }}>No</TableCell>
                      <TableCell style={{ minWidth: '100px' }} align="left">
                        Date
                      </TableCell>
                      <TableCell style={{ minWidth: '100px' }} align="left">
                        Time
                      </TableCell>
                      <TableCell align="left">Name</TableCell>
                      <TableCell align="left">Type</TableCell>
                      <TableCell align="left">Event</TableCell>
                      <TableCell align="left">Function</TableCell>
                      <TableCell align="left">Event Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logsList?.length > 0
                      ? logsList?.map((row, index) => (
                          <Row key={index} row={row} logsPayload={logsPayload} index={index} />
                        ))
                      : null}
                  </TableBody>
                </Table>
                {!isLoading && logsList?.length == 0 ? <NoDataDiv /> : null}
                {logsList?.length > 0 ? (
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
                ) : null}
              </TableContainer>
            </Box>
            {!csvGenerated && (
              <LoadingButton
                className="log-btn"
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
                  <LoadingButton className="log-btn" variant="outlined">
                    DownLoad CSV
                  </LoadingButton>
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
