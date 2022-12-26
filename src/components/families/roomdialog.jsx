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
  TextField
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
  date: yup
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
          selectedOption: props?.roomDetails?.disabled == 'true' ? 'enable' : 'disable',
          date: ''
        }}
        onSubmit={props.handleRoomDisableEnable}>
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
                        value={props?.roomDetails?.disabled == 'true' ? 'enable' : 'disable'}
                        control={<Radio />}
                        label={
                          props?.roomDetails?.disabled == 'true'
                            ? 'Enable immediately'
                            : 'Disable immediately'
                        }
                      />
                      <Stack direction="row" spacing={10}>
                        <FormControlLabel
                          value="schedule"
                          control={<Radio />}
                          label={
                            props?.roomDetails?.disabled == 'true'
                              ? 'Schedule enable date'
                              : 'Schedule end date'
                          }
                          sx={{ whiteSpace: 'nowrap' }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DesktopDatePicker
                            open={isDatePickerOpen}
                            minDate={new Date()}
                            label={
                              props?.roomDetails?.disabled == 'true'
                                ? 'Enable date'
                                : 'Disable date'
                            }
                            value={values?.date}
                            inputFormat="MM/DD/YYYY"
                            onClose={() => setIsDatePickerOpen(false)}
                            renderInput={(params) => (
                              <TextField
                                onClick={() => setIsDatePickerOpen(true)}
                                {...params}
                                helperText={touched.date && errors.date}
                                error={touched.date && Boolean(errors.date)}
                              />
                            )}
                            components={{
                              OpenPickerIcon: !isDatePickerOpen
                                ? ArrowDropDownIcon
                                : ArrowDropUpIcon
                            }}
                            onChange={(value) => {
                              setFieldValue('date', value ? value : '');
                            }}
                          />
                        </LocalizationProvider>
                      </Stack>
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
                type="submit">
                {props?.roomDetails?.disabled == 'true' ? 'YES, ENABLE' : 'YES, DISABLE'}
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
  handleRoomDisableEnable: PropTypes.func,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  roomDetails: PropTypes.object
};
