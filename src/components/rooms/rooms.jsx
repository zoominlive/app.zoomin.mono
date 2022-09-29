import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField
} from '@mui/material';
import React, { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import AddRoom from './addroom';
import RoomActions from './roomactions';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const Row = (props) => {
  const { row } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.room_name}</TableCell>
        <TableCell>{row.location}</TableCell>
        <TableCell>{row.cams}</TableCell>
        <TableCell align="right">
          <RoomActions />
        </TableCell>
      </TableRow>
      <TableRow className={`expandable-row ${!open ? 'border-bottom-none' : ''}`}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Camera Name</TableCell>
                    <TableCell>URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.cam.map((camRow, index) => (
                    <TableRow key={index}>
                      <TableCell>{camRow.cam_name}</TableCell>
                      <TableCell>
                        <a href={camRow.cam_url} target="_blank" rel="noreferrer">
                          {camRow.cam_url}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

Row.propTypes = {
  row: PropTypes.shape({
    room_name: PropTypes.string,
    location: PropTypes.string,
    cams: PropTypes.number,
    cam: PropTypes.arrayOf(
      PropTypes.shape({
        cam_name: PropTypes.string,
        cam_url: PropTypes.string
      })
    )
  })
};

const Rooms = () => {
  const layoutCtx = useContext(LayoutContext);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);

  useEffect(() => {
    layoutCtx.setActive(2);
    layoutCtx.setBreadcrumb(['Rooms']);
  }, []);

  const rows = [
    {
      id: 1,
      room_name: 'Room 1',
      location: 'Location 1',
      cams: 4,
      cam: [
        {
          cam_name: 'Cam 1',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
        },
        {
          cam_name: 'Cam 2',
          cam_url:
            'https://zoomin.com/systems/en/room/zoomin-room-1/room/zoomin-room-1/room/zoomin-room-1/'
        },
        {
          cam_name: 'Cam 3',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/n/room/zoomin-room-1'
        },
        {
          cam_name: 'Cam 4',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
        }
      ]
    },
    {
      id: 2,
      room_name: 'Room 2',
      location: 'Location 2',
      cams: 4,
      cam: [
        {
          cam_name: 'Cam 1',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
        },
        {
          cam_name: 'Cam 2',
          cam_url:
            'https://zoomin.com/systems/en/room/zoomin-room-1/room/zoomin-room-1/room/zoomin-room-1/'
        },
        {
          cam_name: 'Cam 3',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/n/room/zoomin-room-1'
        },
        {
          cam_name: 'Cam 4',
          cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
        }
      ]
    }
  ];
  return (
    <Box className="listing-wrapper">
      <Card>
        <CardContent>
          <Box>
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
                    onClick={() => setIsAddRoomDialogOpen(true)}>
                    {' '}
                    Add Room
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={2}>
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Room Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Cams</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <Row key={row.id} row={row} />
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
      <AddRoom open={isAddRoomDialogOpen} setOpen={setIsAddRoomDialogOpen} />
    </Box>
  );
};

export default Rooms;
