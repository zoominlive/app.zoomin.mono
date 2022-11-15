import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Form, Formik } from 'formik';
import React, { useEffect } from 'react';
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';

const validationSchema = yup.object({
  email: yup
    .string('Enter Username/email')
    .email('Enter valid username/email')
    .required('Username/Email is required'),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required')
});

const Login = () => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (authCtx.token) {
      navigate('/dashboard');
    }
  }, [authCtx.token, navigate]);

  // Method to handle login
  const handleSubmit = (data) => {
    setSubmitLoading(true);
    API.post('users/login', data)
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem('token', response.data.Data.token);
          localStorage.setItem('user', JSON.stringify(response.data.Data.userData));
          authCtx.setToken(response.data.Data.token);
          if (authCtx.authError) {
            authCtx.setAuthError(false);
          }
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status
          );
        }
        setSubmitLoading(false);
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div style={{}}>
        <img
          src="https://zoomin-dev-images.s3.us-west-2.amazonaws.com/zoomin-logo/Group+6.png"
          alt=""
          style={{
            marginTop: '7vh',
            display: 'block',
            height: '120px',
            width: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        />
      </div>
      <Box className="auth-wrapper">
        <Card>
          <CardContent>
            <Box className="auth-container">
              <Typography component="h1" variant="h5">
                SIGN IN
              </Typography>
              <Box>
                <Formik
                  enableReinitialize
                  validateOnChange
                  validationSchema={validationSchema}
                  initialValues={{
                    email: '',
                    password: ''
                  }}
                  onSubmit={handleSubmit}>
                  {({ values, setFieldValue, touched, errors }) => {
                    return (
                      <Form>
                        <Stack spacing={3} mb={4}>
                          <TextField
                            label="Username/Email"
                            name="email"
                            value={values?.email || ''}
                            onChange={(e) => {
                              setFieldValue('email', e.target.value || '');
                            }}
                            helperText={touched.email && errors.email}
                            error={touched.email && Boolean(errors.email)}
                            fullWidth
                          />
                          <TextField
                            autoComplete="current-password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            onChange={(e) => {
                              setFieldValue('password', e.target.value || '');
                            }}
                            value={values?.password || ''}
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
                          <LoadingButton
                            loading={submitLoading}
                            loadingPosition="center"
                            startIcon={submitLoading && <SaveIcon />}
                            variant="contained"
                            type="submit">
                            SIGN IN
                          </LoadingButton>
                        </Stack>
                      </Form>
                    );
                  }}
                </Formik>
                <Stack direction="row" justifyContent="space-between">
                  <a
                    href="https://www.zoominlive.com/privacy-policy"
                    rel="noreferrer"
                    target="_blank">
                    Privacy Policy
                  </a>
                  <a
                    href="https://www.zoominlive.com/terms-conditions"
                    rel="noreferrer"
                    target="_blank">
                    Terms Of Service
                  </a>
                  <Link to="/forgot-password" variant="body2">
                    Forgot password?
                  </Link>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Login;

Login.propTypes = {
  snackbarShowMessage: PropTypes.func
};
