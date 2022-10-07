import { SnackbarProvider } from 'notistack';
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import EmailChange from './components/auth/emailchange';
import ForgotPassword from './components/auth/forgotpassoword';
import Login from './components/auth/login';
import SetPassword from './components/auth/setpassword';
import SnackbarCloseButton from './components/common/snackbarclosrbutton';
import Layout from './components/layout/layout';
import ProtectedRoute from './hoc/protectedroute';
import PublicRoute from './hoc/publicroute';
import AppRoutes from './routes';

const App = () => {
  return (
    <SnackbarProvider
      autoHideDuration={3000}
      maxSnack={5}
      action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/email-change" element={<EmailChange />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/*" element={<AppRoutes />} />
          </Route>
        </Route>
      </Routes>
    </SnackbarProvider>
  );
};

export default App;
