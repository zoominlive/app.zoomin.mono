import React, { useContext, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputLabel,
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
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const MobileStreamEditForm = (props) => {
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);

  const validationSchema = yup.object({
    stream_name: yup.string('Stream name').required('Stream name is required')
  });

  const formik = useFormik({
    initialValues: {
      stream_name: props?.recordingData?.stream_name || ''
    }
  });

  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const handleSubmit = (data) => {
    const payload = {
      ...data,
      stream_id: props?.recordingData?.stream_id
    };

    setSubmitLoading(true);
    API.put('recordings/edit-mobile-stream', payload).then((response) => {
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
    if (!submitLoading) {
      props.setOpen(false);
      props.setRecordingData();
      props.getRecordingData();
    }
  };

  return (
    <Dialog
      sx={{
        '& .MuiDialog-container': isCloseDialog
          ? {
              alignItems: 'flex-start',
              marginTop: '12vh',
              '& .MuiDialog-paper': { maxWidth: '440px !important' }
            }
          : {}
      }}
      open={props.open}
      onClose={handleClose}
      fullWidth
      className="add-user-drawer">
      {/* <Divider /> */}
      {isCloseDialog ? (
        <ConfirmationDialog
          onCancel={() => {
            setIsCloseDialog(false);
          }}
          onConfirm={() => {
            setIsCloseDialog(false);
            props.setOpen(false);
            props.setRecordingData();
            // handleFormDialogClose();
          }}
          handleFormDialogClose={handleClose}
        />
      ) : (
        <>
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
                    <Grid container spacing={2}>
                      <Grid item md={6} xs={12}>
                        <InputLabel id="stream_name">Stream Name</InputLabel>
                        <TextField
                          labelId="stream_name"
                          name="stream_name"
                          value={values?.stream_name}
                          onChange={(event) => {
                            setFieldValue('stream_name', event.target.value);
                          }}
                          helperText={touched.stream_name && errors.stream_name}
                          error={touched.stream_name && Boolean(errors.stream_name)}
                          fullWidth
                        />
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
        </>
      )}
    </Dialog>
  );
};

export default MobileStreamEditForm;

MobileStreamEditForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  recordingData: PropTypes.object,
  setRecordingData: PropTypes.func,
  getRecordingData: PropTypes.func
};
