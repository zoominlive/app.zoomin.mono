import { IconButton } from '@mui/material';
import { useSnackbar } from 'notistack';
import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

function SnackbarCloseButton({ snackbarKey }) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton sx={{ color: 'white' }} onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon />
    </IconButton>
  );
}

export default SnackbarCloseButton;

SnackbarCloseButton.propTypes = {
  snackbarKey: PropTypes.any
};
