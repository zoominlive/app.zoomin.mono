import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/authcontext';

const LogoutDialog = (props) => {
  const navigate = useNavigate();
  const authCtx = useContext(AuthContext);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    authCtx.setToken();
    navigate('login');
  };
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.setOpen(false);
        setIsDeleteLoading(false);
      }}
      fullWidth
      className="logout-dialog">
      <DialogTitle>Logout</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText>Are you sure you want to logout?</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={() => props.setOpen(false)}>
          CANCEL
        </Button>
        <LoadingButton
          loading={isDeleteLoading}
          loadingPosition={isDeleteLoading ? 'start' : undefined}
          startIcon={isDeleteLoading && <SaveIcon />}
          variant="text"
          onClick={handleLogout}>
          LOG OUT
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutDialog;

LogoutDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
