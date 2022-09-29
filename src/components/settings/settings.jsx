import { Card, CardContent } from '@mui/material';
import React, { useEffect } from 'react';
import { useContext } from 'react';
import LayoutContext from '../../context/layoutcontext';

const Settings = () => {
  const layoutCtx = useContext(LayoutContext);

  useEffect(() => {
    layoutCtx.setActive();
    layoutCtx.setBreadcrumb(['Settings']);
  }, []);
  return (
    <Card className="empty-content-placeholder">
      <CardContent></CardContent>
    </Card>
  );
};

export default Settings;
