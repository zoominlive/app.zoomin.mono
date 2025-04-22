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
  Tooltip,
  InputAdornment,
  Checkbox
} from '@mui/material';
import React, { useContext, useEffect, useMemo } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import ChildForm from './childform';
import ZoneAddForm from './zoneaddform';
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
// import DeleteDialog from '../common/deletedialog';
import debounce from 'lodash.debounce';
// import Loader from '../common/loader';
import { capitalizeFirstLetter } from '../../utils/capitalizefirstletter';
import dayjs from 'dayjs';
import NoDataDiv from '../common/nodatadiv';
import SearchIcon from '@mui/icons-material/Search';
import NewDeleteDialog from '../common/newdeletedialog';
import LinerLoader from '../common/linearLoader';
import { useLocation } from 'react-router-dom';

const Families = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const location = useLocation();
  const receivedData = location.state?.data;
  const { enqueueSnackbar } = useSnackbar();
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isZoneFormDialogOpen, setIsZoneFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
  const [zonesList, setZonesList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [zonesDropdownLoading, setZonesDropdownLoading] = useState(false);
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
    searchBy: receivedData ? receivedData : '',
    location: ['All'],
    zones: [],
    cust_id: localStorage.getItem('cust_id')
  });

  useEffect(() => {
    layoutCtx.setActive(2);
    layoutCtx.setBreadcrumb(['Families', 'Manage Families and their camera authorizations']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getFamiliesList();
  }, [familiesPayload]);

  useEffect(() => {
    setZonesDropdownLoading(true);
    API.get('zones/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
        if (response.status === 200) {
          setZonesList(response.data.Data);
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
        setZonesDropdownLoading(false);
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

    // Flatten all child locations into the locations array
    children?.forEach((child) => {
      child?.child_locations?.forEach((location) => {
        locations.push(location);
      });
    });

    // Create a map to ensure unique locations based on loc_id
    const uniqueLocations = locations.reduce((map, location) => {
      if (!map.has(location.loc_id)) {
        map.set(location.loc_id, location);
      }
      return map;
    }, new Map());

    // Convert unique locations back to an array
    const uniqueLocationsArray = Array.from(uniqueLocations.values());

    // Generate JSX
    const locationsJSX = uniqueLocationsArray.map((location, index) => (
      <Chip key={index} label={location.loc_name} color="primary" className="chip-color" />
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
    const { value } = event.target;

    if (value.includes('All')) {
      // If 'All' is the only selected option, set to 'All'
      // Otherwise, set to the specific locations
      setFamiliesPayload((prevPayload) => ({
        ...prevPayload,
        location: value.length === 1 ? ['All'] : value.filter((loc) => loc !== 'All')
      }));
    } else {
      // Check if all other locations are selected
      const allLocationIds = authCtx.user.locations.map((loc) => loc.loc_id);
      const isAllLocationsSelected = allLocationIds.every((locId) => value.includes(locId));

      setFamiliesPayload((prevPayload) => ({
        ...prevPayload,
        location: isAllLocationsSelected ? ['All'] : value
      }));
    }
  };

  // Method to handle zone change for table
  const handleZoneChange = (_, value) => {
    const zonesArr = [];
    value.forEach((zone) => zonesArr.push(zone.zone_name));
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, zones: zonesArr, page: 0 }));
  };

  // Calls the search handler after 500ms
  const familesListDebounce = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  // Method to delete family
  const handleFamilyDelete = () => {
    setDeleteLoading(true);
    console.log('family==>', family);
    API.delete('family/delete', {
      data: {
        family_id: family.primary.family_id,
        frontegg_user_id: family.primary.frontegg_user_id
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
      <Card className="filter">
        <CardContent>
          <Grid container spacing={2}>
            <Grid item md={8} sm={12}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item md={5} sm={12}>
                    <InputLabel id="search">Search</InputLabel>
                    <TextField
                      labelId="search"
                      placeholder={'Family Member Name, Child Name'}
                      onChange={familesListDebounce}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item md={3.5} sm={12}>
                    <InputLabel id="location">Location</InputLabel>
                    <FormControl fullWidth className="location-select">
                      <Select
                        labelId="location"
                        // id="location"
                        multiple
                        value={familiesPayload?.location}
                        onChange={handleLocationChange}
                        renderValue={(selected) => {
                          if (selected.length === 0) return 'Select Locations';
                          if (selected.includes('All')) return 'All';

                          const selectedNames = authCtx.user.locations
                            .filter((loc) => selected.includes(loc.loc_id))
                            .map((loc) => loc.loc_name)
                            .join(', ');

                          return (
                            <Box
                              sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                              {selectedNames}
                            </Box>
                          );
                        }}>
                        <MenuItem value="All">
                          <Checkbox checked={familiesPayload.location.includes('All')} />
                          All
                        </MenuItem>
                        {authCtx.user.locations
                          .sort((a, b) => (a.loc_name > b.loc_name ? 1 : -1))
                          .map((item) => (
                            <MenuItem key={item.loc_id} value={item.loc_id}>
                              {' '}
                              <Checkbox
                                checked={
                                  familiesPayload.location.includes(item.loc_id) ||
                                  familiesPayload.location.includes('All')
                                }
                              />
                              {item.loc_name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={3.5} sm={12}>
                    <InputLabel id="zones">Zones</InputLabel>
                    <Autocomplete
                      labelId="zones"
                      fullWidth
                      multiple
                      id="zones"
                      options={zonesList.sort((a, b) => (a?.zone_name > b?.zone_name ? 1 : -1))}
                      isOptionEqualToValue={(option, value) => option?.zone_id === value?.zone_id}
                      getOptionLabel={(option) => {
                        return option?.zone_name;
                      }}
                      onChange={handleZoneChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option?.zone_name} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          // label="Room"
                          fullWidth
                          placeholder="Zones"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {zonesDropdownLoading ? (
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
                  className="add-button"
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => setIsAddFamilyDialogOpen(true)}>
                  {' '}
                  Add Family
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Box mt={2} sx={{ position: 'relative' }}>
            <LinerLoader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell align="left">Children</TableCell>
                    <TableCell style={{ minWidth: '150px' }}>Primary Parent</TableCell>
                    <TableCell align="left">Family</TableCell>
                    <TableCell style={{ minWidth: '100px' }} align="left">
                      Location
                    </TableCell>
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
                          <TableCell align="left">
                            {row.children.length > 1 ? (
                              <AvatarGroup>
                                {row.children.map((child, index) => (
                                  <>
                                    <Tooltip
                                      id="button-report"
                                      placement="top"
                                      title={child?.first_name + ' ' + child?.last_name}>
                                      {/* <Box className="profile-img"> */}

                                      <Avatar
                                        key={
                                          index
                                        }>{`${child?.first_name[0]?.toUpperCase()}`}</Avatar>
                                    </Tooltip>
                                  </>
                                ))}
                              </AvatarGroup>
                            ) : (
                              <Typography>
                                {row.children[0]?.first_name &&
                                  capitalizeFirstLetter(row.children[0]?.first_name)}{' '}
                                {row.children[0]?.last_name &&
                                  capitalizeFirstLetter(row.children[0]?.last_name)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {/* <Stack direction="row" alignItems="center" spacing={3}>
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
                            </Stack> */}
                            <Box className="viewer-profile">
                              <Box className="profile-img">
                                {row?.primary?.profile_image ? (
                                  <Avatar
                                    alt={`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}
                                    src={row?.primary?.profile_image}
                                  />
                                ) : (
                                  <Avatar>
                                    {`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}
                                  </Avatar>
                                )}
                              </Box>
                              <Typography>
                                {' '}
                                {row?.primary?.first_name &&
                                  capitalizeFirstLetter(row?.primary?.first_name)}{' '}
                                {row?.primary?.last_name &&
                                  capitalizeFirstLetter(row?.primary?.last_name)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="left">
                            <AvatarGroup>
                              {row.secondary.length === 0 && (
                                <Avatar
                                  key={index}
                                  title={`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}
                                  src={
                                    row.primary?.profile_image
                                  }>{`${row.primary?.first_name[0]?.toUpperCase()}${row.primary?.last_name[0]?.toUpperCase()}`}</Avatar>
                              )}
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
                          <TableCell align="left">
                            <Stack direction="row">{renderFamilyLocations(row.children)}</Stack>
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
          zonesList={zonesList}
          family={family}
          child={child}
          setChild={setChild}
          setFamily={setFamily}
          getFamiliesList={getFamiliesList}
        />
      )}
      {isZoneFormDialogOpen && (
        <ZoneAddForm
          open={isZoneFormDialogOpen}
          setOpen={setIsZoneFormDialogOpen}
          zonesList={zonesList}
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
          zonesList={zonesList}
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
        setIsZoneFormDialogOpen={setIsZoneFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
        getFamiliesList={getFamiliesList}
        setParentType={setParentType}
        zonesList={zonesList}
        parentType={parentType}
      />
      <NewDeleteDialog
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
