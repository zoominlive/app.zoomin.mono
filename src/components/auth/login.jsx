import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  InputLabel
} from '@mui/material';
import { Form, Formik } from 'formik';
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import PropTypes from 'prop-types';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import CustomerSelection from './customerSelection';
import TitleDiv from './titlediv';
import LinkDiv from './linkdiv';
// import AuthBg from '../../assets/auth-bg.png';
const validationSchema = yup.object({
  email: yup
    .string('Enter Username/email')
    .email('Enter valid username/email')
    .required('Username/Email is required'),
  password: yup
    .string('Enter your password')
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required')
});

const Login = () => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomerSelection, setShowCustomerSelection] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (authCtx.token) {
      //navigate('/dashboard');
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
          authCtx.setUser(response.data.Data.userData);
          if (response.data.Data.userData.role === 'Super Admin') {
            setShowCustomerSelection(true);
          } else {
            authCtx.setToken(response.data.Data.token);
          }
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
      {/* <div style={{}}>
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
      </div> */}

      <Grid container>
        <Grid item md={6} sm={12} xs={12}>
          <Card>
            <CardContent className="card-content">
              <TitleDiv
                isShowTitle={true}
                title={''}
                subtitle={'Live Streaming Video Families Adore'}
              />
              {showCustomerSelection ? (
                <CustomerSelection />
              ) : (
                <Box className="auth-wrapper">
                  <Box className="auth-container">
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
                              <Stack spacing={3}>
                                <Box mt={1}>
                                  <InputLabel id="email_address">Email Address</InputLabel>
                                  <TextField
                                    labelId="email_address"
                                    InputLabelProps={{
                                      focused: true,
                                      shrink: true
                                    }}
                                    placeholder="Please enter your email address"
                                    name="email"
                                    value={values?.email || ''}
                                    onChange={(e) => {
                                      setFieldValue('email', e.target.value || '');
                                    }}
                                    helperText={touched.email && errors.email}
                                    error={touched.email && Boolean(errors.email)}
                                    fullWidth
                                  />
                                </Box>
                                <Box>
                                  <InputLabel id="password">Password</InputLabel>
                                  <TextField
                                    autoComplete="current-password"
                                    labelId="password"
                                    placeholder="Please enter your password"
                                    InputLabelProps={{
                                      focused: true,
                                      shrink: true
                                    }}
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
                                            onClick={() =>
                                              setShowPassword((prevState) => !prevState)
                                            }>
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                          </IconButton>
                                        </InputAdornment>
                                      )
                                    }}
                                  />
                                </Box>
                                <Stack direction={'row'} justifyContent={'flex-end'}>
                                  <Link to="/forget-password" variant="body2">
                                    Forget password?
                                  </Link>
                                </Stack>
                                <LoadingButton
                                  loading={submitLoading}
                                  loadingPosition="center"
                                  startIcon={submitLoading && <SaveIcon />}
                                  variant="contained"
                                  type="submit">
                                  Login
                                </LoadingButton>
                              </Stack>
                            </Form>
                          );
                        }}
                      </Formik>

                      <LinkDiv />
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item md={6} sm={12} xs={12} className="auth-img-div login-img">
          {/* <Box component="img" src={AuthBg} alt={''} /> */}
        </Grid>
      </Grid>
    </>
  );
};

export default Login;

Login.propTypes = {
  snackbarShowMessage: PropTypes.func
};
