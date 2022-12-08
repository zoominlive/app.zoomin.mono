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
import moment from 'moment-timezone';
const validationSchema = yup.object({
  rooms: yup.array().min(1, 'Atleast one room is required'),
  locations: yup.array().min(1, 'Select at least one location').required('required')
});

const ChildForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Method to close the form dialog
  const handleDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
      props.setChild();
    }
  };

  // Method to create/edit the child
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
        time_zone: moment.tz.guess(),
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

  const setRoomsList = (locations) => {
    if (locations?.length !== 0) {
      return props.roomsList
        .filter((room) => {
          let count = 0;
          locations?.forEach((loc) => {
            if (loc == room.location) {
              count = 1;
            }
          });

          return count === 1;
        })
        .sort((a, b) => (a.room_name > b.room_name ? 1 : -1));
    } else {
      return [];
    }
  };

  return (
    <Dialog open={props.open} onClose={handleDialogClose} fullWidth className="add-child-drawer">
      <DialogTitle>{'Add Rooms'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          rooms: props.child ? props.child.rooms.rooms : [],
          locations: props.child ? props.child.location.locations : []
        }}
        onSubmit={(e) => {
          if (e === 'hello') {
            handleSubmit();
          }
        }}>
        {({ values, setFieldValue, touched, errors, isValidating }) => {
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={3}>
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
                  <Grid item md={6} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      options={setRoomsList(values?.locations)}
                      noOptionsText={'Select location first'}
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
