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
import { LoadingButton } from '@mui/lab';

const FamilyDrawer = (props) => {
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
                {props?.family?.primary?.role}
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
                        {parent.role}
                      </Typography>
                    </Stack>
                    <Typography variant="caption">{parent.email}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                  <Button variant="outlined" className="disabled-btn">
                    Disable
                  </Button>
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
                      <LoadingButton variant="outlined" className="disabled-btn">
                        Disable
                      </LoadingButton>
                      <IconButton
                        className="edit-btn"
                        onClick={() => {
                          props.setChild(child);
                          props.setIsChildFormDialogOpen(true);
                        }}>
                        <EditIcon />
                      </IconButton>
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
  setIsDisableFamilyDialogOpen: PropTypes.func,
  setIsChildFormDialogOpen: PropTypes.func,
  family: PropTypes.object,
  setPrimaryParent: PropTypes.func,
  setSecondaryParent: PropTypes.func,
  setChild: PropTypes.func
};
