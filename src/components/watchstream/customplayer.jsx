/* eslint-disable no-unused-vars */
import { Box, Typography } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import PlayerControls from './playercontols';
import screenfull from 'screenfull';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Loader from '../common/loader';
import { useContext } from 'react';
import AuthContext from '../../context/authcontext';
import _, { throttle } from 'lodash';
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
  const [startDialogTimer, setStartDialogTimer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef({
    timerId: 0
  });
  const [videoState, setVideoState] = useState({
    played: 0,
    seeking: false,
    duration: 0
  });
  const { played, seeking, duration } = videoState;
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
    if (startDialogTimer) {
      timer.current.timerId = 0;
      startTimer();
    }
  }, [startDialogTimer]);

  useEffect(() => {
    setUrl(props?.streamUri);
  }, [props.streamUri]);

  useEffect(() => {
    if (location.pathname == '/watch-stream' || location.pathname == '/dashboard') {
      if (props.activeRecordingCameras.includes(props.camDetails?.cam_id)) {
        setIsRecording(true);
      } else {
        setIsRecording(false);
      }
    }
  }, [props.activeRecordingCameras]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoState.seeking && playerRef.current) {
        setVideoState((prevState) => ({
          ...prevState,
          played: playerRef.current.getCurrentTime() / playerRef.current.getDuration()
        }));
      }
    }, 500); // Adjust interval timing (500ms works well)

    return () => clearInterval(interval);
  }, [videoState.seeking]);

  const handleRecording = (tag) => {
    if (!playerRecording && !props.isRecording) {
      API.post('cams/start-recording', {
        cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
        user_id: authCtx?.user?.user_id,
        location: props?.camDetails?.location || props?.camDetails?.loc_id,
        cam_id: props?.camDetails?.cam_id,
        zone_id: props?.camDetails?.zone_id,
        zone_name: props?.camDetails?.zone_name,
        alias: props?.camDetails?.cam_alias,
        record_audio: authCtx?.user?.permit_audio ? true : false
      }).then((response) => {
        if (response.status === 201) {
          setPlayerRecording(!playerRecording);
          clearTimeout(timer.current.timerId);
        } else {
          setError(!error);
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      });
    } else {
      API.post('cams/stop-recording', {
        cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
        user_id: authCtx?.user?.user_id,
        location: props?.camDetails?.location || props?.camDetails?.loc_id,
        cam_id: props?.camDetails?.cam_id,
        alias: props?.camDetails?.cam_alias,
        tag_id: tag?.tag_id
      }).then((response) => {
        if (response.status === 201) {
          if (props.isRecording) {
            setPlayerRecording(false);
          } else {
            setPlayerRecording(!playerRecording);
          }
          timer.current.timerId = 0;
          startTimer();
          let activeCameras = props.activeRecordingCameras;
          activeCameras = activeCameras.filter((cam) => {
            return cam !== props?.camDetails?.cam_id;
          });
          props.setActiveCameras(activeCameras);
        } else {
          setPlayerRecording(!playerRecording);
          setError(!error);
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

  const handleEditRecordingTag = (tag) => {
    API.put('cams/edit-recording', {
      cust_id: authCtx?.user?.cust_id || localStorage.getItem('cust_id'),
      user_id: authCtx?.user?.user_id,
      cam_id: props?.camDetails?.cam_id,
      tag_id: tag
    }).then((response) => {
      if (response.status === 201) {
        console.log('recording tag updated');
      } else {
        console.log('error updating tag');
      }
    });
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

  const progressHandler = useCallback(
    throttle((state) => {
      if (!videoState.seeking) {
        setVideoState((prevState) => ({
          ...prevState,
          played: state.played
        }));
      }
    }, 300), // Adjust interval timing
    [videoState.seeking]
  );

  const seekHandler = (e, value) => {
    const newPlayed = value / 100;
    setVideoState((prevState) => ({ ...prevState, played: newPlayed, seeking: true }));
  };

  const seekMouseUpHandler = (e, value) => {
    const newPlayed = value / 100;
    playerRef.current.seekTo(newPlayed, 'fraction');

    setVideoState((prevState) => ({
      ...prevState,
      played: newPlayed,
      seeking: false // Resume progress updates
    }));
  };

  const handleDuration = (duration) => {
    setVideoState((prev) => ({ ...prev, duration }));
  };

  return (
    <>
      {!_.isEmpty(url) && (
        <>
          <Box
            className={
              !props.dialogOpen && location.pathname === '/recordings'
                ? 'video-player-wrapper-recordings-page'
                : props.dialogOpen && location.pathname === '/recordings'
                ? 'video-player-wrapper-no-video-bg'
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
              onDuration={handleDuration}
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
              isRecording={isRecording}
              start_time={props.startTime}
              tagName={props.tagName}
              recordingCameraId={props.recordingCameraId}
              existingCameraId={props.camDetails.cam_id}
              recordedPlayback={props.recordedPlayback}
              handleFullscreenToggle={handleFullscreenToggle}
              seekMouseUpHandler={seekMouseUpHandler}
              noOfCameras={props.noOfCameras}
              isMuted={isMuted}
              error={error}
              setIsMuted={setIsMuted}
              played={played}
              duration={duration}
              startDialogTimer={setStartDialogTimer}
              handleEditRecordingTag={handleEditRecordingTag}
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
  dialogOpen: PropTypes.bool,
  isRecording: PropTypes.bool,
  startTime: PropTypes.string,
  tagName: PropTypes.string,
  recordingCameraId: PropTypes.string,
  setActiveCameras: PropTypes.func,
  recordedPlayback: PropTypes.bool,
  cameras: PropTypes.array,
  edit_cam: PropTypes.bool,
  canvas_status: PropTypes.bool,
  drawbox_co: PropTypes.array,
  activeRecordingCameras: PropTypes.array,
  setCoords: PropTypes.object,
  setCanvasWidthHeight: PropTypes.object
};
