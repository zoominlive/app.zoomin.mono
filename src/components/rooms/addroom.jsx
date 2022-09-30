import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const AddRoom = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.setOpen(false)}
      fullWidth
      className="edit-family-dialog">
      <DialogTitle>Add Room</DialogTitle>
      <Divider />
      <DialogContent>
        <Box px={2}>
          <Grid container spacing={2}>
            <Grid item md={6} sm={12}>
              <TextField label="Room Name" value={'Room 1'} fullWidth />
            </Grid>
            <Grid item md={6} sm={12}>
              <FormControl fullWidth>
                <InputLabel id="location-select">Location</InputLabel>
                <Select
                  labelId="location-select"
                  id="location-select"
                  label="Location"
                  value={'Location 1'}>
                  <MenuItem key={0} value={'Location 1'}>
                    Location 1
                  </MenuItem>

                  <MenuItem key={1} value={'Location 2'}>
                    Location 2
                  </MenuItem>

                  <MenuItem key={2} value={'Location 3'}>
                    Location 3
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Divider textAlign="left" sx={{ mx: '-16px', my: '15px' }}>
            CAMERA
          </Divider>
          <Grid className="camera-fields" container spacing={3} sx={{ mb: 3 }}>
            <Grid className="name" item xs={6} sm={3} md={3}>
              <TextField label="Camera Name" value="Cam 1" />
            </Grid>
            <Grid className="url" item xs={12} sm={6} md={7}>
              <TextField
                label="Cam URL"
                value="https://zoomin.com/systems/school5/zoomin-room-6/"
                fullWidth
              />
            </Grid>
            <Grid className="action" item xs={6} sm={3} md={2}>
              <Box className="row-button-wrapper">
                <IconButton aria-label="delete" className="row-delete-btn">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          <Grid className="camera-fields" container spacing={3}>
            <Grid className="name" item xs={6} sm={3} md={3}>
              <TextField label="Camera Name" value="Cam 2" />
            </Grid>
            <Grid className="url" item xs={12} sm={6} md={7}>
              <TextField
                label="Cam URL"
                value="https://zoomin.com/systems/school5/zoomin-room-6/"
                fullWidth
              />
            </Grid>
            <Grid className="action" item xs={6} sm={3} md={2}>
              <Box className="row-button-wrapper">
                <Button variant="contained" endIcon={<AddIcon />} className="row-add-btn">
                  Add CAM
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

export default AddRoom;

AddRoom.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
