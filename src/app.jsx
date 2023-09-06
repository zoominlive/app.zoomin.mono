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
  useEffect(() => {
    if (authCtx.token) {
      let { user_id, family_member_id } = JSON.parse(localStorage.getItem('user'));

      let data = {};
      if (family_member_id) {
        data = { family_member_id: family_member_id };
      } else {
        data = { user_id: user_id };
      }
      //navigate('/dashboard');

      let socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);

      // Connection opened
      socket.addEventListener('open', (event) => {
        console.log('Connected');
        socket.send(JSON.stringify(data), event);
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        let data = JSON.parse(event.data);
        if (data?.update_dashboard_data) {
          localStorage.setItem('updateDashboardData', true);
          authCtx.setUpdateDashboardData(true);
        } else {
          enqueueSnackbar(data?.message, { variant: 'success' });
        }
      });

      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);
        socket.addEventListener('Open', (event) => {
          console.log('Reconnected');
          socket.send(JSON.stringify(data), event);
        });
      });

      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed with code:', event.code, 'reason:', event.reason);
        socket = new WebSocket(process.env.REACT_APP_SOCKET_URL);
        socket.addEventListener('open', (event) => {
          console.log('Reconnected');
          socket.send(JSON.stringify(data), event);
        });
      });
    }
  }, [authCtx.token]);
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forget-password" element={<ForgotPassword />} />
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
