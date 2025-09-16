import React from 'react';
import { Stack } from '@mui/material';
import NoData from '../../assets/off-the-air.svg';

const NoLiveStreamDiv = () => {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        fontSize: 12,
        fontWeight: '500',
        lineHeight: '18px',
        letterSpacing: '0.1px',
        paddingTop: 5,
        paddingBottom: 5,
        color: '#212121'
      }}>
      <img src={NoData} width={80} height={80} alt="No Data" />
      Off The Air
    </Stack>
  );
};

export default NoLiveStreamDiv;
