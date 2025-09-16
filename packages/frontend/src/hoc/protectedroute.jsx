import React from 'react';
// import { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
// import AuthContext from '../context/authcontext';
import { useAuth, useLoginWithRedirect } from '@frontegg/react';

const ProtectedRoute = () => {
  // const { token } = useContext(AuthContext);
  const { user, isAuthenticated } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const loginWithRedirect = useLoginWithRedirect();
  const location = useLocation();
  if (!isAuthenticated) {
    localStorage.setItem('postLoginRedirect', location.pathname + location.search);
    loginWithRedirect();
    return null;
  }
  if (user) {
    localStorage.setItem('accessToken', user?.accessToken);
    localStorage.setItem('tenant_id', user?.tenantId);
    // localStorage.setItem('cust_id', '0904a188-a225-4b4b-b76a-823bda38c4e7');
    // localStorage.setItem('cust_name', 'Fun Land Childcare');
  }

  return <Outlet />;
};

export default ProtectedRoute;
