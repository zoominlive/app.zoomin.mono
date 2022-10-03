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
import { LoadingButton } from '@mui/lab';

const DeleteDialog = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        if (!props.loading) {
          props.handleDialogClose();
        }
      }}
      fullWidth
      className="small-dialog delete-dialog">
      <DialogTitle>{props.title}</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText>{props.contentText}</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          variant="text"
          onClick={() => {
            if (!props.loading) {
              props.handleDialogClose();
            }
          }}
          disabled={props.loading}>
          CANCEL
        </Button>
        <LoadingButton loading={props.loading} onClick={props.handleDelete} variant="text">
          YES
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;

DeleteDialog.propTypes = {
  open: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  title: PropTypes.string,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDelete: PropTypes.func
};
