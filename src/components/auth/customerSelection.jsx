/* eslint-disable no-unused-vars */
import { LoadingButton } from '@mui/lab';
import {
  //Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  //LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
//import Loader from '../common/loader';
import LinerLoader from '../common/linearLoader';

const validationSchema = yup.object({
  customer: yup.string('Enter Customer').required('Customer is required')
});

const CustomerSelection = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customersList, setCustomersList] = useState([]);

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    // let token = localStorage.getItem('token');
    localStorage.setItem('cust_id', data?.customer);
    // authCtx.setToken(token);
    let customer = customersList.find((i) => i.cust_id === data?.customer);
    let name = customer.company_name;
    localStorage.setItem('cust_name', name);
    authCtx.setCustName(name);
    navigate('/customers');
    setSubmitLoading(false);
  };

  const handleLoginBack = () => {
    navigate('login');
  };

  const getCustomersList = () => {
    setIsLoading(true);
    API.get('customers/all', { params: { all: true } }).then((response) => {
      if (response.status === 200) {
        setCustomersList(response.data.Data.customers);
        //setTotalCustomers(response.data.Data.count);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    // if (authCtx.sessionCreated) {
    getCustomersList();
    // }
  }, []);
  console.log(isLoading);
  return (
    <Grid container>
      <Grid item md={6} sm={12} xs={12} alignContent={'center'}>
        <Box className="auth-wrapper">
          <Card>
            <CardContent>
              <Box className="auth-container">
                <Typography component="h1" variant="h5">
                  CUSTOMER
                </Typography>
                <Box className="customer-loader" component={'div'}>
                  <LinerLoader loading={isLoading} />
                </Box>
                <Formik
                  enableReinitialize
                  validateOnChange
                  validationSchema={validationSchema}
                  initialValues={{
                    customer: ''
                  }}
                  onSubmit={handleSubmit}>
                  {({ values, setFieldValue, touched, errors }) => {
                    return (
                      <Form>
                        <Stack spacing={3}>
                          <Box mt={1}>
                            <InputLabel id="customer">Customer</InputLabel>
                            <FormControl fullWidth>
                              <Select
                                labelId="customer"
                                id="customer"
                                value={values?.role}
                                label="Customer"
                                name="customer"
                                error={touched.customer && Boolean(errors.customer)}
                                onChange={(event) => {
                                  setFieldValue('customer', event.target.value);
                                }}>
                                {customersList.map((i) => {
                                  return (
                                    <MenuItem value={i.cust_id} key={i.cust_id}>
                                      {i.company_name}{' '}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                              {touched.customer && Boolean(errors.customer) && (
                                <FormHelperText sx={{ color: '#d32f2f' }}>
                                  {touched.customer && errors.customer}
                                </FormHelperText>
                              )}
                            </FormControl>
                          </Box>
                          <LoadingButton
                            loading={submitLoading}
                            loadingPosition="center"
                            startIcon={submitLoading && <SaveIcon />}
                            variant="contained"
                            type="submit">
                            Submit
                          </LoadingButton>
                          {/* <Button
                            variant="contained"
                            onClick={handleLoginBack}
                            disabled={submitLoading}>
                            Go Back To Login
                          </Button> */}
                        </Stack>
                      </Form>
                    );
                  }}
                </Formik>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Grid>
      <Grid item md={6} sm={12} xs={12} className="auth-img-div login-img" />
    </Grid>
  );
};

export default CustomerSelection;
