import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import PlayerControls from './playercontols';
import screenfull from 'screenfull';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Loader from '../common/loader';
import { useSnackbar } from 'notistack';

const CustomPlayer = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [playing, setPlaying] = useState(false);
  const [inPIPMode, setInPIPMode] = useState(false);
  const [fullscreen, setFullScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const [showErrorMessage, setShowErrorMessage] = useState(true);

  useEffect(() => {
    function exitHandler() {
      if (
        !document.webkitIsFullScreen &&
        !document.mozFullScreen &&
        !document.msFullscreenElement
      ) {
        setFullScreen(false);
      }
    }
    document.addEventListener('webkitfullscreenchange', exitHandler, false);
    document.addEventListener('mozfullscreenchange', exitHandler, false);
    document.addEventListener('fullscreenchange', exitHandler, false);
    document.addEventListener('MSFullscreenChange', exitHandler, false);
    return () => {
      document.removeEventListener('webkitfullscreenchange', exitHandler, false);
      document.removeEventListener('mozfullscreenchange', exitHandler, false);
      document.removeEventListener('fullscreenchange', exitHandler, false);
      document.removeEventListener('MSFullscreenChange', exitHandler, false);
    };
  }, []);

  const handleFullscreenToggle = () => {
    screenfull.toggle(playerContainerRef.current);
    setFullScreen((fullscreen) => !fullscreen);
  };

  return (
    <Box className="video-player-wrapper" ref={playerContainerRef}>
      <Loader loading={!ready} />
      <ReactPlayer
        url={`http://35.91.216.67${props?.streamUri}`}
        height={'100%'}
        width={'100%'}
        controls={false}
        ref={playerRef}
        onReady={() => setReady(true)}
        onPlay={() => {
          setPlaying(true);
          setShowErrorMessage(true);
        }}
        onPause={() => {
          setPlaying(false);
        }}
        onError={() => {
          if (showErrorMessage) {
            enqueueSnackbar('Something went wrong while playing the video', { variant: 'error' });
            setReady(true);
            setShowErrorMessage(false);
          }
          // playerRef.current.getInternalPlayer('hls').destroy();
        }}
        playing={playing}
        pip={inPIPMode}
        config={{
          file: {
            hlsOptions: {
              forceHLS: true,
              debug: false,
              xhrSetup: function (xhr) {
                xhr.setRequestHeader(
                  'Authorization',
                  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozMCwiaWF0IjoxNjY2OTI4MTU1LCJleHAiOjE2NjcwMTQ1NTV9.BE_5AgG4mtqSQhIOTTjfiU99SzNQQeWknoE-hEFy0VE'
                );
              }
            }
          }
        }}
      />
      <PlayerControls
        playing={playing}
        setPlaying={setPlaying}
        inPIPMode={inPIPMode}
        setInPIPMode={setInPIPMode}
        fullscreen={fullscreen}
        handleFullscreenToggle={handleFullscreenToggle}
        noOfCameras={props.noOfCameras}
      />
    </Box>
  );
};

export default CustomPlayer;

CustomPlayer.propTypes = {
  noOfCameras: PropTypes.number,
  streamUri: PropTypes.string
};
