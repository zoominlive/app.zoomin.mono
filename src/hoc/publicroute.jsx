import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/authcontext';

const PublicRoute = () => {
  const { token } = useContext(AuthContext);

  return !token ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default PublicRoute;
