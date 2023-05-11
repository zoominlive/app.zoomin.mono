import { Box, Fade, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';

const CustomerActions = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Method to open the customer actions on table
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  // Method to close the customer actions on table
  const handleClose = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(null);
  };

  // Method that sets the customer id for customer form and opens the customer form dialog
  const handleCustomerEdit = (event) => {
    props.setCustomer({ ...props.customer });
    props.setIsCustomerFormDialogOpen(true);
    handleClose(event);
  };

  // Method to set customer for the delete action
  const handleCustomerDelete = (event) => {
    props.setCustomer({ ...props.customer });
    props.setIsDeleteDialogOpen(true);
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
        onClose={handleClose}
        anchorEl={anchorEl}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}>
        <MenuItem onClick={handleCustomerEdit}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit Customer</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCustomerDelete}>
          <ListItemIcon>
            <DeleteForeverIcon />
          </ListItemIcon>
          <ListItemText>Delete Customer</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerActions;

CustomerActions.propTypes = {
  customer: PropTypes.object,
  setCustomer: PropTypes.func,
  setIsCustomerFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
