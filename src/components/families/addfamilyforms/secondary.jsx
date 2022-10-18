import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import React from 'react';
import PhoneNumberInput from '../../common/phonenumberinput';
import DeleteIcon from '@mui/icons-material/Delete';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import AddIcon from '@mui/icons-material/Add';

const Secondary = (props) => {
  console.log(props.errors);
  return (
    <FieldArray
      name="secondary"
      render={(arrayHelpers) => {
        return (
          <>
            {props.values.secondary &&
              props.values.secondary.length > 0 &&
              props.values.secondary.map((_, index) => (
                <Box key={index}>
                  {index !== 0 && (
                    <Divider
                      textAlign="left"
                      sx={{
                        margin: '30px -48px'
                      }}>
                      FAMILY MEMBER {index + 1}
                    </Divider>
                  )}
                  <Grid container spacing={2}>
                    <Grid item md={4} sm={12}>
                      <TextField
                        name={`secondary.${index}.first_name`}
                        value={props?.values?.secondary[index]?.first_name}
                        onChange={(event) => {
                          props.setFieldValue(`secondary[${index}].first_name`, event.target.value);
                        }}
                        label="First Name"
                        helperText={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].first_name &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          props.errors.secondary[index].first_name
                        }
                        error={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].first_name &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].first_name)
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={4} sm={12}>
                      <TextField
                        label="Last Name"
                        name={`secondary.${index}.last_name`}
                        value={props?.values?.secondary[index]?.last_name}
                        onChange={(event) => {
                          props.setFieldValue(`secondary[${index}].last_name`, event.target.value);
                        }}
                        helperText={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].last_name &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          props.errors.secondary[index].last_name
                        }
                        error={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].last_name &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].last_name)
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={4} sm={12}>
                      <FormControl
                        fullWidth
                        error={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].relationship &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].relationship)
                        }>
                        <InputLabel id="role">Role</InputLabel>
                        <Select
                          labelId="role"
                          id="role"
                          label="role"
                          name={`secondary.${index}.relationship`}
                          value={props?.values?.secondary[index]?.relationship}
                          onChange={(event) => {
                            props.setFieldValue(
                              `secondary[${index}].relationship`,
                              event.target.value
                            );
                          }}>
                          <MenuItem value={'Mother'}>Mother</MenuItem>
                          <MenuItem value={'Father'}>Father</MenuItem>
                          <MenuItem value={'Aunt'}>Aunt</MenuItem>
                          <MenuItem value={'Uncle'}>Uncle</MenuItem>
                          <MenuItem value={'Grandmother'}>Grandmother</MenuItem>
                          <MenuItem value={'Grandfather'}>Grandfather</MenuItem>
                          <MenuItem value={'Other'}>Other</MenuItem>
                        </Select>
                        {props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].relationship &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].relationship) && (
                            <FormHelperText sx={{ color: '#d32f2f' }}>
                              {props.errors.secondary[index].relationship}
                            </FormHelperText>
                          )}
                      </FormControl>
                    </Grid>
                    <Grid item md={5} sm={12}>
                      <TextField
                        name={`secondary.${index}.email`}
                        label="Email"
                        value={props?.values?.secondary[index]?.email}
                        onChange={(event) => {
                          props.setFieldValue(`secondary[${index}].email`, event.target.value);
                        }}
                        helperText={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].email &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          props.errors.secondary[index].email
                        }
                        error={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].email &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].email)
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={4} sm={12}>
                      <TextField
                        name={`secondary.${index}.phone`}
                        label="Phone"
                        value={
                          props?.values?.secondary[index]?.phone
                            ? props?.values?.secondary[index]?.phone
                            : ''
                        }
                        onChange={(event) => {
                          props.setFieldValue(
                            `secondary[${index}].phone`,
                            event.target.value || ''
                          );
                        }}
                        helperText={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].phone &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          props.errors.secondary[index].phone
                        }
                        error={
                          props.touched &&
                          props.touched.secondary &&
                          props.touched.secondary[index] &&
                          props.touched.secondary[index].phone &&
                          props.errors &&
                          props.errors.secondary &&
                          props.errors.secondary[index] &&
                          Boolean(props.errors.secondary[index].phone)
                        }
                        InputProps={{ inputComponent: PhoneNumberInput }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item md={3} sm={12}>
                      <Box className="row-button-wrapper">
                        <IconButton
                          aria-label="delete"
                          className="row-delete-btn"
                          onClick={() => arrayHelpers.remove(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            <Box className="row-button-wrapper" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                endIcon={<AddIcon />}
                className="row-add-btn"
                onClick={() =>
                  arrayHelpers.push({
                    first_name: '',
                    last_name: '',
                    relationship: '',
                    email: '',
                    phone: ''
                  })
                }>
                Add Family Member
              </Button>
            </Box>
          </>
        );
      }}
    />
  );
};

export default Secondary;

Secondary.propTypes = {
  values: PropTypes.object,
  setFieldValue: PropTypes.func,
  touched: PropTypes.object,
  errors: PropTypes.object
};
