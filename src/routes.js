import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/dashboard';
import Families from './components/families/families';
import Profile from './components/profile/profile';
import Rooms from './components/rooms/rooms';
import Settings from './components/settings/settings';
import Users from './components/users/users';
import WatchStream from './components/watchstream/watchstream';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/families" element={<Families />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/watch-stream" element={<WatchStream />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />

      {/* Default Route */}
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

export default AppRoutes;
