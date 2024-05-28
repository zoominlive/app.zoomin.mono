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
import Customers from './components/customers/customers';
import WatchStream from './components/watchstream/watchstream';
import AuthContext from './context/authcontext';
import Invoices from './components/billing/invoices';
import PostLoginSteps from './components/dashboard/postloginsteps';
import { useAuth } from '@frontegg/react';
// import Alerts from './components/alerts/alerts';

const AppRoutes = () => {
  const authCtx = useContext(AuthContext);
  const { user } = useAuth();
  return (
    <Routes>
      <>
        {authCtx.user && authCtx.user.role === 'Super Admin' && (
          <>
            <Route path="/customers" element={<Customers />} />
          </>
        )}
        {authCtx.user && (authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin') && (
          <>
            <Route path="/logs" element={<Logs />} />
            <Route path="/users" element={<Users />} />
          </>
        )}
        {authCtx.user && (authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin') && (
          <Route path="/billing" element={<Invoices />} />
        )}
        {authCtx.user &&
          (authCtx.user.role === 'Super Admin' || authCtx.paymentMethod) &&
          authCtx.user.role !== 'Family' &&
          authCtx.user.role !== 'Teacher' && (
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
        {/* <Route path="/recordings" element={<Recordings />} /> */}
        {/* <Route path="/alerts" element={<Alerts />} /> */}
        <Route path="/watch-stream" element={<WatchStream />} />
        {authCtx.user && authCtx.user.role === 'Admin' && !authCtx.paymentMethod && (
          <Route path="/terms-and-conditions" element={<PostLoginSteps />} />
        )}

        {/* Default Route */}
        <Route
          path="*"
          element={
            authCtx.user && (authCtx.user.role === 'Family' || authCtx.user.role === 'Teacher') ? (
              <Navigate to={'watch-stream'} />
            ) : user?.superUser ? (
              <Navigate to={'customer-selection'} />
            ) : (
              authCtx.paymentMethod && <Navigate to={'dashboard'} />
            )
          }
        />
      </>
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default AppRoutes;
