import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const Loader = (props) => {
  return (
    <Backdrop
      sx={{
        position: 'absolute',
        color: 'rgb(245 112 35)',
        zIndex: 1,
        filter: 'invert(1)'
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
