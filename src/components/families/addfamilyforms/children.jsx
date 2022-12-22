import {
  Chip,
  Grid,
  IconButton,
  TextField,
  Box,
  Button,
  Autocomplete,
  Radio,
  FormControlLabel
} from '@mui/material';
import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';
import { useContext } from 'react';
import AuthContext from '../../../context/authcontext';
import { useState } from 'react';
import { useEffect } from 'react';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import moment from 'moment';

const Children = (props) => {
  const authCtx = useContext(AuthContext);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    let rooms = [];
    props.roomsList?.map((room) => {
      let count = 0;
      selectedLocation?.forEach((location) => {
        if (room.location === location) {
          count = count + 1;
        }
      });
      if (count > 0) {
        rooms.push(room);
      }
    });
    setRoomList(rooms);
  }, [selectedLocation]);
  return (
    <FieldArray
      name="children"
      render={(arrayHelpers) => {
        return (
          <>
            <Grid container spacing={3}>
              {props.values.children &&
                props.values.children.length > 0 &&
                props.values.children.map((_, index) => (
                  <>
                    <Grid item md={6} sm={12}>
                      <TextField
                        name={`children.${index}.first_name`}
                        label="First Name"
                        value={props?.values?.children[index]?.first_name}
                        onChange={(event) => {
                          props.setFieldValue(`children[${index}].first_name`, event.target.value);
                        }}
                        fullWidth
                        helperText={
                          props.touched &&
                          props.touched.children &&
                          props.touched.children[index] &&
                          props.touched.children[index].first_name &&
                          props.errors &&
                          props.errors.children &&
                          props.errors.children[index] &&
                          props.errors.children[index].first_name
                        }
                        error={
                          props.touched &&
                          props.touched.children &&
                          props.touched.children[index] &&
                          props.touched.children[index].first_name &&
                          props.errors &&
                          props.errors.children &&
                          props.errors.children[index] &&
                          Boolean(props.errors.children[index].first_name)
                        }
                      />
                    </Grid>
                    <Grid item md={6} sm={12}>
                      <TextField
                        name={`children.${index}.last_name`}
                        label="Last Name"
                        value={props?.values?.children[index]?.last_name}
                        onChange={(event) => {
                          props.setFieldValue(`children[${index}].last_name`, event.target.value);
                        }}
                        fullWidth
                        helperText={
                          props.touched &&
                          props.touched.children &&
                          props.touched.children[index] &&
                          props.touched.children[index].last_name &&
                          props.errors &&
                          props.errors.children &&
                          props.errors.children[index] &&
                          props.errors.children[index].last_name
                        }
                        error={
                          props.touched &&
                          props.touched.children &&
                          props.touched.children[index] &&
                          props.touched.children[index].last_name &&
                          props.errors &&
                          props.errors.children &&
                          props.errors.children[index] &&
                          Boolean(props.errors.children[index].last_name)
                        }
                      />
                    </Grid>

                    <Grid item md={6} sm={12}>
                      <Autocomplete
                        fullWidth
                        multiple
                        id={`children.${index}.locations`}
                        options={authCtx?.user?.location?.selected_locations.sort((a, b) =>
                          a.room_name > b.room_name ? 1 : -1
                        )}
                        value={props?.values?.children[index]?.locations}
                        onChange={(_, value) => {
                          props.setFieldValue(`children[${index}].locations`, value);
                          setSelectedLocation(value);
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Locations"
                            fullWidth
                            helperText={
                              props.touched &&
                              props.touched.children &&
                              props.touched.children[index] &&
                              props.touched.children[index].locations &&
                              props.errors &&
                              props.errors.children &&
                              props.errors.children[index] &&
                              props.errors.children[index].locations
                            }
                            error={
                              props.touched &&
                              props.touched.children &&
                              props.touched.children[index] &&
                              props.touched.children[index].locations &&
                              props.errors &&
                              props.errors.children &&
                              props.errors.children[index] &&
                              Boolean(props.errors.children[index].locations)
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={6} sm={12}>
                      <Autocomplete
                        fullWidth
                        multiple
                        noOptionsText={'Select location first'}
                        id={`children.${index}.rooms`}
                        options={roomList ? roomList?.sort((a, b) => (a > b ? 1 : -1)) : []}
                        value={props?.values?.children[index]?.rooms}
                        isOptionEqualToValue={(option, value) => option.room_id === value.room_id}
                        getOptionLabel={(option) => {
                          return option.room_name;
                        }}
                        onChange={(_, value) => {
                          props.setFieldValue(`children[${index}].rooms`, value);
                        }}
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
                            label="Rooms"
                            fullWidth
                            helperText={
                              props.touched &&
                              props.touched.children &&
                              props.touched.children[index] &&
                              props.touched.children[index].rooms &&
                              props.errors &&
                              props.errors.children &&
                              props.errors.children[index] &&
                              props.errors.children[index].rooms
                            }
                            error={
                              props.touched &&
                              props.touched.children &&
                              props.touched.children[index] &&
                              props.touched.children[index].rooms &&
                              props.errors &&
                              props.errors.children &&
                              props.errors.children[index] &&
                              Boolean(props.errors.children[index].rooms)
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={2.5} sm={12}>
                      <FormControlLabel
                        value="Start Now"
                        control={
                          <Radio
                            checked={
                              props?.values?.children[index]?.selected_option === 'Start Now' ||
                              !props?.values?.children[index]?.selected_option
                            }
                            onChange={(e) => {
                              props.setFieldValue(
                                `children[${index}].selected_option`,
                                e.target.value
                              );

                              props.setFieldValue(`children[${index}].enable_date`, null);
                            }}
                          />
                        }
                        label="Start Now"
                      />
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      <FormControlLabel
                        value="Schedule start date"
                        control={
                          <Radio
                            checked={
                              props?.values?.children[index]?.selected_option ===
                              'Schedule start date'
                            }
                            onChange={(e) =>
                              props.setFieldValue(
                                `children[${index}].selected_option`,
                                e.target.value
                              )
                            }
                          />
                        }
                        label="Schedule start date"
                      />
                    </Grid>
                    <Grid item md={3.5} sm={12}>
                      {props?.values?.children[index]?.selected_option ===
                        'Schedule start date' && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DesktopDatePicker
                            open={
                              props?.values?.children[index]?.date_picker_open
                                ? props?.values?.children[index]?.date_picker_open
                                : false
                            }
                            minDate={new Date()}
                            label="Start date"
                            toolbarPlaceholder="Start date"
                            value={
                              props?.values?.children[index]?.enable_date
                                ? props?.values?.children[index]?.enable_date
                                : moment()
                            }
                            inputFormat="MM/DD/YYYY"
                            onClose={() =>
                              props.setFieldValue(`children[${index}].date_picker_open`, false)
                            }
                            renderInput={(params) => (
                              <TextField
                                onClick={() =>
                                  props.setFieldValue(`children[${index}].date_picker_open`, true)
                                }
                                {...params}
                              />
                            )}
                            components={{
                              OpenPickerIcon: !props?.values?.children[index]?.date_picker_open
                                ? ArrowDropDownIcon
                                : ArrowDropUpIcon
                            }}
                            onChange={(value) => {
                              props.setFieldValue(`children[${index}].enable_date`, value);
                            }}
                          />
                        </LocalizationProvider>
                      )}
                    </Grid>
                    <Grid item md={2} sm={12}>
                      {props.values.children.length !== 1 && (
                        <Box className="row-button-wrapper">
                          <IconButton
                            aria-label="delete"
                            className="row-delete-btn"
                            onClick={() => {
                              arrayHelpers.remove(index);
                            }}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Grid>
                  </>
                ))}
            </Grid>
            <Box className="row-button-wrapper" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                endIcon={<AddIcon />}
                className="row-add-btn"
                onClick={() => {
                  arrayHelpers.push({
                    first_name: '',
                    rooms: []
                  });
                }}>
                Add Child
              </Button>
            </Box>
          </>
        );
      }}
    />
  );
};

export default Children;

Children.propTypes = {
  values: PropTypes.object,
  setFieldValue: PropTypes.func,
  touched: PropTypes.object,
  errors: PropTypes.object,
  roomsList: PropTypes.array
};
