/* eslint-disable no-unused-vars */
import { Box, Typography } from '@mui/material';
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
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
// import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const CustomPlayer = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [inPIPMode, setInPIPMode] = useState(false);
  const [fullscreen, setFullScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const [showErrorMessage, setShowErrorMessage] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [url, setUrl] = useState('');
  const [playerPlaying, setPlayerPlaying] = useState(true);
  const [playerRecording, setPlayerRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const timer = useRef({
    timerId: 0
  });
  const [videoState, setVideoState] = useState({
    played: 0,
    seeking: false
  });
  const { played, seeking } = videoState;
  // const [streamStatus, setStreamStatus] = useState(null);

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

  const handleRecording = (tag) => {
    if (!playerRecording) {
      API.post('cams/start-recording', {
        cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
        user_id: authCtx?.user?.user_id,
        location: props?.camDetails?.location,
        cam_id: props?.camDetails?.cam_id,
        alias: props?.camDetails?.cam_alias
      }).then((response) => {
        if (response.status === 201) {
          console.log('recording started');
          setPlayerRecording(!playerRecording);
          enqueueSnackbar(response.data.Message, {
            variant: 'success'
          });
        } else {
          console.log('response', response);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    } else {
      console.log('tag==>', tag?.tag_id);
      API.post('cams/stop-recording', {
        cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
        user_id: authCtx?.user?.user_id,
        location: props?.camDetails?.location,
        cam_id: props?.camDetails?.cam_id,
        alias: props?.camDetails?.cam_alias,
        tag_id: tag?.tag_id
      }).then((response) => {
        if (response.status === 201) {
          setPlayerRecording(!playerRecording);
          enqueueSnackbar(response.data.Data, {
            variant: 'success'
          });
        } else {
          console.log('stopresponse=>', response);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    }
  };

  const staticTimeOut = 20 * 1000 * 60;
  const defaultTimeOut = props?.timeOut * 1000 * 60;
  const startTimer = () => {
    if (timer.current.timerId == 0) {
      const timer1 = setTimeout(
        () => {
          setPlayerPlaying(false);
          props.setPlaying(false);
          props.setIsDeleteDialogOpen(true);
        },
        props?.timeOut ? defaultTimeOut : staticTimeOut
      );
      timer.current.timerId = timer1;
    }
  };

  // useEffect(() => {
  //   const checkStreamStatus = async () => {
  //     try {
  //       console.log('props.streamUri', props.streamUri);
  //       const response = await fetch(props.streamUri);
  //       console.log('res==>', response);
  //       if (response.status === 200) {
  //         setStreamStatus('available');
  //       } else if (response.status === 404) {
  //         setStreamStatus('notFound');
  //       } else {
  //         setStreamStatus('error');
  //       }
  //     } catch (error) {
  //       console.error('Error checking stream status:', error);
  //       setStreamStatus('error');
  //     }
  //   };

  //   if (props.streamUri) {
  //     checkStreamStatus();
  //   } else {
  //     setStreamStatus(null); // Reset stream status if no URI provided
  //   }
  // }, [props.streamUri]);

  const handleFullscreenToggle = () => {
    screenfull.toggle(playerContainerRef.current);
    setFullScreen((fullscreen) => !fullscreen);
  };

  const progressHandler = (state) => {
    if (!seeking) {
      setVideoState({ ...videoState, ...state });
    }
  };

  const seekHandler = (e, value) => {
    setVideoState({ ...videoState, played: parseFloat(value) / 100 });
    playerRef.current.seekTo(parseFloat(value / 100));
  };

  return (
    <>
      {!_.isEmpty(url) && (
        <>
          <Box
            className={
              location.pathname === '/recordings'
                ? 'video-player-wrapper-recordings-page'
                : location.pathname === '/watch-stream' || location.pathname === '/cameras'
                ? 'video-player-wrapper-watch-stream-page'
                : 'video-player-wrapper'
            }
            sx={{ position: 'relative' }}
            ref={playerContainerRef}>
            <Loader loading={!ready} />
            <ReactPlayer
              progressInterval={0}
              url={
                props?.streamUri?.includes('https://live.zoominlive.com') ||
                props?.streamUri?.includes('zoomin-recordings-rtmp')
                  ? props?.streamUri
                  : `${props?.streamUri}`
              }
              // url={props?.streamUri}
              className={
                location.pathname === '/watch-stream' || location.pathname === '/cameras'
                  ? 'react-player'
                  : 'react-player custom-wrapper'
              }
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
              onProgress={progressHandler}
            />
            {location.pathname === '/watch-stream' && (
              <Box className={'overlay'}>
                <Typography
                  fontSize={'12px'}
                  color={
                    'white'
                  }>{`${props?.camDetails?.zone_name} - ${props?.camDetails?.cam_name}`}</Typography>
              </Box>
            )}
            <PlayerControls
              playing={playerPlaying}
              setPlaying={setPlayerPlaying}
              handleRecording={handleRecording}
              recording={playerRecording}
              setRecording={setPlayerRecording}
              inPIPMode={inPIPMode}
              setInPIPMode={setInPIPMode}
              fullscreen={fullscreen}
              handleFullscreenToggle={handleFullscreenToggle}
              noOfCameras={props.noOfCameras}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              played={played}
              onSeek={seekHandler}
              streamRunning={props.streamRunning}
              streamUrl={props?.streamUri}
            />
          </Box>
        </>
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
  cam_id: PropTypes.number,
  streamRunning: PropTypes.bool,
  cameras: PropTypes.array,
  edit_cam: PropTypes.bool,
  canvas_status: PropTypes.bool,
  drawbox_co: PropTypes.array,
  setCoords: PropTypes.object,
  setCanvasWidthHeight: PropTypes.object
};
