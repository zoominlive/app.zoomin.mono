import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputLabel,
  Switch,
  TextField
} from '@mui/material';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import API from '../../api';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import CloseIcon from '@mui/icons-material/Close';
import closeicon from '../../assets/closeicon.svg';
import ConfirmationDialog from '../common/confirmationdialog';

const SettingsFormTag = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isCloseDialog, setIsCloseDialog] = useState(false);
  const handleClose = () => setIsCloseDialog(!isCloseDialog);

  const validationSchema = yup.object({
    tag_name: yup
      .string('Enter tag name')
      .required('Tag name is required')
      .max(12, 'Tag name must be at most 12 characters')
  });
  // console.log('props', props);

  const handleSubmit = (data, { setSubmitting }) => {
    const { tag_name, tag_status } = data;
    const payload = {
      tag_name: tag_name.trim(),
      status: tag_status,
      cust_id:
        authCtx.user.role === 'Super Admin' ? localStorage.getItem('cust_id') : authCtx.user.cust_id
    };
    if (props.tag !== undefined && props.tag?.tag_name) {
      API.put('cams/edit-record-tag', {
        tag_name: data.tag_name.trim(),
        tag_id: props.tag.tag_id,
        status: data.tag_status
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getTagsList();
          props.setTag();
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
    } else {
      API.post('cams/add-record-tag', payload).then((response) => {
        if (response.status === 201) {
          enqueueSnackbar(response?.data?.Message, {
            variant: 'success'
          });
          props.getTagsList();
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
    }
    setSubmitting(false);
  };

  // Method to close the form dialog
  const handleFormDialogClose = () => {
    if (!submitLoading) {
      props.setOpen(false);
    }
    props.setTag();
  };
  // console.log('props', props.location);
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
            handleFormDialogClose();
          }}
          handleFormDialogClose={handleClose}
        />
      ) : (
        <>
          <DialogTitle sx={{ paddingTop: 3.5 }}>
            {props.tag?.tag_name !== undefined ? 'Edit Tag' : 'Add Tag'}
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
            initialValues={{
              tag_name: props?.tag?.tag_name || '',
              tag_status: props?.tag?.status || true
            }}
            onSubmit={handleSubmit}>
            {({ values, setFieldValue, touched, errors }) => {
              return (
                <Form>
                  <DialogContent>
                    <InputLabel id="tag_name">Tag name</InputLabel>
                    <TextField
                      labelId="tag_name"
                      name="tag_name"
                      value={values?.tag_name}
                      onChange={(event) => {
                        setFieldValue('tag_name', event.target.value);
                      }}
                      helperText={touched.tag_name && errors.tag_name}
                      error={touched.tag_name && Boolean(errors.tag_name)}
                    />
                    <InputLabel id="tag_status">Tag status</InputLabel>
                    <Switch
                      checked={values?.tag_status}
                      inputProps={{ 'aria-label': 'controlled' }}
                      onChange={(event) => {
                        setFieldValue('tag_status', event.target.checked);
                      }}
                    />
                  </DialogContent>
                  <Divider />
                  <DialogActions
                    sx={{
                      paddingRight: 4,
                      paddingBottom: 3,
                      justifyContent: 'end'
                    }}>
                    <LoadingButton
                      className="add-btn save-changes-btn"
                      loading={submitLoading}
                      loadingPosition={submitLoading ? 'start' : undefined}
                      startIcon={submitLoading && <SaveIcon />}
                      variant="text"
                      type={'submit'}>
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

export default SettingsFormTag;

SettingsFormTag.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  tag: PropTypes.object,
  customer: PropTypes.object,
  getTagsList: PropTypes.func,
  setTag: PropTypes.func,
  tag_name: PropTypes.string
};
