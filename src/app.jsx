import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import ForgotPassword from './components/auth/forgotpassoword';
import Login from './components/auth/login';
import Layout from './components/layout/layout';
import ProtectedRoute from './hoc/protectedroute';
import AppRoutes from './routes';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/*" element={<AppRoutes />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
