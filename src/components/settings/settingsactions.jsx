import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';

const SettingsActions = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Method to open the user actions on table
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the user actions on table
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  // Method that sets the user id for user form and opens the user form dialog
  const handleUserEdit = (event) => {
    if (props.zone) {
      props.setZone({ ...props.zone });
    } else if (props.tag) {
      props.setTag({ ...props.tag });
    } else {
      props.setLocation({ ...props.location });
    }
    props.setIsUserFormDialogOpen(true);
    handleClose(event);
  };

  // Method to set user for the delete action
  const handleUserDelete = (event) => {
    if (props.zone) {
      props.setZone({ ...props.zone });
    } else if (props.tag) {
      props.setTag({ ...props.tag });
    } else {
      props.setLocation({ ...props.location });
    }
    props.setIsDeleteDialogOpen(true);
    handleClose(event);
  };

  return (
    <Box>
      <IconButton aria-controls="alpha-menu" aria-haspopup="true" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        className="table-actions menu"
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}>
        <MenuItem onClick={handleUserEdit}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>
            {props.zone ? 'Edit Zone' : props.tag ? 'Edit Tag' : 'Edit Location'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleUserDelete}>
          <ListItemIcon>
            <DeleteOutlineIcon />
          </ListItemIcon>
          <ListItemText>
            {props.zone ? 'Delete Zone' : props.tag ? 'Delete Tag' : 'Delete Location'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SettingsActions;

SettingsActions.propTypes = {
  location: PropTypes.object,
  zone: PropTypes.object,
  tag: PropTypes.object,
  setLocation: PropTypes.func,
  setZone: PropTypes.func,
  setTag: PropTypes.func,
  setIsUserFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
