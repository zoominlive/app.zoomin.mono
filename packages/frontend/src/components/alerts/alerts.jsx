import React, { useEffect } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';

import AuthContext from '../../context/authcontext';
import { Box, Card } from '@mui/material';

const Alerts = () => {
  const layoutCtx = useContext(LayoutContext);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    layoutCtx.setActive(8);
    layoutCtx.setBreadcrumb(['Alerts']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  return (
    <Box style={{ height: '80vh' }}>
      <Card style={{ height: '100%', border: 'none' }}>
        <iframe
          src="https://www.zoominlive.com/ml"
          height="100%"
          style={{ border: 'none' }}
          width="100%"></iframe>
      </Card>
    </Box>
  );
};

export default Alerts;
