import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Form, Formik } from 'formik';
import React from 'react';
import { useState } from 'react';
import * as yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLocation } from 'react-router-dom';
import API from '../../api';
import { useSnackbar } from 'notistack';
import SaveIcon from '@mui/icons-material/Save';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const { search } = useLocation();

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    API.post('users/setPassword', { token: search.substring(1), password: data.password }).then(
      (response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
        } else {
          enqueueSnackbar(response?.response?.data?.Message, {
            variant: 'error'
          });
        }
        setSubmitLoading(false);
      }
    );
  };

  return (
    <Box className="auth-wrapper">
      <Card>
        <CardContent>
          <Box className="auth-container">
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
                                onClick={() => setShowConfirmPassword((prevState) => !prevState)}>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SetPassword;
