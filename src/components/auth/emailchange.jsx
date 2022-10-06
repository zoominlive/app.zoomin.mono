import { Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useEffect } from 'react';
import Loader from '../common/loader';
import { useSnackbar } from 'notistack';

const EmailChange = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 3000);
    enqueueSnackbar('Test', {
      autoHideDuration: 3000,
      variant: 'success'
    });
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
