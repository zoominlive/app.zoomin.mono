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
  Radio,
  RadioGroup,
  Stack,
  TextField
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import moment from 'moment';
import { useEffect } from 'react';

const DisableFamily = (props) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [date, setDate] = useState('');
  const [isDateValid, setIsDateValid] = useState(true);

  useEffect(() => {
    if (date) {
      setIsDateValid(moment(date.toDate()).isValid());
    }
  }, [date]);

  const handleDialogClose = () => {
    props.setOpen(false);
    setIsDateValid(true);
    setDate('');
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleDialogClose}
      fullWidth
      className="disable-family-dialog small-dialog">
      <DialogTitle>Disable Family</DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText mb={4}>
          This action will disable access for all children
        </DialogContentText>
        <Stack spacing={5}>
          <FormControl>
            <RadioGroup aria-labelledby="disable-group" name="disable-group">
              <Stack spacing={2}>
                <FormControlLabel value="disable" control={<Radio />} label="Disable immediately" />
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
                      value={date}
                      inputFormat="MM/DD/YYYY"
                      onClose={() => setIsDatePickerOpen(false)}
                      renderInput={(params) => (
                        <TextField
                          onClick={() => setIsDatePickerOpen(true)}
                          {...params}
                          error={!isDateValid}
                          helperText={!isDateValid && 'Enter Valid Date'}
                        />
                      )}
                      components={{
                        OpenPickerIcon: !isDatePickerOpen ? ArrowDropDownIcon : ArrowDropUpIcon
                      }}
                      onChange={(value) => setDate(value)}
                    />
                  </LocalizationProvider>
                </Stack>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={handleDialogClose}>
          CANCEL
        </Button>
        <Button variant="text" onClick={() => props.setOpen(false)}>
          YES, DISABLE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DisableFamily;

DisableFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
