const axios = require('axios');
const customerServices = require('../services/customers');

// encode given rtsp stream url
const startEncodingStream = async (url, token, custId) => {
  try {
    const baseUrl = await customerServices.getTranscoderUrl(custId);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const createdStream = await axios.post(baseUrl + '/start', {
      uri: url
    });
    return createdStream;
  } catch (error) {
    return error;
  }
};
// delete selected stream
const deleteEncodingStream = async (streamId, wait, token, custId) => {
  try {
    const baseUrl = await customerServices.getTranscoderUrl(custId);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const deletedStream = await axios.post(baseUrl + '/stop', {
      id: streamId,
      remove: true, // optional - indicates if stream should be removed as well from list or not
      wait: wait // optional - indicates if the call should wait for the stream to stop
    });
    return deletedStream;
  } catch (error) {
    return error;
  }
};
// get list of all the streams available
const listAvailableStreams = async (token, custId) => {
  try {
    const baseUrl = await customerServices.getTranscoderUrl(custId);
    axios.default.headers.common['Authorization'] = `Bearer ${token}`;
    const listOfStreams = await axios.get(baseUrl + '/list');
    return listOfStreams;
  } catch (error) {
    return error;
  }
};

module.exports = {
  startEncodingStream,
  deleteEncodingStream,
  listAvailableStreams
};
