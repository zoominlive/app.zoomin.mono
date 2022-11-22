import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import PropTypes from 'prop-types';

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
        className="row-delete-btn"
        color="error"
        onClick={handleCameraDelete}>
        <DeleteIcon />
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
