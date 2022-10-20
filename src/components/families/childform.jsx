import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Grid,
  Autocomplete
} from '@mui/material';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import API from '../../api';
import { useState } from 'react';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';

const validationSchema = yup.object({
  first_name: yup.string().required('First Name is required'),
  last_name: yup.string().required('Last Name is required'),
  rooms: yup.array().min(1, 'Atleast one room is required'),
  locations: yup.array().min(1, 'Select at least one location').required('required')
});

const ChildForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setChild();
    }
  };

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    if (props.child) {
      API.put('family/child/edit', {
        first_name: data.first_name,
        last_name: data.last_name,
        rooms: { rooms: data.rooms },
        location: { locations: data.locations },
        child_id: props.child.child_id
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          props.setFamily((prevState) => {
            const tempFamily = { ...prevState };
            const index = tempFamily.children.findIndex(
              (child) => child.child_id === props.child.child_id
            );
            if (index !== -1) {
              tempFamily.children[index] = {
                child_id: props.child.child_id,
                ...response.data.Data
              };
            }
            return tempFamily;
          });
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
      API.post('family/child/add', {
        first_name: data.first_name,
        last_name: data.last_name,
        rooms: { rooms: data.rooms },
        location: { locations: data.locations },
        family_id: props.family.primary.family_id
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.setFamily();
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

  return (
    <Dialog open={props.open} onClose={handleDialogClose} fullWidth className="add-child-drawer">
      <DialogTitle>{props.child ? 'Edit Child' : 'Add Child'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: props.child ? props.child.first_name : '',
          last_name: props.child ? props.child.last_name : '',
          rooms: props.child ? props.child.rooms.rooms : [],
          locations: props.child ? props.child.location.locations : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors, isValidating }) => {
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item md={6} sm={12}>
                    <TextField
                      name="first_name"
                      label="First Name"
                      value={values.first_name}
                      onChange={(event) => {
                        setFieldValue('first_name', event.target.value);
                      }}
                      helperText={touched.first_name && errors.first_name}
                      error={touched.first_name && Boolean(errors.first_name)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <TextField
                      name="last_name"
                      label="Last Name"
                      value={values.last_name}
                      onChange={(event) => {
                        setFieldValue('last_name', event.target.value);
                      }}
                      helperText={touched.last_name && errors.last_name}
                      error={touched.last_name && Boolean(errors.last_name)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      options={props.roomsList.sort((a, b) => (a.room_name > b.room_name ? 1 : -1))}
                      value={values?.rooms}
                      isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                      getOptionLabel={(option) => {
                        return option.room_name;
                      }}
                      onChange={(_, value) => {
                        setFieldValue('rooms', value);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option.room_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rooms"
                          helperText={touched.rooms && errors.rooms}
                          error={touched.rooms && Boolean(errors.rooms)}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      options={authCtx?.user?.location?.selected_locations.sort((a, b) =>
                        a > b ? 1 : -1
                      )}
                      value={values?.locations}
                      onChange={(_, value) => {
                        setFieldValue('locations', value);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Locations"
                          helperText={touched.locations && errors.locations}
                          error={touched.locations && Boolean(errors.locations)}
                          fullWidth
                        />
                      )}
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
    </Dialog>
  );
};

export default ChildForm;

ChildForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  roomsList: PropTypes.array,
  family: PropTypes.object,
  child: PropTypes.any,
  setChild: PropTypes.func,
  setFamily: PropTypes.func,
  getFamiliesList: PropTypes.func
};
