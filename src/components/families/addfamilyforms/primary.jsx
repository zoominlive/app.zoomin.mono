import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import PhoneNumberInput from '../../common/phonenumberinput';

const Primary = () => {
  return (
    <Grid container spacing={2}>
      <Grid item md={4} sm={12}>
        <TextField label="First Name" value="Dolores" fullWidth />
      </Grid>
      <Grid item md={4} sm={12}>
        <TextField label="Last Name" value="Chambers" fullWidth />
      </Grid>
      <Grid item md={4} sm={12}>
        <FormControl fullWidth>
          <InputLabel id="role">Role</InputLabel>
          <Select labelId="role" id="role" value={'Mother'} label="Role">
            <MenuItem value={'Mother'}>Mother</MenuItem>
            <MenuItem value={'Father'}>Father</MenuItem>
            <MenuItem value={'Aunt'}>Aunt</MenuItem>
            <MenuItem value={'Uncle'}>Uncle</MenuItem>
            <MenuItem value={'Grandmother'}>Grandmother</MenuItem>
            <MenuItem value={'Grandfather'}>Grandfather</MenuItem>
            <MenuItem value={'Other'}>Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item md={6} sm={12}>
        <TextField
          label="Phone"
          value={6715550110}
          InputProps={{ inputComponent: PhoneNumberInput }}
          fullWidth
        />
      </Grid>
      <Grid item md={6} sm={12}>
        <TextField label="Email" value={'dolores.chambers@example.com'} fullWidth />
      </Grid>
    </Grid>
  );
};

export default Primary;
