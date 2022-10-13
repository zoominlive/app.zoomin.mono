export const errorMessageHandler = (enqueueSnackbar, message, statusCode, setAuthError) => {
  if (statusCode === 401) {
    setAuthError(true);
    localStorage.clear();
    return;
  } else {
    enqueueSnackbar(message, { variant: 'error' });
  }
};
