import axios from 'axios';

const startEncodingStream = async (id) => {
  try {
    const createdStream = await axios.post(process.env.RTSP_STREAM_BASE_URL + '/start', {
      uri: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4',
      id: id
    });
    return createdStream;
  } catch (error) {
    return error;
  }
};

const deleteEncodingStream = async (streamId, wait) => {
  try {
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

const listAvailableStreams = async (streamId, wait) => {
  try {
    const listOfStreams = await axios.get(process.env.RTSP_STREAM_BASE_URL + '/list', {
      id: streamId,
      remove: true, // optional - indicates if stream should be removed as well from list or not
      wait: wait // optional - indicates if the call should wait for the stream to stop
    });
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
