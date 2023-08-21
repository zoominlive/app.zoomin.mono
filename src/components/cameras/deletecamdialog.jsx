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

const DeleteCamDialog = (props) => {
  const [wait, setWait] = useState(false);
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        if (!props.loading) {
          props.handleDialogClose();
        }
      }}>
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        Delete Camera
        <IconButton
          aria-label="close"
          onClick={() => {
            if (!props.loading) {
              props.handleDialogClose();
            }
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
