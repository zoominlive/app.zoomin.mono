import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/authcontext';
import CloseIcon from '@mui/icons-material/Close';

const LogoutDialog = (props) => {
  const navigate = useNavigate();
  const authCtx = useContext(AuthContext);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleLogout = () => {
    setTimeout(() => {
      localStorage.clear();
      authCtx.setToken();
    }, 1000);
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
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {'Signout'}
        {/* <DialogContentText>
          Please select which stream you want to watch on your dashboard
        </DialogContentText> */}
        <IconButton
          aria-label="close"
          onClick={() => {
            props.setOpen(false);
            setIsDeleteLoading(false);
          }}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>Are you sure you want to signout?</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
        <LoadingButton
          className="add-btn save-changes-btn"
          loading={isDeleteLoading}
          loadingPosition={isDeleteLoading ? 'start' : undefined}
          startIcon={isDeleteLoading && <SaveIcon />}
          variant="text"
          onClick={handleLogout}>
          SIGN OUT
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
