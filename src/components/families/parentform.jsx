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
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import PhoneNumberInput from '../common/phonenumberinput';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import API from '../../api';

const validationSchema = yup.object().shape({
  first_name: yup.string().required('First Name is required'),
  last_name: yup.string().required('Last Name is required'),
  relationship: yup.string().required('Role is required'),
  phone: yup
    .string()
    .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number')
    .required('Phone is required'),
  email: yup.string().email('Enter valid email').required('Email is required')
});

const ParentsForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Method to create/edit parent
  const handleSubmit = (data) => {
    setSubmitLoading(true);
    if (props.primaryParent || props.secondaryParent) {
      const family_member_id = props.primaryParent
        ? props.primaryParent.family_member_id
        : props.secondaryParent.family_member_id;
      API.put('family/edit', { ...data, family_member_id }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          if (props.primaryParent) {
            props.setFamily((prevState) => {
              const tempFamily = { ...prevState };
              tempFamily.primary = {
                family_member_id: props.primaryParent.family_member_id,
                ...data
              };
              return tempFamily;
            });
          } else {
            props.setFamily((prevState) => {
              const tempFamily = { ...prevState };
              const index = tempFamily.secondary.findIndex(
                (parent) => parent.family_member_id === props.secondaryParent.family_member_id
              );
              tempFamily.secondary[index] = {
                family_member_id: props.secondaryParent.family_member_id,
                ...data
              };
              return tempFamily;
            });
          }
          handleDialogClose();
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
    } else {
      API.post('family/addParent', {
        ...data,
        family_id: props.family.primary.family_id,
        member_type: 'secondary',
        location: authCtx.user.location
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          handleDialogClose();
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
    }
  };

  const handleDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setPrimaryParent();
      props.setSecondaryParent();
    }
  };

  return (
    <Dialog open={props.open} onClose={handleDialogClose} fullWidth className="add-parentdialog">
      <DialogTitle>
        {props.primaryParent || props.secondaryParent ? 'Edit Parent' : 'Add Parent'}
      </DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: props.primaryParent
            ? props.primaryParent.first_name
            : props.secondaryParent
            ? props.secondaryParent.first_name
            : '',
          last_name: props.primaryParent
            ? props.primaryParent.last_name
            : props.secondaryParent
            ? props.secondaryParent.last_name
            : '',
          relationship: props.primaryParent
            ? props.primaryParent.relationship
            : props.secondaryParent
            ? props.secondaryParent.relationship
            : '',
          phone: props.primaryParent
            ? props.primaryParent.phone
            : props.secondaryParent
            ? props.secondaryParent.phone
            : '',
          email: props.primaryParent
            ? props.primaryParent.email
            : props.secondaryParent
            ? props.secondaryParent.email
            : ''
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors, isValidating }) => {
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
              </DialogContent>
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
  setOpen: PropTypes.func,
  family: PropTypes.object,
  primaryParent: PropTypes.any,
  setPrimaryParent: PropTypes.func,
  secondaryParent: PropTypes.any,
  setSecondaryParent: PropTypes.func,
  setFamily: PropTypes.func,
  getFamiliesList: PropTypes.func
};
