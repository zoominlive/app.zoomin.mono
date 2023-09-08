import { LinearProgress, Stack, Backdrop } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const LinerLoader = (props) => {
  console.log(props);
  return (
    // <Backdrop
    //   sx={{
    //     position: 'absolute',
    //     color: '#1b4965',
    //     zIndex: 1,
    //     backgroundColor: 'transparent'
    //   }}
    //   open={props.loading}>
    //   {/* <CircularProgress color="inherit" /> */}
    //   <LinearProgress />
    // </Backdrop>
    <Backdrop open={props.loading}>
      <Stack direction={'row'} justifyContent={'center'}>
        <LinearProgress style={{ width: '180px' }} className="linear-loader" />
      </Stack>
    </Backdrop>
  );
};

export default LinerLoader;

LinerLoader.propTypes = {
  loading: PropTypes.bool
};
