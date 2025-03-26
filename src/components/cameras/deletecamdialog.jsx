import { LoadingButton } from '@mui/lab';
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const DeleteCamDialog = (props) => {
  const [wait, setWait] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);
  return (
    <Dialog
      open={props.open}
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      // onClose={() => {
      //   if (!props.loading) {
      //     props.handleDialogClose();
      //   }
      // }}
      onClose={handleClose}>
      {isCloseDialog ? (
        <ConfirmationDialog
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          onConfirm={() => {
            setIsCloseDialog(false);
            props.handleDialogClose();
          }}
          handleFormDialogClose={handleClose}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            Delete Camera
            <IconButton
              aria-label="close"
              // onClick={() => {
              //   if (!props.loading) {
              //     props.handleDialogClose();
              //   }
              // }}
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 18,
                top: 30
              }}>
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(event) => setWait(event.target.checked)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon />}
                />
              }
              label="Wait until no one is watching the stream before removing."
            />
          </DialogContent>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <LoadingButton
              className="add-btn delete-btn"
              loading={props.loading}
              loadingPosition={props.loading ? 'start' : undefined}
              startIcon={props.loading && <SaveIcon />}
              variant="text"
              onClick={() => props.handleCamDelete(wait)}>
              Delete
            </LoadingButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DeleteCamDialog;

DeleteCamDialog.propTypes = {
  open: PropTypes.bool,
  handleCamDelete: PropTypes.func,
  handleDialogClose: PropTypes.func,
  loading: PropTypes.bool
};
