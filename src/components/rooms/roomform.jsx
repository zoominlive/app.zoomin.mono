import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
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
  TextField,
  Tooltip
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as yup from 'yup';
import { FieldArray, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import DeleteCamDialog from './deletecamdialog';
import { useState } from 'react';
import { useRef } from 'react';
import API from '../../api';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import { useEffect } from 'react';

const validationSchema = yup.object({
  room_name: yup.string('Enter Room name').required('Room name is required'),
  location: yup.string('Select Location').required('Location is required'),
  cams: yup.array().of(
    yup.object().shape({
      cam_name: yup.string('Enter Camera name').required('Camera name is required'),
      cam_uri: yup
        .string()
        .matches(
          /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
          'Enter correct url'
        )
        .required('Camera url is required')
    })
  )
});

const RoomForm = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const authCtx = useContext(AuthContext);
  const [isDeleteCamDialogOpen, setIsDeleteCamDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cameraSaveLoading, setCameraSaveLoading] = useState([]);
  const [camDeleteLoading, setCamDeleteLoading] = useState(false);
  const [disableActions, setDisableActions] = useState(false);
  const arrayHelpersRef = useRef(null);
  const formikRef = useRef(null);
  const [cameraIndex, setCameraIndex] = useState();
  const maximumCams = 15;

  useEffect(() => {
    const tempCameraSaveLoading = props?.room?.camDetails?.map(() => false);
    setCameraSaveLoading(tempCameraSaveLoading || []);
  }, []);

  useEffect(() => {
    if (cameraSaveLoading.length > 0) {
      const tempCameraSaveLoading = cameraSaveLoading.some((loading) => loading);
      if (tempCameraSaveLoading) {
        setDisableActions(true);
      } else {
        setDisableActions(false);
      }
    }
  }, [cameraSaveLoading]);

  const handleSubmit = (data) => {
    setSubmitLoading(true);
    if (props.room) {
      API.put('rooms/edit', { ...data, room_id: props.room.room_id }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getRoomsList();
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
      handleFormDialogClose();
    } else {
      API.post('rooms/add', data).then((response) => {
        if (response.status === 201) {
          props.setRoom(response.data.Data);
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getRoomsList();
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
  };

  const handleFormDialogClose = () => {
    props.setOpen(false);
    props.setRoom();
  };

  const handleCamAdd = (index, uri, name) => {
    setCameraSaveLoading((prevState) => {
      const temp = [...prevState];
      temp[index] = true;
      return temp;
    });
    API.post('cams/add', { cam_uri: uri, cam_name: name, room_id: props.room.room_id }).then(
      (response) => {
        if (response.status === 201) {
          arrayHelpersRef.current.replace(index, response.data.Data);
          props.getRoomsList();
          enqueueSnackbar(response.data.Message, { variant: 'success' });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setCameraSaveLoading((prevState) => {
          const temp = [...prevState];
          temp[index] = false;
          return temp;
        });
      }
    );
  };

  const handleCamDelete = (wait) => {
    setCamDeleteLoading(true);
    API.delete('cams/delete', {
      data: {
        cam_id: formikRef.current.values.cams[cameraIndex].cam_id,
        // cam_id: props.room.camDetails[cameraIndex].cam_id,
        streamId: formikRef.current.values.cams[cameraIndex].stream_uuid,

        // streamId: props.room.camDetails[cameraIndex].stream_uuid,
        wait
      }
    }).then((response) => {
      if (response.status === 200) {
        arrayHelpersRef.current.remove(cameraIndex);
        setCameraSaveLoading((prevState) => {
          const temp = [...prevState];
          temp.splice(cameraIndex, 1);
          return temp;
        });
        props.getRoomsList();
        setIsDeleteCamDialogOpen(false);
        setCameraIndex();
        enqueueSnackbar(response.data.Message, { variant: 'success' });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setCamDeleteLoading(false);
      handleDialogClose();
    });
  };

  const handleDialogClose = () => {
    setIsDeleteCamDialogOpen(false);
  };

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        if (!submitLoading && !disableActions && !camDeleteLoading) {
          handleFormDialogClose();
        }
      }}
      fullWidth
      className="edit-family-dialog">
      <DialogTitle>{props.room ? 'Edit Room' : 'Add Room'}</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        innerRef={formikRef}
        initialValues={{
          room_name: props?.room?.room_name ? props?.room?.room_name : '',
          location: props?.room?.location ? props?.room?.location : '',
          cams:
            props?.room?.camDetails && props?.room?.camDetails.length > 0
              ? props?.room?.camDetails
              : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors, validateField, setFieldTouched }) => {
          console.log(values);
          return (
            <Form>
              <DialogContent>
                <Box px={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="room_name"
                        label="Room Name"
                        value={values?.room_name}
                        onChange={(event) => {
                          setFieldValue('room_name', event.target.value);
                        }}
                        helperText={touched.room_name && errors.room_name}
                        error={touched.room_name && Boolean(errors.room_name)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={touched.location && Boolean(errors.location)}>
                        <InputLabel id="location-select">Location</InputLabel>
                        <Select
                          name="location"
                          labelId="location-select"
                          id="location-select"
                          label="Location"
                          value={values?.location}
                          onChange={(event) => {
                            setFieldValue('location', event.target.value);
                          }}>
                          {authCtx.user &&
                            authCtx.user.location &&
                            authCtx.user.location.selected_locations &&
                            authCtx.user.location.selected_locations.length > 0 &&
                            authCtx.user.location.selected_locations.map((location, index) => {
                              return (
                                <MenuItem key={index} value={location}>
                                  {location}
                                </MenuItem>
                              );
                            })}
                        </Select>
                        {touched.location && errors.location && (
                          <FormHelperText sx={{ color: '#d32f2f' }}>
                            {errors.location}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                  {props?.room?.room_id && (
                    <>
                      <Divider textAlign="left" sx={{ mx: '-16px', my: '15px' }}>
                        CAMERA
                      </Divider>
                      <FieldArray
                        name="cams"
                        render={(arrayHelpers) => {
                          arrayHelpersRef.current = arrayHelpers;
                          return (
                            <>
                              {values.cams &&
                                values.cams.length > 0 &&
                                values.cams.map((_, index) => (
                                  <Grid
                                    key={index}
                                    className="camera-fields"
                                    container
                                    spacing={3}
                                    sx={{ mb: index !== values.cams.length - 1 && 3 }}>
                                    <Grid className="name" item xs={6} sm={3} md={3}>
                                      <TextField
                                        name={`cams.${index}_cam_name`}
                                        label="Camera Name"
                                        value={values?.cams[index]?.cam_name}
                                        onChange={(event) => {
                                          setFieldValue(
                                            `cams[${index}].cam_name`,
                                            event.target.value
                                          );
                                        }}
                                        helperText={
                                          touched.cams &&
                                          touched.cams[index] &&
                                          touched.cams[index].cam_name &&
                                          errors.cams &&
                                          errors.cams[index] &&
                                          errors.cams[index].cam_name
                                        }
                                        error={
                                          touched.cams &&
                                          touched.cams[index] &&
                                          touched.cams[index].cam_name &&
                                          errors.cams &&
                                          errors.cams[index] &&
                                          Boolean(errors.cams[index].cam_name)
                                        }
                                        fullWidth
                                      />
                                    </Grid>
                                    <Grid className="url" item xs={12} sm={6} md={6.5}>
                                      <TextField
                                        name={`cams.${index}_cam_uri`}
                                        label="Cam URL"
                                        value={values?.cams[index]?.cam_uri}
                                        onChange={(event) => {
                                          setFieldValue(
                                            `cams[${index}].cam_uri`,
                                            event.target.value
                                          );
                                        }}
                                        fullWidth
                                        helperText={
                                          touched.cams &&
                                          touched.cams[index] &&
                                          touched.cams[index].cam_uri &&
                                          errors.cams &&
                                          errors.cams[index] &&
                                          errors.cams[index].cam_uri
                                        }
                                        error={
                                          touched.cams &&
                                          touched.cams[index] &&
                                          touched.cams[index].cam_uri &&
                                          errors.cams &&
                                          errors.cams[index] &&
                                          Boolean(errors.cams[index].cam_uri)
                                        }
                                      />
                                    </Grid>
                                    <Grid
                                      className="action"
                                      item
                                      xs={6}
                                      sm={3}
                                      md={2.5}
                                      sx={{
                                        mt:
                                          touched.cams &&
                                          touched.cams[index] &&
                                          (touched.cams[index].cam_uri ||
                                            touched.cams[index].cam_name) &&
                                          errors &&
                                          errors.cams &&
                                          errors?.cams[index] &&
                                          (errors.cams[index].cam_name ||
                                            errors.cams[index].cam_name)
                                            ? -3
                                            : 0
                                      }}>
                                      <Stack
                                        className="row-button-wrapper"
                                        direction="row"
                                        spacing={3}>
                                        <IconButton
                                          aria-label="delete"
                                          className="row-delete-btn"
                                          disabled={cameraSaveLoading[index]}
                                          onClick={() => {
                                            if (values.cams[index].cam_id) {
                                              setCameraIndex(index);
                                              setIsDeleteCamDialogOpen(true);
                                            } else {
                                              arrayHelpersRef.current.remove(index);
                                            }
                                          }}>
                                          <DeleteIcon />
                                        </IconButton>

                                        {!values.cams[index].cam_id && (
                                          <LoadingButton
                                            variant="contained"
                                            loading={cameraSaveLoading[index]}
                                            onClick={() => {
                                              validateField(`cams[${index}].cam_uri`);
                                              setFieldTouched(`cams[${index}].cam_uri`);
                                              validateField(`cams[${index}].cam_name`);
                                              setFieldTouched(`cams[${index}].cam_name`);

                                              if (
                                                values.cams[index].cam_name &&
                                                values.cams[index].cam_uri &&
                                                /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g.test(
                                                  values.cams[index].cam_uri
                                                )
                                              ) {
                                                handleCamAdd(
                                                  index,
                                                  values.cams[index].cam_uri,
                                                  values.cams[index].cam_name
                                                );
                                              }
                                            }}>
                                            Save
                                          </LoadingButton>
                                        )}
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                ))}
                              <Box className="row-button-wrapper" justifyContent="flex-end" mt={2}>
                                {values.cams.length !== maximumCams ? (
                                  <Button
                                    disabled={values.cams.length === maximumCams}
                                    variant="contained"
                                    endIcon={<AddIcon />}
                                    sx={{ mt: 1, mr: 4 }}
                                    onClick={() => {
                                      if (values.cams.length === maximumCams - 1) {
                                        enqueueSnackbar(
                                          `Maximum ${maximumCams} cameras are allowed.`,
                                          {
                                            variant: 'warning'
                                          }
                                        );
                                      }
                                      arrayHelpers.push({
                                        cam_name: '',
                                        cam_uri: ''
                                      });
                                      setCameraSaveLoading((prevState) => [...prevState, false]);
                                    }}
                                    className="row-add-btn">
                                    Add CAM
                                  </Button>
                                ) : (
                                  <Tooltip
                                    title={`Maximum ${maximumCams} cameras are allowed`}
                                    placement="top"
                                    arrow>
                                    <Box component="span" mt={1} mr={4}>
                                      <Button
                                        disabled={values.cams.length === maximumCams}
                                        variant="contained"
                                        endIcon={<AddIcon />}
                                        className="row-add-btn">
                                        Add CAM
                                      </Button>
                                    </Box>
                                  </Tooltip>
                                )}
                              </Box>
                            </>
                          );
                        }}
                      />
                    </>
                  )}
                </Box>
              </DialogContent>

              <Divider />
              <DialogActions>
                <Button
                  disabled={disableActions}
                  variant="text"
                  onClick={() => {
                    if (!submitLoading && !disableActions && !camDeleteLoading) {
                      handleFormDialogClose();
                    }
                  }}>
                  CANCEL
                </Button>
                <LoadingButton
                  disabled={disableActions}
                  loading={submitLoading}
                  loadingPosition={submitLoading ? 'start' : undefined}
                  startIcon={submitLoading && <SaveIcon />}
                  variant="text"
                  type="submit">
                  {props?.room?.room_id ? 'SAVE CHANGES' : 'SAVE ROOM & ADD CAMERA'}
                </LoadingButton>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
      <DeleteCamDialog
        open={isDeleteCamDialogOpen}
        loading={camDeleteLoading}
        handleCamDelete={handleCamDelete}
        handleDialogClose={handleDialogClose}
      />
    </Dialog>
  );
};

export default RoomForm;

RoomForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  room: PropTypes.object,
  setRoom: PropTypes.func,
  getRoomsList: PropTypes.func
};
