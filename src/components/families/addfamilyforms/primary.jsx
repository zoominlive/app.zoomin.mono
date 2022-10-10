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
  console.log(props.touched);
  console.log(props.errors);
  return (
    <Grid container spacing={2}>
      <Grid item md={4} sm={12}>
        <TextField
          label="First Name"
          name="first_name"
          value={props?.values?.primary?.first_name ? props?.values?.primary?.first_name : ''}
          onChange={(event) => {
            props.setFieldValue('primary.first_name', event.target.value);
          }}
          helperText={props?.touched?.primary?.first_name && props?.errors?.primary?.first_name}
          error={props?.touched?.primary?.first_name && Boolean(props?.errors?.primary?.first_name)}
          fullWidth
        />
      </Grid>
      <Grid item md={4} sm={12}>
        <TextField
          label="Last Name"
          value={props?.values?.primary?.last_name ? props?.values?.primary?.last_name : ''}
          onChange={(event) => {
            props.setFieldValue('primary.last_name', event.target.value);
          }}
          helperText={props?.touched?.primary?.last_name && props?.errors?.primary?.last_name}
          error={props?.touched?.primary?.last_name && Boolean(props?.errors?.primary?.last_name)}
          fullWidth
        />
      </Grid>
      <Grid item md={4} sm={12}>
        <FormControl fullWidth>
          <InputLabel id="role">Role</InputLabel>
          <Select
            labelId="role"
            id="role"
            value={props?.values?.primary?.role ? props?.values?.primary?.role : ''}
            onChange={(event) => {
              props.setFieldValue('primary.role', event.target.value);
            }}
            error={props?.touched?.primary?.role && Boolean(props?.errors?.primary?.role)}
            label="Role">
            <MenuItem value={'Mother'}>Mother</MenuItem>
            <MenuItem value={'Father'}>Father</MenuItem>
          </Select>
          {props?.touched?.primary?.role && props?.errors?.primary?.role && (
            <FormHelperText sx={{ color: '#d32f2f' }}>
              {props?.errors?.primary?.role}
            </FormHelperText>
          )}
        </FormControl>
      </Grid>
      <Grid item md={6} sm={12}>
        <TextField
          label="Phone"
          value={props?.values?.primary?.phone ? props?.values?.primary?.phone : ''}
          onChange={(event) => {
            props.setFieldValue('primary.phone', event.target.value);
          }}
          helperText={props?.touched?.primary?.phone && props?.errors?.primary?.phone}
          error={props?.touched?.primary?.phone && Boolean(props?.errors?.primary?.phone)}
          InputProps={{ inputComponent: PhoneNumberInput }}
          fullWidth
        />
      </Grid>
      <Grid item md={6} sm={12}>
        <TextField
          label="Email"
          value={props?.values?.primary?.email ? props?.values?.primary?.email : ''}
          onChange={(event) => {
            props.setFieldValue('primary.email', event.target.value);
          }}
          helperText={props?.touched?.primary?.email && props?.errors?.primary?.email}
          error={props?.touched?.primary?.email && Boolean(props?.errors?.primary?.email)}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};

export default Primary;

Primary.propTypes = {
  values: PropTypes.object,
  setFieldValue: PropTypes.func,
  touched: PropTypes.object,
  errors: PropTypes.object
};
