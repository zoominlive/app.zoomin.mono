import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Chip,
  Switch
} from '@mui/material';
import RoomAddForm from './roomaddform';
import SchedulerFrom from './scheduler';
// import BlockIcon from '@mui/icons-material/Block';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditSchedule from '../../assets/schedule.svg';
import Schedule from '../../assets/new-schedule.svg';
import DeleteScheduleIcon from '../../assets/delete-icon.svg';
import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@mui/icons-material/Edit';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
// import DeleteDialog from '../common/deletedialog';
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
import AddIcon from '@mui/icons-material/Add';
import { Plus } from 'react-feather';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NewDeleteDialog from '../common/newdeletedialog';
import PrimaryMemberDeleteDialog from './primaryMemberDeleteDialog';
const FamilyDrawer = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [toDelete, setToDelete] = useState();
  const [toDeleteRoom, setToDeleteRoom] = useState();
  const [childToDisable, setChildToDisable] = useState();
  const [parentToDisable, setParentToDisable] = useState();
  const [disableLoading, setDisableLoading] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isDeleteChildDialogOpen, setIsDeleteChildDialogOpen] = useState(false);
  const [disableDialogTitle, setDisableDialogTitle] = useState();
  const [disableDialogSubTitle, setDisableDialogSubTitle] = useState();
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
  const [isRoomAddDialogOpen, setIsRoomAddDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [existingRooms, setExistingRooms] = useState([]);
  const [selectedChild, setSelectedChild] = useState({});
  const [roomOpenInScheduler, setRoomOpenInScheduler] = useState({});
  const [roomScheduleDeleteLoading, setRoomScheduleDeleteLoading] = useState({
    room_id: '',
    child_id: '',
    loading: false
  });

  const [isDeleteTitle, setIsDeleteTitle] = useState('');
  const [isDeleteContext, setIsDeleteContext] = useState('');
  const [isPrimaryMemberDeleteOpen, setIsPrimaryMemberDeleteOpen] = useState(false);
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
    let data = {
      [isDeleteTitle == 'Delete Child' || isDeleteTitle == "Delete Child's Room"
        ? 'child_id'
        : 'family_member_id']: toDelete
    };
    if (isDeleteTitle == "Delete Child's Room") {
      data = { ...data, room_id: toDeleteRoom };
    }
    setDeleteLoading(true);
    API.delete(
      `family/${
        isDeleteTitle == 'Delete Child'
          ? 'child/delete'
          : isDeleteTitle == "Delete Child's Room"
          ? 'child/deleteroom'
          : 'delete-secondary-member'
      }`,
      {
        data: data
      }
    ).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        props.getFamiliesList();
        props.setFamily((prevState) => {
          const tempFamily = { ...prevState };
          if (isDeleteTitle == 'Delete Child') {
            tempFamily.children = tempFamily.children.filter(
              (child) => child.child_id !== toDelete
            );
          } else if (isDeleteTitle == 'Delete Primary Member') {
            tempFamily.primary = {};
          } else {
            tempFamily.secondary = tempFamily.secondary.filter(
              (member) => member.family_member_id !== toDelete
            );
          }
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
    setToDelete();
    setIsDeleteTitle('');
    setIsDeleteContext('');
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
      family_id: props.family.primary.family_id
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
    // setEnableChildrenLoading((prevState) => {
    //   const tempLoading = [...prevState];
    //   tempLoading[index] = true;
    //   return tempLoading;
    // });
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
      // setEnableChildrenLoading((prevState) => {
      //   const tempLoading = [...prevState];
      //   tempLoading[index] = false;
      //   return tempLoading;
      // });
    });
  };

  const handleChildDisable = (childToDisable, index) => {
    // setEnableChildrenLoading((prevState) => {
    //   const tempLoading = [...prevState];
    //   tempLoading[index] = true;
    //   return tempLoading;
    // });
    API.put('family/child/disable', {
      child_id: childToDisable
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
      // setEnableChildrenLoading((prevState) => {
      //   const tempLoading = [...prevState];
      //   tempLoading[index] = false;
      //   return tempLoading;
      // });
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
      <Typography variant="h6" className="title">
        Family Management
      </Typography>
      <Stack direction="row" mt={2} alignItems="center" justifyContent={'flex-start'} spacing={1}>
        {props?.family?.primary?.status === 'Disabled' ? (
          <LoadingButton
            //className="add_family_member_btn"
            variant="contained"
            loading={enableFamilyLoading}
            loadingPosition={enableFamilyLoading ? 'start' : undefined}
            startIcon={enableFamilyLoading && <SaveIcon />}
            className="add_family_member_btn family_enable_btn"
            onClick={handleFamilyEnable}>
            Enable Family
          </LoadingButton>
        ) : (
          <>
            {props?.family?.primary?.scheduled_end_date == null && (
              <>
                {/* <Stack direction="row" justifyContent="space-between" spacing={1}> */}
                <Button
                  className="add_family_member_btn"
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => {
                    props.setFamily(props.family);
                    props.setIsParentFormDialogOpen(true);
                  }}>
                  Add Family Member
                </Button>
                <Button
                  className="add_child_btn"
                  variant="outlined"
                  startIcon={<Plus />}
                  onClick={() => {
                    props.setFamily(props.family);
                    props.setIsChildFormDialogOpen(true);
                  }}>
                  Add Child
                </Button>
                <Button
                  // variant="contained"
                  className="disable_family_btn"
                  // color="dark"
                  onClick={() => props.setIsDisableFamilyDialogOpen(true)}>
                  Disable Family
                </Button>
                {/* </Stack> */}
              </>
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
                      <DeleteIcon className="delete-icon" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
          </>
        )}
      </Stack>

      <Typography variant="h6" className="title">
        Primary Family Member
      </Typography>
      <Stack
        spacing={1.5}
        px={2.5}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        className="family_member_wrap">
        <Stack spacing={1.5} direction="row" alignItems="center">
          <Box className="viewer-profile">
            <Box className="profile-img">
              <Avatar
                title={
                  !_.isEmpty(props?.family?.primary) &&
                  `${props?.family?.primary?.first_name[0]?.toUpperCase()}${props?.family?.primary?.last_name[0]?.toUpperCase()}`
                }
                src={props?.family?.primary?.profile_image}>{`${
                !_.isEmpty(props?.family?.primary) &&
                props?.family?.primary?.first_name[0]?.toUpperCase()
              }${
                !_.isEmpty(props?.family?.primary) &&
                props?.family?.primary?.last_name[0]?.toUpperCase()
              }`}</Avatar>
            </Box>
          </Box>
          <Stack>
            <Stack direction="row" spacing={1.5}>
              <Typography variant="body2">
                {props?.family?.primary?.first_name &&
                  capitalizeFirstLetter(props?.family?.primary?.first_name)}{' '}
                {props?.family?.primary?.last_name &&
                  capitalizeFirstLetter(props?.family?.primary?.last_name)}
              </Typography>

              {/* <Divider orientation="vertical" variant="middle" flexItem /> */}
              <Chip label={props?.family?.primary?.relationship} />
              {/* <Typography variant="body2" className="blue-text">
                {props?.family?.primary?.relationship}
              </Typography> */}
            </Stack>
            <Typography variant="caption">{props?.family?.primary?.email}</Typography>
          </Stack>
        </Stack>
        <Box>
          <IconButton
            className="edit-btn"
            onClick={() => {
              props.setPrimaryParent(props?.family?.primary);
              props.setParentType('primary');
              props.setIsParentFormDialogOpen(true);
            }}>
            <EditOutlinedIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setIsPrimaryMemberDeleteOpen(true);
              // setIsDeleteChildDialogOpen(true);
              // setIsDeleteTitle('Delete Primary Member');
              // setIsDeleteContext(
              //   props.family.secondary.length > 0
              //     ? 'Select new primary member'
              //     : 'You can not delete the primary family member without another family member to take its place'
              // );
              // setToDelete(props?.family?.primary?.family_member_id);
            }}>
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      </Stack>
      {props?.family?.secondary && props?.family?.secondary?.length > 0 && (
        <>
          <Typography variant="h6" className="title">
            Other Family Members
          </Typography>
          {props.family.secondary.map((parent, index) => (
            <Box key={index}>
              <Stack
                spacing={1.5}
                px={2.5}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                className="family_member_wrap">
                <Stack direction="row" spacing={1.5}>
                  <Box className="viewer-profile">
                    <Box className="profile-img">
                      <Avatar
                        src={
                          parent?.profile_image
                        }>{`${parent?.first_name[0]?.toUpperCase()}${parent?.last_name[0]?.toUpperCase()}`}</Avatar>
                    </Box>
                  </Box>
                  <Stack>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="body2">
                        {' '}
                        {capitalizeFirstLetter(parent?.first_name)}{' '}
                        {capitalizeFirstLetter(parent?.last_name)}
                      </Typography>
                      {/* <Divider orientation="vertical" variant="middle" flexItem /> */}
                      <Chip label={parent?.relationship} />
                      {/* <Typography variant="body2" className="blue-text">
                        {parent?.relationship}
                      </Typography> */}
                    </Stack>
                    <Typography variant="caption">{parent?.email}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
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
                          <DeleteIcon className="delete-icon" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  {parent.status === 'Disabled' ? (
                    <Switch
                      className={`switch-disable`}
                      checked={false}
                      onChange={() => {
                        handleParentEnable(parent.family_member_id, index);
                      }}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                  ) : (
                    <>
                      {parent?.scheduled_end_date == null && (
                        <Switch
                          className={`switch-enable`}
                          checked={true}
                          onChange={() => {
                            setDisableDialogTitle('Disable Secondary Family Member');
                            setDisableDialogSubTitle(
                              'Disabled secondary family member so they can watch stream'
                            );
                            setIsDisableDialogOpen(true);
                            let locations = [];
                            props?.family?.children.forEach((child) => {
                              // eslint-disable-next-line no-unsafe-optional-chaining
                              locations.push(...child?.location?.locations);
                            });
                            setLocationsToDisable(_.uniq(locations));
                            setParentToDisable(parent.family_member_id);
                          }}
                          inputProps={{ 'aria-label': 'controlled' }}
                        />
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
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setIsDeleteChildDialogOpen(true);
                      setIsDeleteTitle('Delete Family Member');
                      setIsDeleteContext('Are you sure you want to delete this family member?');
                      setToDelete(parent.family_member_id);
                    }}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          ))}
        </>
      )}
      {props?.family?.children && props?.family?.children?.length > 0 && (
        <>
          <Typography variant="h6" className="title">
            Children
          </Typography>
          <Stack spacing={2}>
            {props?.family?.children.map((child, index) => (
              <Stack key={index} spacing={2} className="family_member_wrap">
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box className="viewer-profile">
                        <Box className="profile-img">
                          <Avatar>{`${child?.first_name[0]?.toUpperCase()}${child?.last_name[0]?.toUpperCase()}`}</Avatar>
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        {' '}
                        {capitalizeFirstLetter(child?.first_name)}{' '}
                        {capitalizeFirstLetter(child?.last_name)}
                      </Typography>
                      {/* <Typography variant="caption">
                                {room?.scheduled_enable_date
                                  ? 'Enable date: ' + room?.scheduled_enable_date + '  '
                                  : room?.scheduled_disable_date
                                  ? 'Disable date: ' + room?.scheduled_disable_date + '  '
                                  : room?.disabled == 'true'
                                  ? 'Disabled  '
                                  : 'Enabled  '}
                              </Typography> */}
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {(child?.scheduled_enable_date !== null && child?.scheduled_enable_date) ||
                      (child?.scheduled_end_date !== null && child?.scheduled_end_date) ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                          <Typography variant="caption">
                            {`${
                              child?.scheduled_enable_date !== null && child?.scheduled_enable_date
                                ? 'Enable Date'
                                : 'Disable Date'
                            }:  ${
                              child?.scheduled_enable_date !== null && child?.scheduled_enable_date
                                ? child?.scheduled_enable_date
                                : child?.scheduled_end_date
                            }`}
                            {/* {`${
                              child?.status === 'Disabled' ? 'Disable Date' : 'Enable Date'
                            }:  ${
                              child?.scheduled_enable_date !== null && child?.scheduled_enable_date
                                ? child?.scheduled_enable_date
                                : child?.scheduled_end_date
                            }`} */}
                          </Typography>
                          <Tooltip
                            id="button-report"
                            title={`Delete scheduled ${
                              child?.scheduled_enable_date !== null && child?.scheduled_enable_date
                                ? 'Enable'
                                : 'disable'
                            }`}>
                            <img
                              src={DeleteScheduleIcon}
                              style={{ height: '.8rem', marginLeft: '.3rem' }}
                              onClick={() => {
                                setScheduledLoading({
                                  loading: true,
                                  index: index,
                                  type: 'child'
                                });
                                if (child?.status === 'Disabled') {
                                  handleChildDisable(child.child_id, index);
                                } else {
                                  handleChildEnable(child.child_id, index);
                                }
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
                      ) : null}
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center">
                      {/* {props?.family?.children.length !== 1 && (
                        <IconButton
                          className="child-delete-btn"
                          className="edit-btn"
                          onClick={() => {
                            setIsDeleteChildDialogOpen(true);
                            setChildToDelete(child.child_id);
                          }}>
                          <DeleteIcon className="delete-icon" />
                          <DeleteOutlineIcon />
                        </IconButton>
                      )} */}
                      {child.status === 'Disabled' ? (
                        // <Tooltip id="button-report" title="Enable">
                        <>
                          {!enableChildrenLoading[index] && (
                            // <BlockIcon
                            //   className="curser-pointer block-icon"
                            //   onClick={() => {
                            //     handleChildEnable(child.child_id, index);
                            //   }}></BlockIcon>

                            <Switch
                              className="switch-disable"
                              checked={false}
                              onChange={() => {
                                handleChildEnable(child.child_id, index);
                              }}
                              inputProps={{ 'aria-label': 'controlled' }}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {child?.scheduled_end_date == null && (
                            // <Tooltip id="button-report" title="Disable">
                            <>
                              {/* <CheckCircleIcon
                                className={'curser-pointer enable-icon'}
                                onClick={() => {
                                  setLocationsToDisable(child?.location?.locations);
                                  setIsDisableDialogOpen(true);
                                  setChildToDisable(child.child_id);
                                  setDisableDialogTitle('Disable Child');
                                }}></CheckCircleIcon> */}

                              <Switch
                                className="switch-enable"
                                checked={true}
                                onChange={() => {
                                  setLocationsToDisable(child?.location?.locations);
                                  setIsDisableDialogOpen(true);
                                  setChildToDisable(child.child_id);
                                  setDisableDialogTitle('Disable Child');
                                }}
                                inputProps={{ 'aria-label': 'controlled' }}
                              />
                              {/* // </Tooltip> */}
                            </>
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
                          //className="child-delete-btn"
                          className="edit-btn"
                          onClick={() => {
                            setIsDeleteChildDialogOpen(true);
                            setToDelete(child.child_id);
                            setIsDeleteTitle('Delete Child');
                            setIsDeleteContext('Are you sure you want to delete this child?');
                          }}>
                          {/* <DeleteIcon className="delete-icon" /> */}
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  {child?.roomsInChild?.map((room, index) => (
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
                                  {room?.room?.room_name &&
                                    capitalizeFirstLetter(room?.room?.room_name)}
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
                          <Switch
                            className={`switch-${room?.disabled == 'true' ? 'enable' : 'disable'}`}
                            checked={room?.disabled == 'true' ? false : true}
                            onChange={() => {
                              setRoomToDisable(room);
                              setIsRoomDialogOpen(true);
                            }}
                            inputProps={{ 'aria-label': 'controlled' }}
                          />

                          <img
                            src={
                              _.isEmpty(room.schedule) || _.isEmpty(room.schedule?.timeRange)
                                ? Schedule
                                : EditSchedule
                            }
                            onClick={() => {
                              setRoomOpenInScheduler(room);
                              setIsSchedulerOpen(true);
                            }}
                            style={{ height: '1.5rem' }}
                            className="curser-pointer"></img>
                          <IconButton
                            //className="child-delete-btn"
                            onClick={() => {
                              setIsDeleteChildDialogOpen(true);
                              setToDelete(child.child_id);
                              setToDeleteRoom(room?.room_id);
                              setIsDeleteTitle("Delete Child's Room");
                              setIsDeleteContext('Are you sure you want to delete this room?');
                            }}
                            className="edit-btn">
                            <DeleteOutlineIcon />
                          </IconButton>
                          {/* <BlockIcon
                            className={
                              room?.disabled == 'true'
                                ? 'disable-icon curser-pointer'
                                : 'curser-pointer'
                            }
                            onClick={() => {
                              setRoomToDisable(room);
                              setIsRoomDialogOpen(true);
                            }}></BlockIcon> */}
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                  {/* <AddIcon
                    className={'room-add-btn'}
                    onClick={() => {
                      setExistingRooms(child.roomsInChild);
                      setIsRoomAddDialogOpen(true);
                      setSelectedChild(child);
                    }}>
                  </AddIcon> */}
                  <Button
                    startIcon={<AddIcon />}
                    className="add-room-btn"
                    onClick={() => {
                      setExistingRooms(child.roomsInChild);
                      setIsRoomAddDialogOpen(true);
                      setSelectedChild(child);
                    }}>
                    Add Room
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </>
      )}

      <NewDeleteDialog
        //title="Delete Child"
        title={isDeleteTitle}
        //contentText="Are you sure you want to delete this child?"
        contentText={isDeleteContext}
        loading={deleteLoading}
        open={isDeleteChildDialogOpen}
        handleDialogClose={handleDeleteDialogClose}
        handleDelete={handleChildDelete}
      />
      <DisableDialog
        title={disableDialogTitle}
        subTitle={disableDialogSubTitle}
        open={isDisableDialogOpen}
        loading={disableLoading}
        setSelectedLocationsToDisable={setSelectedLocationsToDisable}
        locationsToDisable={locationsToDisable}
        handleDialogClose={handleDisableDialogClose}
        handleDisable={handleDisable}
        setOpen={setIsDisableDialogOpen}
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
      <RoomAddForm
        open={isRoomAddDialogOpen}
        setOpen={setIsRoomAddDialogOpen}
        roomsList={props.roomsList}
        existingRooms={existingRooms}
        child={selectedChild}
        getFamiliesList={props.getFamiliesList}
      />
      {isSchedulerOpen && (
        <SchedulerFrom
          open={isSchedulerOpen}
          setOpen={setIsSchedulerOpen}
          roomDetails={roomOpenInScheduler}
          getFamiliesList={props.getFamiliesList}
        />
      )}

      <PrimaryMemberDeleteDialog
        open={isPrimaryMemberDeleteOpen}
        setOpen={setIsPrimaryMemberDeleteOpen}
        family={props?.family}
        getFamiliesList={props.getFamiliesList}
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
  getFamiliesList: PropTypes.func,
  roomsList: PropTypes.array
};
