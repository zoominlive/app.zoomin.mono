import { Alert, Snackbar } from '@mui/material';
import React, { useState } from 'react';

export const Notification = (WrappedComponent) => {
  // eslint-disable-next-line react/display-name
  return (props) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("I'm a custom snackbar");
    const [duration, setDuration] = useState(2000);
    const [severity, setSeverity] = useState('success'); /** error | warning | info */

    // Method trigger the notification
    const showMessage = (message, severity = 'success', duration = 2000) => {
      setMessage(message);
      setSeverity(severity);
      setDuration(duration);
      setOpen(true);
    };

    // Method close the notification
    const handleClose = (_, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen(false);
    };

    return (
      <>
        <WrappedComponent {...props} snackbarShowMessage={showMessage} />
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          autoHideDuration={duration}
          open={open}
          onClose={handleClose}>
          <Alert variant="filled" onClose={handleClose} severity={severity}>
            {message}
          </Alert>
        </Snackbar>
      </>
    );
  };
};
