import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import PhoneNumberInput from '../common/phonenumberinput';

const validationSchema = yup.object().shape({
  first_name: yup.string().required('First Name is required'),
  last_name: yup.string().required('Last Name is required'),
  role: yup.string().required('Role is required'),
  phone: yup
    .string()
    .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
    .required('Phone is required'),
  email: yup.string().email('Enter valid email').required('Email is required')
});

const ParentsForm = (props) => {
  const handleSubmit = (data) => {
    console.log('Data', data);
  };

  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="add-parentdialog">
      <DialogTitle>Add Parent</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: '',
          last_name: '',
          role: '',
          phone: '',
          email: ''
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
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
                  <Grid item md={4} sm={12}>
                    <FormControl fullWidth>
                      <InputLabel id="role">Role</InputLabel>
                      <Select
                        labelId="role"
                        id="role"
                        label="Role"
                        name={'role'}
                        value={values?.role}
                        onChange={(event) => {
                          setFieldValue('role', event.target.value);
                        }}>
                        <MenuItem value={'Mother'}>Mother</MenuItem>
                        <MenuItem value={'Father'}>Father</MenuItem>
                        <MenuItem value={'Aunt'}>Aunt</MenuItem>
                        <MenuItem value={'Uncle'}>Uncle</MenuItem>
                        <MenuItem value={'Grandmother'}>Grandmother</MenuItem>
                        <MenuItem value={'Grandfather'}>Grandfather</MenuItem>
                        <MenuItem value={'Other'}>Other</MenuItem>
                      </Select>
                      {touched.role && Boolean(errors.role) && (
                        <FormHelperText sx={{ color: '#d32f2f' }}>
                          {touched.role && errors.role}
                        </FormHelperText>
                      )}
                    </FormControl>
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
                  <Grid item md={6} sm={12}>
                    <TextField
                      name={'phone'}
                      label="Phone"
                      value={values?.phone}
                      onChange={(event) => {
                        setFieldValue('phone', event.target.value);
                      }}
                      helperText={touched.phone && errors.phone}
                      error={touched.phone && Boolean(errors.phone)}
                      InputProps={{ inputComponent: PhoneNumberInput }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <Divider />
              <DialogActions>
                <Button variant="text" onClick={() => props.setOpen(false)}>
                  CANCEL
                </Button>
                <Button variant="text" type="submit">
                  SAVE CHANGES
                </Button>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
      <Divider />
    </Dialog>
  );
};

export default ParentsForm;

ParentsForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
