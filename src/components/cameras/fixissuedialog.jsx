import {
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack
} from '@mui/material';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';

const FixIssueDialog = (props) => {
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
        Fix Camera
        <IconButton
          aria-label="close"
          // onClick={() => {
          //   if (!props.loading) {
          //     props.handleDialogClose();
          //   }
          // }}
          onClick={() => {
            setIsCloseDialog(false);
            props.handleDialogClose();
          }}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
        <DialogContentText>
          Are you sure you would like to attempt to fix this camera?
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
              props.handleDialogClose();
            }}>
            No
          </Button>

          <LoadingButton
            id="yes-btn"
            className="log-btn"
            loading={props.loading}
            loadingPosition={props.loading ? 'start' : undefined}
            startIcon={props.loading && <SaveIcon />}
            variant="outlined"
            sx={{ marginRight: 1.5, color: '#ffff' }}
            style={{ color: '#ffff' }}
            onClick={() => {
              props.handleCameraFix();
            }}>
            Yes
          </LoadingButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default FixIssueDialog;

FixIssueDialog.propTypes = {
  open: PropTypes.bool,
  handleCameraFix: PropTypes.func,
  handleDialogClose: PropTypes.func,
  loading: PropTypes.bool
};
