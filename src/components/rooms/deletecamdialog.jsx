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
import React from 'react';
import PropTypes from 'prop-types';

const DeleteCamDialog = (props) => {
  return (
    <Dialog open={props.open} onClose={props.handleDialogClose}>
      <DialogTitle>Delete Camera</DialogTitle>
      <Divider />
      <DialogContent>
        <FormControlLabel
          control={<Checkbox />}
          label="Wait until no one is watching the stream before removing."
        />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={props.handleDialogClose}>
          CANCEL
        </Button>
        <LoadingButton
          //  loading={props.loading}
          onClick={props.handleCamDelete}
          variant="text">
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
  handleDialogClose: PropTypes.func
};
