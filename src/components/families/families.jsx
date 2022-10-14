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
  CircularProgress
} from '@mui/material';
import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import ChildForm from './childform';
import FamilyForm from './familyform';
import DisableFamily from './disablefamily';
// import EditFamily from './editfamily';
import FamilyAction from './familyactions';
import FamilyDrawer from './familydrawer';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import ParentForm from './parentform';
import DeleteDialog from '../common/deletedialog';

const Families = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isChildFormDialogOpen, setIsChildFormDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [isParentFormDialogOpen, setIsParentFormDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  const [primaryParent, setPrimaryParent] = useState();
  const [secondaryParent, setSecondaryParent] = useState();
  const [child, setChild] = useState();
  const [family, setFamily] = useState();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const tempFamily = {
    primary: {
      id: 1,
      first_name: 'Parent',
      last_name: '1',
      role: 'Father',
      phone: 5555555555,
      email: 'parent1@example.com'
    },
    secondary: [
      {
        id: 1,
        first_name: 'Parent',
        last_name: '2',
        role: 'Father',
        phone: 5555555555,
        email: 'parent2@example.com',
        disabled: false
      },
      {
        id: 2,
        first_name: 'Parent',
        last_name: '3',
        role: 'Grandfather',
        phone: 5555555555,
        email: 'parent2@example.com',
        disabled: false
      }
    ],
    children: [
      {
        id: 1,
        first_name: 'Child 1',
        disabled: false,
        rooms: [
          {
            room_name: 'Room 2',
            room_id: 1
          }
        ]
      },
      {
        id: 2,
        first_name: 'Child 2',
        disabled: false,
        rooms: [
          {
            room_name: 'Room 2',
            room_id: 1
          }
        ]
      },
      {
        id: 3,
        first_name: 'Child 3',
        disabled: false,
        rooms: [
          {
            room_name: 'Room 2',
            room_id: 1
          }
        ]
      }
    ]
  };
  const [familiesPayload, setFamiliesPayload] = useState({
    page: 1,
    limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    search: '',
    location: 'All',
    rooms: []
  });

  useEffect(() => {
    layoutCtx.setActive(2);
    layoutCtx.setBreadcrumb(['Families', 'Manage Families and their camera autorization']);
  }, []);

  useEffect(() => {
    setRoomsDropdownLoading(true);
    API.get('rooms/list').then((response) => {
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
    });
  }, []);

  const rows = [
    {
      id: 1,
      primary_parent: 'Savannah Nguyen',
      location: 'Location 4',
      family: ['TY', 'RE', 'CA'],
      children: ['B', 'D'],
      end_date: '09.12.2022'
    },
    {
      id: 2,
      primary_parent: 'Savannah Nguyen',
      location: 'Location 4',
      family: ['TY', 'RE', 'CA'],
      children: ['B', 'D'],
      end_date: '09.12.2022'
    }
  ];

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, page: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setFamiliesPayload((prevPayload) => ({
      ...prevPayload,
      limit: parseInt(event.target.value, 10)
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, search: event.target.value }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, location: event.target.value }));
  };

  // Method to handle room change for table
  const handleRoomChange = (_, value) => {
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, rooms: value }));
  };

  const handleFamilyDelete = () => {
    setDeleteLoading(false);
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
                      placeholder={'Location, Room, etc...'}
                      onChange={handleSearch}
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
                        <MenuItem value={'Location 1'}>Location 1</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={3.5} sm={12}>
                    <Autocomplete
                      fullWidth
                      multiple
                      id="rooms"
                      value={familiesPayload?.rooms}
                      options={roomsList}
                      isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                      getOptionLabel={(option) => {
                        return option.room_name;
                      }}
                      onChange={handleRoomChange}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option.room_name} {...getTagProps({ index })} />
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
          <Box mt={2}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: '150px' }}>Primary Parent</TableCell>
                    <TableCell style={{ minWidth: '100px' }} align="left">
                      Location
                    </TableCell>
                    <TableCell align="left">Family</TableCell>
                    <TableCell align="left">Children</TableCell>
                    <TableCell align="left">Schedule end date</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => {
                        setIsFamilyDrawerOpen(true);
                        setFamily(tempFamily);
                      }}>
                      <TableCell component="th" scope="row">
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Avatar>RE</Avatar>
                          <Typography>{row.primary_parent}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="left">{row.location}</TableCell>
                      <TableCell align="left">
                        <AvatarGroup max={5}>
                          {row.family.map((person, index) => (
                            <Avatar key={index}>{person}</Avatar>
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell align="left">
                        {' '}
                        <AvatarGroup max={5}>
                          {row.children.map((person, index) => (
                            <Avatar key={index}>{person}</Avatar>
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell>{row.end_date}</TableCell>
                      <TableCell align="right">
                        <FamilyAction
                          openChildFormDialog={setIsChildFormDialogOpen}
                          openFamilyDrawer={setIsFamilyDrawerOpen}
                          openDisableFamilyDialog={setIsDisableFamilyDialogOpen}
                          openParentFormDialog={setIsParentFormDialogOpen}
                          openDeleteDialog={setIsDeleteDialogOpen}
                          family={row}
                          setFamily={setFamily}
                          tempFamily={tempFamily}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 25, 50]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
                component="div"
                count={1}
                rowsPerPage={familiesPayload?.limit}
                page={familiesPayload?.page - 1}
                sx={{ flex: '1 1 auto' }}
              />
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
        />
      )}
      <DisableFamily open={isDisableFamilyDialogOpen} setOpen={setIsDisableFamilyDialogOpen} />
      {isAddFamilyDialogOpen && (
        <FamilyForm
          open={isAddFamilyDialogOpen}
          setOpen={setIsAddFamilyDialogOpen}
          roomsList={roomsList}
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
        />
      )}
      <FamilyDrawer
        open={isFamilyDrawerOpen}
        setOpen={setIsFamilyDrawerOpen}
        family={family}
        setIsParentFormDialogOpen={setIsParentFormDialogOpen}
        setIsChildFormDialogOpen={setIsChildFormDialogOpen}
        setIsDisableFamilyDialogOpen={setIsDisableFamilyDialogOpen}
        setPrimaryParent={setPrimaryParent}
        setSecondaryParent={setSecondaryParent}
        setChild={setChild}
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
