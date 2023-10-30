import {
  Autocomplete,
  Avatar,
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
  Grid
} from '@mui/material';

import logo from '../../assets/app-capital.svg';
// import appLogo from '../../assets/app-icon.png';
import collapsedLogo from '../../assets/white-logo-collapsed.png';
import collapseButton from '../../assets/collapse-button.svg';
import openButton from '../../assets/open-button.svg';
import React, { useEffect, useState } from 'react';
import { Monitor, Users, Copy, User, Video, Book, Shield, Camera, Film, Code } from 'react-feather';
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
import buildingIcon from '../../assets/building.svg';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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
      } else if (response.status !== 200 && response.status !== 500) {
        setTimeout(() => {
          getUsers();
        }, 60000);
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

  const getUsers = () => {
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
          response?.response?.data?.Message || 'Something Went Wrong in second trial.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
      setDropdownLoading(false);
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
      name: 'Users',
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
      link: 'https://zoominlive.document360.io/'
    },
    {
      name: 'Support',
      icon: <Shield style={{ color: 'white' }} />,
      link: 'https://www.zoominlive.com/support'
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

  return (
    <>
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
                      (item.key === 5 || item.key === 9) &&
                      item.key !== 10
                    ) {
                      return true;
                    } else if (authCtx.user.role === 'Admin' && item.key !== 9 && item.key !== 10) {
                      return true;
                    } else if (authCtx.user.role == 'Teacher' && item.key == 5 && item.key !== 10) {
                      return true;
                    } else if (
                      authCtx.user.role === 'Super Admin' &&
                      //item.key === 10
                      [1, 2, 3, 4, 5, 6, 7, 8, 10].includes(item.key)
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
                    {layoutCtx?.breadcrumb?.length > 2 ? (
                      <Avatar
                        src={authCtx?.user?.profile_image}
                        sx={{ width: 85, height: 85 }}
                        alt='="profile-image'
                      />
                    ) : null}
                    <Stack direction={'column'} spacing={0.5}>
                      <Typography variant="h2">{layoutCtx?.breadcrumb[0]}</Typography>
                      {layoutCtx?.breadcrumb?.length > 1 && (
                        <Typography className="">{layoutCtx?.breadcrumb[1]}</Typography>
                      )}
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item md={12} sm={12} xs={12} lg={5}>
                  <>
                    <Stack
                      direction={'row'}
                      justify-content={'end'}
                      alignItems={'center'}
                      spacing={3}>
                      <Autocomplete
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 0
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
                                  <InputAdornment position="start">
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
