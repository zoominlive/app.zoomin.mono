import { LoadingButton } from '@mui/lab';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Form, Formik } from 'formik';
import React, { useEffect } from 'react';
import { useState } from 'react';
import * as yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api';
import { useSnackbar } from 'notistack';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import Loader from '../common/loader';
const validationSchema = yup.object({
  password: yup
    .string('Enter password')
    .required('Password is required')
    .min(6, 'Password must be atleast 6 character log'),
  confirm_password: yup
    .string('Enter confirm password')
    .required('Confirm password is required')
    .oneOf([yup.ref('password'), null], 'Password must match')
});

const SetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isPasswordSetSuccesful, setIsPasswordSetSuccesful] = useState(false);
  const { search } = useLocation();
  const [linkStatus, setLinkStatus] = useState('loading');

  useEffect(() => {
    const queryParams = search?.substring(1)?.split('&');
    const token = queryParams && queryParams[0]?.substring(6);
    const type = queryParams && queryParams[1]?.substring(5);

    API.post(type === 'family' ? 'family/checkLinkValid' : 'users/checkLinkValid', {
      token: token
    }).then((response) => {
      if (response.status === 200) {
        setLinkStatus(true);
      } else {
        setLinkStatus(false);
      }
    });
  }, []);

  // Method to sent the set password request
  const handleSubmit = (data) => {
    const queryParams = search?.substring(1)?.split('&');
    const token = queryParams && queryParams[0].substring(6);
    const type = queryParams && queryParams[1].substring(5);

    setSubmitLoading(true);
    API.post(type === 'family' ? 'family/setPassword' : 'users/setPassword', {
      token: token,
      password: data.password
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        setIsPasswordSetSuccesful(true);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status
        );
      }
      setSubmitLoading(false);
    });
  };

  return (
    <>
      {linkStatus === true ? (
        <Box className="auth-wrapper">
          <Card>
            <CardContent>
              <Box className="auth-container">
                {!isPasswordSetSuccesful ? (
                  <>
                    {' '}
                    <Typography component="h1" variant="h5">
                      SET PASSWORD
                    </Typography>
                    <Formik
                      enableReinitialize
                      validateOnChange
                      validationSchema={validationSchema}
                      initialValues={{
                        password: '',
                        confirm_password: ''
                      }}
                      onSubmit={handleSubmit}>
                      {({ values, setFieldValue, touched, errors }) => {
                        return (
                          <Form>
                            <Stack spacing={3} my={4}>
                              <TextField
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={values?.password}
                                onChange={(event) => {
                                  setFieldValue('password', event.target.value);
                                }}
                                helperText={touched.password && errors.password}
                                error={touched.password && Boolean(errors.password)}
                                fullWidth
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword((prevState) => !prevState)}>
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                              <TextField
                                name="confirm_password"
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={values?.confirm_password}
                                onChange={(event) => {
                                  setFieldValue('confirm_password', event.target.value);
                                }}
                                helperText={touched.confirm_password && errors.confirm_password}
                                error={touched.confirm_password && Boolean(errors.confirm_password)}
                                fullWidth
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() =>
                                          setShowConfirmPassword((prevState) => !prevState)
                                        }>
                                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                              <LoadingButton
                                loading={submitLoading}
                                loadingPosition="center"
                                startIcon={submitLoading && <SaveIcon />}
                                variant="contained"
                                type="submit">
                                Submit
                              </LoadingButton>
                            </Stack>
                          </Form>
                        );
                      }}
                    </Formik>
                  </>
                ) : (
                  <Stack spacing={4} height={300} alignItems="center" justifyContent="center">
                    <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
                      <Avatar sx={{ color: 'green', background: '#1976D20A' }}>
                        <CheckIcon />
                      </Avatar>
                      <Typography>Password Successfully Changed.</Typography>
                    </Stack>
                    <Button onClick={() => navigate('login')} variant="contained">
                      Go Back To Login
                    </Button>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Box className="auth-wrapper">
          <Loader loading={linkStatus == 'loading' ? true : false} />
          {linkStatus !== 'loading' && (
            <Card sx={{ height: 300 }}>
              <CardContent>
                <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
                  <Avatar sx={{ color: 'red', background: '#1976D20A' }}>
                    <ErrorIcon />
                  </Avatar>
                  <Typography>Link Expired.</Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </>
  );
};

export default SetPassword;
