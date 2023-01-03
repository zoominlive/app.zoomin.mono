import axios from 'axios';

let baseURL = process.env.REACT_APP_BE_ENDPOINT;

export const currentURL = baseURL;

// Axios Instance
const API = axios.create({
  baseURL,
  responseType: 'json',
  timeout: 1000 * 20
});

export default API;
// Axios Request interceptors
API.interceptors.request.use((req) => {
  const userToken = localStorage.getItem('token');
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
      // localStorage.removeItem('token');
      // window.location.replace('/login');
    }
    return err;
  }
);
