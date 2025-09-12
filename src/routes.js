import React, { useContext, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
const Dashboard = lazy(() => import('./components/dashboard/dashboard'));
const Families = lazy(() => import('./components/families/families'));
const Profile = lazy(() => import('./components/profile/profile'));
const Zones = lazy(() => import('./components/zones/zones'));
const Cameras = lazy(() => import('./components/cameras/cameras'));
const Recordings = lazy(() => import('./components/recordings/recordings'));
const Logs = lazy(() => import('./components/logs/logs'));
const Settings = lazy(() => import('./components/settings/settings'));
const Users = lazy(() => import('./components/users/users'));
const Customers = lazy(() => import('./components/customers/customers'));
const WatchStream = lazy(() => import('./components/watchstream/watchstream'));
import AuthContext from './context/authcontext';
const Invoices = lazy(() => import('./components/billing/invoices'));
const PostLoginSteps = lazy(() => import('./components/dashboard/postloginsteps'));
import { useAuth } from '@frontegg/react';
import APIKeys from './components/apikeys/apikeys';
import StreamVideo from './components/watchstream/streamvideo';
import ContainerMetrics from './components/metrics/containermetrics.jsx';
// import Alerts from './components/alerts/alerts';

const AppRoutes = () => {
  const authCtx = useContext(AuthContext);
  const { user } = useAuth();
  return (
    <Suspense fallback={null}>
      <Routes>
        <>
          {authCtx.user && authCtx.user.role === 'Super Admin' && (
            <>
              <Route path="/customers" element={<Customers />} />
              <Route path="/metrics" element={<ContainerMetrics />} />
            </>
          )}
          {authCtx.user && (authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin') && (
            <>
              <Route path="/logs" element={<Logs />} />
              <Route path="/users" element={<Users />} />
              <Route path="/api-keys" element={<APIKeys />} />
            </>
          )}
          {authCtx.user &&
            (authCtx.user.role === 'Admin' || authCtx.user.role === 'Super Admin') && (
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
                <Route path="/zones" element={<Zones />} />
                <Route path="/cameras" element={<Cameras />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/recordings" element={<Recordings />} />
              </>
            )}
          {/* <Route path="/recordings" element={<Recordings />} /> */}
          {/* <Route path="/alerts" element={<Alerts />} /> */}
          <Route path="/watch-stream" element={<WatchStream />} />
          <Route path="/shared-clips" element={<StreamVideo />} />
          {authCtx.user && authCtx.user.role === 'Admin' && !authCtx.paymentMethod && (
            <Route path="/terms-and-conditions" element={<PostLoginSteps />} />
          )}

          {/* Default Route */}
          <Route
            path="*"
            element={
              authCtx.user &&
              (authCtx.user.role === 'Family' || authCtx.user.role === 'Teacher') ? (
                <Navigate to={'watch-stream'} />
              ) : user?.superUser ? (
                <Navigate to={'customers'} />
              ) : (
                authCtx.paymentMethod && <Navigate to={'dashboard'} />
              )
            }
          />
        </>
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
