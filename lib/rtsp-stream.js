const axios = require('axios');
const customerServices = require('../services/customers');
const { v4: uuidv4 } = require("uuid");

// encode given rtsp stream url
const startEncodingStream = async (url, token, loc, cust_id) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc, cust_id);
    console.log('baseUrl==>', baseUrl);
    const alias = uuidv4();
    //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const createdStream = await axios.post(baseUrl + '/start', {
      stream: {
        uri: url,
        alias: alias,
      },
      codec: 'libx264'
    },{
      headers: {
        'Authorization': `Bearer ${token}` 
      }});
    console.log('createdStream==>', createdStream);
    return createdStream;
  } catch (error) {
    return error;
  }
};

// encode given rtsp stream url
const startEncodingStreamToFixCam = async (url, token, loc, cust_id, alias, coords) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc, cust_id);
    console.log('baseUrl==>', baseUrl);
    //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const createdStream = await axios.post(baseUrl + '/start', {
      stream: {
        uri: url,
        alias: alias,
      },
      on_screen_display: coords,
      codec: 'libx264'
    },{
      headers: {
        'Authorization': `Bearer ${token}` 
      }});
    return createdStream;
  } catch (error) {
    return error;
  }
};

// delete selected stream
const stopEncodingStream = async (streamId, wait, token, custId, loc) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc, custId);
    //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const deletedStream = await axios.post(baseUrl + '/stop', {
      id: streamId,
      remove: true,
      wait: wait // optional - indicates if the call should wait for the stream to stop
    }, {
      headers: {
        'Authorization': `Bearer ${token}` 
      }});
    return deletedStream;
  } catch (error) {
    return error;
  }
};

// delete selected stream while privacy masking
const stopEncodingStreamPrivacyMasking = async (alias, wait, token, custId, loc) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc, custId);
    //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const deletedStream = await axios.post(baseUrl + '/stop', {
      alias: alias,
      remove: true,
      wait: wait // optional - indicates if the call should wait for the stream to stop
    }, {
      headers: {
        'Authorization': `Bearer ${token}` 
      }});
    return deletedStream;
  } catch (error) {
    return error;
  }
};

// delete selected stream
const deleteEncodingStream = async (streamId, wait, token, custId, loc) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc, custId);
    //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const deletedStream = await axios.post(baseUrl + '/stop', {
      id: streamId,
      remove: true, // optional - indicates if stream should be removed as well from list or not
      wait: wait // optional - indicates if the call should wait for the stream to stop
    }, {
      headers: {
        'Authorization': `Bearer ${token}` 
      }});
    return deletedStream;
  } catch (error) {
    return error;
  }
};
// get list of all the streams available
const listAvailableStreams = async (token, loc) => {
  try {
    // const baseUrl = await customerServices.getTranscoderUrl(custId);
    const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(loc);
    //axios.default.headers.common['Authorization'] = `Bearer ${token}`;
    const listOfStreams = await axios.get(baseUrl + '/list',{
      headers: {
        'Authorization': `Bearer ${token}` 
      },
      timeout: 5000
    });
    return listOfStreams;
  } catch (error) {
    if(error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('Request timed out:', error.message);
    } else{
      console.log("error in listAvailableStreams", error.message);
    }
    return error;
  }
};

module.exports = {
  startEncodingStream,
  deleteEncodingStream,
  listAvailableStreams,
  startEncodingStreamToFixCam,
  stopEncodingStream,
  stopEncodingStreamPrivacyMasking
};
