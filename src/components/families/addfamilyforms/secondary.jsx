import {
  Box,
  Button,
  Divider,
  FormControl,
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
import AddIcon from '@mui/icons-material/Add';

const Secondary = () => {
  return (
    <>
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
            <Select
              labelId="role"
              id="role"
              value={'Grandfather'}
              label="Role"
              MenuProps={{
                anchorOrigin: {
                  horizontal: 'right'
                },
                transformOrigin: {
                  vertical: 'top'
                }
              }}>
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
        <Grid item md={5} sm={12}>
          <TextField label="Email" value={'dolores.chambers@example.com'} fullWidth />
        </Grid>
        <Grid item md={4} sm={12}>
          <TextField
            label="Phone"
            value={6715550110}
            InputProps={{ inputComponent: PhoneNumberInput }}
            fullWidth
          />
        </Grid>
        <Grid item md={3} sm={12}>
          <Box className="row-button-wrapper">
            <IconButton aria-label="delete" className="row-delete-btn">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      <Divider
        textAlign="left"
        sx={{
          margin: '30px -48px'
        }}>
        Parent 2
      </Divider>
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
            <Select
              labelId="role"
              id="role"
              value={'Grandfather'}
              label="Role"
              MenuProps={{
                anchorOrigin: {
                  horizontal: 'right'
                },
                transformOrigin: {
                  vertical: 'top'
                }
              }}>
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
        <Grid item md={5} sm={12}>
          <TextField label="Email" value={'dolores.chambers@example.com'} fullWidth />
        </Grid>
        <Grid item md={4} sm={12}>
          <TextField
            label="Phone"
            value={6715550110}
            InputProps={{ inputComponent: PhoneNumberInput }}
            fullWidth
          />
        </Grid>
        <Grid item md={3} sm={12}>
          <Box className="row-button-wrapper">
            <Button variant="contained" endIcon={<AddIcon />} className="row-add-btn">
              Add Parent
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default Secondary;
