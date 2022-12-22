import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Tooltip
} from '@mui/material';

import BlockIcon from '@mui/icons-material/Block';
import Schedule from '../../assets/schedule.svg';
import DeleteScheduleIcon from '../../assets/delete-icon.svg';
import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@mui/icons-material/Edit';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import DeleteDialog from '../common/deletedialog';
import DisableDialog from './disabledialog';
import RoomDialog from './roomdialog';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { LoadingButton } from '@mui/lab';
import SaveIcon from '@mui/icons-material/Save';
import API from '../../api';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import Loader from '../common/loader';
import _ from 'lodash';

const FamilyDrawer = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [childToDelete, setChildToDelete] = useState();
  const [childToDisable, setChildToDisable] = useState();
  const [parentToDisable, setParentToDisable] = useState();
  const [disableLoading, setDisableLoading] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isDeleteChildDialogOpen, setIsDeleteChildDialogOpen] = useState(false);
  const [disableDialogTitle, setDisableDialogTitle] = useState();
  const [deleteLoading, setDeleteLoading] = useState();
  const [roomLoading, setRoomLoading] = useState(false);
  const [enableFamilyLoading, setEnableFamilyLoading] = useState(false);
  const [enableFamilyMembersLoading, setEnableFamilyMembersLoading] = useState([]);
  const [enableChildrenLoading, setEnableChildrenLoading] = useState([]);
  const [disableDrawerClose, setDisableDrawerClose] = useState(false);
  const [scheduledLoading, setScheduledLoading] = useState({ loading: false, index: -1, type: '' });
  const [locationsToDisable, setLocationsToDisable] = useState([]);
  const [selectedLocationsToDisable, setSelectedLocationsToDisable] = useState([]);
  const [roomTodisable, setRoomToDisable] = useState({});
  const [roomScheduleDeleteLoading, setRoomScheduleDeleteLoading] = useState({
    room_id: '',
    child_id: '',
    loading: false
  });

  useEffect(() => {
    if (!isDisableDialogOpen) {
      setChildToDisable();
      setParentToDisable();
    }
  }, [isDisableDialogOpen]);

  useEffect(() => {
    if (props?.family?.secondary) {
      const secondaryParentsLoading = props?.family?.secondary?.map(() => false);
      setEnableFamilyMembersLoading(secondaryParentsLoading);
    }
  }, [props?.family?.secondary]);

  useEffect(() => {
    if (props?.family?.children) {
      const childrenLoading = props?.family?.children?.map(() => false);
      setEnableChildrenLoading(childrenLoading);
    }
  }, [props?.family?.children]);

  useEffect(() => {
    if (
      enableFamilyLoading ||
      enableFamilyMembersLoading.some((loading) => loading) ||
      enableChildrenLoading.some((loading) => loading)
    ) {
      setDisableDrawerClose(true);
    } else {
      setDisableDrawerClose(false);
    }
  }, [enableFamilyLoading, enableFamilyMembersLoading, enableChildrenLoading]);

  // Method to delete child
  const handleChildDelete = () => {
    setDeleteLoading(true);
    API.delete('family/child/delete', {
      data: {
        child_id: childToDelete
      }
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
        props.setFamily((prevState) => {
          const tempFamily = { ...prevState };
          tempFamily.children = tempFamily.children.filter(
            (child) => child.child_id !== childToDelete
          );
          return tempFamily;
        });
        handleDeleteDialogClose();
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setDeleteLoading(false);
    });
  };

  // Method to delete family
  const handleFamilyEnable = () => {
    setEnableFamilyLoading(true);
    API.put('family/enable', {
      family_member_id: props.family.primary.family_member_id,
      member_type: 'primary',
      family_id: props.family.primary.family_id
    }).then((response) => {
      if (response.status === 200) {
        setScheduledLoading({ loading: false, index: -1, type: '' });
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
        props.setFamily((prevState) => {
          let tempFamily = { ...prevState };
          tempFamily.primary.status = 'Enabled';
          tempFamily.primary.scheduled_end_date = null;
          tempFamily.secondary.length > 0 &&
            tempFamily.secondary.forEach((parent) => {
              parent.status = 'Enabled';
              parent.scheduled_end_date = null;
            });

          tempFamily.children.forEach((child) => {
            child.status = 'Enabled';
            child.scheduled_end_date = null;
          });
          return tempFamily;
        });
      } else {
        setScheduledLoading({ loading: false, index: -1, type: '' });
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setEnableFamilyLoading(false);
    });
  };

  // Method to close the delete child dialog
  const handleDeleteDialogClose = () => {
    setIsDeleteChildDialogOpen(false);
    setChildToDelete();
  };

  // Method to close the disable dialog
  const handleDisableDialogClose = () => {
    if (!disableLoading) {
      setIsDisableDialogOpen(false);
    }
  };

  // Method to disable the parent and child
  const handleDisable = (data) => {
    setDisableLoading(true);
    console.log(parentToDisable);
    if (parentToDisable) {
      API.put('family/disable', {
        family_member_id: parentToDisable,
        member_type: 'secondary',
        family_id: props.family.primary.family_id,
        locations_to_disable: selectedLocationsToDisable,
        scheduled_end_date:
          data.selectedOption === 'schedule' && dayjs(data.disableDate).format('YYYY-MM-DD')
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          if (response?.data?.Data?.scheduled === true) {
            props.setFamily((prevState) => {
              let tempFamily = { ...prevState };
              const index = tempFamily.secondary.findIndex(
                (parent) => parent.family_member_id === parentToDisable
              );

              tempFamily.secondary[index].scheduled_end_date = dayjs(data.disableDate).format(
                'YYYY-MM-DD'
              );

              return tempFamily;
            });
          } else if (data.selectedOption === 'disable') {
            props.setFamily((prevState) => {
              let tempFamily = { ...prevState };
              const index = tempFamily.secondary.findIndex(
                (parent) => parent.family_member_id === parentToDisable
              );

              tempFamily.secondary[index].status = 'Disabled';
              return tempFamily;
            });
          }
          handleDisableDialogClose();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setDisableLoading(false);
      });
    } else {
      API.put('family/child/disable', {
        child_id: childToDisable,
        locations_to_disable: selectedLocationsToDisable,
        scheduled_end_date:
          data.selectedOption === 'schedule' && dayjs(data.disableDate).format('YYYY-MM-DD')
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          if (response?.data?.Data?.scheduled === true) {
            props.setFamily((prevState) => {
              let tempFamily = { ...prevState };
              const index = tempFamily.children.findIndex(
                (child) => child.child_id === childToDisable
              );

              tempFamily.children[index].scheduled_end_date = dayjs(data.disableDate).format(
                'YYYY-MM-DD'
              );
              return tempFamily;
            });
          } else if (data.selectedOption === 'disable') {
            props.setFamily((prevState) => {
              let tempFamily = { ...prevState };
              const index = tempFamily.children.findIndex(
                (child) => child.child_id === childToDisable
              );

              tempFamily.children[index].status = 'Disabled';
              return tempFamily;
            });
          }
          handleDisableDialogClose();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setDisableLoading(false);
      });
    }
  };

  // Method to enable the parent
  const handleParentEnable = (parentToEnable, index) => {
    setEnableFamilyMembersLoading((prevState) => {
      const tempLoading = [...prevState];
      tempLoading[index] = true;
      return tempLoading;
    });

    API.put('family/enable', {
      family_member_id: parentToEnable,
      member_type: 'secondary',
      family_id: props.family.primary.family_member_id
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
        props.setFamily((prevState) => {
          const tempFamily = { ...prevState };
          tempFamily.secondary[index].status = 'Enabled';
          tempFamily.secondary[index].scheduled_end_date = null;
          return tempFamily;
        });
        setScheduledLoading({ loading: false, index: -1, type: '' });
      } else {
        setScheduledLoading({ loading: false, index: -1, type: '' });
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setEnableFamilyMembersLoading((prevState) => {
        const tempLoading = [...prevState];
        tempLoading[index] = false;
        return tempLoading;
      });
    });
  };

  // Method to enable the child
  const handleChildEnable = (childToEnable, index) => {
    setEnableChildrenLoading((prevState) => {
      const tempLoading = [...prevState];
      tempLoading[index] = true;
      return tempLoading;
    });

    API.put('family/child/enable', {
      child_id: childToEnable
    }).then((response) => {
      if (response.status === 200) {
        setScheduledLoading({ loading: false, index: -1, type: '' });
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
        props.setFamily((prevState) => {
          const tempFamily = { ...prevState };
          tempFamily.children[index].status = 'Enabled';
          tempFamily.children[index].scheduled_end_date = null;
          return tempFamily;
        });
      } else {
        setScheduledLoading({ loading: false, index: -1, type: '' });
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setEnableChildrenLoading((prevState) => {
        const tempLoading = [...prevState];
        tempLoading[index] = false;
        return tempLoading;
      });
    });
  };

  const handleRoomDisableEnable = (data) => {
    setRoomLoading(true);

    if (roomTodisable.disabled == 'true') {
      let scheduled_enable_date =
        data.selectedOption == 'schedule' ? dayjs(data.date).format('YYYY-MM-DD') : null;
      API.put('rooms/enable', {
        room_child_id: roomTodisable?.room_child_id,
        scheduled_enable_date: scheduled_enable_date
      }).then((response) => {
        if (response.status === 200) {
          setRoomLoading(false);
          setIsRoomDialogOpen(false);
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          // props.setFamily((prevState) => {
          //   const tempFamily = { ...prevState };
          //   tempFamily.children[index].status = 'Enabled';
          //   tempFamily.children[index].scheduled_end_date = null;
          //   return tempFamily;
          // });
        } else {
          setRoomLoading(false);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    } else {
      let scheduled_disable_date =
        data.selectedOption == 'schedule' ? dayjs(data.date).format('YYYY-MM-DD') : null;
      API.put('rooms/disable', {
        room_child_id: roomTodisable?.room_child_id,
        scheduled_disable_date: scheduled_disable_date
      }).then((response) => {
        if (response.status === 200) {
          setRoomLoading(false);
          setIsRoomDialogOpen(false);
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
          // props.setFamily((prevState) => {
          //   const tempFamily = { ...prevState };
          //   tempFamily.children[index].status = 'Enabled';
          //   tempFamily.children[index].scheduled_end_date = null;
          //   return tempFamily;
          // });
        } else {
          setRoomLoading(false);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    }
  };

  const handleDeleteSchedule = (room) => {
    setRoomScheduleDeleteLoading({ room_id: room.room_id, child_id: room.child_id, loading: true });
    if (room.disabled == 'true') {
      API.put('rooms/disable', {
        room_child_id: room?.room_child_id,
        scheduled_disable_date: null
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setRoomScheduleDeleteLoading({
          room_id: room.room_id,
          child_id: room.child_id,
          loading: false
        });
      });
    } else {
      API.put('rooms/enable', {
        room_child_id: room?.room_child_id,
        scheduled_enable_date: null
      }).then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
          props.getFamiliesList();
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setRoomScheduleDeleteLoading({
          room_id: room.room_id,
          child_id: room.child_id,
          loading: false
        });
      });
    }
  };

  return (
    <Drawer
      className="family-drawer"
      anchor={'right'}
      open={props.open}
      onClose={() => {
        if (!disableDrawerClose) {
          props.setOpen(false);
        }
      }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h5">Family</Typography>
      </Stack>
      <Divider textAlign="left" className="title-divider">
        PRIMARY FAMILY MEMBER
      </Divider>
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between">
        <Stack spacing={1.5} direction="row" alignItems="center">
          <Avatar
            title={`${props?.family?.primary?.first_name[0]?.toUpperCase()}${props?.family?.primary?.last_name[0]?.toUpperCase()}`}
            src={
              props?.family?.primary?.profile_image
            }>{`${props?.family?.primary?.first_name[0]?.toUpperCase()}${props?.family?.primary?.last_name[0]?.toUpperCase()}`}</Avatar>
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
            props.setParentType('primary');
            props.setIsParentFormDialogOpen(true);
          }}>
          <EditIcon />
        </IconButton>
      </Stack>
      {props?.family?.secondary && props?.family?.secondary?.length > 0 && (
        <>
          <Divider textAlign="left" className="title-divider">
            OTHER FAMILY MEMBERS
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
                  <Avatar
                    src={
                      parent?.profile_image
                    }>{`${parent?.first_name[0]?.toUpperCase()}${parent?.last_name[0]?.toUpperCase()}`}</Avatar>
                  <Stack>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="body2">
                        {' '}
                        {capitalizeFirstLetter(parent?.first_name)}{' '}
                        {capitalizeFirstLetter(parent?.last_name)}
                      </Typography>
                      <Divider orientation="vertical" variant="middle" flexItem />
                      <Typography variant="body2" className="blue-text">
                        {parent?.relationship}
                      </Typography>
                    </Stack>
                    <Typography variant="caption">{parent?.email}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                  {parent.status === 'Disabled' ? (
                    <Button
                      onClick={() => {
                        handleParentEnable(parent.family_member_id, index);
                      }}
                      variant="outlined"
                      className="secondary-disabled-btn">
                      <BlockIcon></BlockIcon>
                    </Button>
                  ) : (
                    <>
                      {parent?.scheduled_end_date == null && (
                        <Button
                          variant="outlined"
                          className="disabled-btn"
                          onClick={() => {
                            setDisableDialogTitle('Disable Secondary Family Member');
                            setIsDisableDialogOpen(true);
                            let locations = [];
                            props?.family?.children.forEach((child) => {
                              // eslint-disable-next-line no-unsafe-optional-chaining
                              locations.push(...child?.location?.locations);
                            });
                            setLocationsToDisable(_.uniq(locations));
                            console.log(_.uniq(locations));
                            console.log('parent to disable', parent.family_member_id);
                            setParentToDisable(parent.family_member_id);
                          }}>
                          <BlockIcon className="curser-pointer"></BlockIcon>
                        </Button>
                      )}
                      {parent?.scheduled_end_date !== null && parent?.scheduled_end_date && (
                        <>
                          <Typography variant="caption">
                            {`Disable Date:  ${parent?.scheduled_end_date}`}
                          </Typography>
                          <Tooltip id="button-report" title="Delete scheduled disable">
                            <IconButton
                              aria-label="delete"
                              className="row-delete-btn"
                              color="error"
                              onClick={() => {
                                setScheduledLoading({
                                  loading: true,
                                  index: index,
                                  type: 'member'
                                });
                                handleParentEnable(parent.family_member_id, index);
                              }}>
                              <Loader
                                loading={
                                  scheduledLoading.loading &&
                                  scheduledLoading.index == index &&
                                  scheduledLoading.type == 'member'
                                    ? true
                                    : false
                                }
                              />
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </>
                  )}
                  <IconButton
                    className="edit-btn"
                    onClick={() => {
                      props.setSecondaryParent(parent);
                      props.setParentType('secondary');
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
            {props?.family?.children.map((child, index) => (
              <Stack key={index} spacing={2}>
                <Stack spacing={1.5} px={2.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>{`${child?.first_name[0]?.toUpperCase()}${child?.last_name[0]?.toUpperCase()}`}</Avatar>
                      <Typography variant="body2">
                        {' '}
                        {capitalizeFirstLetter(child?.first_name)}{' '}
                        {capitalizeFirstLetter(child?.last_name)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {child?.scheduled_end_date !== null && child?.scheduled_end_date && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                          <Typography variant="caption">
                            {`Disable Date:  ${child?.scheduled_end_date}`}
                          </Typography>
                          <Tooltip id="button-report" title="Delete scheduled disable">
                            <img
                              src={DeleteScheduleIcon}
                              style={{ height: '.8rem', marginLeft: '.3rem' }}
                              onClick={() => {
                                setScheduledLoading({
                                  loading: true,
                                  index: index,
                                  type: 'child'
                                });
                                handleChildEnable(child.child_id, index);
                              }}
                              className="curser-pointer"></img>
                          </Tooltip>
                          <Loader
                            loading={
                              scheduledLoading?.loading &&
                              scheduledLoading?.index == index &&
                              scheduledLoading?.type == 'child'
                                ? true
                                : false
                            }
                          />
                        </Box>
                      )}
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center">
                      {child.status === 'Disabled' ? (
                        <Tooltip id="button-report" title="Enable">
                          <LoadingButton
                            style={{ color: 'gray', border: '1px solid gray' }}
                            loading={enableChildrenLoading[index]}
                            onClick={() => {
                              handleChildEnable(child.child_id, index);
                            }}
                            variant="outlined"
                            className="enable-btn">
                            {!enableChildrenLoading[index] && <BlockIcon></BlockIcon>}
                          </LoadingButton>
                        </Tooltip>
                      ) : (
                        <>
                          {child?.scheduled_end_date == null && (
                            <Tooltip id="button-report" title="Disable">
                              <Button
                                variant="outlined"
                                className="disabled-btn"
                                onClick={() => {
                                  setLocationsToDisable(child?.location?.locations);
                                  setIsDisableDialogOpen(true);
                                  setChildToDisable(child.child_id);
                                  setDisableDialogTitle('Disable Child');
                                }}>
                                <BlockIcon></BlockIcon>
                              </Button>
                            </Tooltip>
                          )}
                        </>
                      )}

                      <IconButton
                        className="edit-btn"
                        onClick={() => {
                          props.setChild(child);
                          props.setIsChildFormDialogOpen(true);
                        }}>
                        <EditIcon />
                      </IconButton>
                      {props?.family?.children.length !== 1 && (
                        <IconButton
                          className="child-delete-btn"
                          onClick={() => {
                            setIsDeleteChildDialogOpen(true);
                            setChildToDelete(child.child_id);
                          }}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
                  {child?.newRooms?.map((room, index) => (
                    <Box key={index}>
                      <Stack
                        spacing={1.5}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between">
                        <Stack direction="row" spacing={1.5}>
                          <Stack px={2.5}>
                            <Stack direction="row" spacing={1.5}>
                              <Typography variant="body2">
                                <Box sx={{ fontWeight: 'bold' }}>
                                  {capitalizeFirstLetter(room.rooms.room_name)}
                                </Box>
                              </Typography>
                            </Stack>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                              <Typography variant="caption">
                                {room?.scheduled_enable_date
                                  ? 'Enable date: ' + room?.scheduled_enable_date + '  '
                                  : room?.scheduled_disable_date
                                  ? 'Disable date: ' + room?.scheduled_disable_date + '  '
                                  : room?.disabled == 'true'
                                  ? 'Disabled  '
                                  : 'Enabled  '}
                              </Typography>
                              {(room?.scheduled_enable_date || room?.scheduled_disable_date) && (
                                <img
                                  src={DeleteScheduleIcon}
                                  style={{ height: '.8rem', marginLeft: '.3rem' }}
                                  onClick={() => handleDeleteSchedule(room)}
                                  className="curser-pointer"></img>
                              )}
                              {roomScheduleDeleteLoading.room_id == room.room_id &&
                                roomScheduleDeleteLoading.child_id == child.child_id &&
                                roomScheduleDeleteLoading.loading && <Loader loading={true} />}
                            </Box>
                          </Stack>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          justifyContent="center">
                          <img
                            src={Schedule}
                            style={{ height: '1.5rem' }}
                            className="curser-pointer"></img>

                          <BlockIcon
                            className={
                              room?.disabled == 'true'
                                ? 'disable-icon curser-pointer'
                                : 'curser-pointer'
                            }
                            onClick={() => {
                              setRoomToDisable(room);
                              setIsRoomDialogOpen(true);
                            }}></BlockIcon>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                  <Divider variant="middle" sx={{ marginTop: '15px', marginBottom: '15px' }} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </>
      )}

      <Divider textAlign="left" className="title-divider">
        {props?.family?.primary?.status === 'Disabled' ? 'ENABLE FAMILY' : 'DISABLE FAMILY'}
      </Divider>
      <Stack direction="row" px={2.5} mt={2} alignItems="center">
        {props?.family?.primary?.status === 'Disabled' ? (
          <LoadingButton
            loading={enableFamilyLoading}
            loadingPosition={enableFamilyLoading ? 'start' : undefined}
            startIcon={enableFamilyLoading && <SaveIcon />}
            variant="contained"
            onClick={handleFamilyEnable}>
            ENABLE FAMILY
          </LoadingButton>
        ) : (
          <>
            {props?.family?.primary?.scheduled_end_date == null && (
              <Button
                variant="outlined"
                className="disabled-btn"
                onClick={() => props.setIsDisableFamilyDialogOpen(true)}>
                Disable FAMILY
              </Button>
            )}
            {props?.family?.primary?.scheduled_end_date != null &&
              props?.family?.primary?.scheduled_end_date && (
                <>
                  {' '}
                  <Typography variant="caption">
                    {`Disable Date:  ${dayjs(props?.family?.primary?.scheduled_end_date).format(
                      'YYYY-MM-DD'
                    )}`}
                  </Typography>
                  <Tooltip id="button-report" title="Delete scheduled disable">
                    <IconButton
                      aria-label="delete"
                      className="row-delete-btn"
                      color="error"
                      onClick={() => {
                        setScheduledLoading({
                          loading: true,
                          index: -1,
                          type: 'family'
                        });
                        handleFamilyEnable();
                      }}>
                      <Loader
                        loading={
                          scheduledLoading.loading && scheduledLoading.type == 'family'
                            ? true
                            : false
                        }
                      />
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
          </>
        )}
      </Stack>

      <DeleteDialog
        title="Delete Child"
        contentText="Are you sure you want to delete this child?"
        loading={deleteLoading}
        open={isDeleteChildDialogOpen}
        handleDialogClose={handleDeleteDialogClose}
        handleDelete={handleChildDelete}
      />
      <DisableDialog
        title={disableDialogTitle}
        open={isDisableDialogOpen}
        loading={disableLoading}
        setSelectedLocationsToDisable={setSelectedLocationsToDisable}
        locationsToDisable={locationsToDisable}
        handleDialogClose={handleDisableDialogClose}
        handleDisable={handleDisable}
      />
      <RoomDialog
        open={isRoomDialogOpen}
        setOpen={setIsRoomDialogOpen}
        loading={roomLoading}
        roomDetails={roomTodisable}
        title={roomTodisable?.disabled == 'true' ? 'Enable Room' : 'Disable Room'}
        contentText="This action will disable room access to this child"
        handleRoomDisableEnable={handleRoomDisableEnable}
        handleDialogClose={() => setIsRoomDialogOpen(false)}
      />
    </Drawer>
  );
};

export default FamilyDrawer;

FamilyDrawer.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  setIsParentFormDialogOpen: PropTypes.func,
  setParentType: PropTypes.func,
  setIsDisableFamilyDialogOpen: PropTypes.func,
  setIsChildFormDialogOpen: PropTypes.func,
  setIsRoomFormDialogOpen: PropTypes.func,
  family: PropTypes.object,
  setFamily: PropTypes.func,
  setPrimaryParent: PropTypes.func,
  setSecondaryParent: PropTypes.func,
  setChild: PropTypes.func,
  getFamiliesList: PropTypes.func
};
