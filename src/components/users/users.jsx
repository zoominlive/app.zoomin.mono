import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import UserForm from './userform';
import UserActions from './useractions';
import DeleteDialog from '../common/deletedialog';

const Users = () => {
  const layoutCtx = useContext(LayoutContext);
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [user, setUser] = useState();
  const [usersPayload, setUsersPayload] = useState({
    page: 1,
    limit: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    search: '',
    location: 'All'
  });

  useEffect(() => {
    layoutCtx.setActive(4);
    layoutCtx.setBreadcrumb(['Users']);
  }, []);

  const rows = [
    {
      id: 1,
      user: 'Ralph Edwards',
      location: 'Location 4',
      email: 'debra.holt@example.com'
    },
    {
      id: 2,
      user: 'Ralph Edwards',
      location: 'Location 4',
      email: 'debra.holt@example.com'
    }
  ];

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, page: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, limit: parseInt(event.target.value, 10) }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, search: event.target.value }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setUsersPayload((prevPayload) => ({ ...prevPayload, location: event.target.value }));
  };

  return (
    <Box className="listing-wrapper">
      <Card>
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={6} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={8} sm={12}>
                      <TextField
                        label="Search"
                        value={usersPayload?.search}
                        placeholder="Location, room, etc..."
                        onChange={handleSearch}
                      />
                    </Grid>
                    <Grid item md={4} sm={12}>
                      <FormControl fullWidth className="location-select">
                        <InputLabel id="location">Location</InputLabel>
                        <Select
                          labelId="location"
                          id="location"
                          value={usersPayload?.location}
                          label="Location"
                          onChange={handleLocationChange}>
                          <MenuItem value={'All'}>All</MenuItem>
                          <MenuItem value={'Location 1'}>Location 1</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              <Grid
                item
                md={6}
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

          <Box mt={2}>
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
                  {rows.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell component="th" scope="row">
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Avatar>RE</Avatar>
                          <Typography>{row.user}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="left">{row.location}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 25, 50]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
                component="div"
                count={1}
                rowsPerPage={usersPayload?.limit}
                page={usersPayload?.page - 1}
                sx={{ flex: '1 1 auto' }}
              />
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      <UserForm
        open={isUserFormDialogOpen}
        setOpen={setIsUserFormDialogOpen}
        user={user}
        setUser={setUser}
      />
      <DeleteDialog
        open={isDeleteDialogOpen}
        handleDialogClose={() => setIsDeleteDialogOpen(false)}
        handleDelete={() => setIsDeleteDialogOpen(false)}
        title="Delete User"
        contentText={'Are you sure you want to delete this user?'}
      />
    </Box>
  );
};

export default Users;
