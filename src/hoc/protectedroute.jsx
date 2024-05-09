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
  }
  if (user && user.roles[0].name == 'Super Admin') {
    console.log('user in protectedRoute-->', user);
    localStorage.setItem('accessToken', user?.accessToken);
    localStorage.setItem('cust_id', '0d388af2-d396-4d9b-b28a-417a5953ed42');
    localStorage.setItem('cust_name', 'Third Street Childcare');
  } else {
    localStorage.setItem('accessToken', user?.accessToken);
  }

  return isAuthenticated && <Outlet />;
};

export default ProtectedRoute;
