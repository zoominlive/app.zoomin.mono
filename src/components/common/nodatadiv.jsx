import React from 'react';
import { Stack } from '@mui/material';
import NoData from '../../assets/no-data.svg';

const NoDataDiv = () => {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ fontWeight: 'bold', paddingTop: 5, paddingBottom: 5 }}>
      <img src={NoData} />
      No Data Found
    </Stack>
  );
};

export default NoDataDiv;
