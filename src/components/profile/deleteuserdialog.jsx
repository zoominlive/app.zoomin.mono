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
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';

// Method to delete user and redirect to login page
const DeleteUserDialog = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();

  const handleUserDelete = () => {
    props.setDeleteLoading(true);
    API.delete('users').then((response) => {
      if (response.status === 200) {
        localStorage.clear();
        window.location.reload('login');
      } else {
        props.setDeleteLoading(false);
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          navigate,
          authCtx.setToken
        );
      }
    });
  };

  const handleDialogClose = () => {
    if (!props.deleteLoading) {
      props.setOpen(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleDialogClose}
      fullWidth
      className="delete-user-dialog small-dialog">
      <DialogTitle>Delete User</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText mb={4}>Are you sure you want to delete this user?</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={handleDialogClose}>
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

export default DeleteUserDialog;

DeleteUserDialog.propTypes = {
  open: PropTypes.bool,
  deleteLoading: PropTypes.bool,
  setOpen: PropTypes.func,
  setDeleteLoading: PropTypes.func
};
