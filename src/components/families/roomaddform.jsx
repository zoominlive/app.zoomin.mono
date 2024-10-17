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
  Autocomplete,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormHelperText
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
// eslint-disable-next-line no-unused-vars
import SaveIcon from '@mui/icons-material/Save';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import dayjs from 'dayjs';
import moment from 'moment';

const validationSchema = yup.object({
  rooms: yup.array().min(1, 'Atleast one room is required'),
  locations: yup.array().min(1, 'Select at least one location').required('required'),
  selectedOption: yup.string().required('Please select atleast one option'),
  date: yup
    .date()
    .typeError('Please enter valid date!')
    .nullable()
    .when('selectedOption', {
      is: (val) => val === 'schedule',
      then: yup.date().typeError('Please enter valid date!').nullable().required('Date is required')
    })
});

const AddRoomForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('enable');

  // Method to close the form dialog
  const handleDialogClose = () => {
    props.setOpen(false);
  };

  // Method to add room
  const handleSubmit = (data) => {
    setSubmitLoading(true);
    let existingRoom = props?.existingRooms.map((room) => {
      return {
        room_id: room.room_id,
        room_name: room.room.room_name,
        location: room.room.location
      };
    });

    API.post('family/child/addroom', {
      existingRooms: existingRoom,
      roomsToAdd: data?.rooms,
      selectedOption: data?.selectedOption,
      schedule_enable_date:
        data?.selectedOption == 'schedule' ? dayjs(data?.date).format('YYYY-MM-DD') : null,
      child_id: props?.child?.child_id
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setSubmitLoading(false);
      handleDialogClose();
    });
  };

  const setRoomsList = (locations) => {
    if (locations?.length !== 0) {
      let rooms = props.roomsList
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
      let roomsToAdd = [];
      rooms.forEach((room) => {
        let count = 0;
        props.existingRooms.forEach((room1) => {
          if (room1.room_id === room.room_id) {
            count = 1;
          }
        });
        if (count == 0) {
          roomsToAdd.push(room);
        }
      });

      return roomsToAdd;
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
          rooms: [],
          locations: [],
          selectedOption: 'enable',
          date: ''
        }}
        onSubmit={(data) => {
          handleSubmit(data);
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
                      options={authCtx?.user?.location?.selected_locations?.sort((a, b) =>
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
                      noOptionsText={
                        values.locations.length == 0
                          ? 'Select location first'
                          : 'No rooms available'
                      }
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
                    <FormControl>
                      <RadioGroup
                        aria-labelledby="disable-group"
                        row
                        name="selectedOptionn"
                        value={values.selectedOption}
                        onChange={(event) => {
                          setFieldValue('selectedOption', event.currentTarget.value);
                          setSelectedOption(event.currentTarget.value);
                        }}>
                        <FormControlLabel
                          value={'enable'}
                          control={<Radio />}
                          label={'Enable immediately'}
                        />
                        <FormControlLabel
                          value="schedule"
                          control={<Radio />}
                          style={{ paddingLeft: '15px' }}
                          label={'Schedule enable date'}
                        />
                      </RadioGroup>
                      {touched.selectedOption && Boolean(errors.selectedOption) && (
                        <FormHelperText sx={{ color: '#d32f2f' }}>
                          {touched.selectedOption && errors.selectedOption}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item md={3} sm={12}>
                    {' '}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DesktopDatePicker
                        disableHighlightToday
                        disabled={selectedOption == 'enable'}
                        open={isDatePickerOpen}
                        minDate={moment().add(1, 'days')}
                        label={'Enable date'}
                        value={values?.date}
                        inputFormat="MM/DD/YYYY"
                        onClose={() => setIsDatePickerOpen(false)}
                        renderInput={(params) => (
                          <TextField
                            onClick={() => setIsDatePickerOpen(true)}
                            {...params}
                            disabled={selectedOption == 'enable'}
                            helperText={touched.date && errors.date}
                            error={touched.date && Boolean(errors.date)}
                          />
                        )}
                        components={{
                          OpenPickerIcon: !isDatePickerOpen ? ArrowDropDownIcon : ArrowDropUpIcon
                        }}
                        onChange={(value) => {
                          setFieldValue('date', value ? value : '');
                        }}
                      />
                    </LocalizationProvider>
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
                  loadingPosition={submitLoading || isValidating ? 'center' : undefined}
                  // startIcon={(submitLoading || isValidating) && <SaveIcon />}
                  variant="text"
                  type="submit">
                  {!submitLoading && 'SAVE CHANGES'}
                </LoadingButton>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default AddRoomForm;

AddRoomForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  roomsList: PropTypes.array,
  family: PropTypes.object,
  child: PropTypes.any,
  setChild: PropTypes.func,
  setFamily: PropTypes.func,
  getFamiliesList: PropTypes.func,
  existingRooms: PropTypes.array
};
