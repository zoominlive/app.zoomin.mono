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
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import DeleteDialog from '../common/deletedialog';
// import API from '../../api';
// import { useSnackbar } from 'notistack';
// import { errorMessageHandler } from '../../utils/errormessagehandler';
// import { useContext } from 'react';
// import AuthContext from '../../context/authcontext';

const FamilyDrawer = (props) => {
  // const authCtx = useContext(AuthContext);
  // const { enqueueSnackbar } = useSnackbar();
  // const [childToDelete, setChildToDelete] = useState();
  const [isDeleteChildDialogOpen, setIsDeleteChildDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState();

  const handleChildDelete = () => {
    setDeleteLoading(true);
    // API.delete('family/child/delete', { family_member_id: childToDelete }).then((response) => {
    //   if (response.status === 200) {
    //     enqueueSnackbar(response.data.Message, { variant: 'success' });
    //     props.getFamiliesList();
    //     props.setFamily((prevState) => {
    //       const tempFamily = { ...prevState };
    //       tempFamily.children = tempFamily.children.filter((child) => child.id !== childToDelete);
    //       return tempFamily;
    //     });
    //     handleDeleteDialogClose();
    //   } else {
    //     errorMessageHandler(
    //       enqueueSnackbar,
    //       response?.response?.data?.Message || 'Something Went Wrong.',
    //       response?.response?.status,
    //       authCtx.setAuthError
    //     );
    //   }
    // });

    handleDeleteDialogClose();
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteChildDialogOpen(false);
    // setChildToDelete();
  };

  return (
    <Drawer
      className="family-drawer"
      anchor={'right'}
      open={props.open}
      onClose={() => props.setOpen(false)}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h5">Family</Typography>
      </Stack>
      <Divider sx={{ marginBottom: '30px' }} />
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between">
        <Stack spacing={1.5} direction="row" alignItems="center">
          <Avatar>{`${props?.family?.primary?.first_name[0]?.toUpperCase()}${props?.family?.primary?.last_name[0]?.toUpperCase()}`}</Avatar>
          <Stack>
            <Stack direction="row" spacing={1.5}>
              <Typography variant="body2">
                {props?.family?.primary?.first_name &&
                  capitalizeFirstLetter(props?.family?.primary?.first_name)}{' '}
                {props?.family?.primary?.last_name &&
                  capitalizeFirstLetter(props?.family?.primary?.last_name)}
              </Typography>
              <Divider orientation="vertical" variant="middle" flexItem />
              <Typography variant="body2" className="blue-text">
                {props?.family?.primary?.relationship}
              </Typography>
            </Stack>
            <Typography variant="caption">{props?.family?.primary?.email}</Typography>
          </Stack>
        </Stack>

        <IconButton
          className="edit-btn"
          onClick={() => {
            props.setPrimaryParent(props?.family?.primary);
            props.setIsParentFormDialogOpen(true);
          }}>
          <EditIcon />
        </IconButton>
      </Stack>
      {props?.family?.secondary && props?.family?.secondary?.length > 0 && (
        <>
          <Divider textAlign="left" className="title-divider">
            OTHER FAMILY
          </Divider>
          {props.family.secondary.map((parent, index) => (
            <Box key={index}>
              <Stack
                spacing={1.5}
                px={2.5}
                direction="row"
                alignItems="center"
                justifyContent="space-between">
                <Stack direction="row" spacing={1.5}>
                  <Avatar>{`${parent.first_name[0].toUpperCase()}${parent.last_name[0].toUpperCase()}`}</Avatar>
                  <Stack>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="body2">
                        {' '}
                        {capitalizeFirstLetter(parent.first_name)}{' '}
                        {capitalizeFirstLetter(parent.last_name)}
                      </Typography>
                      <Divider orientation="vertical" variant="middle" flexItem />
                      <Typography variant="body2" className="blue-text">
                        {parent.relationship}
                      </Typography>
                    </Stack>
                    <Typography variant="caption">{parent.email}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                  {!parent.disabled ? (
                    <Button variant="outlined" className="disabled-btn">
                      Disable
                    </Button>
                  ) : (
                    <Button variant="contained" className="enable-btn">
                      ENABLE
                    </Button>
                  )}
                  <IconButton
                    className="edit-btn"
                    onClick={() => {
                      props.setSecondaryParent(parent);
                      props.setIsParentFormDialogOpen(true);
                    }}>
                    <EditIcon />
                  </IconButton>
                </Stack>
              </Stack>
              <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />{' '}
            </Box>
          ))}
        </>
      )}

      {props?.family?.children && props?.family?.children?.length > 0 && (
        <>
          <Divider textAlign="left" className="title-divider">
            CHILDREN
          </Divider>
          <Stack spacing={2}>
            {props.family.children.map((child, index) => (
              <Stack key={index} spacing={2}>
                <Stack spacing={1.5} px={2.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>{child.first_name[0].toUpperCase()}</Avatar>
                      <Typography variant="body2">
                        {capitalizeFirstLetter(child.first_name)}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center">
                      {!child.disabled ? (
                        <Button variant="outlined" className="disabled-btn">
                          Disable
                        </Button>
                      ) : (
                        <Button variant="contained" className="enable-btn">
                          ENABLE
                        </Button>
                      )}

                      <IconButton
                        className="edit-btn"
                        onClick={() => {
                          props.setChild(child);
                          props.setIsChildFormDialogOpen(true);
                        }}>
                        <EditIcon />
                      </IconButton>
                      {props?.family?.children?.length !== 1 && (
                        <IconButton
                          className="child-delete-btn"
                          onClick={() => {
                            setIsDeleteChildDialogOpen(true);
                            // setChildToDelete(child.id);
                          }}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  <Box className="rooms">
                    {child.rooms.map((room, index) => (
                      <Chip key={index} label={room.room_name} />
                    ))}
                  </Box>
                  {index !== props.family.children.length - 1 && (
                    <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
                  )}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </>
      )}

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
        SCHEDULE END DATE
      </Divider>
      <Stack spacing={1.5} px={2.5} mb={2} direction="row" alignItems="center">
        <Avatar sx={{ color: '#1976d2', background: '#1976D20A' }}>
          <VisibilityOffIcon />
        </Avatar>
        <Typography variant="body2">12.09.2022</Typography>
      </Stack>
      <DeleteDialog
        title="Delete Child"
        contentText="Are you sure you want to delete this child?"
        loading={deleteLoading}
        open={isDeleteChildDialogOpen}
        handleDialogClose={handleDeleteDialogClose}
        handleDelete={handleChildDelete}
      />
    </Drawer>
  );
};

export default FamilyDrawer;

FamilyDrawer.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  setIsParentFormDialogOpen: PropTypes.func,
  setIsDisableFamilyDialogOpen: PropTypes.func,
  setIsChildFormDialogOpen: PropTypes.func,
  family: PropTypes.object,
  setFamily: PropTypes.func,
  setPrimaryParent: PropTypes.func,
  setSecondaryParent: PropTypes.func,
  setChild: PropTypes.func,
  getFamiliesList: PropTypes.func
};
