import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';
import EventNoteIcon from '@mui/icons-material/EventNote';

const DisputeActions = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Method to open the actions on table
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the dispute actions on table
  const handleCloseDispute = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  // Method that sets the user for user form and opens the user form dialog
  const handleDispute = (event) => {
    props.setIsDisputeFormDialogOpen(true);
    handleCloseDispute(event);
  };

  // Method to close the actions on table
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
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
        <MenuItem onClick={handleDispute}>
          <ListItemIcon>
            <EventNoteIcon />
          </ListItemIcon>
          <ListItemText>Dispute Invoice</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DisputeActions;

DisputeActions.propTypes = {
  setIsDisputeFormDialogOpen: PropTypes.func
};
