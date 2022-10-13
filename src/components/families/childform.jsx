import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Grid,
  Autocomplete
} from '@mui/material';
import { Form, Formik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  first_name: yup.string().required('First Name is required'),
  rooms: yup.array().min(1, 'Atleast one room is required')
});

const AddChild = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="add-child-drawer">
      <DialogTitle>Add Child</DialogTitle>
      <Divider />
      <Formik
        enableReinitialize
        validateOnChange
        validationSchema={validationSchema}
        initialValues={{
          first_name: '',
          rooms: []
        }}>
        {({ values, setFieldValue, touched, errors }) => {
          console.log(errors);
          return (
            <Form>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item md={3} sm={12}>
                    <TextField
                      name="first_name"
                      label="First Name"
                      value={values.first_name}
                      onChange={(event) => {
                        setFieldValue('first_name', event.target.value);
                      }}
                      helperText={touched.first_name && errors.first_name}
                      error={touched.first_name && Boolean(errors.first_name)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item md={9} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      options={props.roomsList}
                      value={values?.rooms}
                      isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                      getOptionLabel={(option) => {
                        return option.room_name;
                      }}
                      onChange={(_, value) => {
                        setFieldValue('rooms', value);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option.room_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Room"
                          helperText={touched.rooms && errors.rooms}
                          error={touched.rooms && Boolean(errors.rooms)}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={3}></Stack>
              </DialogContent>
              <Divider />
              <DialogActions>
                <Button variant="text" onClick={() => props.setOpen(false)}>
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

export default AddChild;

AddChild.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  roomsList: PropTypes.array
};
