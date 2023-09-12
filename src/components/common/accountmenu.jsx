import {
  Avatar,
  Box,
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
// import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from '../../context/authcontext';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

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
      {/* <IconButton onClick={handleClick}> */}

      {/* </IconButton> */}
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'}>
        <Stack direction={'row'}>
          <Avatar
            src={authCtx?.user?.profile_image}
            style={{
              border: '2px solid #eae9ff',
              margin: '5px 5px 5px 0'
            }}
          />

          <Box component={'p'} className="profile-name">
            {authCtx?.user?.first_name} {authCtx?.user?.last_name}
          </Box>
        </Stack>
        <IconButton onClick={handleClick} sx={{ ml: 1 }}>
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
          {/* <MenuItem
            onClick={(event) => {
              navigate('/settings');
              handleClose(event);
            }}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText sx={{ ml: 2 }}>Settings</ListItemText>
          </MenuItem> */}
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
            sx={{ padding: 1.4 }}
            onClick={(event) => {
              props.openLogoutDialog(true);
              handleClose(event);
            }}>
            <ListItemIcon>
              <ExitToAppIcon style={{ fill: '#5A53DD' }} />
            </ListItemIcon>
            <ListItemText className="logout-text">Logout</ListItemText>
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
