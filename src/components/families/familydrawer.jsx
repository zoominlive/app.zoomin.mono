import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
// import EditIcon from '@mui/icons-material/Edit';
// import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';

const FamilyDrawer = (props) => {
  return (
    <Drawer
      className="family-drawer"
      anchor={'right'}
      open={props.open}
      onClose={() => props.setOpen(false)}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h5">Family</Typography>
        {/* <IconButton className="edit-btn">
          <EditIcon />
        </IconButton> */}
      </Stack>
      <Divider sx={{ marginBottom: '30px' }} />
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between">
        <Stack spacing={1.5} direction="row" alignItems="center">
          <Avatar>DC</Avatar>
          <Stack>
            <Stack direction="row" spacing={1.5}>
              <Typography variant="body2">Dolores Chambers</Typography>
              <Divider orientation="vertical" variant="middle" flexItem />
              <Typography variant="body2" className="blue-text">
                Mother
              </Typography>
            </Stack>
            <Typography variant="caption">dolores.chambers@example.com</Typography>
          </Stack>
        </Stack>

        <IconButton className="edit-btn" onClick={() => props.setIsParentFormDialogOpen(true)}>
          <EditIcon />
        </IconButton>
        {/* <Stack spacing={1.5} px={2.5} direction="row" alignItems="center">
          <Avatar sx={{ color: '#1976d2', background: '#1976D20A' }}>
            <LocationOnIcon />
          </Avatar>
          <Typography variant="body2">Location 1</Typography>
        </Stack> */}
      </Stack>
      <Divider textAlign="left" className="title-divider">
        OTHER FAMILY
      </Divider>
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between">
        <Stack direction="row" spacing={1.5}>
          <Avatar>JC</Avatar>
          <Stack>
            <Stack direction="row" spacing={1}>
              <Typography variant="body2">Cameron Williamson</Typography>
              <Divider orientation="vertical" variant="middle" flexItem />
              <Typography variant="body2" className="blue-text">
                Dad
              </Typography>
            </Stack>
            <Typography variant="caption">tim.jennings@example.com</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Button variant="outlined" className="disabled-btn">
            Disable
          </Button>
          <IconButton className="edit-btn" onClick={() => props.setIsParentFormDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between">
        <Stack direction="row" spacing={1.5}>
          <Avatar>JW</Avatar>
          <Stack>
            <Stack direction="row" spacing={1}>
              <Typography variant="body2">Jerry Williamson</Typography>
              <Divider orientation="vertical" variant="middle" flexItem />
              <Typography variant="body2" className="blue-text">
                Grandmother
              </Typography>
            </Stack>
            <Typography variant="caption">tim.jennings@example.com</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Button variant="outlined" className="disabled-btn">
            Disable
          </Button>
          <IconButton className="edit-btn" onClick={() => props.setIsParentFormDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
      <Divider textAlign="left" className="title-divider">
        CHILDREN
      </Divider>
      <Stack spacing={2}>
        <Stack spacing={1.5} px={2.5}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar>D</Avatar>
              <Typography variant="body2">David</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
              <Button variant="outlined" className="disabled-btn">
                Disable
              </Button>
              <IconButton
                className="edit-btn"
                onClick={() => props.setIsParentFormDialogOpen(true)}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Box className="rooms">
            <Chip label="Room 1" />
            <Chip label="Room 2" />
            <Chip label="Room 3" />
            <Chip label="Room 4" />
            <Chip label="Room 5" />
            <Chip label="Room 6" />
            <Chip label="Room 7" />
          </Box>
          <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
        </Stack>

        <Stack spacing={1.5} px={2.5}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar>D</Avatar>
              <Typography variant="body2">David</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
              <Button variant="outlined" className="disabled-btn">
                Disable
              </Button>
              <IconButton
                className="edit-btn"
                onClick={() => props.setIsParentFormDialogOpen(true)}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Box className="rooms">
            <Chip label="Room 1" />
            <Chip label="Room 2" />
            <Chip label="Room 3" />
            <Chip label="Room 4" />
          </Box>
        </Stack>
      </Stack>
      <Divider textAlign="left" className="title-divider">
        DISABLE FAMILY
      </Divider>
      <Stack direction="row" px={2.5} mt={2}>
        <Button
          variant="outlined"
          className="disabled-btn"
          onClick={() => props.setIsDisableFamilyDialogOpen(true)}>
          Disable FAMILY
        </Button>
      </Stack>
      <Divider textAlign="left" className="title-divider">
        SCHECULE END DATE
      </Divider>
      <Stack spacing={1.5} px={2.5} mb={2} direction="row" alignItems="center">
        <Avatar sx={{ color: '#1976d2', background: '#1976D20A' }}>
          <VisibilityOffIcon />
        </Avatar>
        <Typography variant="body2">12.09.2022</Typography>
      </Stack>
    </Drawer>
  );
};

export default FamilyDrawer;

FamilyDrawer.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  setIsParentFormDialogOpen: PropTypes.func,
  setIsDisableFamilyDialogOpen: PropTypes.func
};
