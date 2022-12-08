import React, { useEffect } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';

import AuthContext from '../../context/authcontext';
import { Box, Card } from '@mui/material';

const Recordings = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    layoutCtx.setActive(7);
    layoutCtx.setBreadcrumb(['Recordings']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  return (
    <Box style={{ height: '80vh' }}>
      <Card style={{ height: '100%' }}>
        <iframe
          src="https://www.zoominlive.com/recording-request"
          height="100%"
          style={{ border: 'none' }}
          width="100%"></iframe>
      </Card>
    </Box>
  );
};

export default Recordings;
