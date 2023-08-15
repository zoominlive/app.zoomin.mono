import {
  Avatar,
  Box,
  Drawer,
  FormControl,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import logo from '../../assets/logo.svg';
import appLogo from '../../assets/app-icon.png';
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
const Layout = () => {
  const layoutCtx = useContext(LayoutContext);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(window.innerWidth < 900 ? false : true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    authCtx.setLocation(event.target.value);
  };

  useEffect(() => {
    setIsLoading(true);
    // API Call for Fetching Logged in user detail
    API.get('users', { params: { cust_id: localStorage.getItem('cust_id') } }).then((response) => {
      if (response.status === 200) {
        authCtx.setUser({
          ...response.data.Data,
          location: response.data.Data.location
        });
        localStorage.setItem(
          'user',
          JSON.stringify({ ...response.data.Data, location: response.data.Data.location })
        );
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

  useEffect(() => {
    window.addEventListener('resize', handleDrawerToggleOnResize);
    return () => {
      window.removeEventListener('resize', handleDrawerToggleOnResize);
    };
  }, []);

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
    {
      name: 'Customers',
      icon: <User style={{ color: 'white' }} />,
      link: '/customers',
      active: true,
      key: 10
    },
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
              <img src={appLogo} style={{ height: '4.5em' }} />
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
                    } else if (
                      authCtx.user.role == 'Teacher' &&
                      (item.key == 5 || item.key == 7) &&
                      item.key !== 10
                    ) {
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
              {bottomMenuItems.map((item, index) => (
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

              {/* <Box className="breadcrumb">
                {layoutCtx?.breadcrumb?.length > 2 ? (
                  <Avatar src={layoutCtx?.breadcrumb[2]} />
                ) : null}

                <Typography variant="h2">{layoutCtx?.breadcrumb[0]}</Typography>
              </Box>*/}

              <Stack
                direction={'row'}
                justifyContent={'center'}
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
            </Box>

            {/* <FormControl fullWidth className="header-location">
                <InputLabel id="demo-simple-select-label">Location</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={location}
                  label="Location"
                  onChange={handleChange}
                  sx={{
                    '& fieldset': {
                      border: 'none'
                    }
                  }}>
                  <MenuItem value={'Location 1'}>Location 1</MenuItem>
                  <MenuItem value={'Location 2'}>Location 2</MenuItem>
                  <MenuItem value={'Location 3'}>Location 3</MenuItem>
                </Select>
                
              </FormControl> */}
            <Stack direction={'row'} gap={2} alignItems={'center'}>
              <FormControl fullWidth className="location-select header-location">
                {/* <InputLabel id="location">Location</InputLabel> */}
                <Select
                  // labelId="location"
                  id="location"
                  value={authCtx?.location || 'All'}
                  label="Location"
                  onChange={handleChange}
                  sx={{
                    '& fieldset': {
                      border: 'none'
                    }
                  }}
                  renderValue={(value) => {
                    return (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* <Avatar src={buildingIcon} sx={{ paddding: '0px 6px' }} /> */}
                        <img src={buildingIcon} />

                        {value}
                      </Box>
                    );
                  }}>
                  <MenuItem value={'All'}>All</MenuItem>
                  {authCtx?.user?.location?.accessable_locations
                    .sort((a, b) => (a > b ? 1 : -1))
                    .map((location, index) => (
                      <MenuItem key={index} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Box className="header-right">
                <AccountMenu openLogoutDialog={setIsLogoutDialogOpen} />
              </Box>
            </Stack>
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
