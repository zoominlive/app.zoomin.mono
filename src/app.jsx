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
// import useWebSocket from 'react-use-websocket';
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
      //console.log('=====', authCtx);
      //console.log(localStorage.getItem('user'));
      let { user_id, family_member_id } = JSON.parse(localStorage.getItem('user'));
      //console.log(user_id, family_member_id);
      let data = {};
      if (family_member_id) {
        data = { family_member_id: family_member_id };
      } else {
        data = { user_id: user_id };
      }
      //navigate('/dashboard');
      const webSocket = new WebSocket(
        //'wss://dhuvtskn6f.execute-api.us-east-1.amazonaws.com/stage'
        'ws://localhost:3001'
      );
      console.log('===== webSocket =====', webSocket);
      webSocket.onopen = function (e, req, res) {
        //alert('[open] Connection established');
        //alert('Sending to server');
        console.log(e, res, 'opopen===');
        webSocket.send(JSON.stringify(data));
        webSocket.onmessage = (event) => {
          console.log('===========in side === on message', event);
          let data = JSON.parse(event?.data);
          if (data?.Data?.display_notification) {
            enqueueSnackbar(data?.Data?.message, { variant: 'success' });
          }
        };
      };
      webSocket.onmessage = (event) => {
        console.log('===========on message', event);
        let data = JSON.parse(event?.data);
        if (data?.Data?.display_notification) {
          enqueueSnackbar(data?.Data?.message, { variant: 'success' });
        }
      };
      //enqueueSnackbar(event?.data?.message, { variant: 'success' });
    }
  }, [authCtx.token]);
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
