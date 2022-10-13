import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SaveIcon from '@mui/icons-material/Save';

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
      <DialogTitle>Delete Camera</DialogTitle>
      <Divider />
      <DialogContent>
        <FormControlLabel
          control={<Checkbox onChange={(event) => setWait(event.target.checked)} />}
          label="Wait until no one is watching the stream before removing."
        />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          disabled={props.loading}
          variant="text"
          onClick={() => {
            if (!props.loading) {
              props.handleDialogClose();
            }
          }}>
          CANCEL
        </Button>

        <LoadingButton
          loading={props.loading}
          loadingPosition={props.loading ? 'start' : undefined}
          startIcon={props.loading && <SaveIcon />}
          variant="text"
          onClick={() => props.handleCamDelete(wait)}>
          YES
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
