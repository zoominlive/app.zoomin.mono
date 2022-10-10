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
  Autocomplete
} from '@mui/material';
import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import AddChild from './addchild';
import FamilyForm from './familyform';
import DisableFamily from './disablefamily';
import EditFamily from './editfamily';
import FamilyAction from './familyactions';
import FamilyDrawer from './familydrawer';

const Families = () => {
  const layoutCtx = useContext(LayoutContext);
  const [isAddChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isEditFamilyDialogOpen, setIsEditFamilyDialogOpen] = useState(false);
  const [isDisableFamilyDialogOpen, setIsDisableFamilyDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isFamilyDrawerOpen, setIsFamilyDrawerOpen] = useState(false);
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
    console.log(value);
    setFamiliesPayload((prevPayload) => ({ ...prevPayload, rooms: value }));
  };

  console.log(familiesPayload);

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
                      value={familiesPayload?.search}
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
                      options={['Room 1', 'Room 2', 'Room 3']}
                      onChange={handleRoomChange}
                      value={familiesPayload?.rooms}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Room" fullWidth placeholder="Room" />
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
                    <TableRow key={index} hover onClick={() => setIsFamilyDrawerOpen(true)}>
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
                          openAddChildDialog={setIsChildDialogOpen}
                          openEditFamilyDialog={setIsEditFamilyDialogOpen}
                          openDisableFamilyDialog={setIsDisableFamilyDialogOpen}
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
      <EditFamily open={isEditFamilyDialogOpen} setOpen={setIsEditFamilyDialogOpen} />
      <AddChild open={isAddChildDialogOpen} setOpen={setIsChildDialogOpen} />
      <DisableFamily open={isDisableFamilyDialogOpen} setOpen={setIsDisableFamilyDialogOpen} />
      <FamilyForm open={isAddFamilyDialogOpen} setOpen={setIsAddFamilyDialogOpen} />
      <FamilyDrawer open={isFamilyDrawerOpen} setOpen={setIsFamilyDrawerOpen} />
    </Box>
  );
};

export default Families;
