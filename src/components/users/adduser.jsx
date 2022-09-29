import React from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material';
import avatar from '../../assets/avatar.png';

const AddUser = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="add-user-drawer">
      <DialogTitle>Add User</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} mt={2}>
          <Stack direction="row" spacing={2}>
            <Avatar src={avatar} />
            <Button variant="text" className="avatar-btn">
              Upload
            </Button>
          </Stack>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={6} sm={12}>
                <TextField label="First Name" value={'Gordon'} />
              </Grid>
              <Grid item md={6} sm={12}>
                <TextField label="Last Name" value={'Freeman'} />
              </Grid>
              <Grid item md={6} sm={12}>
                <TextField label="Email" value={'combinekiller3@blackmessa.com'} />
              </Grid>
              <Grid item md={6} sm={12}>
                <FormControl fullWidth>
                  <InputLabel id="user-location">Location</InputLabel>
                  <Select
                    labelId="user-location"
                    id="user-location"
                    value={'Location 1'}
                    label="Location">
                    <MenuItem value={'Location 1'}>Location 1</MenuItem>
                    <MenuItem value={'Location 2'}>Location 2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="text" onClick={() => props.setOpen(false)}>
          CANCEL
        </Button>
        <Button variant="text" onClick={() => props.setOpen(false)}>
          SAVE CHANGES
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUser;

AddUser.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
