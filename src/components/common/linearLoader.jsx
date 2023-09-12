import React from 'react';
import { LinearProgress, Stack, Backdrop } from '@mui/material';
import PropTypes from 'prop-types';

const LinerLoader = (props) => {
  return (
    <Backdrop open={props.loading}>
      <Stack direction={'row'} justifyContent={'center'}>
        <LinearProgress className="linear-loader" />
      </Stack>
    </Backdrop>
  );
};

export default LinerLoader;

LinerLoader.propTypes = {
  loading: PropTypes.bool
};
