export const errorMessageHandler = (enqueueSnackbar, message, statusCode, setAuthError) => {
  if (statusCode === 401) {
    setAuthError(true);
    localStorage.removeItem('token');
    return;
  } else {
    enqueueSnackbar(message, { variant: 'error' });
  }
};
