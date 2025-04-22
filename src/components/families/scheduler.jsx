import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  IconButton,
  Box,
  Grid,
  styled,
  Switch,
  AccordionSummary,
  Accordion,
  AccordionDetails
} from '@mui/material';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import API from '../../api';
import { useEffect } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { useContext } from 'react';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { Add, Delete, ExpandMore } from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers-pro';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import dayjs from 'dayjs';

const CustomSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  transition: 'all 0.3s ease',
  display: 'flex',
  '&:active .MuiSwitch-thumb': {
    width: 22
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transition: 'all 0.3s ease',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      transition: 'all 0.3s ease',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#5A53DD !important', // Your purple color for active state
        opacity: 1
      }
    }
  },
  '& .MuiSwitch-thumb': {
    width: 22,
    height: 22,
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    boxShadow: theme.shadows[1]
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#BDBDBD !important', // Grey color for inactive state
    opacity: 1,
    transition: 'all 0.3s ease'
  }
}));

const validationSchema = yup.object().shape({
  selectedOption: yup.string().required('Please select atleast one option')
});
const Days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SchedulerDialog = (props) => {
  const [newTimer, setNewTimer] = useState([]);
  const [loading, setLoading] = useState(false);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  const [defaultSchedule, setDefaultSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  const [customRestrictions, setCustomRestrictions] = useState(false);
  const [allowCustomSchedule, setAllowCustomSchedule] = useState(true);

  const timeStringToDate = (timeStr) => {
    if (!timeStr) return null; // handle empty or undefined gracefully

    const [hours, minutes] = timeStr.split(':').map(Number);
    return dayjs().hour(hours).minute(minutes).second(0);
  };

  const formatScheduleForSave = (schedules) => {
    const grouped = {};

    Object.entries(schedules).forEach(([day, slots]) => {
      slots.forEach((slot) => {
        const start = formatTo12Hour(slot.start);
        const end = formatTo12Hour(slot.end);
        const key = `${start}-${end}`;

        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(day);
      });
    });

    return Object.entries(grouped).map(([key, days]) => {
      const [start, end] = key.split('-');
      return [[start.trim(), end.trim()], days];
    });
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return null; // handle empty or undefined gracefully

    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  // Utility to convert 12hr to 24hr
  const to24Hour = (time) => {
    if (!time) return null;

    const [h, m] = time.replace(/AM|PM/i, '').split(':');
    let hours = parseInt(h);
    const minutes = m.trim();
    const isPM = time.toLowerCase().includes('pm');
    const isAM = time.toLowerCase().includes('am');

    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const handleTimeChange = (day, index, field, timeValue) => {
    if (!timeValue || !timeValue.isValid()) return;
    const formatted = timeValue.format('HH:mm'); // convert Dayjs to "08:00"

    setSchedule((prev) => {
      const updated = { ...prev };
      updated[day] = [...updated[day]];
      updated[day][index] = { ...updated[day][index], [field]: formatted };
      return updated;
    });
  };

  const handleAddTimeSlot = (day) => {
    const newSchedule = { ...schedule };
    newSchedule[day].push({ start: '', end: '' });
    setSchedule(newSchedule);
  };

  const handleDeleteTimeSlot = (day, index) => {
    const newSchedule = { ...schedule };
    newSchedule[day].splice(index, 1);
    setSchedule(newSchedule);
  };
  // End of New UI handlers

  useEffect(() => {
    if (props?.zoneDetails?.schedule?.timeRange?.length != 0) {
      console.log(
        'props?.zoneDetails?.schedule?.timeRange==>',
        props?.zoneDetails?.schedule?.timeRange
      );
      props?.zoneDetails?.schedule?.timeRange?.forEach(([timeRange, days]) => {
        const [start, end] = timeRange.map(to24Hour);
        days.forEach((day) => {
          if (schedule[day]) {
            schedule[day].push({ start, end });
          }
        });
      });
      setSchedule(schedule);

      // newTimer?.forEach(([timeRange, days]) => {
      //   const [start, end] = timeRange.map(to24Hour);
      //   days.forEach((day) => {
      //     if (defaultSchedule[day]) {
      //       defaultSchedule[day].push({ start, end });
      //     }
      //   });
      // });
      // setDefaultSchedule(defaultSchedule);
    }
  }, []);

  useEffect(() => {
    getDefaultScheduleSettings();
  }, []);

  useEffect(() => {
    const updatedSchedule = { ...defaultSchedule }; // Shallow copy

    newTimer?.forEach(([timeRange, days]) => {
      const [start, end] = timeRange.map(to24Hour);

      days.forEach((day) => {
        if (!updatedSchedule[day]) updatedSchedule[day] = [];

        const exists = updatedSchedule[day].some(
          (slot) => slot.start === start && slot.end === end
        );

        if (!exists) {
          updatedSchedule[day].push({ start, end });
        }
      });
    });
    setDefaultSchedule(updatedSchedule);
  }, [newTimer]); // empty dependency array ensures this runs only once on mount

  const handleSubmit = () => {
    setLoading(true);

    const formatted = formatScheduleForSave(schedule);
    const defaultFormatted = formatScheduleForSave(defaultSchedule);
    const payload = {
      zone_child_id: props.zoneDetails.zone_child_id,
      timeRange: customRestrictions ? formatted : defaultFormatted
    };

    API.put('family/child/zoneschedule', payload).then((response) => {
      if (response.status === 200) {
        props.getFamiliesList();
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.setOpen(false);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setLoading(false);
    });
  };

  // Method to fetch Default Settings for Schedule
  const getDefaultScheduleSettings = () => {
    API.get('family/child/schedule', {
      params: {
        cust_id: authCtx.user.cust_id || localStorage.getItem('cust_id')
      }
    }).then((response) => {
      if (response.status === 200) {
        console.log('res', response.data);
        setNewTimer(response.data.Data.schedule.timeRange);
        // setCustomRestrictions(response.data.Data.schedule.allowCustomSchedule);
        setAllowCustomSchedule(response.data.Data.schedule.allowCustomSchedule);
        setCustomRestrictions(false); // Always show Default Schedule first
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    });
  };

  return (
    <Dialog open={props.open} fullWidth className="disable-family-dialog scheduler-dialog">
      <DialogTitle>{'Schedule'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validationSchema={validationSchema}
        initialValues={{
          selectedOption: 'All'
        }}
        onSubmit={(e) => handleSubmit(e)}>
        {() => (
          <Form>
            <DialogContent>
              <Box mb={2} sx={{ backgroundColor: '#F5F7FA', borderRadius: '16px', p: '12px 16px' }}>
                <FormControlLabel
                  sx={{ gap: '8px', marginLeft: 0 }}
                  control={
                    <CustomSwitch
                      checked={!customRestrictions}
                      onChange={() => {
                        setCustomRestrictions(false);
                        const updatedSchedule = { ...defaultSchedule }; // Shallow copy

                        newTimer?.forEach(([timeRange, days]) => {
                          const [start, end] = timeRange.map(to24Hour);

                          days.forEach((day) => {
                            if (!updatedSchedule[day]) updatedSchedule[day] = [];

                            const exists = updatedSchedule[day].some(
                              (slot) => slot.start === start && slot.end === end
                            );

                            if (!exists) {
                              updatedSchedule[day].push({ start, end });
                            }
                          });
                        });

                        setDefaultSchedule(updatedSchedule);
                      }}
                    />
                  }
                  label={
                    <Stack direction={'column'}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          color: '#343434'
                        }}>
                        Default Restrictions
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          color: '#797D8C'
                        }}>
                        Uses the default time restrictions set by your administrator.
                      </Typography>
                    </Stack>
                  }
                />
              </Box>
              <Box mb={2} sx={{ backgroundColor: '#F5F7FA', borderRadius: '16px', p: '12px 16px' }}>
                <FormControlLabel
                  sx={{ gap: '8px', marginLeft: 0 }}
                  control={
                    <CustomSwitch
                      checked={customRestrictions}
                      onChange={() => {
                        if (allowCustomSchedule) {
                          setCustomRestrictions(true);
                        }
                      }}
                      disabled={!allowCustomSchedule}
                    />
                  }
                  label={
                    <Stack direction={'column'}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '20px',
                          color: '#343434'
                        }}>
                        Custom Restrictions
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          color: '#797D8C'
                        }}>
                        Assign the default settings assigned by your administrator.
                      </Typography>
                    </Stack>
                  }
                />
              </Box>
              {Days.map((day) =>
                customRestrictions ? (
                  <Accordion
                    key={day}
                    disabled={!customRestrictions}
                    defaultExpanded={schedule[day]?.length > 0}
                    sx={{
                      boxShadow: 'none',
                      border: '1px solid rgba(235, 232, 255, 1)',
                      marginBottom: '12px',
                      borderRadius: '16px',
                      '&.Mui-expanded': {
                        border: '1px solid var(--Blue, rgba(90, 83, 221, 1))'
                      },
                      '&.MuiAccordion-root:before': {
                        backgroundColor: 'unset'
                      }
                    }}>
                    <AccordionSummary
                      sx={{
                        alignItems: 'center',
                        paddingX: '28px',
                        '.MuiAccordionSummary-content': { alignItems: 'center' }
                      }}
                      expandIcon={<ExpandMore />}>
                      <FormControlLabel
                        sx={{ gap: '8px' }}
                        control={<CustomSwitch checked={schedule[day]?.length > 0} disabled />}
                        label={
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '20px'
                            }}>
                            {day}
                          </Typography>
                        }
                      />
                      <Box ml={2} textAlign={'center'}>
                        {schedule[day]?.map((slot, i) => (
                          <Typography
                            key={i}
                            variant="body2"
                            textAlign={'center'}
                            display="inline"
                            sx={{
                              fontWeight: 400,
                              fontSize: '16px',
                              color: '#797D8C'
                            }}
                            ml={1}>
                            {formatTo12Hour(slot.start)} - {formatTo12Hour(slot.end)}
                            {i < schedule[day].length - 1 ? ',' : ''}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {schedule[day]?.map((slot, index) => (
                        <Grid container spacing={2} alignItems="center" key={index} mb={1}>
                          <Grid item xs={5}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <TimePicker
                                value={timeStringToDate(slot.start)}
                                onChange={(newValue) =>
                                  handleTimeChange(day, index, 'start', newValue)
                                }
                                label="Start Time"
                              />
                            </LocalizationProvider>
                          </Grid>
                          <Grid item xs={5}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <TimePicker
                                value={timeStringToDate(slot.end)}
                                onChange={(newValue) =>
                                  handleTimeChange(day, index, 'end', newValue)
                                }
                                label="End Time"
                              />
                            </LocalizationProvider>
                          </Grid>
                          <Grid item xs={2} alignItems="center">
                            <IconButton onClick={() => handleAddTimeSlot(day, index)}>
                              <Add />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteTimeSlot(day, index)}>
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                      {schedule[day]?.length == 0 && (
                        <Button
                          startIcon={<Add />}
                          onClick={() => handleAddTimeSlot(day)}
                          variant="outlined"
                          sx={{
                            border: '1px solid #5A53DD',
                            color: '#5A53DD',
                            borderRadius: '21px'
                          }}
                          size="small">
                          Add Time Slot
                        </Button>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  <>
                    {console.log('newTimer==>', newTimer)}
                    {console.log('schedule==>', schedule)}
                    {console.log('defaultSchedule==>', defaultSchedule[day]?.length > 0)}
                    <Accordion
                      key={day}
                      disabled={!customRestrictions}
                      // defaultExpanded={defaultSchedule[day]?.length > 0}
                      expanded={defaultSchedule[day]?.length > 0}
                      sx={{
                        boxShadow: 'none',
                        border: '1px solid rgba(235, 232, 255, 1)',
                        marginBottom: '12px',
                        borderRadius: '16px',
                        '&.Mui-expanded': {
                          border: '1px solid var(--Blue, rgba(90, 83, 221, 1))'
                        },
                        '&.MuiAccordion-root:before': {
                          backgroundColor: 'unset'
                        }
                      }}>
                      <AccordionSummary
                        sx={{
                          alignItems: 'center',
                          paddingX: '28px',
                          '.MuiAccordionSummary-content': { alignItems: 'center' }
                        }}
                        expandIcon={<ExpandMore />}>
                        <FormControlLabel
                          sx={{ gap: '8px' }}
                          control={
                            <CustomSwitch checked={defaultSchedule[day]?.length > 0} disabled />
                          }
                          label={
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: '20px'
                              }}>
                              {day}
                            </Typography>
                          }
                        />
                        <Box ml={2} textAlign={'center'}>
                          {defaultSchedule[day]?.map((slot, i) => (
                            <Typography
                              key={i}
                              variant="body2"
                              textAlign={'center'}
                              display="inline"
                              sx={{
                                fontWeight: 400,
                                fontSize: '16px',
                                color: '#797D8C'
                              }}
                              ml={1}>
                              {formatTo12Hour(slot.start)} - {formatTo12Hour(slot.end)}
                              {i < defaultSchedule[day].length - 1 ? ',' : ''}
                            </Typography>
                          ))}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {defaultSchedule[day]?.map((slot, index) => (
                          <Grid container spacing={2} alignItems="center" key={index} mb={1}>
                            <Grid item xs={5}>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                  value={timeStringToDate(slot.start)}
                                  onChange={(newValue) =>
                                    handleTimeChange(day, index, 'start', newValue)
                                  }
                                  label="Start Time"
                                />
                              </LocalizationProvider>
                            </Grid>
                            <Grid item xs={5}>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                  value={timeStringToDate(slot.end)}
                                  onChange={(newValue) =>
                                    handleTimeChange(day, index, 'end', newValue)
                                  }
                                  label="End Time"
                                />
                              </LocalizationProvider>
                            </Grid>
                            <Grid item xs={2} alignItems="center">
                              <IconButton onClick={() => handleAddTimeSlot(day, index)}>
                                <Add />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteTimeSlot(day, index)}>
                                <Delete />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}
                        {defaultSchedule[day]?.length == 0 && (
                          <Button
                            startIcon={<Add />}
                            onClick={() => handleAddTimeSlot(day)}
                            variant="outlined"
                            sx={{
                              border: '1px solid #5A53DD',
                              color: '#5A53DD',
                              borderRadius: '21px'
                            }}
                            size="small">
                            Add Time Slot
                          </Button>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </>
                )
              )}
            </DialogContent>
            <Stack direction={'row-reverse'} padding={2}>
              <Stack direction={'row'} gap={2}>
                {location.pathname == '/families' && (
                  <Button
                    className="cancel-recording-btn"
                    variant="outlined"
                    disabled={loading}
                    onClick={() => {
                      if (!loading) {
                        props.setOpen(false);
                      }
                    }}
                    sx={{ borderRadius: '60px !important' }}>
                    Cancel
                  </Button>
                )}
                <Button className="save-changes-button" variant="text" type="submit">
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default SchedulerDialog;

SchedulerDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  zoneDetails: PropTypes.object,
  getFamiliesList: PropTypes.func,
  setAllowCustomSchedule: PropTypes.func,
  settings: PropTypes.bool,
  allowCustomSchedule: PropTypes.bool,
  custId: PropTypes.string,
  timer: PropTypes.array,
  zone_child_id: PropTypes.string,
  getDefaultScheduleSettings: PropTypes.func
};
