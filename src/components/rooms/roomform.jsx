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

const validationSchema = yup.object({
  room_name: yup.string('Enter Room name').required('Room name is required'),
  location: yup.string('Select Location').required('Location is required'),
  cams: yup.array().of(
    yup.object().shape({
      cam_name: yup.string('Enter Camera name').required('Camera name is required'),
      cam_url: yup
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
  const maximumCams = 5;

  const handleSubmit = (data) => {
    console.log(data);
  };

  const handleFormDialogClose = () => {
    props.setOpen(false);
    props.setRoom();
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleFormDialogClose}
      fullWidth
      // maxWidth={'lg'}
      className="edit-family-dialog"
      // className=""
    >
      <DialogTitle>Add Room</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          room_name: props?.room?.room_name ? props?.room?.room_name : '',
          location: props?.room?.location ? props?.room?.location : '',
          cams: props?.room?.cams && props?.room?.cams.length > 0 ? props?.room?.cams : []
        }}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, touched, errors }) => {
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
                          <MenuItem key={0} value={'Location 1'}>
                            Location 1
                          </MenuItem>

                          <MenuItem key={1} value={'Location 2'}>
                            Location 2
                          </MenuItem>

                          <MenuItem key={2} value={'Location 3'}>
                            Location 3
                          </MenuItem>
                        </Select>
                        {touched.location && errors.location && (
                          <FormHelperText sx={{ color: '#d32f2f' }}>
                            {errors.location}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Divider textAlign="left" sx={{ mx: '-16px', my: '15px' }}>
                    CAMERA
                  </Divider>
                  <FieldArray
                    name="cams"
                    render={(arrayHelpers) => (
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
                                    setFieldValue(`cams[${index}].cam_name`, event.target.value);
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
                              <Grid className="url" item xs={12} sm={6} md={7}>
                                <TextField
                                  name={`cams.${index}_cam_url`}
                                  label="Cam URL"
                                  value={values?.cams[index]?.cam_url}
                                  onChange={(event) => {
                                    setFieldValue(`cams[${index}].cam_url`, event.target.value);
                                  }}
                                  fullWidth
                                  helperText={
                                    touched.cams &&
                                    touched.cams[index] &&
                                    touched.cams[index].cam_url &&
                                    errors.cams &&
                                    errors.cams[index] &&
                                    errors.cams[index].cam_url
                                  }
                                  error={
                                    touched.cams &&
                                    touched.cams[index] &&
                                    touched.cams[index].cam_url &&
                                    errors.cams &&
                                    errors.cams[index] &&
                                    Boolean(errors.cams[index].cam_url)
                                  }
                                />
                              </Grid>
                              <Grid className="action" item xs={6} sm={3} md={2}>
                                <Box className="row-button-wrapper">
                                  <IconButton
                                    aria-label="delete"
                                    className="row-delete-btn"
                                    onClick={() => {
                                      arrayHelpers.remove(index);
                                    }}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
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
                                if (values.cams.length === 4) {
                                  enqueueSnackbar('Maximum 5 cameras are allowed.', {
                                    variant: 'warning'
                                  });
                                }
                                arrayHelpers.push({
                                  cam_name: '',
                                  cam_url: ''
                                });
                              }}
                              className="row-add-btn">
                              Add CAM
                            </Button>
                          ) : (
                            <Tooltip title="Maximum 5 cameras are allowed" placement="top" arrow>
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
                    )}
                  />
                </Box>
              </DialogContent>

              <Divider />
              <DialogActions>
                <Button variant="text" onClick={handleFormDialogClose}>
                  CANCEL
                </Button>
                <Button variant="text" type="submit">
                  SAVE CHANGES
                </Button>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default RoomForm;

RoomForm.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  room: PropTypes.object,
  setRoom: PropTypes.func
};
