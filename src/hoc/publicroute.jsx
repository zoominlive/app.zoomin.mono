/* eslint-disable no-unused-vars */
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/authcontext';
import { useAuth, useLoginWithRedirect } from '@frontegg/react';

const PublicRoute = () => {
  // const { token } = useContext(AuthContext);
  const { user } = useAuth();
  const loginWithRedirect = useLoginWithRedirect();

  return !user?.accessToken ? loginWithRedirect() : <Navigate to="/dashboard" />;
};

export default PublicRoute;
