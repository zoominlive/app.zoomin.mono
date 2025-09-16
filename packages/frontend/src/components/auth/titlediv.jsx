import React from 'react';
import logoBlue from '../../assets/logo-blue.svg';
import { Box, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const TitleDiv = ({ isShowTitle = true, title, subtitle }) => {
  return (
    <Stack
      direction={'column'}
      justifyContent={'center'}
      alignItems={'center'}
      className="auth-title-wraper">
      <Box component="img" src={logoBlue} alt={''} />
      {isShowTitle ? (
        <>
          <Typography component="h1" variant="h5">
            {title}
          </Typography>
          <Typography>{subtitle}</Typography>
        </>
      ) : null}
    </Stack>
  );
};

export default TitleDiv;

TitleDiv.propTypes = {
  isShowTitle: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string
};
