export const errorMessageHandler = (enqueueSnackbar, message, statusCode, navigate, setToken) => {
  if (statusCode === 401) {
    enqueueSnackbar(message, { variant: 'error' });
    localStorage.removeItem('token');
    navigate('/login');
    setToken();
    return;
  } else {
    enqueueSnackbar(message, { variant: 'error' });
  }
};
