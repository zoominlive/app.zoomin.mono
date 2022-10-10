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
      <Route path="/dashboard" element={<Dashboard />} />
      {authCtx.user.role === 'Admin' && <Route path="/users" element={<Users />} />}
      <Route path="/families" element={<Families />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/watch-stream" element={<WatchStream />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />

      {/* Default Route */}
      <Route path="*" element={<Navigate to={'dashboard'} />} />
    </Routes>
  );
};

export default AppRoutes;
