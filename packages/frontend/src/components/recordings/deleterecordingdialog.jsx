import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Stack,
  Typography
} from '@mui/material';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import DeleteRecordingTrash from '../../assets/delete-recording-trash.svg';
import { useState } from 'react';
import API from '../../api';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import ConfirmationDialog from '../common/confirmationdialog';

const DeleteRecordingDialog = (props) => {
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);

  const handleClose = () => {
    props.setIsDeleteDialogOpen(false);
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    if (props?.recordingData?.record_uuid) {
      API.delete('recordings/delete', {
        data: { record_uuid: props?.recordingData?.record_uuid }
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, {
            variant: 'success'
          });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        props.handleDialogClose();
        setDeleteLoading(false);
      });
    } else {
      API.delete('recordings/delete-mobile-stream', {
        data: { stream_id: props?.recordingData?.stream_id }
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, {
            variant: 'success'
          });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        props.handleDialogClose();
        setDeleteLoading(false);
      });
    }
  };

  return (
    <Dialog
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      open={props.open}
      onClose={handleClose}
      fullWidth
      className="delete-recording-dialog delete-dialog">
      {isCloseDialog ? (
        <>
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
        </>
      ) : (
        <>
          <DialogContent sx={{ padding: '40px 40px 12px' }}>
            <DialogContentText>
              <Stack direction={'column'} alignItems={'center'} justifyContent={'flex-start'}>
                <img src={DeleteRecordingTrash} alt="DeleteRecordingTrash" />
                <Typography
                  sx={{
                    marginTop: '24px',
                    marginBottom: '12px',
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: '33px',
                    textAlign: 'center',
                    color: '#343434'
                  }}>
                  Delete Recording?
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '21px',
                    textAlign: 'center',
                    color: '#828282'
                  }}>
                  {props.contentText}
                </Typography>
              </Stack>
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ paddingBottom: '40px', justifyContent: 'center' }}>
            <Button
              className="cancel-recording-btn"
              variant="outlined"
              sx={{ borderRadius: '60px !important' }}
              onClick={handleClose}>
              Cancel
            </Button>
            <LoadingButton
              className="add-btn rec-delete-btn"
              loading={deleteLoading}
              loadingPosition={deleteLoading ? 'start' : undefined}
              startIcon={deleteLoading && <SaveIcon />}
              variant="text"
              onClick={handleDelete}>
              Delete
            </LoadingButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DeleteRecordingDialog;

DeleteRecordingDialog.propTypes = {
  open: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  recordingData: PropTypes.object,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDelete: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
