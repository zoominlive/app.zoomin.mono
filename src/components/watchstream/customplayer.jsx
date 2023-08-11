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
  const [isMuted, setIsMuted] = useState(true);
  const timer = useRef({
    timerId: 0
  });

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
      clearTimeout(timer.current.timerId);
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
    if (timer.current.timerId == 0) {
      const timer1 = setTimeout(() => {
        setPlayerPlaying(false);
        props.setPlaying(false);
        props.setIsDeleteDialogOpen(true);
      }, props?.timeOut * 1000 * 60);
      timer.current.timerId = timer1;
    }
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

          <label style={{ position: 'absolute', color: 'white', paddingLeft: 30 }}>
            {props?.camDetails?.location +
              '/' +
              props?.camDetails?.room_name +
              ' - ' +
              props?.camDetails?.cam_name}
          </label>
          <ReactPlayer
            url={
              props.streamUri.includes('https://live.zoominlive.com')
                ? `${props?.streamUri}?uid=${
                    authCtx?.user?.family_member_id || authCtx?.user?.user_id
                  }&sid=${
                    props?.streamUri
                      .split('/')
                      [props?.streamUri.split('/').length - 1].split('.')[0]
                  }`
                : `${authCtx.user.transcoderBaseUrl}${props?.streamUri}?uid=${
                    authCtx?.user?.family_member_id || authCtx?.user?.user_id
                  }&sid=${props?.cam_id}`
            }
            className="react-player"
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
            muted={isMuted}
          />

          <PlayerControls
            playing={playerPlaying}
            setPlaying={setPlayerPlaying}
            inPIPMode={inPIPMode}
            setInPIPMode={setInPIPMode}
            fullscreen={fullscreen}
            handleFullscreenToggle={handleFullscreenToggle}
            noOfCameras={props.noOfCameras}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
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
  setIsDeleteDialogOpen: PropTypes.func,
  camDetails: PropTypes.object,
  cam_id: PropTypes.number
};
