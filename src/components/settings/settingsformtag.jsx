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
  IconButton,
  InputLabel,
  Stack,
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
      .max(10, 'Tag name must be at most 10 characters')
  });
  // console.log('props', props);

  const handleSubmit = (data, { setSubmitting }) => {
    const { tag_name } = data;
    const payload = {
      tag_name: tag_name,
      cust_id:
        authCtx.user.role === 'Super Admin' ? localStorage.getItem('cust_id') : authCtx.user.cust_id
    };
    if (props.tag !== undefined && props.tag?.tag_name) {
      API.put('cams/edit-record-tag', {
        tag_name: data.tag_name,
        tag_id: props.tag.tag_id
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
    // let new_locations = [];
    // let mappedLocations = props.locationsList.map((item) => item.loc_name);
    // new_locations = [...mappedLocations, ...data.customer_locations];
    // if (new_locations.length > props.customer?.max_locations) {
    //   setMaxLocationAlert(true);
    // } else {
    //   setSubmitLoading(true);
    //   console.log('payload==>', payload);
    //   props.location !== undefined && props.location?.loc_name
    //     ? API.put('customers/editCustomerLocation', {
    //         loc_name: data.customer_locations[0],
    //         loc_id: props.location.loc_id,
    //         status: statusChecked
    //       }).then((response) => {
    //         if (response.status === 200) {
    //           enqueueSnackbar(response?.data?.Message, {
    //             variant: 'success'
    //           });
    //           props.getLocationsList();
    //           props.setLocation();
    //           handleFormDialogClose();
    //         } else {
    //           errorMessageHandler(
    //             enqueueSnackbar,
    //             response?.response?.data?.Message || 'Something Went Wrong.',
    //             response?.response?.status,
    //             authCtx.setAuthError
    //           );
    //         }
    //         setSubmitLoading(false);
    //       })
    //     : API.post('customers/createCustomerLocation', payload).then((response) => {
    //         if (response.status === 201) {
    //           enqueueSnackbar(response?.data?.Message, {
    //             variant: 'success'
    //           });
    //           props.getLocationsList();
    //           handleFormDialogClose();
    //         } else {
    //           errorMessageHandler(
    //             enqueueSnackbar,
    //             response?.response?.data?.Message || 'Something Went Wrong.',
    //             response?.response?.status,
    //             authCtx.setAuthError
    //           );
    //         }
    //         setSubmitLoading(false);
    //       });
    // }
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
    <Dialog open={props.open} onClose={handleClose} fullWidth className="add-user-drawer">
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
                  handleFormDialogClose();
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
          initialValues={{
            tag_name: props?.tag?.tag_name || ''
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
                    fullWidth
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
