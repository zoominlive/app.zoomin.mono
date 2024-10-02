import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import API from '../../assets/API.png';

const NoAPIKeyDataDiv = ({ handleCreateNewKey }) => {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ fontSize: 15, fontWeight: 'bold', paddingTop: 5, paddingBottom: 5 }}>
      <img src={API} />
      <Stack direction={'column'} gap={1} mt={'16px !important'} justifyContent={'center'}>
        <Typography
          textAlign={'center'}
          fontWeight={600}
          fontSize={'22px'}
          lineHeight={'33px'}
          color={'#343434'}>
          No API keys generated
        </Typography>
        <Typography fontWeight={500} fontSize={'16px'} lineHeight={'24px'} color={'#828282'}>
          Please create your first app by clicking the button below
        </Typography>
        <Button
          className="create-app-button"
          variant="contained"
          onClick={handleCreateNewKey}
          sx={{
            borderRadius: '50px',
            textTransform: 'capitalize',
            padding: '10px 18px',
            margin: 'auto'
          }}>
          Create Your First App
        </Button>
      </Stack>
    </Stack>
  );
};

export default NoAPIKeyDataDiv;

NoAPIKeyDataDiv.propTypes = {
  handleCreateNewKey: PropTypes.func
};
