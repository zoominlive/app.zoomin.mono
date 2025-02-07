import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  Checkbox,
  Avatar,
  AvatarGroup,
  Slider,
  Typography,
  IconButton,
  Grid,
  CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
const DefaultScheduler = (props) => {
  const [daytimers, setDayTimers] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timer, setTimer] = useState([0, 100]);
  const [allCheckBoxClicked, setallDaysCheckBoxClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disableSlider, setDisableSlider] = useState(false);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();

  const handleAddRemoveAllDays = () => {
    if (allCheckBoxClicked) {
      setSelectedDays([]);
      setallDaysCheckBoxClicked(false);
    } else {
      setSelectedDays(Days);
      setallDaysCheckBoxClicked(true);
    }
  };

  const addRemoveDaySelectedDays = (selected) => {
    if (selectedDays.includes(selected)) {
      let daysToadd = selectedDays.filter((day) => day != selected);
      setSelectedDays(daysToadd);
    } else {
      setSelectedDays([...selectedDays, selected]);
    }
  };

  const handleTimerChange = (event, newValue) => {
    console.log(newValue);
    // if (newValue[1] - newValue[0] > 3) {
    setTimer(newValue);
    // }
  };

  const handleAddTimerforSelectedDays = () => {
    let days = daytimers ? daytimers : [];
    days.push([timer, selectedDays]);
    setDayTimers(days);
    setTimer([0, 100]);
    setSelectedDays([]);
    setallDaysCheckBoxClicked(false);
    setDisableSlider(false);
  };

  const handleDisableSchedule = () => {
    setDisableSlider(!disableSlider);
    if (!disableSlider) {
      setTimer([0, 0]);
    } else {
      setTimer([0, 100]);
    }
  };

  const handleDeleteTimer = (index) => {
    let days = daytimers.filter((val, idx) => idx != index);
    setDayTimers(days);
  };

  const getValueLable = (value) => {
    let hours = moment.utc(value * 14.4 * 1000 * 60).format('hh:mm A');
    let time = '30';
    if (parseInt(hours.slice(3)) >= 0 && parseInt(hours.slice(3, 5)) < 30) {
      time = '00';
    }

    if (value == 100) {
      return '11:59 PM';
    } else {
      return hours.slice(0, 2) + ':' + time + hours.slice(5);
    }
  };

  const getValueFromLabel = (label) => {
    let seconds = moment(label, 'HH:mm: A').diff(moment().startOf('day'), 'seconds');
    return Math.ceil((parseInt(seconds) * 100) / 86400);
  };

  useEffect(() => {
    if (props.timer?.length != 0) {
      let daysToStore = props.timer?.map((day) => {
        let timerToAdd = [getValueFromLabel(day[0][0]), getValueFromLabel(day[0][1])];
        return [timerToAdd, day[1]];
      });
      console.log('daysToStore==>', daysToStore);
      setDayTimers(daysToStore);
      // setTimer(daysToStore[0][0]);
    }
  }, [props.timer]);

  const handleSubmitDefaultSettings = () => {
    setLoading(true);

    let daysTostore = daytimers.map((day) => {
      let timerToAdd = [getValueLable(day[0][0]), getValueLable(day[0][1])];
      return [timerToAdd, day[1]];
    });
    console.log('daysTostore', daysTostore);
    console.log('props.custId', props.custId);
    const payload = {
      cust_id: props.custId,
      timeRange: daysTostore
    };
    const childPayload = {
      zone_child_id: props.zone_child_id,
      timeRange: daysTostore
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

  return props.defaultSettings ? (
    <Formik
      enableReinitialize
      validationSchema={validationSchema}
      initialValues={{
        selectedOption: 'All'
      }}
      onSubmit={(e) => handleSubmitDefaultSettings(e)}>
      {({ errors, touched }) => (
        <Form>
          <DialogContent>
            <Stack>
              <FormControl>
                <Stack spacing={1} className="schduler-stack">
                  <Card className={'scheduler-selected-option'}>
                    <label className={'scheduler-label'}>Available Times</label>
                  </Card>

                  <Stack spacing={3} pb={3}>
                    <Container>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allCheckBoxClicked}
                            onClick={() => handleAddRemoveAllDays()}
                          />
                        }
                        label="All Days"
                      />
                      <AvatarGroup max={7}>
                        {Days.map((day, index) => (
                          <Avatar
                            className={`${
                              selectedDays.includes(day) ? '' : 'scheduler-avatar-not-selected'
                            }`}
                            onClick={() => addRemoveDaySelectedDays(day)}
                            key={index}>{`${day.slice(0, 2)}`}</Avatar>
                        ))}
                      </AvatarGroup>
                    </Container>
                    {console.log('timer props-->', props.timer)}
                    <Stack direction={'row'} pl={4} pb={3}>
                      <Slider
                        disabled={disableSlider}
                        value={timer}
                        valueLabelFormat={getValueLable}
                        onChange={(event, newValue) => handleTimerChange(event, newValue)}
                        valueLabelDisplay={'on'}
                        aria-labelledby="non-linear-slider"
                        getAriaValueText={getValueLable}
                        disableSwap
                        sx={{ width: props.defaultSettings && '78%' }}
                      />

                      <Container className="schduler-addtime-container">
                        {/* <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                              {getValueLable(timer[0]) + ' - ' + getValueLable(timer[1])}
                            </Typography> */}
                        {/* <Stack direction={'row'}> */}
                        <Button
                          className={`add-btn ${selectedDays.length == 0 ? 'schedule-btn' : ''}`}
                          disabled={selectedDays.length == 0}
                          variant="contained"
                          onClick={() => {
                            handleAddTimerforSelectedDays();
                          }}>
                          Schedule
                        </Button>
                        <Button
                          className={`add-btn ${selectedDays.length == 0 ? 'schedule-btn' : ''}`}
                          sx={'width: 126.76px'}
                          disabled={selectedDays.length == 0}
                          variant="contained"
                          onClick={() => {
                            handleDisableSchedule();
                          }}>
                          {disableSlider ? 'Enable' : 'Disable'}
                        </Button>
                        {/* </Stack> */}
                      </Container>
                    </Stack>
                    {daytimers?.map((timer, index) => (
                      <Stack direction={'row'} key={index} className="list-timerange-item ">
                        <Container className="list-item-container">
                          <Slider
                            disabled
                            value={timer[0]}
                            valueLabelFormat={getValueLable}
                            valueLabelDisplay={'auto'}
                            aria-labelledby="non-linear-slider"
                            getAriaValueText={getValueLable}
                            disableSwap
                          />
                          <AvatarGroup max={7}>
                            {timer[1].map((day, index) => (
                              <Avatar key={index}>{`${day.slice(0, 2)}`}</Avatar>
                            ))}
                          </AvatarGroup>
                        </Container>
                        <Container className="schduler-addtime-container-saved">
                          <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                            {getValueLable(timer[0][0]) + ' - ' + getValueLable(timer[0][1])}
                          </Typography>

                          <IconButton
                            sx={{ marginLeft: '5px' }}
                            className=" schduler-delete-button "
                            onClick={() => {
                              handleDeleteTimer(index);
                            }}>
                            <DeleteIcon />
                          </IconButton>
                        </Container>
                      </Stack>
                    ))}
                    {(daytimers?.length == 0 || !daytimers) && (
                      <Container className="no-custom-period-text">
                        <p>
                          24 x 7 Access Is Active <br></br>Until Custom Periods Are Added
                        </p>
                      </Container>
                    )}
                  </Stack>
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
            {props.defaultSettings && (
              <Button
                variant="text"
                disabled={loading}
                onClick={() => {
                  if (!loading) {
                    props.setOpen(false);
                  }
                }}>
                CANCEL
              </Button>
            )}
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
  ) : (
    <Grid container className="stream-details-wraper">
      <Grid item xl={12} lg={12} md={12} sm={12} xs={12} className="default-scheduler-settings">
        <Card sx={{ height: '100%' }}>
          <CardContent className="live-stream-card">
            <Formik
              enableReinitialize
              validationSchema={validationSchema}
              initialValues={{
                selectedOption: 'All'
              }}
              onSubmit={(e) => handleSubmitDefaultSettings(e)}>
              {({ errors, touched }) => (
                <Form>
                  <DialogContent>
                    <Stack>
                      <FormControl>
                        <Stack spacing={1} className="schduler-stack">
                          <Card className={'scheduler-selected-option'}>
                            <label className={'scheduler-label'}>Available Times</label>
                          </Card>

                          <Stack spacing={3} pb={3}>
                            <Container>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={allCheckBoxClicked}
                                    onClick={() => handleAddRemoveAllDays()}
                                  />
                                }
                                label="All Days"
                              />
                              <AvatarGroup max={7}>
                                {Days.map((day, index) => (
                                  <Avatar
                                    className={`${
                                      selectedDays.includes(day)
                                        ? ''
                                        : 'scheduler-avatar-not-selected'
                                    }`}
                                    onClick={() => addRemoveDaySelectedDays(day)}
                                    key={index}>{`${day.slice(0, 2)}`}</Avatar>
                                ))}
                              </AvatarGroup>
                            </Container>
                            {console.log('timer props-->', props.timer)}
                            <Stack direction={'row'} pl={4} pb={3}>
                              <Slider
                                disabled={disableSlider}
                                value={timer}
                                valueLabelFormat={getValueLable}
                                onChange={(event, newValue) => handleTimerChange(event, newValue)}
                                valueLabelDisplay={'on'}
                                aria-labelledby="non-linear-slider"
                                getAriaValueText={getValueLable}
                                disableSwap
                                sx={{ width: props.defaultSettings && '78%' }}
                              />

                              <Container className="schduler-addtime-container">
                                {/* <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                              {getValueLable(timer[0]) + ' - ' + getValueLable(timer[1])}
                            </Typography> */}
                                {/* <Stack direction={'row'}> */}
                                <Button
                                  className={`add-btn ${
                                    selectedDays.length == 0 ? 'schedule-btn' : ''
                                  }`}
                                  disabled={selectedDays.length == 0}
                                  variant="contained"
                                  onClick={() => {
                                    handleAddTimerforSelectedDays();
                                  }}>
                                  Schedule
                                </Button>
                                <Button
                                  className={`add-btn ${
                                    selectedDays.length == 0 ? 'schedule-btn' : ''
                                  }`}
                                  sx={'width: 126.76px'}
                                  disabled={selectedDays.length == 0}
                                  variant="contained"
                                  onClick={() => {
                                    handleDisableSchedule();
                                  }}>
                                  {disableSlider ? 'Enable' : 'Disable'}
                                </Button>
                                {/* </Stack> */}
                              </Container>
                            </Stack>
                            {daytimers?.map((timer, index) => (
                              <Stack direction={'row'} key={index} className="list-timerange-item ">
                                <Container className="list-item-container">
                                  <Slider
                                    disabled
                                    value={timer[0]}
                                    valueLabelFormat={getValueLable}
                                    valueLabelDisplay={'auto'}
                                    aria-labelledby="non-linear-slider"
                                    getAriaValueText={getValueLable}
                                    disableSwap
                                  />
                                  <AvatarGroup max={7}>
                                    {timer[1].map((day, index) => (
                                      <Avatar key={index}>{`${day.slice(0, 2)}`}</Avatar>
                                    ))}
                                  </AvatarGroup>
                                </Container>
                                <Container className="schduler-addtime-container-saved">
                                  <Typography variant="caption" sx={{ marginLeft: '5px' }}>
                                    {getValueLable(timer[0][0]) +
                                      ' - ' +
                                      getValueLable(timer[0][1])}
                                  </Typography>

                                  <IconButton
                                    sx={{ marginLeft: '5px' }}
                                    className=" schduler-delete-button "
                                    onClick={() => {
                                      handleDeleteTimer(index);
                                    }}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Container>
                              </Stack>
                            ))}
                            {(daytimers?.length == 0 || !daytimers) && (
                              <Container className="no-custom-period-text">
                                <p>
                                  24 x 7 Access Is Active <br></br>Until Custom Periods Are Added
                                </p>
                              </Container>
                            )}
                          </Stack>
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
                    {props.defaultSettings && (
                      <Button
                        variant="text"
                        disabled={loading}
                        onClick={() => {
                          if (!loading) {
                            props.setOpen(false);
                          }
                        }}>
                        CANCEL
                      </Button>
                    )}
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
  settings: PropTypes.bool,
  custId: PropTypes.string,
  timer: PropTypes.array,
  defaultSettings: PropTypes.bool,
  zone_child_id: PropTypes.string,
  getDefaultScheduleSettings: PropTypes.func
};
