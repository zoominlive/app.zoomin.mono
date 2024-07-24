/* eslint-disable no-unused-vars */
import { Box, Button, IconButton, Input, Typography } from '@mui/material';
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
import { Stage, Layer, Rect, Text } from 'react-konva';
// import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const CustomPlayer = (props) => {
  const authCtx = useContext(AuthContext);
  const [inPIPMode, setInPIPMode] = useState(false);
  const [fullscreen, setFullScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const [showErrorMessage, setShowErrorMessage] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [url, setUrl] = useState('');
  const [playerPlaying, setPlayerPlaying] = useState(true);
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

  const handleAPICall = (e) => {
    e.preventDefault();
    const payload = { overlays };
    console.log('API Payload:', payload);
    props.setCoords(payload);
    props.setCanvasWidthHeight(canvasWidthHeight);
    enqueueSnackbar('Coordinates saved. Click Save Changes to proceed', { variant: 'success' });
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
            {props?.edit_cam && props?.canvas_status && (
              <Stage
                width={stageWidth}
                height={stageHeight}
                style={{ position: 'absolute', top: 0, left: 0 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}>
                <Layer>
                  {overlays.map((overlay, index) => (
                    <React.Fragment key={index}>
                      <Rect
                        x={overlay.x}
                        y={overlay.y}
                        width={overlay.width}
                        height={overlay.height}
                        fill="rgba(0, 0, 0, 0.5)"
                        draggable
                        onDragEnd={(e) => handleDragEnd(e, index)}
                      />
                      <Text
                        x={overlay.x}
                        y={overlay.y - 20}
                        text={`x: ${overlay.x}, y: ${overlay.y}`}
                        fontSize={12}
                        fill="white"
                      />
                    </React.Fragment>
                  ))}
                  {currentOverlay && (
                    <Rect
                      x={currentOverlay.x}
                      y={currentOverlay.y}
                      width={currentOverlay.width}
                      height={currentOverlay.height}
                      fill="rgba(0, 0, 0, 0.5)"
                    />
                  )}
                </Layer>
              </Stage>
            )}
            {location.pathname === '/watch-stream' && (
              <Box className={'overlay'}>
                <Typography
                  fontSize={'12px'}
                  color={
                    'white'
                  }>{`${props?.camDetails?.room_name} - ${props?.camDetails?.cam_name}`}</Typography>
              </Box>
            )}
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
              played={played}
              onSeek={seekHandler}
              streamRunning={props.streamRunning}
              streamUrl={props?.streamUri}
            />
          </Box>
          {props?.edit_cam && props?.canvas_status && (
            <Box
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '10px',
                backgroundColor: '#f0f0f0'
              }}>
              <Typography variant="h4">Privacy Areas</Typography>
              {overlays.map((overlay, index) => (
                <Box key={index} style={{ marginBottom: '10px', display: 'flex' }}>
                  <Input
                    type="text"
                    value={`x: ${overlay.x}, y: ${overlay.y}, width: ${overlay.width}, height: ${overlay.height}`}
                    readOnly
                    style={{ width: '100%' }}
                  />
                  <IconButton onClick={() => handleDelete(index)} style={{ marginTop: '5px' }}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>
              ))}
              <Button variant="contained" onClick={handleAPICall} style={{ marginTop: '10px' }}>
                Set Coordinates
              </Button>
            </Box>
          )}
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
