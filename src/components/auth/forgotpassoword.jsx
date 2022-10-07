import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';

const validationSchema = yup.object({
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required')
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleLoginBack = () => {
    navigate('login');
  };

  return (
    <Box className="auth-wrapper">
      <Card>
        <CardContent>
          <Box className="auth-container">
            <Typography component="h1" variant="h5">
              FORGOT PASSWORD
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
                    <Stack spacing={3} my={4}>
                      <TextField
                        name="email"
                        label="Username/Email"
                        value={values?.email}
                        onChange={(event) => {
                          setFieldValue('email', event.target.value);
                        }}
                        helperText={touched.email && errors.email}
                        error={touched.email && Boolean(errors.email)}
                        fullWidth
                      />
                      <LoadingButton
                        loading={submitLoading}
                        loadingPosition="center"
                        startIcon={submitLoading && <SaveIcon />}
                        variant="contained"
                        type="submit">
                        Submit
                      </LoadingButton>
                      <Button
                        variant="contained"
                        onClick={handleLoginBack}
                        disabled={submitLoading}>
                        Go Back To Login
                      </Button>
                    </Stack>
                  </Form>
                );
              }}
            </Formik>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
