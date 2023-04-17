import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/dashboard';
import Families from './components/families/families';
import Profile from './components/profile/profile';
import Rooms from './components/rooms/rooms';
import Cameras from './components/cameras/cameras';
import Recordings from './components/recordings/recordings';
import Logs from './components/logs/logs';
import Settings from './components/settings/settings';
import Users from './components/users/users';
import WatchStream from './components/watchstream/watchstream';
import AuthContext from './context/authcontext';
// import Alerts from './components/alerts/alerts';

const AppRoutes = () => {
  const authCtx = useContext(AuthContext);

  return (
    <Routes>
      {authCtx.user && authCtx.user.role === 'Admin' && (
        <>
          <Route path="/logs" element={<Logs />} />
          <Route path="/users" element={<Users />} />
        </>
      )}
      {authCtx.user && authCtx.user.role !== 'Family' && authCtx.user.role !== 'Teacher' && (
        <>
          {' '}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/families" element={<Families />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/recordings" element={<Recordings />} />
        </>
      )}
      <Route path="/recordings" element={<Recordings />} />
      {/* <Route path="/alerts" element={<Alerts />} /> */}
      <Route path="/watch-stream" element={<WatchStream />} />
      <Route path="/profile" element={<Profile />} />

      {/* Default Route */}
      <Route
        path="*"
        element={
          authCtx.user && (authCtx.user.role === 'Family' || authCtx.user.role === 'Teacher') ? (
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
