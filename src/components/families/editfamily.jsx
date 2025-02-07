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
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Box,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PhoneNumberInput from '../common/phonenumberinput';

const EditFamily = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="edit-family-dialog">
      <DialogTitle>Edit Family</DialogTitle>
      <Divider />
      <DialogContent>
        <Box px={2}>
          <Grid container spacing={2}>
            <Grid item md={6} sm={12}>
              <TextField label="First Name" value={'Dolores'} fullWidth />
            </Grid>
            <Grid item md={6} sm={12}>
              <TextField label="Last Name" value={'Chambers'} fullWidth />
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
          <Divider
            textAlign="left"
            sx={{
              marginTop: '15px',
              marginBottom: '15px'
            }}>
            CHILDRENS
          </Divider>
          <Grid container spacing={2} className="children-fields" sx={{ mb: 3 }}>
            <Grid className="name" item xs={6} sm={3} md={3}>
              <TextField label="First Name" value="Ketty" />
            </Grid>
            <Grid className="zone" item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id="zone-select">Room</InputLabel>
                <Select
                  labelId="zone-select"
                  id="zone-select"
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
            <Grid className="action" item xs={6} sm={3} md={3}>
              <Box className="row-button-wrapper">
                <IconButton aria-label="delete" className="row-delete-btn">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={2} className="children-fields">
            <Grid className="name" item xs={6} sm={3} md={3}>
              <TextField label="First Name" value="Ketty" />
            </Grid>
            <Grid className="zone" item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id="zone-select">Room</InputLabel>
                <Select
                  labelId="zone-select"
                  id="zone-select"
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
            <Grid className="action" item xs={6} sm={3} md={3}>
              <Box className="row-button-wrapper">
                <Button variant="contained" endIcon={<AddIcon />} className="row-add-btn">
                  Add Children
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
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

export default EditFamily;

EditFamily.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
