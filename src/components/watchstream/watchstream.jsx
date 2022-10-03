import { Card, CardContent } from '@mui/material';
import React, { useEffect } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';

const WatchStream = () => {
  const layoutCtx = useContext(LayoutContext);
  useEffect(() => {
    layoutCtx.setActive(5);
    layoutCtx.setBreadcrumb(['Watch Stream']);
  }, []);

  return (
    <Card className="empty-content-placeholder">
      <CardContent></CardContent>
    </Card>
  );
};

export default WatchStream;
