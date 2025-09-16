import { Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useEffect } from 'react';
import Loader from '../common/loader';
import API from '../../api';
import { useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import ErrorIcon from '@mui/icons-material/Error';

const EmailChange = () => {
  const { search } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const [success, setSuccess] = useState();

  useEffect(() => {
    setIsLoading(true);
    const queryParams = search?.substring(1)?.split('&');
    const token = queryParams && queryParams[0]?.substring(6);
    const type = queryParams && queryParams[1]?.substring(5);
    API.post(type === 'family' ? 'family/emailChange' : 'users/emailChange', { token: token }).then(
      (response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, {
            variant: 'success'
          });
          setIsLoading(false);
          setSuccess(true);
        } else {
          setIsLoading(false);
          setSuccess(false);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status
          );
        }
      }
    );
  }, []);

  return (
    <Box className="auth-wrapper">
      <Loader loading={isLoading} />
      {!isLoading && (
        <Card sx={{ height: 300 }}>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
              {success ? (
                <>
                  <Avatar sx={{ color: 'green', background: '#1976D20A' }}>
                    <CheckIcon />
                  </Avatar>
                  <Typography>Email Successfully Changed</Typography>
                </>
              ) : (
                <>
                  {' '}
                  <Avatar sx={{ color: 'red', background: '#1976D20A' }}>
                    <ErrorIcon />
                  </Avatar>
                  <Typography>Something went wrong.</Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmailChange;
