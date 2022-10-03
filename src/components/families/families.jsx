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
  OutlinedInput,
  Chip,
  AvatarGroup,
  Grid
} from '@mui/material';
import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import AddChild from './addchild';
import AddFamily from './addfamily';
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

  return (
    <Box className="listing-wrapper">
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item md={8} sm={12}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item md={6} sm={12}>
                    <TextField label="Search" value={'Location, Room, etc...'} />
                  </Grid>
                  <Grid item md={3} sm={12}>
                    <FormControl fullWidth className="location-select">
                      <InputLabel id="location">Location</InputLabel>
                      <Select labelId="location" id="location" value={'All'} label="Location">
                        <MenuItem value={'All'}>All</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={3} sm={12}>
                    <FormControl className="room-select">
                      <InputLabel id="room-select">Room</InputLabel>
                      <Select
                        labelId="room-select"
                        id="room-select"
                        multiple
                        value={['Room 1']}
                        input={<OutlinedInput id="select-multiple-chip" label="Room" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} onDelete={() => {}} />
                            ))}
                          </Box>
                        )}>
                        <MenuItem key={0} value={'Room 1'}>
                          Room 1
                        </MenuItem>

                        <MenuItem key={1} value={'Room 2'}>
                          Room 2
                        </MenuItem>

                        <MenuItem key={2} value={'Room 3'}>
                          Room 3
                        </MenuItem>
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
                onPageChange={() => {}}
                component="div"
                count={1}
                rowsPerPage={5}
                page={0}
                sx={{ flex: '1 1 auto' }}
              />
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      <EditFamily open={isEditFamilyDialogOpen} setOpen={setIsEditFamilyDialogOpen} />
      <AddChild open={isAddChildDialogOpen} setOpen={setIsChildDialogOpen} />
      <DisableFamily open={isDisableFamilyDialogOpen} setOpen={setIsDisableFamilyDialogOpen} />
      <AddFamily open={isAddFamilyDialogOpen} setOpen={setIsAddFamilyDialogOpen} />
      <FamilyDrawer open={isFamilyDrawerOpen} setOpen={setIsFamilyDrawerOpen} />
    </Box>
  );
};

export default Families;
