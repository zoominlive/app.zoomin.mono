import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
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
import { Notification } from '../../hoc/notification';
import PropTypes from 'prop-types';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const validationSchema = yup.object({
  username_email: yup.string('Enter Username/email').required('Username / Email is required'),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required')
});

const Login = (props) => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          authCtx.setToken(response.data.Data.token);
          localStorage.setItem('token', response.data.Data.token);
          if (data.rememberMe) {
            localStorage.setItem('username_email', data.username_email);
            localStorage.setItem('password', data.password);
            localStorage.setItem('rememberMe', data.rememberMe);
          } else {
            localStorage.removeItem('username_email', data.username_email);
            localStorage.removeItem('password', data.password);
            localStorage.removeItem('rememberMe', data.rememberMe);
          }
        } else {
          props.snackbarShowMessage(response?.response?.data?.Message, 'error', 3000);
        }
        setSubmitLoading(false);
      })
      .catch((err) => console.log(err));
  };

  return (
    <Box className="auth-wrapper">
      <Card>
        <CardContent>
          <Box className="auth-container">
            <Typography component="h1" variant="h5">
              LOG IN
            </Typography>
            <Box>
              <Formik
                enableReinitialize
                validateOnChange
                validationSchema={validationSchema}
                initialValues={{
                  username_email: localStorage.getItem('rememberMe')
                    ? localStorage.getItem('username_email')
                    : '',
                  password: localStorage.getItem('rememberMe')
                    ? localStorage.getItem('password')
                    : '',
                  rememberMe: localStorage.getItem('rememberMe') ? true : false
                }}
                onSubmit={handleSubmit}>
                {({ values, setFieldValue, touched, errors }) => {
                  return (
                    <Form>
                      <Stack spacing={3} mb={4}>
                        <TextField
                          label="Username/Email"
                          name="username_email"
                          value={values?.username_email || ''}
                          onChange={(e) => {
                            setFieldValue('username_email', e.target.value || '');
                          }}
                          helperText={touched.username_email && errors.username_email}
                          error={touched.username_email && Boolean(errors.username_email)}
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
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="rememberMe"
                              checked={values.rememberMe}
                              onChange={(event) =>
                                setFieldValue('rememberMe', event.target.checked)
                              }
                            />
                          }
                          label="Remember me"
                        />
                        <LoadingButton
                          loading={submitLoading}
                          loadingPosition="center"
                          startIcon={submitLoading && <SaveIcon />}
                          variant="contained"
                          type="submit">
                          LOG IN
                        </LoadingButton>
                      </Stack>
                    </Form>
                  );
                }}
              </Formik>
              <Stack direction="row" justifyContent="center">
                <Link to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Notification(Login);

Login.propTypes = {
  snackbarShowMessage: PropTypes.func
};
