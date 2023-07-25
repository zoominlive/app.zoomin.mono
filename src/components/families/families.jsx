import {
  Avatar,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Stack,
  Box,
  Table,
  Chip,
  AvatarGroup,
  Grid,
  Autocomplete,
  CircularProgress,
  Tooltip
} from '@mui/material';
import React, { useContext, useEffect, useMemo } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import ChildForm from './childform';
import RoomAddForm from './roomaddform';
import FamilyForm from './familyform';
import DisableDialog from './disabledialog';
// import EditFamily from './editfamily';
import FamilyAction from './familyactions';
import FamilyDrawer from './familydrawer';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import ParentForm from './parentform';
import DeleteDialog from '../common/deletedialog';
import debounce from 'lodash.debounce';
import Loader from '../common/loader';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import dayjs from 'dayjs';
import NoDataDiv from '../common/nodatadiv';

const Families = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isRoomFormDialogOpen, setIsRoomFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  const [primaryParent, setPrimaryParent] = useState();
  const [secondaryParent, setSecondaryParent] = useState();
  const [child, setChild] = useState();
  const [family, setFamily] = useState();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [parentType, setParentType] = useState('');
  const [familyIndex, setFamilyIndex] = useState();
  const [familiesPayload, setFamiliesPayload] = useState({
    page: 0,
    limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    rooms: [],
    cust_id: localStorage.getItem('cust_id')
  });

  useEffect(() => {
    layoutCtx.setActive(2);
    layoutCtx.setBreadcrumb(['Families', 'Manage Families and their camera authorization']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getFamiliesList();
  }, [familiesPayload]);

  useEffect(() => {
    setRoomsDropdownLoading(true);
    API.get('rooms/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setRoomsList(response.data.Data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setRoomsDropdownLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    setFamily(familiesList?.[familyIndex]);
  }, [familiesList]);

  // Method to fetch families list
  const getFamiliesList = () => {
    setIsLoading(true);
    API.get('family', { params: familiesPayload }).then((response) => {
      if (response.status === 200) {
        setFamiliesList(response.data.Data.familyArray);
        setTotalFamilies(response.data.Data.count);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setIsLoading(false);
    });
  };

  // Method to render the family location in table(combines the location from each child and remove duplicates)
  const renderFamilyLocations = (children) => {
    let locations = [];
    children?.forEach((child) => {
      child?.location?.locations?.forEach((location) => {
        locations?.push(location);
      });
    });
    const uniqueLocations = locations?.filter((item, index) => locations?.indexOf(item) === index);
    const locationsJSX = uniqueLocations?.map((location, index) => (
      <Chip key={index} label={location} color="primary" />
    ));
    return locationsJSX;
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, page: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setFamiliesPayload((prevPayload) => ({
      ...prevPayload,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setFamiliesPayload((prevPayload) => ({
      ...prevPayload,
      searchBy: event.target.value,
      page: 0
    }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setFamiliesPayload((prevPayload) => ({
      ...prevPayload,
      location: event.target.value,
      page: 0
    }));
  };

  // Method to handle room change for table
  const handleRoomChange = (_, value) => {
    const roomsArr = [];
    value.forEach((room) => roomsArr.push(room.room_name));
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, rooms: roomsArr, page: 0 }));
  };

  // Calls the search handler after 500ms
  const familesListDebounce = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  // Method to delete family
  const handleFamilyDelete = () => {
    setDeleteLoading(true);
    API.delete('family/delete', {
      data: {
        family_id: family.primary.family_id
      }
    }).then((response) => {
      if (response.status === 200) {
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        getFamiliesList();
        setIsDeleteDialogOpen(false);
        setFamily();
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

  // Method to disable family
  const handleFamilyDisable = (data) => {
    setDisableLoading(true);
    API.put('family/disable', {
      family_member_id: family.primary.family_member_id,
      member_type: 'primary',
      family_id: family.primary.family_id,
      scheduled_end_date:
        data.selectedOption === 'schedule' && dayjs(data.disableDate).format('YYYY-MM-DD')
    }).then((response) => {
      if (response.status === 200) {
        if (response?.data?.Data?.scheduled === true) {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = dayjs(data.disableDate).format('YYYY-MM-DD');
            return tempFamily;
          });
        }
        enqueueSnackbar(response.data.Message, { variant: 'success' });
        getFamiliesList();
        if (data.selectedOption === 'disable') {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.status = 'Disabled';
            tempFamily.secondary.length > 0 &&
              tempFamily.secondary.forEach((parent) => {
                parent.status = 'Disabled';
              });

            tempFamily.children.forEach((child) => {
              child.status = 'Disabled';
            });
            if (tempFamily.primary.scheduled_end_date) {
              tempFamily.primary.scheduled_end_date = null;
            }
            return tempFamily;
          });
        } else {
          setFamily((prevState) => {
            let tempFamily = { ...prevState };
            tempFamily.primary.scheduled_end_date = data.disableDate;
            return tempFamily;
          });
        }
        setIsDisableFamilyDialogOpen(false);
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
  };

  return (
    <Box className="listing-wrapper">
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item md={8} sm={12}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item md={5} sm={12}>
                    <TextField
                      label="Search"
                      placeholder={'Family Member Name, Child Name'}
                      onChange={familesListDebounce}
                    />
                  </Grid>
                  <Grid item md={3.5} sm={12}>
                    <FormControl fullWidth className="location-select">
                      <InputLabel id="location">Location</InputLabel>
                      <Select
                        labelId="location"
                        id="location"
                        value={familiesPayload?.location}
                        label="Location"
                        onChange={handleLocationChange}>
                        <MenuItem value={'All'}>All</MenuItem>
                        {authCtx.user.location.accessable_locations
                          .sort((a, b) => (a > b ? 1 : -1))
                          .map((location, index) => (
                            <MenuItem key={index} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={3.5} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      options={roomsList.sort((a, b) => (a?.room_name > b?.room_name ? 1 : -1))}
                      isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                      getOptionLabel={(option) => {
                        return option?.room_name;
                      }}
                      onChange={handleRoomChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.room_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Room"
                          fullWidth
                          placeholder="Room"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {roomsDropdownLoading ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            )
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid
              item
              md={4}
              sm={12}
              sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Box>
                <Button
                  className="add-btn"
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => setIsAddFamilyDialogOpen(true)}>
                  {' '}
                  Add Family
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box mt={2} sx={{ position: 'relative' }}>
            <Loader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: '150px' }}>Primary Family Member</TableCell>
                    <TableCell align="left">Children</TableCell>
                    <TableCell style={{ minWidth: '100px' }} align="left">
                      Location
                    </TableCell>
                    <TableCell align="left">Family Members</TableCell>
                    <TableCell align="left">Schedule End Date</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {familiesList?.length > 0
                    ? familiesList?.map((row, index) => (
                        <TableRow
                          key={index}
                          hover
                          onClick={() => {
                            setIsFamilyDrawerOpen(true);
                            setFamilyIndex(index);
                            setFamily(row);
                          }}>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              {row?.primary?.profile_image ? (
                                <Avatar
                                  alt={`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}
                                  src={row?.primary?.profile_image}
                                />
                              ) : (
                                <Avatar>{`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}</Avatar>
                              )}

                              <Typography>
                                {' '}
                                {row?.primary?.first_name &&
                                  capitalizeFirstLetter(row?.primary?.first_name)}{' '}
                                {row?.primary?.last_name &&
                                  capitalizeFirstLetter(row?.primary?.last_name)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">
                            {' '}
                            <AvatarGroup>
                              {row.children.map((child, index) => (
                                <>
                                  <Tooltip
                                    id="button-report"
                                    placement="top"
                                    title={child?.first_name + ' ' + child?.last_name}>
                                    <Avatar
                                      key={
                                        index
                                      }>{`${child?.first_name[0]?.toUpperCase()}`}</Avatar>
                                  </Tooltip>
                                </>
                              ))}
                            </AvatarGroup>
                          </TableCell>
                          <TableCell align="left">
                            <Stack direction="row">{renderFamilyLocations(row.children)}</Stack>
                          </TableCell>
                          <TableCell align="left">
                            <AvatarGroup>
                              {row.secondary.map((person, index) => (
                                <Avatar
                                  key={index}
                                  title={`${person?.first_name[0]?.toUpperCase()}${person?.last_name[0]?.toUpperCase()}`}
                                  src={
                                    person?.profile_image
                                  }>{`${person?.first_name[0]?.toUpperCase()}${person?.last_name[0]?.toUpperCase()}`}</Avatar>
                              ))}
                            </AvatarGroup>
                          </TableCell>
                          <TableCell>
                            {row.primary.scheduled_end_date
                              ? dayjs(row.primary.scheduled_end_date).format('MM.DD.YYYY')
                              : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            <FamilyAction
                              openChildFormDialog={setIsChildFormDialogOpen}
                              openFamilyDrawer={setIsFamilyDrawerOpen}
                              openDisableFamilyDialog={setIsDisableFamilyDialogOpen}
                              openParentFormDialog={setIsParentFormDialogOpen}
                              openDeleteDialog={setIsDeleteDialogOpen}
                              family={row}
                              setFamily={setFamily}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
              {!isLoading && familiesList?.length == 0 ? <NoDataDiv /> : null}
              {familiesList?.length > 0 ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalFamilies}
                  rowsPerPage={familiesPayload?.limit}
                  page={familiesPayload?.page}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {/* <EditFamily open={isEditFamilyDialogOpen} setOpen={setIsEditFamilyDialogOpen} /> */}
      {isChildFormDialogOpen && (
        <ChildForm
          open={isChildFormDialogOpen}
          setOpen={setIsChildFormDialogOpen}
          roomsList={roomsList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getFamiliesList}
        />
      )}
      {isRoomFormDialogOpen && (
        <RoomAddForm
          open={isRoomFormDialogOpen}
          setOpen={setIsRoomFormDialogOpen}
          roomsList={roomsList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getFamiliesList}
        />
      )}
      {isDisableFamilyDialogOpen && (
        <DisableDialog
          open={isDisableFamilyDialogOpen}
          setOpen={setIsDisableFamilyDialogOpen}
          loading={disableLoading}
          title="Disable Family"
          contentText="This action will disable access for all children."
          handleDisable={handleFamilyDisable}
          handleDialogClose={() => setIsDisableFamilyDialogOpen(false)}
        />
      )}
      {isAddFamilyDialogOpen && (
        <FamilyForm
          open={isAddFamilyDialogOpen}
          setOpen={setIsAddFamilyDialogOpen}
          roomsList={roomsList}
          getFamiliesList={getFamiliesList}
        />
      )}
      {isParentFormDialogOpen && (
        <ParentForm
          open={isParentFormDialogOpen}
          setOpen={setIsParentFormDialogOpen}
          primaryParent={primaryParent}
          setPrimaryParent={setPrimaryParent}
          secondaryParent={secondaryParent}
          setSecondaryParent={setSecondaryParent}
          family={family}
          setFamily={setFamily}
          getFamiliesList={getFamiliesList}
          setParentType={setParentType}
          parentType={parentType}
        />
      )}
      <FamilyDrawer
        open={isFamilyDrawerOpen}
        setOpen={setIsFamilyDrawerOpen}
        family={family}
        setFamily={setFamily}
        setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
        getFamiliesList={getFamiliesList}
        setParentType={setParentType}
        roomsList={roomsList}
        parentType={parentType}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Family"
        contentText="Are you sure you want to delete this family?"
        loading={deleteLoading}
        handleDialogClose={() => {
          setFamily();
          setIsDeleteDialogOpen(false);
        }}
        handleDelete={handleFamilyDelete}
      />
    </Box>
  );
};

export default Families;
