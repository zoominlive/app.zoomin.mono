import {
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Box,
  Button
} from '@mui/material';
import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const Children = () => {
  return (
    <Grid container spacing={3}>
      <Grid item md={3} sm={12}>
        <TextField label="First Name" value="Ketty" fullWidth />
      </Grid>
      <Grid item md={6} sm={12}>
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
      <Grid item md={3} sm={12}>
        <Box className="row-button-wrapper">
          <IconButton aria-label="delete" className="row-delete-btn">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Grid>
      <Grid item md={3} sm={12}>
        <TextField label="First Name" value="Ketty" fullWidth />
      </Grid>
      <Grid item md={6} sm={12}>
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
      <Grid item md={3} sm={12}>
        <Box className="row-button-wrapper">
          <Button variant="contained" endIcon={<AddIcon />} className="row-add-btn">
            Add Child
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Children;
