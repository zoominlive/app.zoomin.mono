import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';
import PhoneNumberInput from '../../common/phonenumberinput';
import DeleteIcon from '@mui/icons-material/Delete';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
// import AddIcon from '@mui/icons-material/Add';
import { Plus } from 'react-feather';

const Secondary = (props) => {
  return (
    <FieldArray
      name="secondary"
      render={(arrayHelpers) => {
        return (
          <>
            <Box
              sx={
                props.values.secondary.length > 0 && {
                  border: '1px solid #EBE8FF',
                  borderRadius: '16px',
                  padding: '24px'
                }
              }>
              {props.values.secondary &&
                props.values.secondary.length > 0 &&
                props.values.secondary.map((_, index) => (
                  <Box key={index}>
                    <Stack
                      direction={'row'}
                      sx={index >= 1 && { marginTop: '24px' }}
                      alignItems={'center'}
                      justifyContent={'space-between'}>
                      <Typography color={'#343434'} sx={{ textWrap: 'nowrap' }} fontWeight={600}>
                        Family Member {index + 1}
                      </Typography>
                      <Box
                        className="family-button-wrapper"
                        sx={props.values.secondary.length > 0 && { justifyContent: 'flex-end' }}>
                        <Button
                          aria-label="delete"
                          startIcon={<DeleteIcon />}
                          className="family-delete-btn"
                          onClick={() => arrayHelpers.remove(index)}>
                          Remove
                        </Button>
                      </Box>
                    </Stack>
                    {index !== 0 && <Divider sx={{ margin: '24px 0px !important' }} />}
                    <Grid container spacing={2}>
                      <Grid item md={6} sm={12} className="family-form">
                        <InputLabel id="first_name">First Name</InputLabel>
                        <TextField
                          name={`secondary.${index}.first_name`}
                          placeholder="Enter first name"
                          value={props?.values?.secondary[index]?.first_name}
                          onChange={(event) => {
                            props.setFieldValue(
                              `secondary[${index}].first_name`,
                              event.target.value
                            );
                          }}
                          labelId="first_name"
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
                      <Grid item md={6} sm={12} className="family-form">
                        <InputLabel id="last_name">Last Name</InputLabel>
                        <TextField
                          labelId="last_name"
                          name={`secondary.${index}.last_name`}
                          placeholder="Enter last name"
                          value={props?.values?.secondary[index]?.last_name}
                          onChange={(event) => {
                            props.setFieldValue(
                              `secondary[${index}].last_name`,
                              event.target.value
                            );
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
                      <Grid item md={6} sm={12} className="family-form">
                        <InputLabel id="role">Role</InputLabel>
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
                          <Select
                            labelId="role"
                            id="role"
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
                      <Grid item md={6} sm={12} className="family-form">
                        <InputLabel id="phone">Phone</InputLabel>

                        <TextField
                          name={`secondary.${index}.phone`}
                          placeholder="Enter phone number"
                          labelId="phone"
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
                      <Grid item md={6} sm={12} className="family-form">
                        <InputLabel id="email">Email</InputLabel>
                        <TextField
                          name={`secondary.${index}.email`}
                          placeholder="Enter email address"
                          labelId="email"
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
                    </Grid>
                  </Box>
                ))}
              {props.values.secondary.length == 0 && (
                <Box className="other-members-wrapper family-form">
                  <Stack direction={'column'} textAlign={'center'}>
                    <Typography
                      fontSize={20}
                      fontWeight={500}
                      color={'#343434'}
                      lineHeight={'30px'}>
                      Do you want to Add Additional Family Members?
                    </Typography>
                    <Typography
                      fontSize={16}
                      fontWeight={400}
                      color={'#797D8C'}
                      lineHeight={'24px'}>
                      If not you can skip this step by clicking the next button
                    </Typography>
                    <Box
                      className="family-button-wrapper"
                      sx={props.values.secondary.length == 0 && { justifyContent: 'center' }}
                      mt={2}>
                      <Button
                        variant="contained"
                        startIcon={<Plus />}
                        className="family-add-btn"
                        onClick={() =>
                          arrayHelpers.push({
                            first_name: '',
                            last_name: '',
                            relationship: '',
                            email: '',
                            phone: ''
                          })
                        }>
                        Add Family Members
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
            {props.values.secondary.length > 0 && (
              <Box className="family-button-wrapper" mt={2}>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  className="family-add-btn"
                  onClick={() =>
                    arrayHelpers.push({
                      first_name: '',
                      last_name: '',
                      relationship: '',
                      email: '',
                      phone: ''
                    })
                  }>
                  Add Family Members
                </Button>
              </Box>
            )}
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
