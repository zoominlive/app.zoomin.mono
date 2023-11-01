import React, { useState } from 'react';
import PropTypes from 'prop-types';

const defaultState = {
  auth: {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    authError: false,
    previosPagePath: '',
    custName: localStorage.getItem('cust_name'),
    location: ['Select All'],
    updateDashboardData: false,
    login: false
  }
};

const AuthContext = React.createContext({
  auth: {
    token: null
  }
});

export const AuthContextProvider = (props) => {
  const [token, setToken] = useState(defaultState.auth.token);
  const [user, setUser] = useState(defaultState.auth.user);
  const [authError, setAuthError] = useState(defaultState.auth.authError);
  const [previosPagePath, setPreviosPagePath] = useState(defaultState.auth.previosPagePath);
  const [custName, setCustName] = useState(defaultState.auth.custName);
  const [location, setLocation] = useState(defaultState.auth.location);
  const [login, setLogin] = useState(defaultState.auth.login);
  const [updateDashboardData, setUpdateDashboardData] = useState(
    defaultState.auth.updateDashboardData
  );
  // Method to handle token changes
  const handleToken = (token) => setToken(token);

  // Method to handle user changes
  const handleUser = (user) => setUser(user);

  // Method to handle authentication status to render invalid token message
  const handleAuthError = (error) => setAuthError(error);

  // Method to handle page change and store previos page path
  const handlePageChange = (path) => setPreviosPagePath(path);

  const handleCustName = (name) => setCustName(name);
  const handleLocation = (loc) => setLocation(loc);
  const handleUpdateDashboardData = (value) => setUpdateDashboardData(value);
  const handleLogin = (value) => setLogin(value);

  const context = {
    token,
    user,
    authError,
    previosPagePath,
    custName,
    location,
    updateDashboardData,
    login,
    setToken: handleToken,
    setUser: handleUser,
    setAuthError: handleAuthError,
    setPreviosPagePath: handlePageChange,
    setCustName: handleCustName,
    setLocation: handleLocation,
    setUpdateDashboardData: handleUpdateDashboardData,
    setLogin: handleLogin
  };

  return <AuthContext.Provider value={context}>{props.children}</AuthContext.Provider>;
};
AuthContextProvider.propTypes = {
  children: PropTypes.any
};

export default AuthContext;
