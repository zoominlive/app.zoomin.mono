import { useSnackbar } from 'notistack';
import * as React from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import EmailChange from './components/auth/emailchange';
import ForgotPassword from './components/auth/forgotpassoword';
import Login from './components/auth/login';
import SetPassword from './components/auth/setpassword';
import Layout from './components/layout/layout';
import AuthContext from './context/authcontext';
import ProtectedRoute from './hoc/protectedroute';
import PublicRoute from './hoc/publicroute';
import AppRoutes from './routes';
import { getBuildDate } from './utils/utils';
import packageJson from '../package.json';
import withClearCache from './ClearCache';

const MainApp = () => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (authCtx.authError) {
      if (authCtx.previosPagePath !== '') {
        enqueueSnackbar('Invalid Token or Token Expired, Please Login again', {
          variant: 'error'
        });
      }
      authCtx.setToken();
      navigate('login');
    }
  }, [authCtx.authError]);

  useEffect(() => {
    console.log('build date:', getBuildDate(packageJson.buildDate));
  }, []);

  return (
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
  );
};

const ClearCacheComponent = withClearCache(MainApp);

function App() {
  return <ClearCacheComponent />;
}

export default App;
