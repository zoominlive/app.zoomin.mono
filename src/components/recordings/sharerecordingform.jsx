/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Tooltip,
  InputLabel
} from '@mui/material';
import PropTypes from 'prop-types';
import { Form, Formik, useFormik } from 'formik';
import CloseIcon from '@mui/icons-material/Close';
import API from '../../api';
import * as yup from 'yup';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import reshareicon from '../../assets/share-recording-again.svg';
import deleterecordingicon from '../../assets/delete-recording-link.svg';
import debounce from 'lodash.debounce';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import moment from 'moment';
import { CheckCircle, PanoramaFishEye } from '@mui/icons-material';
import NoDataDiv from '../common/nodatadiv';
import closeicon from '../../assets/closeicon.svg';
import CautionIcon from '../../assets/caution.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const formatDate = (dateString) => {
  return moment(dateString).format('MM/DD/YYYY');
};
const isExpired = (dateString) => moment().isAfter(moment(dateString));

const validationSchema = yup.object({
  event_name: yup
    .string('Enter event name')
    .nullable() // Allows null values
    .default('') // Ensures a default empty string if null
    .required('Please add an event name before sharing this clip.')
});

const ShareRecordingForm = (props) => {
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedTag, setSelectedTag] = useState(null);
  const [shareHistory, setShareHistory] = useState([]);
  const [urlToCopy, setUrlToCopy] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  // eslint-disable-next-line no-unused-vars
  const [selectedOption, setSelectedOption] = useState('staff');
  const [selectedDaysOption, setSelectedDaysOption] = useState('1');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsersSelected, setAllUsersSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [familiesResults, setFamiliesResults] = useState([]);
  const [usersResults, setUsersResults] = useState([]);
  const [showLink, setShowLink] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getShareHistory();
  }, []);

  useEffect(() => {
    if (selectedOption == 'staff') {
      getUsersList({
        pageNumber: 0,
        pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
        searchBy: '',
        location: 'All',
        role: 'All',
        liveStreaming: 'All',
        cust_id: localStorage.getItem('cust_id')
      });
    } else if (selectedOption == 'family') {
      getFamiliesList({
        page: 0,
        limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
        searchBy: '',
        location: 'All',
        zones: [],
        cust_id: localStorage.getItem('cust_id')
      });
    }
  }, [selectedOption]);

  const getShareHistory = () => {
    setIsLoading(true);
    API.get('recordings/share-history', {
      params: { record_uuid: props?.recordingData?.record_uuid }
    }).then((response) => {
      if (response.status === 200) {
        console.log('shareHistory', response.data.Data);
        setShareHistory(response.data.Data);
        setIsLoading(false);
      } else {
        if (response.response.status !== 404) {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      }
    });
  };

  const formik = useFormik({
    initialValues: {
      event_name: props?.recordingData?.event_name,
      selectedOption: selectedOption,
      selectedDaysOption: selectedDaysOption,
      shared_link: props?.recordingData?.unsigned_url,
      presigned_url: props?.recordingData?.video_url
    }
  });

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const handleFormDialogClose = () => {
    console.log('submitLoading==>', submitLoading);

    if (!submitLoading) {
      props.setOpen(false);
      props.setRecordingData();
      props.getRecordingData();
    }
  };

  const handleSubmit = (data) => {
    console.log('submitLoading==>', submitLoading);
    console.log('selectedUsers==>', selectedUsers);
    console.log('data==>', data);
    API.post('recordings/share', {
      ...data,
      user_id: authCtx.user.user_id,
      recipient: {
        receiver_id: selectedUsers.user_id || selectedUsers.primary.family_member_id,
        receiver_name:
          (selectedUsers.first_name || selectedUsers.primary.first_name) +
          ' ' +
          (selectedUsers.last_name || selectedUsers.primary.last_name),

        receiver_email: selectedUsers.email || selectedUsers.primary.email
      },
      event_name: data?.event_name,
      days: selectedDaysOption,
      shared_link: data?.shared_link,
      record_uuid: props?.recordingData?.record_uuid,
      thumbnail_url: props?.recordingData?.thumbnail_url,
      cust_id: localStorage.getItem('cust_id')
    })
      .then((response) => {
        if (response.status === 201) {
          enqueueSnackbar('Recording Shared Successfully', { variant: 'success' });
          setUrlToCopy(response.data.Data.shared_cf_link);
          setShowLink(true);
          // props.setOpen(false);
          setSubmitLoading(false);
          getShareHistory();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
          props.setOpen(false);
          setSubmitLoading(false);
        }
      })
      .catch(() => setSubmitLoading(false));
  };

  const handleUserChange = (_, value, reason, option) => {
    if (reason == 'selectOption' && option?.option?.user_id == 'Select All' && !allUsersSelected) {
      setSelectedUsers(reason === 'selectOption' ? usersResults : []);
      setAllUsersSelected(true);
    } else if (option?.option?.user_id == 'Select All' && reason === 'removeOption') {
      setSelectedUsers([]);
      setAllUsersSelected(false);
    } else if (
      reason === 'selectOption' &&
      option?.option?.user_id == 'Select All' &&
      allUsersSelected == true
    ) {
      setAllUsersSelected(false);
      setSelectedUsers([]);
    } else {
      setAllUsersSelected(false);
      setSelectedUsers(value || null);
      setSearchText(value ? `${value.first_name || ''} ${value.last_name || ''}`.trim() : ''); // ✅ Ensures input field is updated
    }
  };

  const handleDeleteRecord = (data) => {
    console.log('data==>', data);
    API.delete('recordings/invalidate-link', {
      data: {
        share_id: data?.share_id
      }
    })
      .then((response) => {
        if (response.status === 201) {
          enqueueSnackbar('Recording Deleted successfully!', { variant: 'success' });

          // props.setOpen(false);
          setSubmitLoading(false);
          getShareHistory();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
          props.setOpen(false);
          setSubmitLoading(false);
        }
      })
      .catch(() => setSubmitLoading(false));
  };

  const handleReShare = (data) => {
    console.log('data==>', data);
    API.post('recordings/share', {
      ...data,
      req_share_id: data.share_id,
      recipient: {
        receiver_name:
          data.recordings_share_recipients[0].user?.first_name ||
          data.recordings_share_recipients[0].family?.first_name +
            ' ' +
            data.recordings_share_recipients[0].user?.last_name ||
          data.recordings_share_recipients[0].family?.last_name,
        expires_on: data.expires_on,
        thumbnail_url: data.thumbnail_url,
        receiver_email:
          data.recordings_share_recipients[0].user?.email ||
          data.recordings_share_recipients[0].family?.email,
        video_url: data.shared_cf_link
      },
      reshare: true,
      cust_id: localStorage.getItem('cust_id')
    })
      .then((response) => {
        if (response.status === 201) {
          enqueueSnackbar('Recording re-shared successfully!', { variant: 'success' });

          // props.setOpen(false);
          setSubmitLoading(false);
          getShareHistory();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
          props.setOpen(false);
          setSubmitLoading(false);
        }
      })
      .catch(() => setSubmitLoading(false));
  };

  const newHandleChange = debounce((newValue) => {
    console.log('reached==>', newValue);
    if (!newValue.trim()) return; // Ignore empty values

    const familyPayload = {
      page: 0,
      limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
      searchBy: newValue,
      location: 'All',
      zones: [],
      cust_id: localStorage.getItem('cust_id')
    };

    const usersPlayload = {
      pageNumber: 0,
      pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
      searchBy: newValue,
      location: 'All',
      role: 'All',
      liveStreaming: 'All',
      cust_id: localStorage.getItem('cust_id')
    };

    if (selectedOption === 'family') {
      getFamiliesList(familyPayload);
    } else {
      getUsersList(usersPlayload);
    }
  }, 500);

  // Method to fetch families list
  const getFamiliesList = (familiesPayload) => {
    setOptionsLoading(true);
    API.get('family', { params: familiesPayload }).then((response) => {
      if (response.status === 200) {
        console.log('familiesPayload.searchBy', familiesPayload.searchBy);
        const famResults = response.data.Data.familyArray;
        setFamiliesResults(famResults);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  // Method to fetch user list for table
  const getUsersList = (usersPlayload) => {
    setOptionsLoading(true);
    API.get('users/all', { params: usersPlayload }).then((response) => {
      if (response.status === 200) {
        const userResults = response.data.Data.users;
        setUsersResults(userResults);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      fullWidth
      className="add-user-drawer"
      sx={{
        '& .MuiDialog-paper': { maxWidth: '566px !important' },
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}>
      {/* <Divider /> */}
      {isCloseDialog ? (
        <ConfirmationDialog
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          onConfirm={() => {
            setIsCloseDialog(false);
            handleFormDialogClose(() => {
              setIsCloseDialog(false);
              props.setOpen(false);
              props.setRecordingData();
              // handleFormDialogClose();
            });
          }}
          handleFormDialogClose={handleClose}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            {'Share Video'}
            <DialogContentText></DialogContentText>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 18,
                top: 30
              }}>
              {!isCloseDialog ? <CloseIcon /> : <img src={closeicon} alt="closeicon" />}
            </IconButton>
          </DialogTitle>
          <Formik
            enableReinitialize
            validateOnChange
            validationSchema={validationSchema}
            initialValues={formik.initialValues}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors }) => {
              return (
                <Form>
                  <DialogContent>
                    <Grid container direction={'column'} className="listing-wrapper" spacing={1}>
                      <Grid item md={3} xs={6}>
                        <InputLabel id="event_name">Event Name</InputLabel>
                        <TextField
                          labelId="event_name"
                          placeholder="Event Name"
                          name="event_name"
                          value={values?.event_name}
                          onChange={(event) => {
                            setFieldValue('event_name', event.target.value);
                          }}
                          helperText={touched.event_name && errors.event_name}
                          error={touched.event_name && Boolean(errors.event_name)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item md={3} xs={6}>
                        <Typography>Select User Type</Typography>
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
                            <FormControlLabel value={'staff'} control={<Radio />} label={'Staff'} />
                            <FormControlLabel
                              value="family"
                              control={<Radio />}
                              style={{ paddingLeft: '15px' }}
                              label={'Family'}
                            />
                          </RadioGroup>
                          {touched.selectedOption && Boolean(errors.selectedOption) && (
                            <FormHelperText sx={{ color: '#d32f2f' }}>
                              {touched.selectedOption && errors.selectedOption}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid
                        item
                        md={3}
                        sm={6}
                        className="filter"
                        sx={{ marginY: '14px !important' }}>
                        <Autocomplete
                          limitTags={1}
                          id="tags-standard"
                          options={
                            selectedOption === 'family' ? familiesResults || [] : usersResults || []
                          }
                          inputValue={searchText}
                          loading={optionsLoading}
                          value={selectedUsers || []}
                          getOptionLabel={(option) => {
                            if (!option) return '';
                            return `${
                              option.first_name ||
                              option.primary?.first_name ||
                              option.secondary?.first_name ||
                              ''
                            } ${
                              option.last_name ||
                              option.primary?.last_name ||
                              option.secondary?.last_name ||
                              ''
                            }`.trim();
                          }}
                          onChange={handleUserChange} // Handles selection of options
                          onInputChange={(event, newValue, reason) => {
                            if (reason === 'clear') {
                              setSearchText(''); // ✅ Clears the input when clicking the cross (✖)
                              return;
                            } else if (event?.type === 'change') {
                              setSearchText(newValue); // ✅ Update state first
                              newHandleChange(newValue); // ✅ Trigger API search
                            }
                          }} // Handles search input changes
                          renderTags={(value, getTagProps) =>
                            value?.map((option, index) => (
                              <Chip
                                key={index}
                                label={`${
                                  option?.first_name ||
                                  option?.primary?.first_name ||
                                  option?.secondary?.first_name
                                } ${
                                  option?.last_name ||
                                  option?.primary?.last_name ||
                                  option?.secondary?.last_name
                                }`}
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                          renderOption={(props, option, { selected }) => (
                            <li {...props}>
                              {/* <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={allUsersSelected || selected}
                              /> */}
                              {`${
                                option?.first_name ||
                                option?.primary?.first_name ||
                                option?.secondary?.first_name
                              } ${
                                option?.last_name ||
                                option?.primary?.last_name ||
                                option?.secondary?.last_name
                              }`}
                              {selectedOption === 'family' && option?.children?.length > 0 && (
                                <span>
                                  {' '}
                                  ({option.children[0]?.first_name}&apos;s{' '}
                                  {option?.primary?.relationship})
                                </span>
                              )}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth placeholder="Search by name" />
                          )}
                        />
                      </Grid>
                      <Grid item md={3} xs={6}>
                        <Typography>Select Share Duration</Typography>
                        <FormControl>
                          <RadioGroup
                            aria-labelledby="disable-group"
                            row
                            name="selectedDaysOption"
                            value={values.selectedDaysOption}
                            onChange={(event) => {
                              setFieldValue('selectedDaysOption', event.currentTarget.value);
                              setSelectedDaysOption(event.currentTarget.value);
                            }}>
                            <Stack direction={'column'}>
                              <Box>
                                <FormControlLabel value={'1'} control={<Radio />} label={'1 Day'} />
                                <FormControlLabel
                                  value="3"
                                  control={<Radio />}
                                  style={{ paddingLeft: '15px' }}
                                  label={'3 Days'}
                                />
                                <FormControlLabel
                                  value="5"
                                  control={<Radio />}
                                  style={{ paddingLeft: '15px' }}
                                  label={'5 Days'}
                                />
                                <FormControlLabel
                                  value="forever"
                                  control={<Radio />}
                                  style={{ paddingLeft: '15px' }}
                                  label={'Forever'}
                                />
                              </Box>
                              <Box>
                                <FormControlLabel
                                  value="notify"
                                  control={
                                    <Checkbox
                                      icon={<PanoramaFishEye />}
                                      checkedIcon={<CheckCircle />}
                                    />
                                  }
                                  label={'Do not notify the recipient of this share'}
                                />
                              </Box>
                            </Stack>
                          </RadioGroup>
                          {touched.selectedOption && Boolean(errors.selectedOption) && (
                            <FormHelperText sx={{ color: '#d32f2f' }}>
                              {touched.selectedOption && errors.selectedOption}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <Divider />
                  {showLink && (
                    <Stack pt={2.5} px={2.5} gap={1} direction={'row'}>
                      <TextField
                        disabled
                        labelId="share_link"
                        name="share_link"
                        value={urlToCopy}
                        onChange={(event) => {
                          setFieldValue('share_link', event.target.value);
                        }}
                        sx={{ width: '70%' }}
                      />
                      <Button
                        disabled={submitLoading}
                        className="share-link-btn"
                        variant="outlined"
                        sx={{ borderRadius: '60px !important' }}
                        onClick={() => {
                          navigator.clipboard.writeText(urlToCopy);
                          setOpenSnack(true);
                        }}
                        startIcon={<ContentCopyOutlinedIcon />}>
                        Copy Link
                      </Button>
                    </Stack>
                  )}
                  <DialogActions
                    sx={{
                      paddingRight: 4,
                      paddingTop: 2.5,
                      paddingBottom: 2.5,
                      justifyContent: 'flex-end'
                    }}>
                    <Button
                      disabled={submitLoading}
                      className="cancel-recording-btn"
                      variant="outlined"
                      sx={{ borderRadius: '60px !important' }}
                      onClick={handleFormDialogClose}>
                      Cancel
                    </Button>
                    <Button
                      className="add-btn save-changes-btn"
                      sx={{ borderRadius: '60px !important' }}
                      variant="text"
                      type="submit">
                      Share
                    </Button>
                  </DialogActions>
                </Form>
              );
            }}
          </Formik>
          <Stack paddingX={2.5} paddingBottom={2.5} direction={'column'}>
            <Typography mb={2}>Share History</Typography>
            <Box style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
              {isLoading ? (
                <Box
                  height={'200px'}
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}>
                  <CircularProgress sx={{ color: '#5a53dd' }} />
                </Box>
              ) : shareHistory.length > 0 ? (
                shareHistory?.map((item, index) =>
                  item.recordings_share_recipients.map((recipient, rIndex) => (
                    <Card
                      key={`${index}-${rIndex}`}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: '#f8f8ff'
                      }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {recipient.user?.first_name || recipient.family?.first_name}{' '}
                          {recipient.user?.last_name || recipient.family?.last_name}
                          <Tooltip title={recipient.user?.email || recipient.family?.email} arrow>
                            <Typography
                              component="span"
                              color="gray"
                              sx={{
                                marginLeft: 0.5,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '250px', // You can adjust the width as needed
                                display: 'inline-block',
                                verticalAlign: 'bottom'
                              }}>
                              ({recipient.user?.email || recipient.family?.email})
                            </Typography>
                          </Tooltip>
                        </Typography>
                        <Typography variant="body2">
                          Shared on:{' '}
                          <Typography component="span" color="primary">
                            {formatDate(item.shared_on)}
                          </Typography>{' '}
                          ({moment(item.shared_on).fromNow()})
                        </Typography>
                        {!isExpired(item.expires_on) ? (
                          <Typography variant="body2">
                            Expires on:{' '}
                            <Typography component="span" color="error">
                              {formatDate(item.expires_on)}
                            </Typography>{' '}
                            (in {moment(item.expires_on).fromNow(true)}) {/* Shows "in X days" */}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="error">
                            Expired
                          </Typography>
                        )}
                      </CardContent>
                      {!isExpired(item.expires_on) && (
                        <Stack direction="row" spacing={1}>
                          <IconButton color="primary" onClick={() => handleReShare(item)}>
                            <img src={reshareicon} alt="reshareicon" />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDeleteRecord(item)}>
                            <img src={deleterecordingicon} alt="deleterecordingicon" />
                          </IconButton>
                        </Stack>
                      )}
                    </Card>
                  ))
                )
              ) : (
                <NoDataDiv />
              )}
            </Box>
          </Stack>
          <Snackbar open={openSnack} autoHideDuration={6000} message="Copied!" />
        </>
      )}
    </Dialog>
  );
};

export default ShareRecordingForm;

ShareRecordingForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  recordingData: PropTypes.object,
  setRecordingData: PropTypes.func,
  getRecordingData: PropTypes.func,
  video_url: PropTypes.string
};
