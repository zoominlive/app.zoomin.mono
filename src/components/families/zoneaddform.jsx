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
  zones: yup.array().min(1, 'Atleast one zone is required'),
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

const AddZoneForm = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('enable');

  // Method to close the form dialog
  const handleDialogClose = () => {
    props.setOpen(false);
  };

  // Method to add zone
  const handleSubmit = (data) => {
    setSubmitLoading(true);
    let existingZone = props?.existingZones.map((zone) => {
      return {
        zone_id: zone.zone_id,
        zone_name: zone.zone.zone_name,
        location: zone.zone.location
      };
    });

    API.post('family/child/addzone', {
      existingZones: existingZone,
      zonesToAdd: data?.zones,
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

  const setZonesList = (locations) => {
    console.log('props==>', props);
    console.log('locations==>', locations);
    if (locations?.length !== 0) {
      let zones = props.zonesList
        .filter((zone) => {
          let count = 0;
          locations?.forEach((loc) => {
            if (loc == zone.loc_id) {
              count = 1;
            }
          });

          return count === 1;
        })
        .sort((a, b) => (a.zone_name > b.zone_name ? 1 : -1));
      let zonesToAdd = [];
      zones.forEach((zone) => {
        let count = 0;
        props.existingZones.forEach((zone1) => {
          if (zone1.zone_id === zone.zone_id) {
            count = 1;
          }
        });
        if (count == 0) {
          zonesToAdd.push(zone);
        }
      });

      return zonesToAdd;
    } else {
      return [];
    }
  };

  return (
    <Dialog open={props.open} onClose={handleDialogClose} fullWidth className="add-child-drawer">
      <DialogTitle>{'Add Zone'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          zones: [],
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
                      id="zones"
                      options={authCtx?.user?.locations?.sort((a, b) =>
                        a.loc_name > b.loc_name ? 1 : -1
                      )}
                      value={values?.locations}
                      onChange={(_, value) => {
                        setFieldValue('locations', value);
                      }}
                      getOptionLabel={({ loc_name }) => loc_name}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option.loc_name} {...getTagProps({ index })} />
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
                    {console.log('values==>', values)}
                    <Autocomplete
                      fullWidth
                      multiple
                      id="zones"
                      options={setZonesList(values?.locations.map(({ loc_id }) => loc_id))}
                      noOptionsText={
                        values.locations.length == 0
                          ? 'Select location first'
                          : 'No zones available'
                      }
                      value={values?.zones}
                      isOptionEqualToValue={(option, value) => option.zone_id === value.zone_id}
                      getOptionLabel={(option) => {
                        return option.zone_name;
                      }}
                      onChange={(_, value) => {
                        setFieldValue('zones', value);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option.zone_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Zone"
                          helperText={touched.zones && errors.zones}
                          error={touched.zones && Boolean(errors.zones)}
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

export default AddZoneForm;

AddZoneForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  zonesList: PropTypes.array,
  family: PropTypes.object,
  child: PropTypes.any,
  setChild: PropTypes.func,
  setFamily: PropTypes.func,
  getFamiliesList: PropTypes.func,
  existingZones: PropTypes.array
};
