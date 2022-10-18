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
import dayjs from 'dayjs';

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

const DisableFamily = (props) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleDialogClose = () => {
    props.setOpen(false);
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleDialogClose}
      fullWidth
      className="disable-family-dialog small-dialog">
      <DialogTitle>Disable Family</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validationSchema={validationSchema}
        initialValues={{
          selectedOption: 'disable',
          disableDate: ''
        }}
        onSubmit={(data) => {
          console.log(data);
          console.log(dayjs(data.disableDate).format('MM/DD/YYYY'));
        }}>
        {({ values, errors, setFieldValue, touched }) => (
          <Form>
            <DialogContent>
              <DialogContentText mb={4}>
                This action will disable access for all children
              </DialogContentText>
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
                      <Stack direction="row" spacing={4}>
                        <FormControlLabel
                          value="schedule"
                          control={<Radio />}
                          label="Schedule end date"
                          sx={{ whiteSpace: 'nowrap' }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DesktopDatePicker
                            open={isDatePickerOpen}
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
              <Button variant="text" onClick={handleDialogClose}>
                CANCEL
              </Button>
              <Button type="submit" variant="text">
                YES, DISABLE
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default DisableFamily;

DisableFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
