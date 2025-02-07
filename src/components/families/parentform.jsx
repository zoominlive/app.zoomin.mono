import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Button,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Formik, useFormik } from 'formik';
import * as yup from 'yup';
import PhoneNumberInput from '../common/phonenumberinput';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import API from '../../api';
import moment from 'moment-timezone';

const validationSchema = yup.object().shape({
  first_name: yup.string().required('First Name is required'),
  last_name: yup.string().required('Last Name is required'),
  relationship: yup.string().required('Role is required'),
  phone: yup
    .string()
    .matches(/^(1\s?)?(\d{3}|\(\d{3}\))[\s-]?\d{3}[\s-]?\d{4}$/gm, 'Enter valid phone number'),
  email: yup.string().email('Enter valid email').required('Email is required')
});

const ParentsForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);

  let verifiedPrimaryParent = props.primaryParent?.is_verified;
  let verifiedSecondaryParent = props.secondaryParent?.is_verified;
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
      API.post('family/add-secondary-family-member', {
        ...data,
        family_id: props.family.primary.family_id,
        member_type: 'secondary',
        time_zone: moment.tz.guess(),
        location: authCtx.user.locations,
        cust_id: localStorage.getItem('cust_id'),
        tenant_id: localStorage.getItem('tenant_id')
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

  const handleClose = () => {
    setIsCloseDialog(!isCloseDialog);
  };

  const resendInvite = (newData) => {
    if (props.primaryParent || props.secondaryParent) {
      const family_member_id = props.primaryParent
        ? props.primaryParent.family_member_id
        : props.secondaryParent.family_member_id;
      setSubmitLoading(true);
      API.put('family/edit', { ...newData, family_member_id, inviteFamily: true }).then(
        (response) => {
          if (response.status === 200) {
            enqueueSnackbar(response.data.Message, { variant: 'success' });
            props.getFamiliesList();
            if (props.primaryParent) {
              props.setFamily((prevState) => {
                const tempFamily = { ...prevState };
                tempFamily.primary = {
                  family_member_id: props.primaryParent.family_member_id,
                  ...newData
                };
                console.log('tempFamily', tempFamily);
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
                  ...newData
                };
                console.log('tempFamily', tempFamily);
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
        }
      );
    }
  };

  const formik = useFormik({
    initialValues: {
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
    }
  });

  return (
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-parentdialog">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.primaryParent || props.secondaryParent
          ? `${
              props.parentType == 'primary'
                ? 'Edit Primary Family Member'
                : 'Edit Secondary Family Member'
            }`
          : `${
              props.parentType == 'primary'
                ? 'Add Primary Family Member'
                : 'Add Secondary Family Member'
            }`}
        <DialogContentText>
          {props.primaryParent || props.secondaryParent
            ? `${
                props.parentType == 'primary'
                  ? 'Edit primary family member so they can watch stream'
                  : 'Edit an additional family member that can watch the streams'
              }`
            : `${
                props.parentType == 'primary'
                  ? 'Add primary family member so they can watch stream'
                  : 'Add an additional family member that can watch the streams'
              }`}
        </DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />
      {isCloseDialog ? (
        <>
          <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
            <DialogContentText>
              Are you sure you want to exit before completing the wizard ?
            </DialogContentText>
          </Stack>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <Stack direction="row" justifyContent="flex-end" width="100%">
              <Button
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5 }}
                onClick={() => {
                  setIsCloseDialog(false);
                }}>
                No
              </Button>

              <Button
                id="yes-btn"
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5, color: '#ffff' }}
                style={{ color: '#ffff' }}
                onClick={() => {
                  setIsCloseDialog(false);
                  props.setOpen(false);
                  props.setPrimaryParent();
                  props.setSecondaryParent();
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </>
      ) : (
        <Formik
          enableReinitialize
          validateOnChange
          validationSchema={validationSchema}
          initialValues={formik.initialValues}
          onSubmit={handleSubmit}>
          {({ values, setFieldValue, touched, errors, isValidating }) => {
            return (
              <Form>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="first_name">First Name</InputLabel>
                      <TextField
                        labelId="first_name"
                        name={'first_name'}
                        placeholder="Enter First Name"
                        value={values?.first_name}
                        onChange={(event) => {
                          setFieldValue('first_name', event.target.value);
                        }}
                        helperText={touched.first_name && errors.first_name}
                        error={touched.first_name && Boolean(errors.first_name)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="last_name">Last Name</InputLabel>
                      <TextField
                        labelId="last_name"
                        name={'last_name'}
                        placeholder="Enter Last Name"
                        value={values?.last_name}
                        onChange={(event) => {
                          setFieldValue('last_name', event.target.value);
                        }}
                        helperText={touched.last_name && errors.last_name}
                        error={touched.last_name && Boolean(errors.last_name)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={6} sm={12}>
                      <InputLabel id="role">Role</InputLabel>
                      <FormControl
                        fullWidth
                        error={touched.relationship && Boolean(errors.relationship)}>
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
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="phone">Phone</InputLabel>
                      <TextField
                        labelId="phone"
                        name={'phone'}
                        placeholder="Enter Phone Number"
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
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="email">Email</InputLabel>
                      <TextField
                        labelId="email"
                        name={'email'}
                        placeholder="Enter Email"
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
                <DialogActions
                  sx={{
                    justifyContent:
                      verifiedPrimaryParent || verifiedSecondaryParent
                        ? 'flex-end'
                        : 'space-between'
                  }}>
                  {/* <Button
                  disabled={submitLoading || isValidating}
                  variant="text"
                  onClick={handleDialogClose}>
                  CANCEL
                </Button> */}
                  {verifiedPrimaryParent || verifiedSecondaryParent ? (
                    ''
                  ) : (
                    <LoadingButton
                      loadingPosition={submitLoading ? 'start' : undefined}
                      startIcon={submitLoading && <SaveIcon />}
                      loading={submitLoading}
                      onClick={() => resendInvite(formik.values)}>
                      {submitLoading === false && 'Resend Invite'}
                    </LoadingButton>
                  )}
                  <LoadingButton
                    className="add-btn dashboard-btn"
                    loading={submitLoading || isValidating}
                    loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                    startIcon={(submitLoading || isValidating) && <SaveIcon />}
                    type="submit"
                    sx={{
                      borderRadius: 30,
                      background: '#5A53DD',
                      color: '#fff',
                      textTransform: 'capitalize',
                      width: 'auto'
                    }}>
                    Save Changes
                  </LoadingButton>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      )}
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
  getFamiliesList: PropTypes.func,
  parentType: PropTypes.string
};
