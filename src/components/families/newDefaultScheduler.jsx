import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Stack,
  Typography,
  IconButton,
  Grid,
  CardContent,
  Box,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  // TextField,
  // InputLabel,
  styled
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

const Days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const timeSlotSchema = yup.object().shape({
  start: yup.string().required('Start time is required'),
  end: yup.string().required('End time is required')
});

const validationSchema = yup.object(
  Days.reduce((acc, day) => {
    acc[day] = yup.array().of(timeSlotSchema);
    return acc;
  }, {})
);

const DefaultScheduler = (props) => {
  const [loading, setLoading] = useState(false);
  const [permitCustomSchedule, setPermitCustomSchedule] = useState(props?.allowCustomSchedule);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();

  // Start of New UI handlers
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });

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

  const handleSaveChanges = () => {
    const formatted = formatScheduleForSave(schedule);
    console.log('formatted==>', formatted);
    // Save `formatted` to DB or API
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
    if (props.timer?.length != 0) {
      props.timer.forEach(([timeRange, days]) => {
        const [start, end] = timeRange.map(to24Hour);
        days.forEach((day) => {
          if (schedule[day]) {
            schedule[day].push({ start, end });
          }
        });
      });
      setSchedule(schedule);
    }
  }, [props.timer]);

  const handleSubmitDefaultSettings = () => {
    setLoading(true);
    handleSaveChanges();
    const formatted = formatScheduleForSave(schedule);
    const payload = {
      cust_id: props.custId,
      timeRange: formatted,
      allowCustomSchedule: permitCustomSchedule
    };
    const childPayload = {
      zone_child_id: props.zone_child_id,
      timeRange: formatted,
      allowCustomSchedule: permitCustomSchedule
    };
    // console.log('props.settings', props.settings);
    API.put(
      props.defaultSettings ? 'family/child/zoneschedule' : 'family/child/schedule/edit',
      props.defaultSettings ? childPayload : payload
    ).then((response) => {
      if (response.status === 200) {
        if (props.defaultSettings) {
          props.getFamiliesList();
          props.setOpen(false);
        } else {
          props.getDefaultScheduleSettings();
        }
        enqueueSnackbar(response.data.Message, { variant: 'success' });
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

  return (
    <Grid container className="stream-details-wraper">
      <Grid item xl={12} lg={12} md={12} sm={12} xs={12} className="default-scheduler-settings">
        <Card sx={{ height: '100%' }}>
          <CardContent className="live-stream-card">
            <Typography fontWeight={'bold'}>Default Stream Availability - All Cameras</Typography>
            <Formik
              enableReinitialize
              validationSchema={validationSchema}
              initialValues={schedule}
              onSubmit={(e) => handleSubmitDefaultSettings(e)}>
              {({ errors }) => (
                <Form>
                  <DialogContent sx={{ padding: '8px 0px' }}>
                    {Days.map((day) => (
                      <Accordion
                        key={day}
                        defaultExpanded={schedule[day]?.length > 0}
                        sx={{
                          boxShadow: 'none',
                          border: '1px solid rgba(235, 232, 255, 1)',
                          marginBottom: '12px',
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
                                    slotProps={{
                                      textField: {
                                        error: !!errors?.[day]?.[index]?.start,
                                        helperText: errors?.[day]?.[index]?.start
                                      }
                                    }}
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
                                    slotProps={{
                                      textField: {
                                        error: !!errors?.[day]?.[index]?.end,
                                        helperText: errors?.[day]?.[index]?.end
                                      }
                                    }}
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
                    ))}
                  </DialogContent>
                  <DialogActions>
                    <Stack direction={'row'} gap={4}>
                      {props.defaultSettings && (
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
                  </DialogActions>
                </Form>
              )}
            </Formik>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                padding: '16px',
                marginTop: '8px',
                borderRadius: '21px'
              }}>
              <FormControlLabel
                sx={{ gap: '8px', alignItems: 'flex-start', marginLeft: '8px' }}
                control={<CustomSwitch checked={permitCustomSchedule} />}
                onClick={() => {
                  setPermitCustomSchedule(!permitCustomSchedule);
                }}
                labelPlacement="bottom"
                label={
                  <Typography>
                    {'Permits administrators to assign custom schedule to families'}
                  </Typography>
                }
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DefaultScheduler;

DefaultScheduler.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  zoneDetails: PropTypes.object,
  getFamiliesList: PropTypes.func,
  setAllowCustomSchedule: PropTypes.func,
  settings: PropTypes.bool,
  allowCustomSchedule: PropTypes.bool,
  custId: PropTypes.string,
  timer: PropTypes.array,
  defaultSettings: PropTypes.bool,
  zone_child_id: PropTypes.string,
  getDefaultScheduleSettings: PropTypes.func
};
