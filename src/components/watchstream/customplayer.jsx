import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import PlayerControls from './playercontols';
import screenfull from 'screenfull';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Loader from '../common/loader';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import _ from 'lodash';

const CustomPlayer = (props) => {
  const authCtx = useContext(AuthContext);
  const [inPIPMode, setInPIPMode] = useState(false);
  const [fullscreen, setFullScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const [showErrorMessage, setShowErrorMessage] = useState(true);
  const [url, setUrl] = useState('');
  const [playerPlaying, setPlayerPlaying] = useState(true);

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

  useEffect(() => {
    setUrl(props?.streamUri);
  }, [props.streamUri]);

  const startTimer = () => {
    setTimeout(() => {
      setPlayerPlaying(false);
      props.setPlaying(false);
      props.setIsDeleteDialogOpen(true);
    }, props?.timeOut * 1000 * 60);
  };

  const handleFullscreenToggle = () => {
    screenfull.toggle(playerContainerRef.current);
    setFullScreen((fullscreen) => !fullscreen);
  };

  return (
    <>
      {!_.isEmpty(url) && (
        <Box className="video-player-wrapper" ref={playerContainerRef}>
          <Loader loading={!ready} />
          <ReactPlayer
            url={`${authCtx.user.transcoderBaseUrl}${url}`}
            height={'100%'}
            width={'100%'}
            controls={false}
            ref={playerRef}
            stopOnUnmount={true}
            onReady={() => {
              setPlayerPlaying(true);
              startTimer();
              setReady(true);
            }}
            onPlay={() => {
              setPlayerPlaying(true);
              startTimer();
              setShowErrorMessage(true);
            }}
            onPause={() => {
              setPlayerPlaying(false);
            }}
            onError={() => {
              if (showErrorMessage) {
                setReady(true);
                setShowErrorMessage(false);
              }
            }}
            playing={playerPlaying}
            pip={inPIPMode}
            config={{
              file: {
                hlsOptions: {
                  forceHLS: true,
                  debug: false,
                  xhrSetup: function (xhr) {
                    xhr.setRequestHeader('Authorization', `Bearer ${authCtx.token}`);
                  }
                }
              }
            }}
          />
          <PlayerControls
            playing={playerPlaying}
            setPlaying={setPlayerPlaying}
            inPIPMode={inPIPMode}
            setInPIPMode={setInPIPMode}
            fullscreen={fullscreen}
            handleFullscreenToggle={handleFullscreenToggle}
            noOfCameras={props.noOfCameras}
          />
        </Box>
      )}
    </>
  );
};

export default CustomPlayer;

CustomPlayer.propTypes = {
  noOfCameras: PropTypes.number,
  streamUri: PropTypes.string,
  setTimeOut: PropTypes.func,
  timeOut: PropTypes.number,
  setPlaying: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
