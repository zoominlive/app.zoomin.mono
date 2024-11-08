import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';
import './styles/main.scss';
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { LayoutContextProvider } from './context/layoutcontext';
import { AuthContextProvider } from './context/authcontext';
import { SnackbarProvider } from 'notistack';
import SnackbarCloseButton from './components/common/snackbarclosrbutton';
import * as serviceWorker from './serviceWorker';
import { LicenseInfo } from '@mui/x-license-pro';
import { FronteggProvider } from '@frontegg/react';

const contextOptions = {
  baseUrl: process.env.REACT_APP_FRONTEGG_CREDENTIALS_BASE_URL_DEVELOPMENT,
  clientId: process.env.REACT_APP_FRONTEGG_CREDENTIALS_DEVELOPMENT
};

const authOptions = {
  keepSessionAlive: true // Uncomment this in order to maintain the session alive
};
LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_LICENSE_KEY);

ReactDOM.render(
  <AuthContextProvider>
    <LayoutContextProvider>
      <BrowserRouter>
        <SnackbarProvider
          autoHideDuration={10000}
          maxSnack={5}
          action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}>
          <FronteggProvider
            contextOptions={contextOptions}
            hostedLoginBox={true}
            authOptions={authOptions}>
            {/* <React.StrictMode> */}
            <App />
          </FronteggProvider>
          {/* </React.StrictMode> */}
        </SnackbarProvider>
      </BrowserRouter>
    </LayoutContextProvider>
  </AuthContextProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
