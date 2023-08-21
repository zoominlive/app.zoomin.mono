import { Box, IconButton } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const CameraActions = (props) => {
  // Method to close the user actions on table
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  // Method to set user for the delete action
  const handleCameraDelete = (event) => {
    props.setCamera({ ...props.camera });
    props.setIsDeleteDialogOpen(true);
    handleClose(event);
  };

  return (
    <Box>
      <IconButton
        aria-label="delete"
        className="cam-delete-btn"
        color="default"
        onClick={handleCameraDelete}>
        <DeleteOutlineIcon />
      </IconButton>
    </Box>
  );
};

export default CameraActions;

CameraActions.propTypes = {
  camera: PropTypes.object,
  setCamera: PropTypes.func,
  setIsCameraFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
