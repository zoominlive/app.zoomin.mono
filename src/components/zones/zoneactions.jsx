import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

const ZoneActions = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Method to open the actions on table
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the actions on table
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  // Method that sets the user for user form and opens the user form dialog
  const handleZoneEdit = (event) => {
    props.setZone(props.zone);
    props.setIsZoneFormDialogOpen(true);
    handleClose(event);
  };

  // Method that sets the user to be deleted and opens the delete dialog
  const handleZoneDelete = (event) => {
    props.setZone(props.zone);
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
        <MenuItem onClick={handleZoneEdit}>
          <ListItemIcon>
            <EditOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Edit Zone</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleZoneDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Delete Zone</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ZoneActions;

ZoneActions.propTypes = {
  zone: PropTypes.object,
  setZone: PropTypes.func,
  setIsZoneFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
