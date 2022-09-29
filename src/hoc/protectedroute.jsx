import React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/authcontext';

const ProtectedRoute = () => {
  const { token, setToken } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token, setToken]);

  return token ? <Outlet /> : <Navigate to={'/login'} />;
};

export default ProtectedRoute;
