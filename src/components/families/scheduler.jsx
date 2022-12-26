import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
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
  Stack,
  Checkbox,
  Avatar,
  AvatarGroup,
  Slider,
  Typography,
  Grid,
  IconButton,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Plus } from 'react-feather';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { Container } from '@mui/system';
import moment from 'moment';
import API from '../../api';
import { useEffect } from 'react';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { useContext } from 'react';
import { errorMessageHandler } from '../../utils/errormessagehandler';

const validationSchema = yup.object().shape({
  selectedOption: yup.string().required('Please select atleast one option')
});
const Days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SchedulerDialog = (props) => {
  const [allDaysCommonTimer, setallDaysCommonTimer] = useState([[20, 60]]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [lastSelectedDay, setLastSelectedDay] = useState('Monday');
  const [dayToCopy, setDayToCopy] = useState(8);
  const [allCommonSelectedDays, setAllCommonSelectedDays] = useState([]);
  const [allCheckBoxClicked, setallDaysCheckBoxClicked] = useState(false);
  const [individualDayTimers, setIndividualDayTimers] = useState([
    [[20, 60]],
    [[20, 60]],
    [[20, 60]],
    [[20, 60]],
    [[20, 60]],
    [[20, 60]],
    [[20, 60]]
  ]);
  const [loading, setLoading] = useState(false);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();

  const handleAddRemoveAllDays = () => {
    if (allCheckBoxClicked) {
      setAllCommonSelectedDays([]);
      setallDaysCheckBoxClicked(false);
    } else {
      setAllCommonSelectedDays(Days);
      setallDaysCheckBoxClicked(true);
    }
  };

  const addRemoveDayfromCommonDays = (selected) => {
    if (allCommonSelectedDays.includes(selected)) {
      let daysToadd = allCommonSelectedDays.filter((day) => day != selected);
      setAllCommonSelectedDays(daysToadd);
    } else {
      setAllCommonSelectedDays([...allCommonSelectedDays, selected]);
    }
  };

  const handleTimerChange = (event, newValue, changeIndex) => {
    if (newValue[1] - newValue[0] > 4) {
      const valueToSet = allDaysCommonTimer.map((val, index) => {
        if (index == changeIndex) {
          return newValue;
        } else {
          return val;
        }
      });
      setallDaysCommonTimer(valueToSet);
    }
  };

  const handleAddAllDayCommonTimer = () => {
    setallDaysCommonTimer([...allDaysCommonTimer, [20, 60]]);
  };

  const handleAddIndivudalDayTimer = (outerIndex) => {
    let timersToSet = individualDayTimers.map((dayTimer, index) => {
      if (index == outerIndex) {
        let timeToAdd = dayTimer;
        timeToAdd.push([20, 60]);
        return timeToAdd;
      } else {
        return dayTimer;
      }
    });

    setIndividualDayTimers(timersToSet);
  };

  const handleDeleteIndivudalDayTimer = (outerIndex, innerIndex) => {
    let timersToSet = individualDayTimers.map((dayTimer, index) => {
      if (index == outerIndex) {
        let timeToAdd = dayTimer.filter((timer, index1) => {
          return index1 != innerIndex;
        });
        return timeToAdd;
      } else {
        return dayTimer;
      }
    });

    setIndividualDayTimers(timersToSet);
  };

  const handleIndividualDayTimerChange = (event, newValue, outerIndex, innerIndex) => {
    if (newValue[1] - newValue[0] > 4) {
      const valuesToSet = individualDayTimers.map((dayTimers, index) => {
        if (index == outerIndex) {
          return dayTimers.map((timer, index1) => {
            if (index1 == innerIndex) {
              return newValue;
            } else {
              return timer;
            }
          });
        } else {
          return dayTimers;
        }
      });

      setIndividualDayTimers(valuesToSet);
    }
  };

  const getValueLable = (value) => {
    let hours = moment.utc(value * 14.4 * 1000 * 60).format('HH:mm A');
    let time = '30';
    if (parseInt(hours.slice(3)) >= 0 && parseInt(hours.slice(3, 5)) < 30) {
      time = '00';
    }

    if (value == 100) {
      return '23:59 PM';
    } else {
      return hours.slice(0, 2) + ':' + time + hours.slice(5);
    }
  };

  const getValueFromLabel = (label) => {
    let seconds = moment(label, 'HH:mm: A').diff(moment().startOf('day'), 'seconds');
    return Math.ceil((parseInt(seconds) * 100) / 86400);
  };

  const handleCopyDayschedule = (copyDayIndex, dayIndex, checked) => {
    setDayToCopy(copyDayIndex);
    if (checked == dayIndex) {
      let dayTimers = individualDayTimers;
      dayTimers[dayIndex] = dayTimers[copyDayIndex];
      setIndividualDayTimers(dayTimers);
    }
  };

  const getDayWiseList = (values, setFieldValue) => {
    return Days.map((day, index) => (
      <>
        <Card
          key={index}
          className={selectedDays.includes(day) ? 'scheduler-selected-option' : 'scheduler-option'}>
          <FormControlLabel
            value={day}
            control={
              <Checkbox
                checked={selectedDays?.includes(day) ? true : false}
                onClick={(e) => {
                  if (selectedDays.includes(e.target.value)) {
                    let daysToSelect = selectedDays.filter((day) => day != e.target.value);
                    setSelectedDays(daysToSelect);
                  } else {
                    setSelectedDays([...selectedDays, e.target.value]);
                    console.log([...selectedDays, e.target.value]);
                    setLastSelectedDay(e.target.value);
                  }
                }}
              />
            }
            className={'scheduler-label'}
            label={day}
          />
        </Card>
        {lastSelectedDay == day && (
          <Stack spacing={3} pb={3}>
            <Container>
              <FormControlLabel
                control={
                  <Checkbox
                    onClick={(e) => {
                      if (e.target.checked) {
                        setFieldValue('copyTexboxIndex', index);
                      }
                    }}
                  />
                }
                label="Same time as"
              />
              <FormControl style={{ minWidth: '150px' }}>
                <InputLabel id="demo-simple-select-label">Day</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={dayToCopy}
                  label="Day"
                  onChange={(e) =>
                    handleCopyDayschedule(e.target.value, index, values.copyTexboxIndex)
                  }>
                  {Days.map((day, index) => (
                    <MenuItem key={index} value={index}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Container>
            {individualDayTimers?.[index]?.map((timeRange, index1) => (
              <Container sx={{ marginBottom: '40px' }} key={index1}>
                <Grid container spacing={3}>
                  <Grid item md={7} sm={12}>
                    <Slider
                      value={timeRange}
                      valueLabelFormat={getValueLable}
                      onChange={(event, newValue) =>
                        handleIndividualDayTimerChange(event, newValue, index, index1)
                      }
                      valueLabelDisplay={'on'}
                      aria-labelledby="non-linear-slider"
                      getAriaValueText={getValueLable}
                      disableSwap
                    />
                  </Grid>
                  <Grid item md={5} sm={12}>
                    <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                      {getValueLable(timeRange[0]) + ' - ' + getValueLable(timeRange[1])}
                    </Typography>
                    <IconButton className="schduler-edit-button " sx={{ marginLeft: '5px' }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      sx={{ marginLeft: '5px' }}
                      className=" schduler-delete-button "
                      onClick={() => {
                        handleDeleteIndivudalDayTimer(index, index1);
                      }}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Container>
            ))}
            <Container className="schduler-addtime-container">
              <Button
                className="add-btn"
                variant="contained"
                startIcon={<Plus />}
                onClick={() => handleAddIndivudalDayTimer(index)}>
                {' '}
                Add Time
              </Button>
            </Container>
          </Stack>
        )}
      </>
    ));
  };

  useEffect(() => {
    console.log('loaded');
    if (props?.roomDetails?.schedule?.selectedOption === 'All') {
      const { selectedDays, timeRange } = props.roomDetails.schedule;
      let setTimeRange = timeRange.map((time) => {
        return [getValueFromLabel(time[0]), getValueFromLabel(time[1])];
      });
      setallDaysCommonTimer(setTimeRange);
      setAllCommonSelectedDays(selectedDays);
    } else if (props?.roomDetails?.schedule?.selectedOption === 'individual') {
      const { selectedDays, timeRange } = props.roomDetails.schedule;
      let setTimeRange = timeRange.map((dayWiseTimeRange) => {
        return dayWiseTimeRange.map((time) => {
          return [getValueFromLabel(time[0]), getValueFromLabel(time[1])];
        });
      });
      setIndividualDayTimers(setTimeRange);
      setSelectedDays(selectedDays);
      console.log(selectedDays);
    }
  }, []);

  const handleSubmit = ({ selectedOption }) => {
    setLoading(true);
    if (selectedOption == 'All') {
      const payload = {
        room_child_id: props.roomDetails.room_child_id,
        selectedOption: selectedOption,
        selectedDays: allCommonSelectedDays,
        timeRange: allDaysCommonTimer.map((timeRange) => {
          return [getValueLable(timeRange[0]), getValueLable(timeRange[1])];
        })
      };
      API.put('family/child/roomschedule', payload).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
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
    } else {
      const payload = {
        room_child_id: props.roomDetails.room_child_id,
        selectedOption: selectedOption,
        selectedDays: selectedDays,
        timeRange: individualDayTimers.map((dayRange) => {
          const days = dayRange.map((range) => {
            return [getValueLable(range[0]), getValueLable(range[1])];
          });

          return days;
        })
      };
      API.put('family/child/roomschedule', payload).then((response) => {
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
    }
  };

  return (
    <Dialog open={props.open} fullWidth className="disable-family-dialog scheduler-dialog">
      <DialogTitle>{'Schedule'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validationSchema={validationSchema}
        initialValues={{
          selectedOption: props?.roomDetails?.schedule?.selectedOption
            ? props?.roomDetails?.schedule?.selectedOption
            : 'All',
          date: '',
          selectedDay: 'Mo',
          copyTexboxIndex: ''
        }}
        onSubmit={(e) => handleSubmit(e)}>
        {({ values, errors, setFieldValue, touched }) => (
          <Form>
            <DialogContent>
              {props.contentText && (
                <DialogContentText mb={4}>{props.contentText}</DialogContentText>
              )}
              <Stack>
                <FormControl>
                  <Stack spacing={1} className="schduler-stack">
                    <Card
                      className={
                        values.selectedOption == 'All'
                          ? 'scheduler-selected-option'
                          : 'scheduler-option'
                      }>
                      <FormControlLabel
                        value={'All'}
                        control={
                          <Radio
                            checked={values.selectedOption == 'All'}
                            onChange={(event) => {
                              setFieldValue('selectedOption', event.currentTarget.value);
                            }}
                          />
                        }
                        className={'scheduler-label'}
                        label={'Selected Day(s)'}
                      />
                    </Card>
                    {values.selectedOption == 'All' && (
                      <Stack spacing={3} pb={3}>
                        <Container>
                          <FormControlLabel
                            control={<Checkbox onClick={() => handleAddRemoveAllDays()} />}
                            label="All Days"
                          />
                          <AvatarGroup max={7}>
                            {Days.map((day, index) => (
                              <Avatar
                                className={`${
                                  allCommonSelectedDays.includes(day)
                                    ? ''
                                    : 'scheduler-avatar-not-selected'
                                }`}
                                onClick={() => addRemoveDayfromCommonDays(day)}
                                key={index}>{`${day.slice(0, 2)}`}</Avatar>
                            ))}
                          </AvatarGroup>
                        </Container>
                        {allDaysCommonTimer.map((timer, index) => (
                          <Container key={index}>
                            <Grid container spacing={3}>
                              <Grid item md={7} sm={12}>
                                <Slider
                                  value={timer}
                                  valueLabelFormat={getValueLable}
                                  onChange={(event, newValue) =>
                                    handleTimerChange(event, newValue, index)
                                  }
                                  valueLabelDisplay={'on'}
                                  aria-labelledby="non-linear-slider"
                                  getAriaValueText={getValueLable}
                                  disableSwap
                                />
                              </Grid>
                              <Grid item md={5} sm={12}>
                                <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                                  {getValueLable(timer[0]) + ' - ' + getValueLable(timer[1])}
                                </Typography>
                                <IconButton
                                  className="schduler-edit-button "
                                  sx={{ marginLeft: '5px' }}
                                  onClick={() => {}}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  sx={{ marginLeft: '5px' }}
                                  className=" schduler-delete-button "
                                  onClick={() => {
                                    let timers = allDaysCommonTimer.filter(
                                      (timeRange, index1) => index != index1
                                    );
                                    setallDaysCommonTimer(timers);
                                  }}>
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Container>
                        ))}
                        <Container className="schduler-addtime-container">
                          <Button
                            className="add-btn"
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => handleAddAllDayCommonTimer()}>
                            {' '}
                            Add Time
                          </Button>
                        </Container>
                      </Stack>
                    )}
                    <Card
                      className={
                        values.selectedOption == 'individual'
                          ? 'scheduler-selected-option'
                          : 'scheduler-option'
                      }>
                      <FormControlLabel
                        value="individual"
                        control={
                          <Radio
                            checked={values.selectedOption == 'individual'}
                            onChange={(event) => {
                              setFieldValue('selectedOption', event.currentTarget.value);
                            }}
                          />
                        }
                        className={'scheduler-label'}
                        label={'Individual Day'}
                        sx={{ whiteSpace: 'nowrap' }}
                      />
                    </Card>
                    {values.selectedOption == 'individual' && (
                      <Stack sx={{ width: '95%' }} pl={2} spacing={1}>
                        {getDayWiseList(values, setFieldValue)}
                      </Stack>
                    )}
                  </Stack>

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
                  if (!loading) {
                    props.setOpen(false);
                  }
                }}>
                CANCEL
              </Button>
              <LoadingButton
                loading={loading}
                loadingPosition={loading ? 'start' : undefined}
                startIcon={loading && <SaveIcon />}
                variant="text"
                type="submit">
                SAVE CHANGES
              </LoadingButton>
            </DialogActions>
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
  title: PropTypes.string,
  handleRoomDisableEnable: PropTypes.func,
  contentText: PropTypes.string,
  loading: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  roomDetails: PropTypes.object,
  getFamiliesList: PropTypes.func
};
