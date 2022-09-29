import React, { useState } from 'react';
import PropTypes from 'prop-types';

const defaultState = {
  auth: {
    token: localStorage.getItem('token'),
    user: {}
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

  // Method to handle token changes
  const handleToken = (token) => setToken(token);

  // Method to handle user changes
  const handleUser = (user) => setUser(user);

  const context = {
    token,
    user,
    setToken: handleToken,
    setUser: handleUser
  };

  return <AuthContext.Provider value={context}>{props.children}</AuthContext.Provider>;
};
AuthContextProvider.propTypes = {
  children: PropTypes.any
};

export default AuthContext;
