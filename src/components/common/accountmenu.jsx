import {
  Avatar,
  Box,
  Divider,
  Fade,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Typography
} from '@mui/material';
import React, { useContext } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from '../../context/authcontext';

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
    <Box>
      <IconButton onClick={handleClick}>
        <Avatar src={authCtx?.user?.profile_image} />
      </IconButton>
      <Menu
        className="account-menu"
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}>
        <MenuList>
          <MenuItem sx={{ marginBottom: '15px' }}>
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
          <MenuItem
            onClick={(event) => {
              navigate('/profile');
              handleClose(event);
            }}>
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText sx={{ ml: 2 }}>Profile</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={(event) => {
              props.openLogoutDialog(true);
              handleClose(event);
            }}>
            <ListItemText className="logout-text">SIGN OUT</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default AccountMenu;

AccountMenu.propTypes = {
  openLogoutDialog: PropTypes.func
};
