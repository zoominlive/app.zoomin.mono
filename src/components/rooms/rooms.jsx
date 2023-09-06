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
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  //Stack,
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
import React, { useEffect, useMemo } from 'react';
import { useContext } from 'react';
// import { Video } from 'react-feather';
import { useState } from 'react';
import { Plus, Video } from 'react-feather';
import LayoutContext from '../../context/layoutcontext';
import RoomForm from './roomform';
import RoomActions from './roomactions';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
// import DeleteDialog from '../common/deletedialog';
import Loader from '../common/loader';
import API from '../../api';
import AuthContext from '../../context/authcontext';
import { useSnackbar } from 'notistack';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import debounce from 'lodash.debounce';
import { Link } from 'react-router-dom';
import NoDataDiv from '../common/nodatadiv';
import NewDeleteDialog from '../common/newdeletedialog';
import SearchIcon from '@mui/icons-material/Search';

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
        <TableCell style={{ lineHeight: 2.5 }}>
          {/* <Stack direction={'row'} justifyContent="flex-start" alignItems="center"> */}
          {row?.cameras?.map((camRow, index) => (
            <Link
              key={index}
              to="/watch-stream"
              state={{
                roomName: row?.room_name,
                // eslint-disable-next-line react/prop-types
                roomId: row?.room_id,
                location: row?.location,
                camName: camRow?.cam_name,
                camId: camRow?.cam_id,
                streamUrl: camRow?.stream_uri
              }}
              className="cam-link">
              <Chip
                color="primary"
                className="chip-color"
                label={camRow?.cam_name}
                icon={<Video />}
              />
            </Link>
          ))}
          {/* </Stack> */}
        </TableCell>

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
                    <TableCell sx={{ width: '360px' }}>Description</TableCell>
                    <TableCell>Stream Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row?.cameras?.map((camRow, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{camRow?.cam_name}</TableCell>
                      <TableCell>
                        <Typography>{camRow?.description} </Typography>
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/watch-stream"
                          state={{
                            roomName: row?.room_name,
                            // eslint-disable-next-line react/prop-types
                            roomId: row?.room_id,
                            location: row?.location,
                            camName: camRow?.cam_name,
                            camId: camRow?.cam_id,
                            streamUrl: camRow?.stream_uri
                          }}>
                          <Video />
                        </Link>
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
    cameras: PropTypes.array
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
    rooms: [],
    cust_id: localStorage.getItem('cust_id')
  });

  useEffect(() => {
    layoutCtx.setActive(3);
    layoutCtx.setBreadcrumb(['Rooms', 'Manage rooms and their camera authorization']);

    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    getDropDownRoomList();
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

  // Method to fetch the rooms list for dropdown
  const getDropDownRoomList = () => {
    setRoomsDropdownLoading(true);
    API.get('rooms/list', { params: { cust_id: localStorage.getItem('cust_id') } }).then(
      (response) => {
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
      }
    );
  };

  // Method to delete room
  const handleRoomDelete = () => {
    setDeleteLoading(true);
    API.delete('rooms/delete', { data: { room_id: room.room_id } }).then((response) => {
      if (response.status === 200) {
        setDropdownList((prevList) => {
          let tempList = [...prevList];
          tempList = tempList.filter((item) => item.room_id !== room.room_id);
          return tempList;
        });
        setRoomsPayload((prev) => {
          let temp = { ...prev };
          temp.rooms = temp.rooms.filter((item) => item.room_id !== room.room_id);
          return temp;
        });
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
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 0
    }));
  };

  // Method to handle Search for table
  const handleSearch = (event) => {
    setRoomsPayload((prevPayload) => ({
      ...prevPayload,
      searchBy: event.target.value,
      pageNumber: 0
    }));
  };

  // Method to handle location change for table
  const handleLocationChange = (event) => {
    setRoomsPayload((prevPayload) => ({
      ...prevPayload,
      location: event.target.value,
      pageNumber: 0
    }));
  };

  // Method to handle room change for table
  const handleRoomChange = (_, value) => {
    const roomsArr = [];
    value.forEach((room) => roomsArr.push(room.room_name));
    setRoomsPayload((prevPayload) => ({ ...prevPayload, rooms: roomsArr, pageNumber: 0 }));
  };

  // Calls the search handler after 500ms
  const roomsListDebounce = useMemo(() => {
    return debounce(handleSearch, 500);
  }, []);

  return (
    <Box className="listing-wrapper">
      <Card className="filter">
        <CardContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item md={8} sm={12}>
                <Box>
                  <Grid container spacing={2}>
                    <Grid item md={5} sm={12}>
                      <InputLabel id="search">Search</InputLabel>
                      <TextField
                        labelId="search"
                        placeholder="Room Name, Location"
                        onChange={roomsListDebounce}
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
                      <InputLabel id="location">Select Location</InputLabel>
                      <FormControl fullWidth className="location-select">
                        <Select
                          labelId="location"
                          id="location"
                          value={roomsPayload?.location}
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
                      <InputLabel id="rooms">Select Rooms</InputLabel>
                      <Autocomplete
                        labelId="rooms"
                        loading={roomsDropdownLoading}
                        fullWidth
                        multiple
                        id="rooms"
                        options={dropdownList.sort((a, b) => (a.room_name > b.room_name ? 1 : -1))}
                        isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                        getOptionLabel={(option) => {
                          return option.room_name;
                        }}
                        onChange={handleRoomChange}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              key={index}
                              label={option.room_name}
                              {...getTagProps({ index })}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            placeholder="Rooms"
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
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                <Box>
                  <Button
                    className="add-button"
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
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Box mt={2} sx={{ position: 'relative' }}>
            <Loader loading={isLoading} />
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '50px' }} />
                    <TableCell sx={{ width: '200px' }}>Rooms</TableCell>
                    <TableCell sx={{ width: '200px' }}>Location</TableCell>
                    <TableCell>Cams</TableCell>
                    <TableCell align="right" sx={{ width: '50px' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomsList?.length > 0
                    ? roomsList?.map((room) => (
                        <Row
                          setRoom={setRoom}
                          setIsRoomFormDialogOpen={setIsRoomFormDialogOpen}
                          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                          key={room.room_id}
                          row={room}
                        />
                      ))
                    : null}
                </TableBody>
              </Table>
              {!isLoading && roomsList?.length == 0 ? <NoDataDiv /> : null}
              {roomsList?.length > 0 ? (
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
              ) : null}
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
          getDropDownRoomList={getDropDownRoomList}
          roomsPayload={roomsPayload}
          setRoomsPayload={setRoomsPayload}
          setDropdownList={setDropdownList}
        />
      )}
      <NewDeleteDialog
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
