import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const validationSchema = yup.object({
  email: yup.string('Enter your email').email('Enter a valid email').required('Email is required')
});

const ForgotPassword = () => {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    console.log(data);
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
                    <Stack spacing={3} mt={4} mb={4}>
                      <TextField
                        name="email"
                        label="Email"
                        value={values?.email}
                        onChange={(event) => {
                          setFieldValue('email', event.target.value);
                        }}
                        helperText={touched.email && errors.email}
                        error={touched.email && Boolean(errors.email)}
                        fullWidth
                      />
                      <LoadingButton
                        //   loading={submitLoading}
                        loadingPosition="center"
                        //   startIcon={submitLoading && <SaveIcon />}
                        variant="contained"
                        type="submit">
                        Submit
                      </LoadingButton>
                      <Button variant="contained" onClick={handleLoginBack}>
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
