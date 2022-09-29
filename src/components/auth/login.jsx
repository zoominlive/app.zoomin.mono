import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox
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

const validationSchema = yup.object({
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required'),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required')
});

const Login = (props) => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);

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
            localStorage.setItem('email', data.email);
            localStorage.setItem('password', data.password);
            localStorage.setItem('rememberMe', data.rememberMe);
          } else {
            localStorage.removeItem('email', data.email);
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
    <Box className="login-wrapper">
      <Card>
        <CardContent>
          <Box className="login-container">
            <Typography component="h1" variant="h5">
              LOG IN
            </Typography>
            <Box>
              <Formik
                enableReinitialize
                validateOnChange
                validationSchema={validationSchema}
                initialValues={{
                  email: localStorage.getItem('rememberMe') ? localStorage.getItem('email') : '',
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
                          label="Email"
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
                          type="password"
                          name="password"
                          onChange={(e) => {
                            setFieldValue('password', e.target.value || '');
                          }}
                          value={values?.password || ''}
                          helperText={touched.password && errors.password}
                          error={touched.password && Boolean(errors.password)}
                          fullWidth
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
              <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
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
