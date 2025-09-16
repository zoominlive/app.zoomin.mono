import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Typography
} from '@mui/material';
import PlayArrowRoundedIcon from '../../assets/Play.svg';
// import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PictureInPictureAltRoundedIcon from '../../assets/PictureInPicture.svg';
import FullscreenRoundedIcon from '../../assets/fullscreen.svg';
import FullscreenExitRoundedIcon from '../../assets/fullscreen.svg';
import PauseRoundedIcon from '../../assets/stop-playing.svg';
import VolumeUpIcon from '../../assets/sound_on_icon.svg';
import VolumeOffIcon from '../../assets/mute-sound.svg';
import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Recording from '../../assets/recording.svg';
import StopIcon from '../../assets/pause-recording.svg';
import LocalOfferIcon from '../../assets/RecordingTag.svg';
import AuthContext from '../../context/authcontext';
// import { timeDifference } from '../../utils/timedifference';

const PlayerControls = (props) => {
  const authCtx = useContext(AuthContext);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(() => {
    const storedData = localStorage.getItem(`recordingStartTime_${props.existingCameraId}`);
    if (storedData) {
      const { startTime, duration } = JSON.parse(storedData);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, duration - elapsed);
    }
    return parseInt(authCtx?.user?.max_record_time || 20) * 60; // default 20 mins
  });
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [progress, setProgress] = useState(false);
  // const [tags, setTags] = useState([]);
  const tags = authCtx.tags;

  const timeInSeconds = parseInt(authCtx?.user?.max_record_time || 20) * 60; // default 20 mins
  const recordingId = props.existingCameraId;
  const isRecordingActive = props.recordingStates?.[recordingId] === true;

  const timerRef = useRef(null);

  const startTimer = (initialTime) => {
    setElapsedTime(initialTime);

    localStorage.setItem(
      `recordingStartTime_${recordingId}`,
      JSON.stringify({ startTime: Date.now(), duration: initialTime })
    );

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          props.setRecording();
          setIsRecording(false);
          props.startDialogTimer(true);
          localStorage.removeItem(`recordingStartTime_${recordingId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resumeTimer = () => {
    const storedData = localStorage.getItem(`recordingStartTime_${recordingId}`);
    if (storedData) {
      const { startTime, duration } = JSON.parse(storedData);
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = Math.max(0, duration - elapsedSeconds);

      if (remainingTime > 0) {
        startTimer(remainingTime);
      } else {
        localStorage.removeItem(`recordingStartTime_${recordingId}`);
        setElapsedTime(0);
      }
    }
  };

  useEffect(() => {
    if (!recordingId) return;

    if (isRecordingActive) {
      resumeTimer();
    } else if (isRecording && !isRecordingActive) {
      startTimer(timeInSeconds);
    } else if (!props.recording) {
      // clearInterval(timerRef.current);
      // localStorage.removeItem(`recordingStartTime_${recordingId}`);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingId, isRecording, props.recording, props.recordingStates]);

  useEffect(() => {
    if (progress) {
      setProgress(false);
    }
  }, [props.recording, props.isRecording, props.error]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTagClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowTagOptions(true);
  };

  const handleTagClose = () => {
    setAnchorEl(null);
    setShowTagOptions(false);
  };

  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setShowTagOptions(false);
    setAnchorEl(null);
    props.handleEditRecordingTag(tag.tag_id);
  };

  // Formatting Time (MM:SS)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatSliderTime = (seconds) => {
    if (!seconds) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const location = useLocation();

  const isS3Url = (url) => {
    const s3Pattern =
      /^https:\/\/[a-zA-Z0-9.-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com\/(?:.*\/)*[^/]+\.mp4(?:\?.*)?$/i;
    return s3Pattern.test(url);
  };

  return (
    <Box
      className={
        props.fullscreen && location.pathname == '/dashboard'
          ? 'controls-wrapper-fullscreen'
          : props.fullscreen && location.pathname == '/watch-stream'
          ? 'controls-wrapper-watchstream-fullscreen'
          : 'controls-wrapper'
      }>
      <Grid
        container
        // spacing={2}
        p={2}
        display={'flex'}
        alignItems={'center'}
        justifyContent={'space-between'}>
        <Grid display={'flex'} gap={1} alignItems={'center'}>
          <Grid>
            <IconButton
              sx={{
                display: (props.recording || props.isRecording) && 'none',
                padding: props.fullscreen ? '1px' : '8px'
              }}
              onClick={() => props.setPlaying((playing) => !playing)}>
              {props.playing ? (
                <img
                  src={PauseRoundedIcon}
                  alt="PauseIcon"
                  width={props.fullscreen && 50}
                  height={props.fullscreen && 50}
                />
              ) : (
                <img
                  src={PlayArrowRoundedIcon}
                  alt="PlayIcon"
                  width={props.fullscreen && 50}
                  height={props.fullscreen && 50}
                />
              )}
            </IconButton>
          </Grid>
          {authCtx?.user?.role !== 'Family' && (
            <Grid display={'flex'} alignItems={'center'} gap={1}>
              {/* updated logic */}
              <IconButton
                onClick={() => {
                  if (props.isRecording) {
                    setIsRecording(false);
                  } else {
                    setIsRecording(!isRecording);
                  }
                  setSelectedTag(null);
                  setProgress(true); // Trigger loader when toggling recording
                  props.handleRecording(selectedTag);
                }}
                sx={{
                  color: isRecording ? 'red' : 'white',
                  padding: 0,
                  position: 'relative'
                }}>
                <Box position="relative" display="inline-flex">
                  {/* Loader and Recording Icon */}
                  {!props.recording && progress && (
                    <>
                      <CircularProgress
                        size={props.fullscreen ? 60 : 50}
                        sx={{
                          position: 'absolute',
                          zIndex: 1,
                          top: -5,
                          left: -5,
                          '& .MuiCircularProgress-circle': {
                            color: '#ffffff'
                          },
                          '& svg': {
                            padding: '3px'
                          },
                          display: props.isRecording && 'none'
                        }}
                      />
                      <img
                        src={Recording}
                        alt="recording"
                        width={props.fullscreen && 50}
                        height={props.fullscreen && 50}
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          display: props.isRecording && 'none'
                        }}
                      />
                    </>
                  )}

                  {/* Recording Icon without Loader */}
                  {!props.recording &&
                    !progress &&
                    !props.recordedPlayback &&
                    !props.isRecording &&
                    authCtx.user.camera_recording && (
                      <img
                        src={Recording}
                        alt="recording"
                        width={props.fullscreen && 50}
                        height={props.fullscreen && 50}
                        style={{
                          position: 'relative',
                          zIndex: 2
                        }}
                      />
                    )}

                  {/* Loader and Stop Icon */}
                  {((props.recording && progress) ||
                    (props.isRecording && !props.recording && progress)) && (
                    <>
                      <CircularProgress
                        size={props.fullscreen ? 60 : 50}
                        sx={{
                          position: 'absolute',
                          zIndex: 1,
                          top: -5,
                          left: -5,
                          '& .MuiCircularProgress-circle': {
                            color: '#ffffff'
                          }
                        }}
                      />
                      <img
                        src={StopIcon}
                        alt="stop-recording"
                        width={props.fullscreen && 50}
                        height={props.fullscreen && 50}
                        style={{
                          position: 'relative',
                          zIndex: 2
                        }}
                      />
                    </>
                  )}

                  {/* Stop Icon without Loader */}
                  {((props.recording && !progress) || (props.isRecording && !progress)) && (
                    <img
                      src={StopIcon}
                      alt="stop-recording"
                      width={props.fullscreen && 50}
                      height={props.fullscreen && 50}
                      style={{
                        position: 'relative',
                        zIndex: 2
                      }}
                    />
                  )}
                </Box>
              </IconButton>

              {/* Recording Status */}
              <Stack direction={'row'} sx={{ backgroundColor: '#FFFFFF', borderRadius: '50px' }}>
                {(props.recording || props.isRecording) && (
                  <Box display="flex" alignItems="center" ml={1} mr={1}>
                    <Box
                      display="flex"
                      justifyContent={'center'}
                      alignItems="center"
                      sx={{
                        backgroundColor: '#EB5757',
                        borderRadius: '50px',
                        padding: '4px 8px'
                      }}>
                      <Box
                        sx={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '50%',
                          marginRight: '2px'
                          // marginLeft: '4px'
                        }}></Box>
                      <Typography
                        color="white"
                        sx={{ fontSize: '10px !important', padding: '0px !important' }}>
                        REC
                      </Typography>
                    </Box>
                    <Typography
                      color="black"
                      variant="body1"
                      sx={{ fontSize: '16px !important' }}
                      fontWeight={600}
                      ml={1}>
                      {formatTime(elapsedTime)}
                    </Typography>
                  </Box>
                )}
                {(props.recording || props.isRecording) && (
                  <Box>
                    <Divider variant="middle" orientation="vertical" sx={{ height: '20px' }} />
                  </Box>
                )}
                {/* Tagging Icon */}
                <Box>
                  {((isRecording && props.recording) || props.isRecording) && (
                    <IconButton onClick={handleTagClick}>
                      <img src={LocalOfferIcon} alt="Tag" />
                      {props.fullscreen && (
                        <Typography
                          ml={1}
                          mr={1}
                          fontWeight={500}
                          fontSize={14}
                          lineHeight={'21px'}
                          color={'#5A53DD'}>
                          Select Tag
                        </Typography>
                      )}
                    </IconButton>
                  )}

                  {/* Display Selected Tag */}
                  {(isRecording || props.isRecording) &&
                    (selectedTag || props.tagName) &&
                    props.fullscreen && (
                      <Chip
                        label={selectedTag?.tag_name || props.tagName}
                        sx={{
                          backgroundColor: '#5a53dd !important',
                          color: 'white',
                          borderRadius: '16px',
                          padding: '0 8px',
                          marginLeft: '8px',
                          fontSize: '14px'
                        }}
                      />
                    )}
                </Box>

                {/* Tag Selection Menu */}
                <Menu
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                  }}
                  container={document.fullscreenElement || document.body}
                  open={showTagOptions}
                  onClose={handleTagClose}>
                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      textUnderlineOffset: '4px', // Adjust the spacing of the underline
                      textDecorationColor: '#5A53DD', // Set underline color to purple
                      textDecorationThickness: '2px', // Set underline thickness
                      color: '#5A53DD', // Set text color to purple
                      marginBottom: '8px' // Add space below the title
                    }}>
                    Tag
                  </Typography>
                  {tags.map((tag) => (
                    <MenuItem
                      sx={{
                        color: selectedTag?.tag_name == tag.tag_name && 'white',
                        backgroundColor: selectedTag?.tag_name == tag.tag_name && '#5A53DD'
                      }}
                      key={tag.tag_id}
                      onClick={() => handleTagSelect(tag)}>
                      {tag.tag_name}
                    </MenuItem>
                  ))}
                </Menu>
              </Stack>
            </Grid>
          )}
        </Grid>
        <Grid display={'flex'} gap={1} alignItems={'center'}>
          <Grid margin={'auto'} align={'end'}>
            <IconButton
              sx={{ padding: props.fullscreen ? '1px' : '8px' }}
              onClick={() => props.setIsMuted((isMuted) => !isMuted)}>
              {props.isMuted ? (
                <img
                  src={VolumeOffIcon}
                  alt="volume-off"
                  width={props.fullscreen && 50}
                  height={props.fullscreen && 50}
                />
              ) : (
                <img
                  src={VolumeUpIcon}
                  alt="volume-up"
                  width={props.fullscreen && 50}
                  height={props.fullscreen && 50}
                />
              )}
            </IconButton>
          </Grid>
          <Grid>
            <IconButton
              sx={{ padding: props.fullscreen ? '1px' : '8px' }}
              onClick={() => props.setInPIPMode((inPIP) => !inPIP)}>
              <img
                src={PictureInPictureAltRoundedIcon}
                alt="PiP"
                width={props.fullscreen && 50}
                height={props.fullscreen && 50}
              />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton
              sx={{ padding: props.fullscreen ? '1px' : '8px' }}
              onClick={props.handleFullscreenToggle}>
              {props.fullscreen ? (
                <img
                  src={FullscreenExitRoundedIcon}
                  alt={'FullScreenExit'}
                  width={props.fullscreen && 50}
                  height={props.fullscreen && 50}
                />
              ) : (
                <img src={FullscreenRoundedIcon} alt={FullscreenRoundedIcon} />
              )}
            </IconButton>
          </Grid>
        </Grid>
        {(props.streamRunning === false || props.streamRunning === undefined) &&
          location.pathname === '/recordings' && (
            <Grid item md={12} sm={12}>
              <Stack direction={'row'} justifyContent={'space-between'}>
                <Typography variant="body2" color={'white'}>
                  {formatSliderTime(props.played * props.duration)}
                </Typography>
                <Typography variant="body2" color={'white'}>
                  {formatSliderTime(props.duration)}
                </Typography>
              </Stack>
              <Slider
                min={0}
                max={100}
                onChange={props.onSeek}
                onChangeCommitted={props.seekMouseUpHandler}
                value={props.played * 100}
              />
            </Grid>
          )}
        {isS3Url(props?.streamUrl) &&
          location?.state?.streamUrl &&
          location.pathname === '/watch-stream' && (
            <Grid item md={12} sm={12}>
              <Stack direction={'row'} justifyContent={'space-between'}>
                <Typography variant="body2" color={'white'}>
                  {formatSliderTime(props.played * props.duration)}
                </Typography>
                <Typography variant="body2" color={'white'}>
                  {formatSliderTime(props.duration)}
                </Typography>
              </Stack>
              <Slider
                min={0}
                max={100}
                onChange={props.onSeek}
                onChangeCommitted={props.seekMouseUpHandler}
                value={props.played * 100}
              />
            </Grid>
          )}
      </Grid>
    </Box>
  );
};

export default PlayerControls;

PlayerControls.propTypes = {
  playing: PropTypes.bool,
  recording: PropTypes.bool,
  isRecording: PropTypes.bool,
  error: PropTypes.bool,
  start_time: PropTypes.string,
  tagName: PropTypes.string,
  recordingCameraId: PropTypes.string,
  existingCameraId: PropTypes.string,
  seekMouseUpHandler: PropTypes.func,
  inPIPMode: PropTypes.bool,
  fullscreen: PropTypes.bool,
  setPlaying: PropTypes.func,
  handleRecording: PropTypes.func,
  setRecording: PropTypes.func,
  setInPIPMode: PropTypes.func,
  handleFullscreenToggle: PropTypes.func,
  noOfCameras: PropTypes.number,
  isMuted: PropTypes.bool,
  recordedPlayback: PropTypes.bool,
  setIsMuted: PropTypes.func,
  startDialogTimer: PropTypes.func,
  handleEditRecordingTag: PropTypes.func,
  onSeek: PropTypes.func,
  played: PropTypes.number,
  duration: PropTypes.number,
  streamRunning: PropTypes.bool,
  streamUrl: PropTypes.string,
  recordingStates: PropTypes.object
};
