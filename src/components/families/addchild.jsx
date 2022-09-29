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
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Box,
  Grid
} from '@mui/material';

const AddChild = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="add-child-drawer">
      <DialogTitle>Add Child</DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item md={3} sm={12}>
            <TextField label="First Name" value={'Gordon'} />
          </Grid>
          <Grid item md={9} sm={12}>
            <FormControl fullWidth>
              <InputLabel id="room-select">Room</InputLabel>
              <Select
                labelId="room-select"
                id="room-select"
                multiple
                value={['Room 1', 'Room 2']}
                input={<OutlinedInput id="select-multiple-chip" label="Room" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} onDelete={() => {}} />
                    ))}
                  </Box>
                )}>
                <MenuItem key={0} value={'Room 1'}>
                  Room 1
                </MenuItem>

                <MenuItem key={1} value={'Room 2'}>
                  Room 2
                </MenuItem>

                <MenuItem key={2} value={'Room 3'}>
                  Room 3
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={3}></Stack>
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

export default AddChild;

AddChild.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
