import React from 'react';
import PropTypes from 'prop-types';
import {
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Grid,
  Autocomplete,
  FormControlLabel,
  Radio,
  DialogContentText,
  IconButton,
  InputLabel
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
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';

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
  const [selectedOption, setSelectedOption] = useState('Start Now');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);

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

          //   const tempFamily = { ...prevState };
          //   const index = tempFamily.children.findIndex(
          //     (child) => child.child_id === props.child.child_id
          //   );
          //   if (index !== -1) {
          //     tempFamily.children[index] = {
          //       child_id: props.child.child_id,
          //       ...response.data.Data
          //     };
          //   }
          //   return tempFamily;
          // });

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
      data.rooms.forEach((room) => {
        room.scheduled_enable_date = startDate;
      });
      API.post('family/child/add', {
        first_name: data.first_name,
        last_name: data.last_name,
        time_zone: moment.tz.guess(),
        enable_date: startDate,
        selected_option: selectedOption,
        rooms: { rooms: data.rooms },
        location: { locations: data.locations },
        family_id: props.family.primary.family_id,
        cust_id: localStorage.getItem('cust_id')
      }).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          //props.setFamily();

          props.getFamiliesList();
          // props.setFamily((prevState) => {
          //   const tempFamily = { ...prevState };
          //   // const index = tempFamily.children.findIndex(
          //   //   (child) => child.child_id === props.child.child_id
          //   // );
          //   // if (index !== -1) {
          //   //   tempFamily.children[index] = {
          //   //     child_id: props.child.child_id,
          //   //     ...response.data.Data
          //   //   };
          //   // }
          //   console.log('===tempFamily===', tempFamily);
          //   return tempFamily;
          // });

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
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {props.child ? 'Edit Child' : 'Add Child'}
        <DialogContentText>
          {props.child ? 'Edit' : 'Add'} child so they can watch stream
        </DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleDialogClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: props.child ? props.child.first_name : '',
          last_name: props.child ? props.child.last_name : '',
          rooms: props.child
            ? props.child?.roomsInChild.map((room) => {
                return {
                  room_name: room.room.room_name,
                  location: room.room.location,
                  room_id: room.room_id
                };
              })
            : [],
          locations: props.child ? props.child.location.locations : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors, isValidating }) => {
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item md={6} sm={12}>
                    <InputLabel id="first_name">Child First Name</InputLabel>
                    <TextField
                      labelId="first_name"
                      name="first_name"
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
                    <InputLabel id="last_name">Child Last Name</InputLabel>
                    <TextField
                      labelId="last_name"
                      name="last_name"
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
                    <InputLabel id="locations">Locations</InputLabel>
                    <Autocomplete
                      labelId="locations"
                      fullWidth
                      multiple
                      id="locations"
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
                          helperText={touched.locations && errors.locations}
                          error={touched.locations && Boolean(errors.locations)}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item md={6} sm={12}>
                    <InputLabel id="rooms">Rooms</InputLabel>
                    <Autocomplete
                      labelId="rooms"
                      fullWidth
                      multiple
                      id="rooms"
                      options={props.roomsList
                        .sort((a, b) => (a?.room_name > b?.room_name ? 1 : -1))
                        ?.filter((room) => {
                          if (values?.locations?.find((loc) => loc == room?.location)) {
                            return room;
                          }
                        })}
                      noOptionsText="Select location first"
                      value={values?.rooms}
                      isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                      getOptionLabel={(option) => {
                        return option?.room_name;
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
                          helperText={touched.rooms && errors.rooms}
                          error={touched.rooms && Boolean(errors.rooms)}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  {!props.child && (
                    <>
                      {' '}
                      <Grid item md={12} sm={12}>
                        <FormControlLabel
                          value="Start Now"
                          control={
                            <Radio
                              checked={selectedOption === 'Start Now'}
                              onChange={(e) => {
                                setStartDate(null);
                                setSelectedOption(e.target.value);
                              }}
                            />
                          }
                          label="Start Now"
                        />
                      </Grid>
                      <Grid item md={3} sm={12}>
                        <FormControlLabel
                          value="Schedule start date"
                          control={
                            <Radio
                              checked={selectedOption === 'Schedule start date'}
                              onChange={(e) => {
                                setStartDate(moment());
                                setSelectedOption(e.target.value);
                              }}
                            />
                          }
                          label="Schedule start date"
                        />
                      </Grid>
                      <Grid item md={3.5} sm={12}>
                        {selectedOption === 'Schedule start date' && (
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DesktopDatePicker
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'red'
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'green'
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'purple'
                                  }
                                }
                              }}
                              open={isDatePickerOpen}
                              minDate={new Date()}
                              label="Start date"
                              toolbarPlaceholder="Start date"
                              value={startDate}
                              inputFormat="MM/DD/YYYY"
                              onClose={() => setIsDatePickerOpen(false)}
                              renderInput={(params) => (
                                <TextField
                                  onClick={() => setIsDatePickerOpen(true)}
                                  {...params}
                                  className="date-picker"
                                />
                              )}
                              components={{
                                OpenPickerIcon: !isDatePickerOpen
                                  ? ArrowDropDownIcon
                                  : ArrowDropUpIcon
                              }}
                              onChange={(value) => {
                                setStartDate(value);
                              }}
                            />
                          </LocalizationProvider>
                        )}
                      </Grid>
                    </>
                  )}
                </Grid>
              </DialogContent>
              <Divider />
              <DialogActions>
                {/* <Button
                  disabled={submitLoading || isValidating}
                  variant="text"
                  onClick={handleDialogClose}>
                  CANCEL
                </Button> */}
                {/* <LoadingButton
                  loading={submitLoading || isValidating}
                  loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                  startIcon={(submitLoading || isValidating) && <SaveIcon />}
                  variant="text"
                  type="submit">
                  SAVE CHANGES
                </LoadingButton> */}
                <LoadingButton
                  className="add-btn save-changes-btn"
                  loading={submitLoading || isValidating}
                  loadingPosition={submitLoading || isValidating ? 'start' : undefined}
                  startIcon={(submitLoading || isValidating) && <SaveIcon />}
                  // variant="text"
                  type="submit">
                  Save Changes
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
