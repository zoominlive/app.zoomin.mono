import React, { useState, useContext } from 'react';
import {
  Divider,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Form, Formik } from 'formik';
import { LoadingButton } from '@mui/lab';
import PhoneNumberInput from '../common/phonenumberinput';
import SaveIcon from '@mui/icons-material/Save';
import * as yup from 'yup';
import AuthContext from '../../context/authcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import API from '../../api';
import moment from 'moment-timezone';
import PropTypes from 'prop-types';

const validationSchema = yup.object().shape({
  first_name: yup.string().required('First Name is required'),
  last_name: yup.string().required('Last Name is required'),
  relationship: yup.string().required('Role is required'),
  phone: yup
    .string()
    .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number'),
  email: yup.string().email('Enter valid email').required('Email is required')
});

const AddFamilyDialog = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    API.post('family/addParent', {
      ...data,
      family_id: authCtx.user.family_id,
      member_type: 'secondary',
      time_zone: moment.tz.guess(),
      location: authCtx.user.location,
      cust_id: localStorage.getItem('cust_id')
    })
      .then((response) => {
        if (response.status === 201) {
          enqueueSnackbar('New Family Member Added', { variant: 'success' });

          props.setOpen(false);
          setSubmitLoading(false);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
          props.setOpen(false);
          setSubmitLoading(false);
        }
      })
      .catch(() => setSubmitLoading(false));
  };

  const handleDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
    }
  };

  return (
    <Dialog open={props.open} onClose={handleDialogClose} fullWidth className="add-parentdialog">
      <DialogTitle>Add Secondary Family Member</DialogTitle>
      <DialogContentText>
        Add an additional family member that can watch the streams
      </DialogContentText>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: '',
          last_name: '',
          relationship: '',
          phone: '',
          email: ''
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors, isValidating }) => {
          return (
            <Form>
              <DialogContent sx={{ paddingBottom: '5px' }}>
                <Grid container spacing={2} sx={{ paddingTop: '20px', paddingBottom: '40px' }}>
                  <Grid item md={4} sm={12}>
                    <TextField
                      name={'first_name'}
                      value={values?.first_name}
                      onChange={(event) => {
                        setFieldValue('first_name', event.target.value);
                      }}
                      label="First Name"
                      helperText={touched.first_name && errors.first_name}
                      error={touched.first_name && Boolean(errors.first_name)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={4} sm={12}>
                    <TextField
                      label="Last Name"
                      name={'last_name'}
                      value={values?.last_name}
                      onChange={(event) => {
                        setFieldValue('last_name', event.target.value);
                      }}
                      helperText={touched.last_name && errors.last_name}
                      error={touched.last_name && Boolean(errors.last_name)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={4} sm={12} sx={{ width: '100%' }}>
                    <FormControl
                      fullWidth
                      error={touched.relationship && Boolean(errors.relationship)}>
                      <InputLabel id="role">Role</InputLabel>
                      <Select
                        labelId="role"
                        id="role"
                        label="Role"
                        name={'relationship'}
                        value={values?.relationship}
                        onChange={(event) => {
                          setFieldValue('relationship', event.target.value);
                        }}>
                        <MenuItem value={'Mother'}>Mother</MenuItem>
                        <MenuItem value={'Father'}>Father</MenuItem>
                        <MenuItem value={'Aunt'}>Aunt</MenuItem>
                        <MenuItem value={'Uncle'}>Uncle</MenuItem>
                        <MenuItem value={'Grandmother'}>Grandmother</MenuItem>
                        <MenuItem value={'Grandfather'}>Grandfather</MenuItem>
                        <MenuItem value={'Other'}>Other</MenuItem>
                      </Select>
                      {touched.relationship && Boolean(errors.relationship) && (
                        <FormHelperText sx={{ color: '#d32f2f' }}>
                          {touched.relationship && errors.relationship}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <TextField
                      name={'phone'}
                      label="Phone"
                      value={values?.phone || ''}
                      onChange={(event) => {
                        setFieldValue('phone', event.target.value ? event.target.value : '');
                      }}
                      helperText={touched.phone && errors.phone}
                      error={touched.phone && Boolean(errors.phone)}
                      InputProps={{ inputComponent: PhoneNumberInput }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <TextField
                      name={'email'}
                      label="Email"
                      value={values?.email}
                      onChange={(event) => {
                        setFieldValue('email', event.target.value);
                      }}
                      helperText={touched.email && errors.email}
                      error={touched.email && Boolean(errors.email)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Divider />
                <DialogActions>
                  <Button
                    disabled={submitLoading || isValidating}
                    variant="text"
                    onClick={handleDialogClose}>
                    CANCEL
                  </Button>
                  <LoadingButton
                    loading={submitLoading || isValidating}
                    loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                    startIcon={(submitLoading || isValidating) && <SaveIcon />}
                    variant="text"
                    type="submit">
                    SAVE CHANGES
                  </LoadingButton>
                </DialogActions>
              </DialogContent>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
};
export default AddFamilyDialog;

AddFamilyDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
