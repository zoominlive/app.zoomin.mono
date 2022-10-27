const axios = require('axios');

// encode given rtsp stream url
const startEncodingStream = async (url, token) => {
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const createdStream = await axios.post(process.env.RTSP_STREAM_BASE_URL + '/start', {
      uri: url
    });
    return createdStream;
  } catch (error) {
    return error;
  }
};
// delete selected stream
const deleteEncodingStream = async (streamId, wait, token) => {
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const deletedStream = await axios.post(process.env.RTSP_STREAM_BASE_URL + '/stop', {
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
const listAvailableStreams = async (token) => {
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const listOfStreams = await axios.get(process.env.RTSP_STREAM_BASE_URL + '/list');
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
