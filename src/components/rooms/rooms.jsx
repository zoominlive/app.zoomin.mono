import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
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
import React, { useEffect, useMemo } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { Plus } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import RoomForm from './roomform';
import RoomActions from './roomactions';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteDialog from '../common/deletedialog';
import Loader from '../common/loader';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import debounce from 'lodash.debounce';

const Row = (props) => {
  const { row } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow hover>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.room_name}</TableCell>
        <TableCell>{row.location}</TableCell>
        <TableCell>{row.camDetails.length}</TableCell>
        <TableCell align="right">
          <RoomActions
            room={row}
            setRoom={props.setRoom}
            setIsRoomFormDialogOpen={props.setIsRoomFormDialogOpen}
            setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
          />
        </TableCell>
      </TableRow>
      <TableRow className={`expandable-row ${!open ? 'border-bottom-none' : ''}`}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Table size="small" aria-label="cameras">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '120px' }}>Camera Name</TableCell>
                    <TableCell>URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row?.camDetails?.map((camRow, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{camRow.cam_name}</TableCell>
                      <TableCell>
                        <a href={camRow.cam_url} target="_blank" rel="noreferrer">
                          {camRow.cam_uri}
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
    number_of_cam: PropTypes.number,
    camDetails: PropTypes.arrayOf(
      PropTypes.shape({
        cam_name: PropTypes.string,
        cam_url: PropTypes.string
      })
    )
  }),
  setRoom: PropTypes.func,
  setIsRoomFormDialogOpen: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};

const Rooms = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isRoomFormDialogOpen, setIsRoomFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomsDropdownLoading, setRoomsDropdownLoading] = useState(false);
  const [dropdownList, setDropdownList] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roomsList, setRoomList] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [room, setRoom] = useState();
  const [roomsPayload, setRoomsPayload] = useState({
    pageNumber: 0,
    pageSize: parseInt(process.env.REACT_APP_PAGINATION_LIMIT, 10),
    searchBy: '',
    location: 'All',
    rooms: []
  });

  useEffect(() => {
    layoutCtx.setActive(3);
    layoutCtx.setBreadcrumb(['Rooms']);
  }, []);

  useEffect(() => {
    setRoomsDropdownLoading(true);
    API.get('rooms/list').then((response) => {
      if (response.status === 200) {
        setDropdownList(response.data.Data);
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

  useEffect(() => {
    return () => {
      roomsListDebounce.cancel();
    };
  });

  useEffect(() => {
    getRoomsList();
  }, [roomsPayload]);

  // Method to fetch the rooms list for table
  const getRoomsList = () => {
    setIsLoading(true);
    API.get('rooms', { params: roomsPayload }).then((response) => {
      if (response.status === 200) {
        setRoomList(response.data.Data.finalRoomDetails);
        setTotalRooms(response.data.Data.count);
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

  const handleRoomDelete = () => {
    setDeleteLoading(true);
    API.delete('rooms/delete', { data: { room_id: room.room_id } }).then((response) => {
      if (response.status === 200) {
        getRoomsList();
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
      setRoom();
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    });
  };

  // Method to change the page in table
  const handlePageChange = (_, newPage) => {
    setRoomsPayload((prevPayload) => ({ ...prevPayload, pageNumber: newPage }));
  };

  // Method to change the row per page in table
  const handleChangeRowsPerPage = (event) => {
    setRoomsPayload((prevPayload) => ({
      ...prevPayload,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setRoomsPayload((prevPayload) => ({ ...prevPayload, searchBy: event.target.value }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setRoomsPayload((prevPayload) => ({ ...prevPayload, location: event.target.value }));
  };

  // Method to handle room change for table
  const handleRoomChange = (_, value) => {
    const temp = [];
    value.forEach((val) => {
      temp.push(val.room_name);
    });
    setRoomsPayload((prevPayload) => ({ ...prevPayload, rooms: temp }));
  };

  // Calls the search handler after 500ms
  const roomsListDebounce = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  // const rows = [
  //   {
  //     id: 1,
  //     room_name: 'Room 1',
  //     location: 'Location 1',
  //     number_of_cam: 4,
  //     cams: [
  //       {
  //         cam_name: 'Cam 1',
  //         cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
  //       },
  //       {
  //         cam_name: 'Cam 2',
  //         cam_url:
  //           'https://zoomin.com/systems/en/room/zoomin-room-1/room/zoomin-room-1/room/zoomin-room-1/'
  //       },
  //       {
  //         cam_name: 'Cam 3',
  //         cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/n/room/zoomin-room-1'
  //       },
  //       {
  //         cam_name: 'Cam 4',
  //         cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
  //       }
  //     ]
  //   },
  //   {
  //     id: 2,
  //     room_name: 'Room 2',
  //     location: 'Location 2',
  //     number_of_cam: 3,
  //     cams: [
  //       {
  //         cam_name: 'Cam 1',
  //         cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/'
  //       },
  //       {
  //         cam_name: 'Cam 2',
  //         cam_url:
  //           'https://zoomin.com/systems/en/room/zoomin-room-1/room/zoomin-room-1/room/zoomin-room-1/'
  //       },
  //       {
  //         cam_name: 'Cam 3',
  //         cam_url: 'https://zoomin.com/systems/en/room/zoomin-room-1/n/room/zoomin-room-1'
  //       }
  //     ]
  //   }
  // ];
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
                        placeholder="Location, room, etc..."
                        onChange={roomsListDebounce}
                      />
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      <FormControl fullWidth className="location-select">
                        <InputLabel id="location">Location</InputLabel>
                        <Select
                          labelId="location"
                          id="location"
                          value={roomsPayload?.location}
                          onChange={handleLocationChange}
                          label="Location">
                          <MenuItem value={'All'}>All</MenuItem>
                          {authCtx.user.location.accessable_locations.map((location, index) => (
                            <MenuItem key={index} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      <Autocomplete
                        loading={roomsDropdownLoading}
                        fullWidth
                        multiple
                        id="rooms"
                        value={roomsPayload?.rooms}
                        // options={['Room 1', 'Room 2', 'Room 3']}
                        options={dropdownList}
                        isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                        getOptionLabel={(option) => option.room_name}
                        onChange={handleRoomChange}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Room"
                            fullWidth
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
                    onClick={() => setIsRoomFormDialogOpen(true)}>
                    {' '}
                    Add Room
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={2} sx={{ position: 'relative' }}>
            <Loader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '50px' }} />
                    <TableCell sx={{ width: '200px' }}>Room Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell sx={{ width: '100px' }}>Cams</TableCell>
                    <TableCell align="right" sx={{ width: '50px' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomsList.map((room) => (
                    <Row
                      setRoom={setRoom}
                      setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                      key={room.room_id}
                      row={room}
                    />
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 25, 50]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
                component="div"
                count={totalRooms}
                rowsPerPage={roomsPayload?.pageSize}
                page={roomsPayload?.pageNumber}
                sx={{ flex: '1 1 auto' }}
              />
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
      {isRoomFormDialogOpen && (
        <RoomForm
          room={room}
          setRoom={setRoom}
          open={isRoomFormDialogOpen}
          setOpen={setIsRoomFormDialogOpen}
          getRoomsList={getRoomsList}
        />
      )}
      <DeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Room"
        contentText="Are you sure you want to delete this room?"
        loading={deleteLoading}
        handleDialogClose={() => {
          setRoom();
          setIsDeleteDialogOpen(false);
        }}
        handleDelete={handleRoomDelete}
      />
    </Box>
  );
};

export default Rooms;
