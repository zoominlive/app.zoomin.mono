import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Autocomplete,
  Chip
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
const validationSchema = yup.object().shape({
  selectedOption: yup.string().required('Please select atleast one option'),
  disableDate: yup
    .date()
    .typeError('Please enter valid date!')
    .nullable()
    .when('selectedOption', {
      is: (val) => val === 'schedule',
      then: yup.date().typeError('Please enter valid date!').nullable().required('Date is required')
    })
});

const DisableDialog = (props) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        if (!props.loading) {
          props.handleDialogClose();
        }
      }}
      fullWidth
      className="disable-family-dialog small-dialog">
      <DialogTitle>{props.title}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validationSchema={validationSchema}
        initialValues={{
          selectedOption: 'disable',
          disableDate: ''
        }}
        onSubmit={props.handleDisable}>
        {({ values, errors, setFieldValue, touched }) => (
          <Form>
            <DialogContent>
              {props.contentText && (
                <DialogContentText mb={4}>{props.contentText}</DialogContentText>
              )}
              <Stack spacing={5}>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="disable-group"
                    name="selectedOptionn"
                    value={values.selectedOption}
                    onChange={(event) => {
                      setFieldValue('selectedOption', event.currentTarget.value);
                    }}>
                    <Stack spacing={2}>
                      <FormControlLabel
                        value="disable"
                        control={<Radio />}
                        label="Disable immediately"
                      />
                      <Stack direction="row" spacing={10}>
                        <FormControlLabel
                          value="schedule"
                          control={<Radio />}
                          label="Schedule end date"
                          sx={{ whiteSpace: 'nowrap' }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DesktopDatePicker
                            open={isDatePickerOpen}
                            minDate={new Date()}
                            label="Disable date"
                            value={values?.disableDate}
                            inputFormat="MM/DD/YYYY"
                            onClose={() => setIsDatePickerOpen(false)}
                            renderInput={(params) => (
                              <TextField
                                onClick={() => setIsDatePickerOpen(true)}
                                {...params}
                                helperText={touched.disableDate && errors.disableDate}
                                error={touched.disableDate && Boolean(errors.disableDate)}
                              />
                            )}
                            components={{
                              OpenPickerIcon: !isDatePickerOpen
                                ? ArrowDropDownIcon
                                : ArrowDropUpIcon
                            }}
                            onChange={(value) => {
                              setFieldValue('disableDate', value ? value : '');
                            }}
                          />
                        </LocalizationProvider>
                      </Stack>
                      <Autocomplete
                        fullWidth
                        multiple
                        id="rooms"
                        options={props?.locationsToDisable?.sort((a, b) => (a > b ? 1 : -1))}
                        value={values?.locations}
                        onChange={(_, value) => {
                          props.setSelectedLocationsToDisable(value);
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
                            label="Locations to end access"
                            helperText={
                              values?.locations?.length === 0 && isSubmitClicked
                                ? 'Minimum one location is required'
                                : ''
                            }
                            error={
                              values?.locations?.length === 0 && isSubmitClicked ? true : false
                            }
                            fullWidth
                          />
                        )}
                      />
                    </Stack>
                  </RadioGroup>
                  {touched.selectedOption && Boolean(errors.selectedOption) && (
                    <FormHelperText sx={{ color: '#d32f2f' }}>
                      {touched.selectedOption && errors.selectedOption}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </DialogContent>
            <Divider />
            <DialogActions>
              <Button
                variant="text"
                disabled={props.loading}
                onClick={() => {
                  if (!props.loading) {
                    setIsSubmitClicked(true);
                    props.handleDialogClose();
                  }
                }}>
                CANCEL
              </Button>
              <LoadingButton
                loading={props.loading}
                loadingPosition={props.loading ? 'start' : undefined}
                startIcon={props.loading && <SaveIcon />}
                variant="text"
                type="submit"
                onClick={() => {
                  setIsSubmitClicked(true);
                }}>
                YES, DISABLE
              </LoadingButton>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default DisableDialog;

DisableDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  title: PropTypes.string,
  handleDisable: PropTypes.func,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  locationsToDisable: PropTypes.array,
  handleDialogClose: PropTypes.func,
  setSelectedLocationsToDisable: PropTypes.func
};
