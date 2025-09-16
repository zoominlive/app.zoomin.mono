import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const Loader = (props) => {
  return (
    <Backdrop
      sx={{
        position: 'absolute',
        color: '#1b4965',
        zIndex: 1,
        backgroundColor: 'transparent'
      }}
      open={props.loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default Loader;

Loader.propTypes = {
  loading: PropTypes.bool
};
