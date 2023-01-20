import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import UserForm from './userform';
import UserActions from './useractions';
import DeleteDialog from '../common/deletedialog';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import Loader from '../common/loader';
import debounce from 'lodash.debounce';
import NoDataDiv from '../common/nodatadiv';

const Users = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [user, setUser] = useState();
  const [usersPayload, setUsersPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All'
  });

  useEffect(() => {
    layoutCtx.setActive(4);
    layoutCtx.setBreadcrumb(['Users']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
  });

  useEffect(() => {
    getUsersList();
  }, [usersPayload]);

  // Method to fetch user list for table
  const getUsersList = () => {
    setIsLoading(true);
    API.get('users/all', { params: usersPayload }).then((response) => {
      if (response.status === 200) {
        setUsersList(response.data.Data.users);
        setTotalUsers(response.data.Data.count);
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

  // Method to delete user
  const handleUserDelete = () => {
    setDeleteLoading(true);
    API.delete('users/delete', { data: { userId: user.user_id } }).then((response) => {
      if (response.status === 200) {
        getUsersList();
        enqueueSnackbar(response.data.Message, {
          variant: 'success'
        });
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data?.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
      setUser();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setUsersPayload((prevPayload) => ({
      ...prevPayload,
      pageNumber: 0,
      searchBy: event.target.value ? event.target.value : ''
    }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, location: event.target.value }));
  };

  // Calls the search handler after 500ms
  const debouncedResults = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  return (
    <Box className="listing-wrapper">
      <Card>
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={8} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={5} sm={12}>
                      <TextField
                        label="Search"
                        placeholder="User Name,Email"
                        onChange={debouncedResults}
                      />
                    </Grid>
                    <Grid item md={3} sm={12}>
                      <FormControl fullWidth className="location-select">
                        <InputLabel id="location">Location</InputLabel>
                        <Select
                          labelId="location"
                          id="location"
                          value={usersPayload?.location}
                          label="Location"
                          onChange={handleLocationChange}>
                          <MenuItem value={'All'}>All</MenuItem>
                          {authCtx?.user?.location?.accessable_locations
                            .sort((a, b) => (a > b ? 1 : -1))
                            .map((location, index) => (
                              <MenuItem key={index} value={location}>
                                {location}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
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
                    onClick={() => setIsUserFormDialogOpen(true)}>
                    {' '}
                    Add User
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={2} position="relative">
            <Loader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ minWidth: '150px' }}>User</TableCell>
                    <TableCell style={{ minWidth: '100px' }} align="left">
                      Location
                    </TableCell>
                    <TableCell align="left">Email</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersList?.length > 0
                    ? usersList?.map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={3}>
                              {row.profile_image ? (
                                <Avatar src={row.profile_image} />
                              ) : (
                                <Avatar>{`${row.first_name[0].toUpperCase()}${row.last_name[0].toUpperCase()}`}</Avatar>
                              )}
                              <Typography>{`${row.first_name[0].toUpperCase()}${row.first_name.slice(
                                1
                              )} ${row.last_name[0].toUpperCase()}${row.last_name.slice(
                                1
                              )}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="left">
                            <Stack direction="row">
                              {row.location.selected_locations
                                .sort((a, b) => (a > b ? 1 : -1))
                                .map((location, index) => (
                                  <Chip key={index} label={location} color="primary" />
                                ))}
                            </Stack>
                          </TableCell>
                          <TableCell align="left">{row.email}</TableCell>
                          <TableCell align="right">
                            <UserActions
                              user={row}
                              setUser={setUser}
                              setIsUserFormDialogOpen={setIsUserFormDialogOpen}
                              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </TableBody>
              </Table>
              {usersList?.length == 0 ? <NoDataDiv /> : null}
              {usersList?.length > 0 ? (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 25, 50]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  component="div"
                  count={totalUsers}
                  rowsPerPage={usersPayload?.pageSize}
                  page={usersPayload?.pageNumber}
                  sx={{ flex: '1 1 auto' }}
                />
              ) : null}
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {isUserFormDialogOpen && (
        <UserForm
          open={isUserFormDialogOpen}
          setOpen={setIsUserFormDialogOpen}
          user={user}
          setUser={setUser}
          getUsersList={getUsersList}
        />
      )}
      <DeleteDialog
        open={isDeleteDialogOpen}
        title="Delete User"
        contentText={'Are you sure you want to delete this user?'}
        loading={deleteLoading}
        handleDialogClose={() => {
          setUser();
          setIsDeleteDialogOpen(false);
        }}
        handleDelete={handleUserDelete}
      />
    </Box>
  );
};

export default Users;
