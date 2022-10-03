import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import logo from '../../assets/logo.svg';
import smallLogo from '../../assets/small-logo.svg';
import collapseButton from '../../assets/collapse-button.svg';
import openButton from '../../assets/open-button.svg';
import React, { useEffect, useState } from 'react';
import { Monitor, Users, Copy, User, Video, Book, Shield } from 'react-feather';
import AccountMenu from '../common/accountmenu';
import { Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';
import LogoutDialog from './logoutdialog';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import Loader from '../common/loader';
import { Notification } from '../../hoc/notification';
import PropTypes from 'prop-types';

const Layout = (props) => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(window.innerWidth < 900 ? false : true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    // API Call for Fetching Logged in user detail
    API.get('users').then((response) => {
      if (response.status === 200) {
        authCtx.setUser({
          ...response.data.Data,
          location: JSON.parse(response.data.Data.location)
        });
      } else {
        props.snackbarShowMessage(response?.response?.data?.Message, 'error', 3000);
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
      icon: <Monitor />,
      active: true,
      link: '/dashboard'
    },
    {
      name: 'Families',
      icon: <Users />,
      link: '/families'
    },
    {
      name: 'Rooms',
      icon: <Copy />,
      link: '/rooms'
    },
    {
      name: 'Users',
      icon: <User />,
      link: '/users'
    },
    {
      name: 'Watch Stream',
      icon: <Video />,
      link: '/watch-stream'
    }
  ];

  const bottomMenuItems = [
    {
      name: 'Knowledge Base',
      icon: <Book />
    },
    {
      name: 'Support',
      icon: <Shield />
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
            <img src={open ? logo : smallLogo} />
          </div>
          <List>
            {topMenuItems.map((item, index) => (
              <ListItem
                key={index}
                className={`${index === layoutCtx.active ? 'active' : ''} `}
                sx={{ px: 1 }}>
                {' '}
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5
                  }}
                  onClick={() => navigate(item.link)}>
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

          <Box className="bottom-list-items">
            <List>
              {bottomMenuItems.map((item, index) => (
                <ListItem key={index} sx={{ px: 1 }}>
                  {' '}
                  <ListItemButton
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5
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
              <img onClick={() => setOpen(!open)} src={open ? collapseButton : openButton} />
              <Box className="breadcrumb">
                <Typography variant="h2">{layoutCtx?.breadcrumb[0]}</Typography>
                {layoutCtx?.breadcrumb?.length > 1 && (
                  <>
                    <Typography> | </Typography>
                    <Typography variant="h4">{layoutCtx?.breadcrumb[1]}</Typography>
                  </>
                )}
              </Box>
            </Box>
            <Box className="header-right">
              <AccountMenu openLogoutDialog={setIsLogoutDialogOpen} />
            </Box>
          </header>
          <section className="content-area">
            <Outlet />
          </section>
        </main>
      </Box>
      <LogoutDialog open={isLogoutDialogOpen} setOpen={setIsLogoutDialogOpen} />
    </>
  );
};

export default Notification(Layout);

Layout.propTypes = {
  snackbarShowMessage: PropTypes.func
};
