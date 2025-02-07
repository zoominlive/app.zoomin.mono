import React, { useContext, useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material';
import PropTypes from 'prop-types';
import { Form, Formik, useFormik } from 'formik';
import * as yup from 'yup';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';

const RecordingForm = (props) => {
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagsList, setTagsList] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    getTagsList();
  }, []);

  const getTagsList = () => {
    API.get('cams/list-record-tags').then((response) => {
      if (response.status === 200) {
        setTagsList(response.data.Data.recordTags);
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

  const validationSchema = yup.object({
    event_name: yup.string('Event name').required('Event name is required'),
    tag: yup.string('Select tag').required('Tag is required')
  });

  const formik = useFormik({
    initialValues: {
      event_name: props?.recordingData?.event_name || '',
      tag: props?.recordingData?.tag_id || ''
    }
  });

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const handleSubmit = (data) => {
    const payload = {
      ...data,
      record_uuid: props?.recordingData?.record_uuid
    };

    setSubmitLoading(true);
    API.put('recordings/edit', payload).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response?.data?.Message, {
          variant: 'success'
        });
        handleFormDialogClose();
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setSubmitLoading(false);
    });
  };

  const handleFormDialogClose = () => {
    console.log('submitLoading==>', submitLoading);

    if (!submitLoading) {
      props.setOpen(false);
      props.setRecordingData();
      props.getRecordingData();
    }
  };

  return (
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-user-drawer">
      <DialogTitle sx={{ paddingTop: 3.5 }}>
        {'Edit Record'}
        <DialogContentText></DialogContentText>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 30
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />
      {isCloseDialog ? (
        <>
          <Stack direction={'row'} justifyContent={'center'} alignItems={'start'} padding={3}>
            <DialogContentText>
              Are you sure you want to exit before completing the wizard ?
            </DialogContentText>
          </Stack>
          <DialogActions sx={{ paddingRight: 4, paddingBottom: 3 }}>
            <Stack direction="row" justifyContent="flex-end" width="100%">
              <Button
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5 }}
                onClick={() => {
                  setIsCloseDialog(false);
                }}>
                No
              </Button>

              <Button
                id="yes-btn"
                className="log-btn"
                variant="outlined"
                sx={{ marginRight: 1.5, color: '#ffff' }}
                style={{ color: '#ffff' }}
                onClick={() => {
                  setIsCloseDialog(false);
                  props.setOpen(false);
                  props.setRecordingData();
                  // handleFormDialogClose();
                }}>
                Yes
              </Button>
            </Stack>
          </DialogActions>
        </>
      ) : (
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
                  <Grid container spacing={2}>
                    <Grid item md={6} xs={12}>
                      <InputLabel id="event_name">Event Name</InputLabel>
                      <TextField
                        labelId="event_name"
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
                    <Grid item md={6} xs={12}>
                      <InputLabel id="tag">Tag</InputLabel>
                      <FormControl fullWidth error={touched.role && Boolean(errors.role)}>
                        <Select
                          labelId="tag"
                          id="tag"
                          value={values?.tag}
                          label="Tag"
                          name="tag"
                          onChange={(event) => {
                            setFieldValue('tag', event.target.value);
                            setSelectedTag(event.target.value);
                          }}>
                          {console.log('tagsList==>', tagsList)}
                          {tagsList.map((item) => {
                            return (
                              <MenuItem key={item.tag_id} value={item.tag_id}>
                                {item.tag_name}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {touched.role && Boolean(errors.role) && (
                          <FormHelperText sx={{ color: '#d32f2f' }}>
                            {touched.role && errors.role}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </DialogContent>

                <DialogActions
                  sx={{
                    paddingRight: 4,
                    paddingBottom: 3,
                    justifyContent: 'flex-end'
                  }}>
                  <LoadingButton
                    className="add-btn save-changes-btn"
                    loading={submitLoading}
                    loadingPosition={submitLoading ? 'start' : undefined}
                    startIcon={submitLoading && <SaveIcon />}
                    variant="text"
                    type="submit">
                    Save Changes
                  </LoadingButton>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      )}
    </Dialog>
  );
};

export default RecordingForm;

RecordingForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  recordingData: PropTypes.object,
  setRecordingData: PropTypes.func,
  getRecordingData: PropTypes.func
};
