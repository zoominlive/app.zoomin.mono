import { ContextHolder } from '@frontegg/react';
import axios from 'axios';

let baseURL = process.env.REACT_APP_BE_ENDPOINT;

export const currentURL = baseURL;

// Axios Instance
const API = axios.create({
  baseURL,
  responseType: 'json',
  timeout: 1000 * 30
});

export default API;
// Axios Request interceptors
API.interceptors.request.use((req) => {
  const userToken = localStorage.getItem('accessToken');
  if (userToken)
    req.headers = {
      Authorization: 'Bearer ' + userToken.replace(/^"|"$/g, '')
    };

  return req;
});

// Axios Response interceptors
API.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    if (err.response.status === 401) {
      // test
    }
    if (err.response.status === 403) {
      const baseUrl = ContextHolder.getContext().baseUrl;
      window.location.href = `${baseUrl}/oauth/logout?post_logout_redirect_uri=${process.env.REACT_APP_LOGOUT_REDIRECT_URL_STAGE}`;
    }
    return err;
  }
);
