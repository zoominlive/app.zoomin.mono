import {
  Autocomplete,
  // Avatar,
  Box,
  Checkbox,
  Chip,
  Drawer,
  //FormControl,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  //MenuItem,
  //Select,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  //InputLabel,
  Grid,
  Divider,
  Badge
} from '@mui/material';

import logo from '../../assets/app-capital.svg';
// import appLogo from '../../assets/app-icon.png';
import collapsedLogo from '../../assets/white-logo-collapsed.png';
import collapseButton from '../../assets/collapse-button.svg';
import openButton from '../../assets/open-button.svg';
import React, { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  Users,
  Copy,
  User,
  Video,
  Book,
  Shield,
  Camera,
  Film,
  Code
  // PieChart
} from 'react-feather';
import AccountMenu from '../common/accountmenu';
import { Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import LogoutDialog from './logoutdialog';
import { useSnackbar } from 'notistack';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import Loader from '../common/loader';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AddFamilyDialog from '../addfamily/addfamilydialog';
//import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import buildingIcon from '../../assets/new-building.svg';
import searchIcon from '../../assets/search.svg';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import debounce from 'lodash.debounce';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { PF } from '../pf/pf';

const icon = <RadioButtonUncheckedIcon fontSize="small" />;
const checkedIcon = <CheckCircleOutlineIcon fontSize="small" style={{ color: '#5A53DD' }} />;

const Layout = () => {
  const layoutCtx = useContext(LayoutContext);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(window.innerWidth < 900 ? false : true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allLocationChecked, setAllLocationChecked] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [familiesResults, setFamiliesResults] = useState([]);
  const [childrenResults, setChildrenResults] = useState([]);
  const [usersResults, setUsersResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState();
  const [unreadCount, setUnreadCount] = useState(0);
  const resultsListRef = useRef(null);
  const stripe_cust_id = authCtx.user.stripe_cust_id;
  const notificationRef = useRef(null);

  const locs = ['Select All'];
  //authCtx?.user?.location?.accessable_locations.forEach((loc) => locs.push(loc));
  // const handleChange = (event) => {
  //   authCtx.setLocation(event.target.value);
  // };

  // useEffect(() => {
  //   setDropdownLoading(true);
  //   const locs = ['Select All'];
  //   console.log(
  //     '========authCtx?.user?.location?.accessable_locations===',
  //     authCtx?.user?.location?.accessable_locations
  //   );
  //   let selected_locaions = authCtx?.user?.location?.accessable_locations;
  //   authCtx?.user?.location?.accessable_locations.forEach((loc) => locs.push(loc));
  //   setLocations(locs);
  //   setSelectedLocation(selected_locaions);
  //   setDropdownLoading(false);
  // }, []);

  useEffect(() => {
    authCtx.setLocation(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    setIsLoading(true);
    setDropdownLoading(true);
    // API Call for Fetching Logged in user detail
    // let status = localStorage.getItem('login');
    API.get('users', { params: { cust_id: localStorage.getItem('cust_id') } }).then((response) => {
      if (response.status === 200) {
        setSelectedLocation(response?.data?.Data?.location?.accessable_locations);
        authCtx.setLocation(response?.data?.Data?.location?.accessable_locations);
        authCtx.setUser({
          ...response.data.Data,
          location: response.data.Data.location
        });
        localStorage.setItem(
          'user',
          JSON.stringify({ ...response.data.Data, location: response.data.Data.location })
        );

        let selected_locaions = response?.data?.Data?.location?.accessable_locations;
        response?.data?.Data?.location?.accessable_locations.forEach((loc) => locs.push(loc));
        setLocations(locs);
        setSelectedLocation(selected_locaions);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
      setDropdownLoading(false);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleDrawerToggleOnResize);
    return () => {
      window.removeEventListener('resize', handleDrawerToggleOnResize);
    };
  }, []);

  useEffect(() => {
    window.productFruitsReady = function () {
      // When your custom element is rendered in your application.
      // If you use React, get a "ref" is the launcher element
      const customLauncher = notificationRef?.current;
      // If you want to render a badge with number of unread items...
      //
      // If you want to get the initial number of unread items,
      // attach this event BEFORE the attachNewsWidgetToElement method call.
      window.productFruits?.api?.announcementsV2.listen('newsfeed-unread-count-changed', (data) => {
        const unreadCount = data.count;
        setUnreadCount(unreadCount);
        // Render the count in your UI. We don't render badges automatically, it is up to you.
      });
      // Later, when the PF JS API is available, call the following API method and pass the element instance.
      window.productFruits?.api?.announcementsV2.attachNewsWidgetToElement(customLauncher);
      console.log('Product Fruits is ready!');
    };
  });

  const newHandleChange = debounce((e) => {
    const searchValue = e.target.value;
    setShowSearchResults(searchValue);
    const familyPayload = {
      page: 0,
      limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
      searchBy: searchValue,
      location: 'All',
      rooms: [],
      cust_id: localStorage.getItem('cust_id')
    };

    const usersPlayload = {
      pageNumber: 0,
      pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
      searchBy: searchValue,
      location: 'All',
      role: 'All',
      liveStreaming: 'All',
      cust_id: localStorage.getItem('cust_id')
    };

    getFamiliesList(familyPayload);
    getUsersList(usersPlayload);
  }, 500);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Check if the click target is outside the results list
      if (resultsListRef.current && !resultsListRef.current.contains(event.target)) {
        setShowSearchResults(false); // Close the results list
      }
    };

    // Add event listener for clicks on the document
    document.addEventListener('click', handleOutsideClick);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    getCustPaymentMethod();
  }, []);

  // Method to fetch Customer Payment Method along with Customer Details
  const getCustPaymentMethod = () => {
    setIsLoading(true);
    API.get('payment/list-customer-payment-method', {
      params: { stripe_cust_id: stripe_cust_id, cust_id: localStorage.getItem('cust_id') }
    }).then((response) => {
      if (response.status === 200) {
        console.log('response.data.data.data', response.data.data.data);
        if (response.data.data.data.length !== 0) {
          authCtx.setPaymentMethod(true);
          if (window.location.pathname === '/dashboard') {
            navigate('dashboard');
          }
        } else {
          navigate('terms-and-conditions');
        }
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  // Method to fetch families list
  const getFamiliesList = (familiesPayload) => {
    setIsLoading(true);
    API.get('family', { params: familiesPayload }).then((response) => {
      if (response.status === 200) {
        console.log('familiesPayload.searchBy', familiesPayload.searchBy);
        const famResults = response.data.Data.familyArray;
        const childrenResults = response.data.Data.familyArray.map((item) => item.children);
        setFamiliesResults(famResults);
        setChildrenResults(childrenResults.flatMap((subArray) => subArray));
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

  // Method to fetch user list for table
  const getUsersList = (usersPlayload) => {
    setIsLoading(true);
    API.get('users/all', { params: usersPlayload }).then((response) => {
      if (response.status === 200) {
        const userResults = response.data.Data.users;
        setUsersResults(userResults);
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
  // Method to toggle drawer when the window size changes
  const handleDrawerToggleOnResize = () => {
    if (window.innerWidth <= 900) {
      setOpen(false);
    }
    if (window.innerWidth > 1200) {
      setOpen(true);
    }
  };

  const topMenuItems = [
    {
      name: 'Dashboard',
      icon: <Monitor style={{ color: 'white' }} />,
      active: true,
      link: '/dashboard',
      key: 1
    },
    {
      name: 'Families',
      icon: <Users style={{ color: 'white' }} />,
      link: '/families',
      key: 2
    },
    {
      name: 'Rooms',
      icon: <Copy style={{ color: 'white' }} />,
      link: '/rooms',
      key: 3
    },
    {
      name: 'Cameras',
      icon: <Camera style={{ color: 'white' }} />,
      link: '/cameras',
      key: 6
    },
    {
      name: 'Staff',
      icon: <User style={{ color: 'white' }} />,
      link: '/users',
      key: 4
    },
    // {
    //   name: 'Customers',
    //   icon: <User style={{ color: 'white' }} />,
    //   link: '/customers',
    //   active: true,
    //   key: 10
    // },
    {
      name: 'Watch Stream',
      icon: <Video style={{ color: 'white' }} />,
      link: '/watch-stream',
      key: 5
    },
    {
      name: 'Recordings',
      icon: <Film style={{ color: 'white' }} />,
      link: '/recordings',
      key: 7
    },
    {
      name: 'Logs',
      icon: <Code style={{ color: 'white' }} />,
      link: '/logs',
      key: 8
    },
    {
      name: 'Send An Invite',
      icon: <Users style={{ color: 'white' }} />,
      link: '',
      key: 9
    }
    // {
    //   name: 'Billing',
    //   icon: <PieChart style={{ color: 'white' }} />,
    //   link: '/billing',
    //   key: 10
    // }
    // {
    //   name: 'AI Alerts',
    //   icon: <Code style={{ color: 'white' }} />,
    //   link: '/alerts',
    //   key: 8
    // }
  ];

  const bottomMenuItems = [
    {
      name: 'Customers',
      icon: <User style={{ color: 'white' }} />,
      link: '/customers',
      key: 10
    },
    {
      name: 'Knowledge Base',
      icon: <Book style={{ color: 'white' }} />,
      link: 'https://2whqfcg5oxz4mmi.productfruits.help/'
    },
    {
      name: 'Support',
      icon: <Shield style={{ color: 'white' }} />,
      link: 'https://www.zoominlive.com/contact-support-team'
    }
  ];

  const handleSetLocations = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option == 'Select All' && !allLocationChecked) {
      setSelectedLocation(reason === 'selectOption' ? locations.slice(1, locations.length) : []);
      setAllLocationChecked(true);
    } else if (
      (option?.option == 'Select All' && reason === 'removeOption') ||
      reason === 'clear'
    ) {
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

  const handleResultClick = (value) => {
    if (value?.primary) {
      navigate('/families', { state: { data: value.primary?.first_name } });
      setFamiliesResults([]);
    } else if (value?.child_id) {
      navigate('/families', { state: { data: value?.first_name } });
      setFamiliesResults([]);
    } else {
      navigate('/users', { state: { data: value?.first_name } });
      setUsersResults([]);
    }
  };

  return (
    <>
      <PF />
      <Box sx={{ display: 'flex' }}>
        <Loader loading={isLoading} />
        <Drawer
          variant="permanent"
          className={`layout-drawer ${open ? 'open' : 'collapsed'}`}
          open={open}>
          <div className="header">
            {open ? (
              <img src={logo} style={{ height: '4.5em', width: '190px' }} />
            ) : (
              <img src={collapsedLogo} style={{ height: '42px' }} />
            )}
          </div>
          {authCtx.user && Object?.keys(authCtx?.user)?.length !== 0 && (
            <div className="siderbar-list">
              <List>
                {topMenuItems
                  .filter((item) => {
                    if (
                      authCtx.user.role === 'User' &&
                      item.key !== 4 &&
                      item.key !== 9 &&
                      item.key !== 10
                    ) {
                      return true;
                    } else if (
                      authCtx.user.role === 'Family' &&
                      (item.key === 5 || (item.key === 9 && authCtx.user.invite_family === true)) &&
                      item.key !== 10
                    ) {
                      return true;
                    } else if (
                      authCtx.user.role === 'Admin' &&
                      authCtx.paymentMethod &&
                      item.key !== 9
                    ) {
                      return true;
                    } else if (authCtx.user.role == 'Teacher' && item.key == 5 && item.key !== 10) {
                      return true;
                    } else if (
                      authCtx.user.role === 'Super Admin' &&
                      //item.key === 10
                      [1, 2, 3, 4, 5, 6, 7, 8].includes(item.key)
                    ) {
                      return true;
                    } else {
                      return false;
                    }
                  })
                  .map((item, index) => (
                    <ListItem
                      key={index}
                      className={`${item.key === layoutCtx.active ? 'active' : ''} `}
                      sx={{ px: 1, paddingTop: 0.7, paddingBottom: 0.7 }}>
                      {' '}
                      <ListItemButton
                        sx={{
                          minHeight: 48,
                          justifyContent: open ? 'initial' : 'center',
                          px: 2.5
                        }}
                        onClick={() =>
                          item.key === 9 ? setIsAddFamilyDialogOpen(true) : navigate(item.link)
                        }>
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center'
                          }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          sx={{ display: open ? 'block' : 'none' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </div>
          )}

          <Box className="bottom-list-items">
            <List>
              {bottomMenuItems
                .filter((i) => {
                  if (i.name == 'Customers') {
                    return authCtx.user.role === 'Super Admin' ? true : false;
                  } else {
                    return true;
                  }
                })
                .map((item, index) => (
                  <ListItem key={index} sx={{ px: 1, paddingTop: 0.7, paddingBottom: 0.7 }}>
                    {' '}
                    <ListItemButton
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5
                      }}
                      onClick={() => {
                        if (item?.key) {
                          navigate(item.link);
                        } else {
                          window.open(item.link, '_blank', 'noopener,noreferrer');
                        }
                      }}>
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 3 : 'auto',
                          justifyContent: 'center'
                        }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.name} sx={{ display: open ? 'block' : 'none' }} />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </Box>
        </Drawer>
        <main className={`main-content ${open ? 'open' : 'collapsed'}`}>
          <header>
            <Box className="header-left">
              <img
                onClick={() => setOpen(!open)}
                src={open ? collapseButton : openButton}
                className="collapse-btn"
                style={{ display: 'none' }}
              />
              <KeyboardArrowLeftIcon className="collapse-btn" onClick={() => setOpen(!open)} />
            </Box>
            <Grid container alignItems={'self-end'} gap={1}>
              <Grid container spacing={3} alignItems={'stretch'}>
                <Grid item md={12} sm={12} xs={12} lg={7}>
                  <Stack
                    direction={'row'}
                    justifyContent={'flex-start'}
                    alignItems={'center'}
                    gap={2}
                    className="breadcrumb">
                    {/* {layoutCtx?.breadcrumb?.length > 2 ? (
                      <Avatar
                        src={authCtx?.user?.profile_image}
                        sx={{ width: 85, height: 85 }}
                        alt='="profile-image'
                      />
                    ) : null} */}
                    <Stack direction={'column'} spacing={0.5}>
                      <Typography variant="h2">{layoutCtx?.breadcrumb[0]}</Typography>
                      {layoutCtx?.breadcrumb?.length > 1 && (
                        <Typography className="">{layoutCtx?.breadcrumb[1]}</Typography>
                      )}
                    </Stack>
                  </Stack>
                  {location.pathname == '/dashboard' ? (
                    <Stack
                      direction={'row'}
                      alignItems={'center'}
                      justifyContent={'space-between'}
                      position={'relative'}>
                      <TextField
                        variant="standard"
                        labelId="search"
                        placeholder={'Find Children, Families or Staff'}
                        sx={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '120px',
                          padding: '16px 24px',
                          width: '95%'
                        }}
                        onChange={(e) => newHandleChange(e)}
                        InputProps={{
                          disableUnderline: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <img src={searchIcon} alt="search" width={24} height={24} />
                            </InputAdornment>
                          )
                        }}
                      />
                      {showSearchResults && (
                        <Box className="results-list">
                          <Stack
                            className="search-result"
                            direction={'row'}
                            justifyContent={'space-between'}>
                            <Typography>Name</Typography>
                            <Typography>Role</Typography>
                          </Stack>
                          <Divider />
                          {familiesResults.map((result) => {
                            return (
                              <Stack
                                direction={'row'}
                                justifyContent={'space-between'}
                                alignItems={'center'}
                                sx={{
                                  ':hover': { backgroundColor: '#eae9ff80' }
                                }}
                                key={result?.user_id || result?.primary?.family_member_id}
                                onClick={() => handleResultClick(result)}>
                                <Box ref={resultsListRef} className="search-result">
                                  {result?.primary?.first_name + ' ' + result?.primary?.last_name}
                                </Box>
                                <Box>
                                  <Chip variant="outlined" label={'Family'} />
                                </Box>
                              </Stack>
                            );
                          })}
                          {usersResults.map((result) => {
                            return (
                              <Stack
                                direction={'row'}
                                justifyContent={'space-between'}
                                alignItems={'center'}
                                sx={{
                                  ':hover': { backgroundColor: '#eae9ff80' }
                                }}
                                key={result?.user_id}
                                onClick={() => handleResultClick(result)}>
                                <Box ref={resultsListRef} className="search-result">
                                  {result?.first_name + ' ' + result?.last_name}
                                </Box>
                                <Box>
                                  <Chip
                                    variant="outlined"
                                    label={result?.role === 'User' ? 'Director' : result?.role}
                                  />
                                </Box>
                              </Stack>
                            );
                          })}
                          {childrenResults.map((result) => {
                            return (
                              <Stack
                                direction={'row'}
                                justifyContent={'space-between'}
                                alignItems={'center'}
                                sx={{
                                  ':hover': { backgroundColor: '#eae9ff80' }
                                }}
                                key={result?.user_id}
                                onClick={() => handleResultClick(result)}>
                                <Box ref={resultsListRef} className="search-result">
                                  {result?.first_name + ' ' + result?.last_name}
                                </Box>
                                <Box>
                                  <Chip variant="outlined" label={'Child'} />
                                </Box>
                              </Stack>
                            );
                          })}
                        </Box>
                      )}
                    </Stack>
                  ) : null}
                </Grid>

                <Grid item md={12} sm={12} xs={12} lg={5}>
                  <>
                    <Stack
                      direction={'row'}
                      justifyContent={'end'}
                      alignItems={'center'}
                      spacing={3}>
                      <Badge disableRipple badgeContent={unreadCount} color="error">
                        <NotificationsIcon ref={notificationRef} fontSize="large" />
                      </Badge>
                      {((authCtx?.user?.role === 'Admin' && authCtx?.paymentMethod) ||
                        authCtx?.user?.role === 'Super Admin') && (
                        <Autocomplete
                          sx={{
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                borderWidth: 0
                              },
                            '& .MuiOutlinedInput-root .MuiAutocomplete-endAdornment': {
                              right: '22px'
                            },
                            '& fieldset': { borderRadius: 10, borderWidth: 0 }
                          }}
                          className="header-location-select"
                          multiple
                          limitTags={1}
                          id="tags-standard"
                          options={locations?.length !== 0 ? locations : []}
                          onChange={(_, value, reason, option) => {
                            handleSetLocations(_, value, reason, option);
                          }}
                          value={selectedLocation ? selectedLocation : []}
                          getOptionLabel={(option) => option}
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
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start" sx={{ marginLeft: '22px' }}>
                                      <img src={buildingIcon} />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
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
                      )}
                      <Box className="header-right">
                        <AccountMenu openLogoutDialog={setIsLogoutDialogOpen} />
                      </Box>
                    </Stack>
                  </>
                </Grid>
              </Grid>
              {/* <Grid item xs={12} sm={12} md={4} lg={2.1}>
                <Box className="header-right">
                  <AccountMenu openLogoutDialog={setIsLogoutDialogOpen} />
                </Box>
              </Grid> */}
            </Grid>
          </header>
          <section className="content-area">
            <Outlet />
          </section>
        </main>
      </Box>
      <AddFamilyDialog open={isAddFamilyDialogOpen} setOpen={setIsAddFamilyDialogOpen} />
      <LogoutDialog open={isLogoutDialogOpen} setOpen={setIsLogoutDialogOpen} />
    </>
  );
};

export default Layout;
