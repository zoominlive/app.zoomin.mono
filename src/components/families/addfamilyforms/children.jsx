import {
  Chip,
  Grid,
  IconButton,
  TextField,
  Box,
  Button,
  Autocomplete,
  Radio,
  FormControlLabel,
  InputLabel
} from '@mui/material';
import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
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
import { Plus } from 'react-feather';

const Children = (props) => {
  const authCtx = useContext(AuthContext);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    let rooms = [];
    console.log('props.roomsList==>', props.roomsList);
    props.roomsList?.map((room) => {
      let count = 0;
      selectedLocation?.forEach((location) => {
        console.log('location==>', location);
        if (room.loc_id === location.loc_id) {
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
            {console.log('props.values.children==>', props.values.children)}
            <Grid container spacing={3}>
              {props.values.children &&
                props.values.children.length > 0 &&
                props.values.children.map((_, index) => (
                  <>
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="child_first_name">Child First Name</InputLabel>
                      <TextField
                        name={`children.${index}.first_name`}
                        labelId="child_first_name"
                        value={props?.values?.children[index]?.first_name}
                        placeholder="Enter first name"
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
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="child_last_name">Child Last Name</InputLabel>
                      <TextField
                        labelId="child_last_name"
                        name={`children.${index}.last_name`}
                        value={props?.values?.children[index]?.last_name}
                        placeholder="Enter last name"
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

                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="locations">Locations</InputLabel>
                      <Autocomplete
                        labelId="locations"
                        fullWidth
                        multiple
                        id={`children.${index}.locations`}
                        options={authCtx?.user?.locations?.sort((a, b) =>
                          a.room_name > b.room_name ? 1 : -1
                        )}
                        getOptionLabel={(option) => option.loc_name} // Display loc_name in dropdown
                        value={props?.values?.children[index]?.locations}
                        onChange={(_, value) => {
                          props.setFieldValue(`children[${index}].locations`, value);
                          setSelectedLocation(value);
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip key={index} label={option.loc_name} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
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
                    <Grid item md={6} sm={12} className="family-form">
                      <InputLabel id="rooms">Rooms</InputLabel>
                      <Autocomplete
                        labelId="rooms"
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
                        renderOption={(props, option) => (
                          <li {...props}>
                            {option?.room_name}
                            <Chip
                              label={option?.customer_location.loc_name}
                              size="small"
                              sx={{
                                marginLeft: 1,
                                border: '1px solid #5a53dd',
                                backgroundColor: '#EBE8FF'
                              }}
                            />
                          </li>
                        )}
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
                    <Grid item md={12} sm={12}>
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
                    <Grid item md={12} sm={12}>
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
                    <Grid item md={6} sm={12}>
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
                              props.setFieldValue(
                                `children[${index}].enable_date`,
                                new Date(value)
                              );
                            }}
                          />
                        </LocalizationProvider>
                      )}
                    </Grid>
                    <Grid item md={6} sm={12}>
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
                endIcon={<Plus />}
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
