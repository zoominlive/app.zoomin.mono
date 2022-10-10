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

const EmailChange = () => {
  const { search } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setIsLoading(true);
    API.post('users/emailChange', { token: search.substring(1) }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status
        );
      }
    });
    setIsLoading(false);
  }, []);

  return (
    <Box className="auth-wrapper">
      <Loader loading={isLoading} />
      {!isLoading && (
        <Card sx={{ height: 300 }}>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
              <Avatar sx={{ color: 'green', background: '#1976D20A' }}>
                <CheckIcon />
              </Avatar>
              <Typography>Email Successfully Changed.</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmailChange;
