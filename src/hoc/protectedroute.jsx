import React from 'react';
// import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
// import AuthContext from '../context/authcontext';
import { useAuth, useLoginWithRedirect } from '@frontegg/react';

const ProtectedRoute = () => {
  // const { token } = useContext(AuthContext);
  const { user, isAuthenticated } = useAuth();
  console.log('isAuthenticated->', isAuthenticated);
  // eslint-disable-next-line no-unused-vars
  const loginWithRedirect = useLoginWithRedirect();
  console.log('protected route');
  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }
  if (user) {
    console.log('user in protectedRoute-->', user);
    localStorage.setItem('accessToken', user?.accessToken);
    // localStorage.setItem('cust_id', '0904a188-a225-4b4b-b76a-823bda38c4e7');
    // localStorage.setItem('cust_name', 'Fun Land Childcare');
  }

  return <Outlet />;
};

export default ProtectedRoute;
