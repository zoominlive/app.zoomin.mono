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
import API from '../../api';
import { Notification } from '../../hoc/notification';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';

const DeleteUserDialog = (props) => {
  // Method to delete user and redirect to login page
  const handleUserDelete = () => {
    props.setDeleteLoading(true);
    API.delete('users').then((response) => {
      if (response.status === 200) {
        localStorage.clear();
        window.location.reload('login');
      } else {
        props.setDeleteLoading(false);
        props.snackbarShowMessage(response?.response?.data?.Message, 'error');
      }
    });
  };

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
        <LoadingButton
          loading={props.deleteLoading}
          loadingPosition={props.deleteLoading ? 'start' : undefined}
          startIcon={props.deleteLoading && <SaveIcon />}
          variant="text"
          onClick={handleUserDelete}>
          Yes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default Notification(DeleteUserDialog);

DeleteUserDialog.propTypes = {
  open: PropTypes.bool,
  deleteLoading: PropTypes.bool,
  setOpen: PropTypes.func,
  setDeleteLoading: PropTypes.func,
  snackbarShowMessage: PropTypes.func
};
