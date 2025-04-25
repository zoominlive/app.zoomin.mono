import { Button } from '@mui/material';
import { errorMessageHandler } from './errormessagehandler';
import { useSnackbar } from 'notistack';
import { useContext } from 'react';
import AuthContext from '../context/authcontext';

export const useApiErrorHandler = () => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleApiError = (response) => {
    if (response.message === 'Network Error') {
      enqueueSnackbar('Please refresh the page.', {
        variant: 'info',
        action: (key) => (
          <Button
            onClick={() => {
              window.location.reload();
              closeSnackbar(key);
            }}
            sx={{ color: '#fff', textTransform: 'none' }}>
            Refresh
          </Button>
        )
      });
    } else {
      errorMessageHandler(
        enqueueSnackbar,
        response?.response?.data?.Message || 'Something Went Wrong.',
        response?.response?.status,
        authCtx.setAuthError
      );
    }
  };

  return handleApiError;
};
