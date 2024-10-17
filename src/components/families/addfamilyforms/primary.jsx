import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import React from 'react';
import PhoneNumberInput from '../../common/phonenumberinput';
import PropTypes from 'prop-types';

const Primary = (props) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item md={6} sm={12} className="family-form">
          <InputLabel id="first_name">First Name</InputLabel>
          <TextField
            labelId="first_name"
            name="first_name"
            placeholder="Enter first name"
            value={props?.values?.primary?.first_name ? props?.values?.primary?.first_name : ''}
            onChange={(event) => {
              props.setFieldValue('primary.first_name', event.target.value);
            }}
            helperText={props?.touched?.primary?.first_name && props?.errors?.primary?.first_name}
            error={
              props?.touched?.primary?.first_name && Boolean(props?.errors?.primary?.first_name)
            }
            fullWidth
            InputLabelProps={{
              shrink: true
            }}
          />
        </Grid>
        <Grid item md={6} sm={12} className="family-form">
          <InputLabel id="last_name">Last Name</InputLabel>
          <TextField
            labelId="last_name"
            placeholder="Enter last name"
            value={props?.values?.primary?.last_name ? props?.values?.primary?.last_name : ''}
            onChange={(event) => {
              props.setFieldValue('primary.last_name', event.target.value);
            }}
            helperText={props?.touched?.primary?.last_name && props?.errors?.primary?.last_name}
            error={props?.touched?.primary?.last_name && Boolean(props?.errors?.primary?.last_name)}
            fullWidth
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item md={6} sm={12} className="family-form">
          <InputLabel id="role">Role</InputLabel>
          <FormControl
            fullWidth
            error={
              props?.touched?.primary?.relationship && Boolean(props?.errors?.primary?.relationship)
            }>
            <Select
              labelId="role"
              id="role"
              value={
                props?.values?.primary?.relationship ? props?.values?.primary?.relationship : ''
              }
              onChange={(event) => {
                props.setFieldValue('primary.relationship', event.target.value);
              }}
              label="Role">
              <MenuItem value={'Mother'}>Mother</MenuItem>
              <MenuItem value={'Father'}>Father</MenuItem>
              <MenuItem value={'Aunt'}>Aunt</MenuItem>
              <MenuItem value={'Uncle'}>Uncle</MenuItem>
              <MenuItem value={'Grandmother'}>Grandmother</MenuItem>
              <MenuItem value={'Grandfather'}>Grandfather</MenuItem>
              <MenuItem value={'Other'}>Other</MenuItem>
            </Select>
            {props?.touched?.primary?.relationship && props?.errors?.primary?.relationship && (
              <FormHelperText sx={{ color: '#d32f2f' }}>
                {props?.errors?.primary?.relationship}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item md={6} sm={12} className="family-form">
          <InputLabel id="phone">Phone</InputLabel>
          <TextField
            labelId="phone"
            value={props?.values?.primary?.phone ? props?.values?.primary?.phone : ''}
            placeholder="Enter phone number"
            onChange={(event) => {
              props.setFieldValue('primary.phone', event.target.value || '');
            }}
            helperText={props?.touched?.primary?.phone && props?.errors?.primary?.phone}
            error={props?.touched?.primary?.phone && Boolean(props?.errors?.primary?.phone)}
            InputProps={{ inputComponent: PhoneNumberInput }}
            fullWidth
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item md={6} sm={12} className="family-form">
          <InputLabel id="email">Email</InputLabel>
          <TextField
            labelId="email"
            value={props?.values?.primary?.email ? props?.values?.primary?.email : ''}
            placeholder="Enter email address"
            onChange={(event) => {
              props.setFieldValue('primary.email', event.target.value);
            }}
            helperText={props?.touched?.primary?.email && props?.errors?.primary?.email}
            error={props?.touched?.primary?.email && Boolean(props?.errors?.primary?.email)}
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Primary;

Primary.propTypes = {
  values: PropTypes.object,
  setFieldValue: PropTypes.func,
  touched: PropTypes.object,
  errors: PropTypes.object
};
