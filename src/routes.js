import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/dashboard';
import Families from './components/families/families';
import Profile from './components/profile/profile';
import Rooms from './components/rooms/rooms';
import Settings from './components/settings/settings';
import Users from './components/users/users';
import WatchStream from './components/watchstream/watchstream';
import AuthContext from './context/authcontext';

const AppRoutes = () => {
  const authCtx = useContext(AuthContext);

  return (
    <Routes>
      {authCtx.user && authCtx.user.role === 'Admin' && <Route path="/users" element={<Users />} />}
      {authCtx.user && authCtx.user.role !== 'Family' && (
        <>
          {' '}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/families" element={<Families />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/settings" element={<Settings />} />{' '}
        </>
      )}
      <Route path="/watch-stream" element={<WatchStream />} />
      <Route path="/profile" element={<Profile />} />

      {/* Default Route */}
      <Route
        path="*"
        element={
          authCtx.user && authCtx.user.role === 'Family' ? (
            <Navigate to={'watch-stream'} />
          ) : (
            <Navigate to={'dashboard'} />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
