import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const DeleteUserDialog = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="delete-user-dialog small-dialog">
      <DialogTitle>Delete User</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText mb={4}>Are you sure you want to delete this user?</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={() => props.setOpen(false)}>
          CANCEL
        </Button>
        <Button
          variant="text"
          onClick={() => {
            localStorage.removeItem('token');
            window.location.replace('/login');
          }}>
          YES
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;

DeleteUserDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
