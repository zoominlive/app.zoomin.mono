import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';

const NewDeleteDialog = (props) => {
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
      onClose={handleClose}
      fullWidth
      className="small-dialog delete-dialog">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.title}
        <DialogContentText>
          {/* Please select which stream you want to watch on your dashboard */}
        </DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          // onClick={() => {
          //   if (!props.loading) {
          //     props.handleDialogClose();
          //   }
          // }}
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
            <DialogContentText>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'flex-start'}>
                <CheckCircleIcon /> {props.contentText}{' '}
              </Stack>
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            {/* {props.from === 'watchstream' ? (
          <Button
            variant="text"
            onClick={() => {
              if (!props.loading) {
                props.handleDialogClose();
              }
            }}
            disabled={props.loading}>
            NO
          </Button>
        ) : (
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
        )} */}
            <LoadingButton
              className="add-btn delete-btn"
              loading={props.loading}
              loadingPosition={props.loading ? 'start' : undefined}
              startIcon={props.loading && <SaveIcon />}
              variant="text"
              onClick={props.handleDelete}>
              Delete
            </LoadingButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default NewDeleteDialog;

NewDeleteDialog.propTypes = {
  open: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  title: PropTypes.string,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDelete: PropTypes.func,
  from: PropTypes.string
};
