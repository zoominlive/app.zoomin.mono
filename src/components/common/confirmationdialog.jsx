import {
  Box,
  Button,
  DialogActions,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import React from 'react';
import CautionIcon from '../../assets/caution.svg';
import PropTypes from 'prop-types';
import closeicon from '../../assets/closeicon.svg';

const ConfirmationDialog = ({ onConfirm, onCancel, handleFormDialogClose }) => {
  return (
    <>
      <DialogTitle sx={{ paddingTop: 1.8 }}>
        <IconButton
          aria-label="close"
          onClick={handleFormDialogClose}
          sx={{
            position: 'absolute',
            right: 15,
            top: 15
          }}>
          <img src={closeicon} width="30" height="30" alt="closeicon" />
        </IconButton>
      </DialogTitle>
      <Stack
        direction={'row'}
        justifyContent={'center'}
        gap={1.5}
        alignItems={'start'}
        padding={1.8}>
        <Box sx={{ minWidth: 80, minHeight: 80 }}>
          <img src={CautionIcon} alt="Checkmark Icon" width="70" height="70" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '20px',
              lineHeight: '12.8px',
              letterSpacing: '0px',
              color: '#222222'
            }}>
            Hey, Wait!!
          </Typography>
          <DialogContentText sx={{ mt: 1 }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '20px',
                letterSpacing: '0.1px',
                color: '#222222'
              }}>
              Are you sure you want to exit before <br /> completing the wizard?
            </Typography>
          </DialogContentText>
        </Box>
      </Stack>
      <DialogActions sx={{ paddingRight: 1.8, paddingBottom: 1.8 }}>
        <Stack direction="row" justifyContent="flex-end" width="100%">
          <Button
            className="log-btn"
            variant="outlined"
            sx={{ marginRight: 1.5, padding: '10px 28px !important', height: '45px' }}
            onClick={onCancel}>
            No
          </Button>

          <Button
            id="yes-btn"
            className="log-btn"
            variant="outlined"
            sx={{
              marginRight: 1.5,
              color: '#ffff',
              padding: '10px 28px !important',
              height: '45px'
            }}
            style={{ color: '#ffff' }}
            onClick={onConfirm}>
            Yes
          </Button>
        </Stack>
      </DialogActions>
    </>
  );
};

export default ConfirmationDialog;

ConfirmationDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  handleFormDialogClose: PropTypes.func
};
