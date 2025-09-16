import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from './confirmationdialog';

const NewDeleteDialog = (props) => {
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const expectedValue = `DELETE ${props?.customer?.company_name}`;

  const handleChange = (event) => {
    setInputValue(event.target.value);
    setError(false); // Reset error on change
  };

  const handleDelete = () => {
    if (props?.customer) {
      if (inputValue === expectedValue) {
        props.handleDelete();
        setInputValue('');
      } else {
        setError(true); // Set error if the input doesn't match
      }
    } else {
      props.handleDelete();
    }
  };
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
      onClose={handleClose}
      fullWidth
      className="small-dialog delete-dialog">
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
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'flex-start'}>
                <CheckCircleIcon /> {props.contentText}{' '}
              </Stack>
            </DialogContentText>
            {props.customer && (
              <DialogContent>
                <p>
                  Please type &quot;DELETE {props?.customer?.company_name}&quot; to confirm deletion
                  of this customer.
                </p>
                <TextField
                  label={`Type "DELETE ${props?.customer?.company_name}" to confirm`}
                  value={inputValue}
                  onChange={handleChange}
                  error={error}
                  helperText={error ? 'Please type the exact confirmation text.' : ''}
                  fullWidth
                />
              </DialogContent>
            )}
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
              onClick={handleDelete}>
              {props?.stopSharing ? 'Stop' : 'Delete'}
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
  customer: PropTypes.object,
  stopSharing: PropTypes.bool,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDelete: PropTypes.func,
  from: PropTypes.string
};
