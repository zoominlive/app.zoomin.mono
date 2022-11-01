import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';

import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const FamilyActions = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Method to open the menu
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the menu
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  // Method to open add child dialog
  const handleOpenChildDialog = (event) => {
    props.setFamily(props.family);
    props.openChildFormDialog(true);
    handleClose(event);
  };

  // Method to open edit family drawer
  const handleOpenEditDialog = (event) => {
    props.setFamily(props.family);
    props.openFamilyDrawer(true);
    handleClose(event);
  };

  // Method to open disable family dialog
  const handleOpenDisableFamilyDialog = (event) => {
    props.openDisableFamilyDialog(true);
    props.setFamily(props.family);
    handleClose(event);
  };

  // Method to open disable family dialog
  const handleOpenParentDialog = (event) => {
    props.setFamily(props.family);
    props.openParentFormDialog(true);
    handleClose(event);
  };

  // Method to open delete family dialog
  const handleOpenDeleteDialog = (event) => {
    props.openDeleteDialog(true);
    props.setFamily(props.family);
    handleClose(event);
  };

  return (
    <Box>
      <IconButton aria-controls="alpha-menu" aria-haspopup="true" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        className="table-actions menu"
        open={open}
        transitionDuration={5}
        onClose={handleClose}
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}>
        <MenuItem onClick={handleOpenEditDialog}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit Family</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenChildDialog}>
          <ListItemIcon>
            <GroupAddIcon />
          </ListItemIcon>
          <ListItemText>Add Child</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenParentDialog}>
          <ListItemIcon>
            <GroupAddIcon />
          </ListItemIcon>
          <ListItemText>Add Parent</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleOpenDisableFamilyDialog}
          disabled={props.family.primary.status === 'Disabled'}>
          <ListItemIcon>
            <VisibilityOffIcon />
          </ListItemIcon>
          <ListItemText>Disable Family</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>
          <ListItemIcon>
            <DeleteForeverIcon />
          </ListItemIcon>
          <ListItemText>Delete Family</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FamilyActions;

FamilyActions.propTypes = {
  openChildFormDialog: PropTypes.func,
  openDisableFamilyDialog: PropTypes.func,
  openFamilyDrawer: PropTypes.func,
  family: PropTypes.object,
  setFamily: PropTypes.func,
  openParentFormDialog: PropTypes.func,
  openDeleteDialog: PropTypes.func
};
