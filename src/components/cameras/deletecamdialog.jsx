import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DeleteCamDialog = (props) => {
  const [wait, setWait] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);
  return (
    <Dialog
      open={props.open}
      // onClose={() => {
      //   if (!props.loading) {
      //     props.handleDialogClose();
      //   }
      // }}
      onClose={handleClose}>
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
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {isCloseDialog ? (
        <>
          <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
            <DialogContentText>
              Are you sure you want to exit before completing the wizard ?
            </DialogContentText>
          </Stack>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <Stack direction="row" justifyContent="flex-end" width="100%">
              <Button
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5 }}
                onClick={() => {
                  setIsCloseDialog(false);
                }}>
                No
              </Button>

              <Button
                id="yes-btn"
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5, color: '#ffff' }}
                style={{ color: '#ffff' }}
                onClick={() => {
                  setIsCloseDialog(false);
                  props.handleDialogClose();
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </>
      ) : (
        <>
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
