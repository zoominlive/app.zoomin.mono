import {
  Avatar,
  // Box,
  Divider,
  Fade,
  IconButton,
  //IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Typography
} from '@mui/material';
import React, { useContext } from 'react';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from '../../context/authcontext';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';

const AccountMenu = (props) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const authCtx = useContext(AuthContext);

  // Method to open the account menu
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the account menu
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  return (
    <>
      {/* <IconButton onClick={handleClick}> */}

      {/* </IconButton> */}
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
        <Stack direction={'row'} alignItems={'center'}>
          <Avatar
            src={authCtx?.user?.profile_image}
            style={{
              border: '2px solid #eae9ff',
              margin: '5px 5px 5px 0',
              width: '56px',
              height: '56px'
            }}
          />

          <Stack direction={'column'}>
            <Typography component={'p'} className="profile-name">
              {authCtx?.user?.first_name} {authCtx?.user?.last_name}
            </Typography>
            <Typography component={'p'} className="role">
              {authCtx?.user?.role === 'User' ? 'Director' : authCtx?.user?.role}
            </Typography>
          </Stack>
        </Stack>
        <IconButton onClick={handleClick} sx={{ ml: 1, mb: 3 }}>
          {/* <KeyboardArrowDownIcon style={{ ml: 3 }} onClick={handleClick} /> */}
          <KeyboardArrowDownIcon />
        </IconButton>
      </Stack>

      <Menu
        className="account-menu"
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}>
        <MenuList>
          <MenuItem sx={{ marginBottom: 0 }}>
            <ListItemIcon>
              <Avatar src={authCtx?.user?.profile_image} />
            </ListItemIcon>
            <ListItemText>
              <Stack direction="column" ml={2}>
                <Typography variant="body2" className="user-name">
                  {authCtx?.user?.first_name} {authCtx?.user?.last_name}
                </Typography>
                <Typography variant="caption">{authCtx?.user?.email}</Typography>
              </Stack>
            </ListItemText>
          </MenuItem>
          <Divider />
          {authCtx.user?.role === 'Admin' && authCtx.paymentMethod && (
            <>
              <MenuItem
                onClick={(event) => {
                  navigate('/settings');
                  handleClose(event);
                }}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText sx={{ ml: 2 }}>Settings</ListItemText>
              </MenuItem>
              <Divider />
            </>
          )}
          {authCtx.user?.role === 'Admin' && authCtx.paymentMethod && (
            <>
              <MenuItem
                onClick={(event) => {
                  navigate('/billing');
                  handleClose(event);
                }}>
                <ListItemIcon>
                  <AccountBalanceRoundedIcon />
                </ListItemIcon>
                <ListItemText sx={{ ml: 2 }}>Billing</ListItemText>
              </MenuItem>
              <Divider />
            </>
          )}
          <MenuItem
            onClick={(event) => {
              navigate('/profile');
              handleClose(event);
            }}>
            <ListItemIcon>
              <PermIdentityIcon />
            </ListItemIcon>
            <ListItemText sx={{ ml: 2 }}>Profile</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={(event) => {
              props.openLogoutDialog(true);
              handleClose(event);
            }}>
            <ListItemIcon>
              <ExitToAppIcon style={{ fill: '#5A53DD' }} />
            </ListItemIcon>
            <ListItemText sx={{ ml: 2 }} className="logout-text">
              Logout
            </ListItemText>
          </MenuItem>
          {/* <MenuItem
            sx={{ padding: 1.4 }}
            onClick={(event) => {
              props.openLogoutDialog(true);
              handleClose(event);
            }}>
            <ListItemIcon>
              <ExitToAppIcon style={{ fill: '#5A53DD' }} />
            </ListItemIcon>
            <ListItemText className="logout-text">Logout</ListItemText>
          </MenuItem> */}
        </MenuList>
      </Menu>
    </>
  );
};

export default AccountMenu;

AccountMenu.propTypes = {
  openLogoutDialog: PropTypes.func
};
