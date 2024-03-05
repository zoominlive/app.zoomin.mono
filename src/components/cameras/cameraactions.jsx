import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

const CameraActions = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Method to open the actions on table
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

  // Method that sets the user for user form and opens the user form dialog
  const handleCameraEdit = (event) => {
    props.setCamera(props.camera);
    props.setIsCameraFormDialogOpen(true);
    handleClose(event);
  };

  // Method to set user for the delete action
  const handleCameraDelete = (event) => {
    props.setCamera({ ...props.camera });
    props.setIsDeleteDialogOpen(true);
    handleClose(event);
  };

  // Method to fix camera issue
  const handleFixIssue = (event) => {
    props.setCamera({ ...props.camera });
    props.setIsFixIssueDialogOpen(true);
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
        <MenuItem onClick={handleCameraEdit}>
          <ListItemIcon>
            <EditOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Edit Camera</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCameraDelete}>
          <ListItemIcon>
            <DeleteOutlineIcon />
          </ListItemIcon>
          <ListItemText>Delete Camera</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFixIssue}>
          <ListItemIcon>
            <BuildOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Fix Issue</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CameraActions;

CameraActions.propTypes = {
  camera: PropTypes.object,
  setCamera: PropTypes.func,
  setIsCameraFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func,
  setIsFixIssueDialogOpen: PropTypes.func
};
