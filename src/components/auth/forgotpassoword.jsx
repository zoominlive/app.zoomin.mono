import { LoadingButton } from '@mui/lab';
import {
  Box,
  // Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Grid,
  InputLabel
} from '@mui/material';
import { Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import TitleDiv from './titlediv';
import LinkDiv from './linkdiv';
import SuceessIcon from '../../assets/success-tick-icon.svg';
const validationSchema = yup.object({
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required')
});

const ForgotPassword = () => {
  //const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);

  // Method to sent the forgot password request
  const handleSubmit = (data, actions) => {
    setSubmitLoading(true);
    API.put('users/forgetPassword', data).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        actions.resetForm({
          values: {
            email: ''
          }
        });
        setIsLinkSent(true);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setSubmitLoading(false);
    });
  };

  // const handleLoginBack = () => {
  //   navigate('login');
  // };

  return (
    <Grid container>
      <Grid item md={6} sm={12} xs={12}>
        <Card>
          <CardContent className="card-content">
            <TitleDiv isShowTitle={false} title={''} subtitle={''} />
            <Box className="auth-wrapper">
              <Box className="auth-container">
                {isLinkSent ? (
                  <>
                    <Stack
                      direction={'column'}
                      justifyContent={'center'}
                      alignItems={'center'}
                      className="reset-text">
                      <Typography component="h1" variant="h5">
                        Reset Password
                      </Typography>
                      <Box component="img" src={SuceessIcon} alt={''} />
                      <Typography>
                        A reset password link has been sent to your registered email address. Click
                        the link there to set a new password.
                        <br />
                      </Typography>
                      <Typography>
                        Do not repeat this step if you already got a reset password link.
                      </Typography>
                    </Stack>
                    <br />
                    <Stack direction={'row'} justifyContent={'center'}>
                      {' '}
                      Remember your password? <Link to="/">Log in</Link>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Typography component="h1" variant="h5">
                      Forgot Password
                    </Typography>

                    <Formik
                      enableReinitialize
                      validateOnChange
                      validationSchema={validationSchema}
                      initialValues={{
                        email: ''
                      }}
                      onSubmit={handleSubmit}>
                      {({ values, setFieldValue, touched, errors }) => {
                        return (
                          <Form>
                            <Stack spacing={3}>
                              <Box mt={1}>
                                <InputLabel id="email">Email Address</InputLabel>
                                <TextField
                                  labelId="email"
                                  name="email"
                                  placeholder="Enter your email address"
                                  value={values?.email}
                                  onChange={(event) => {
                                    setFieldValue('email', event.target.value);
                                  }}
                                  helperText={touched.email && errors.email}
                                  error={touched.email && Boolean(errors.email)}
                                  fullWidth
                                />
                              </Box>
                              <LoadingButton
                                loading={submitLoading}
                                loadingPosition="center"
                                startIcon={submitLoading && <SaveIcon />}
                                variant="contained"
                                type="submit">
                                Submit
                              </LoadingButton>
                              <Stack direction={'row'} justifyContent={'center'}>
                                {' '}
                                Remember your password? <Link to="/">Log in</Link>
                              </Stack>

                              <LinkDiv />
                            </Stack>
                          </Form>
                        );
                      }}
                    </Formik>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item md={6} sm={12} xs={12} className="auth-img-div forgot-pwd-img"></Grid>
    </Grid>
  );
};

export default ForgotPassword;
