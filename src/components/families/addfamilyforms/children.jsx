import { Chip, Grid, IconButton, TextField, Box, Button, Autocomplete } from '@mui/material';
import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FieldArray } from 'formik';
import PropTypes from 'prop-types';

const Children = (props) => {
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
                    <Grid item md={3} sm={12}>
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
                    <Grid item md={7} sm={12}>
                      <Autocomplete
                        fullWidth
                        multiple
                        id={`children.${index}.rooms`}
                        options={props.roomsList}
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
                            label="Room"
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
                    <Grid item md={2} sm={12}>
                      {index !== 0 && (
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
