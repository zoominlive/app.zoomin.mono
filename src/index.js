import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import './styles/main.scss';
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { LayoutContextProvider } from './context/layoutcontext';
import { AuthContextProvider } from './context/authcontext';
import { SnackbarProvider } from 'notistack';
import SnackbarCloseButton from './components/common/snackbarclosrbutton';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthContextProvider>
    <LayoutContextProvider>
      <BrowserRouter>
        <React.StrictMode>
          <SnackbarProvider
            autoHideDuration={3000}
            maxSnack={5}
            action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}>
            <App />
          </SnackbarProvider>
        </React.StrictMode>
      </BrowserRouter>
    </LayoutContextProvider>
  </AuthContextProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
