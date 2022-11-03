import React, { useState } from 'react';
import PropTypes from 'prop-types';

const defaultState = {
  auth: {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    authError: false,
    previosPagePath: ''
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

  // Method to handle token changes
  const handleToken = (token) => setToken(token);

  // Method to handle user changes
  const handleUser = (user) => setUser(user);

  // Method to handle authentication status to render invalid token message
  const handleAuthError = (error) => setAuthError(error);

  // Method to handle page change and store previos page path
  const handlePageChange = (path) => setPreviosPagePath(path);

  const context = {
    token,
    user,
    authError,
    previosPagePath,
    setToken: handleToken,
    setUser: handleUser,
    setAuthError: handleAuthError,
    setPreviosPagePath: handlePageChange
  };

  return <AuthContext.Provider value={context}>{props.children}</AuthContext.Provider>;
};
AuthContextProvider.propTypes = {
  children: PropTypes.any
};

export default AuthContext;
