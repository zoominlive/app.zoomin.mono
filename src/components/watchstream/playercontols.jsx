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
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
// import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PictureInPictureAltRoundedIcon from '@mui/icons-material/PictureInPictureAltRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Recording from '../../assets/recording.svg';
import StopIcon from '@mui/icons-material/Stop';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';

const PlayerControls = (props) => {
  const authCtx = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tags, setTags] = useState([]);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (isRecording && props.recording) {
      timer = setInterval(() => {
        setElapsedTime((prev) => {
          // Check if elapsed time has reached 15 minutes (900 seconds)
          if (prev + 1 >= 900) {
            // Automatically stop recording
            setIsRecording(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
      setElapsedTime(0); // Reset timer when recording stops
    }

    return () => clearInterval(timer);
  }, [isRecording, props.recording]);

  useEffect(() => {
    API.get('cams/list-record-tags').then((response) => {
      if (response.status === 200) {
        console.log('recording started');
        setTags(response.data.Data.recordTags);
      } else {
        errorMessageHandler(
          enqueueSnackbar,
          response?.response?.data.Message || 'Something Went Wrong.',
          response?.response?.status,
          authCtx.setAuthError
        );
      }
    });
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
  };

  // Formatting Time (MM:SS)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  const location = useLocation();

  const isS3Url = (url) => {
    // Define the pattern for an S3 URL
    const s3Pattern =
      /^https:\/\/[a-zA-Z0-9-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.mp4/;

    // Test the URL against the pattern
    return s3Pattern.test(url);
  };

  return (
    <Box className="controls-wrapper">
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
              sx={{ backgroundColor: '#fff', display: isRecording && 'none' }}
              onClick={() => props.setPlaying((playing) => !playing)}>
              {props.playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
            </IconButton>
          </Grid>
          <Grid display={'flex'} alignItems={'center'} gap={1}>
            {/* Stop/Record Button */}
            <IconButton
              onClick={() => {
                setIsRecording(!isRecording);
                setSelectedTag(null);
                props.handleRecording(selectedTag);
              }}
              sx={{
                color: isRecording ? 'red' : 'white',
                padding: 0
              }}>
              {(isRecording && !props.recording) || (!isRecording && props.recording) ? (
                <CircularProgress size={40} sx={{ color: '#5A53DD' }} />
              ) : isRecording && props.recording ? (
                <StopIcon
                  sx={{ backgroundColor: '#fff', borderRadius: 50, height: '40px', width: '40px' }}
                />
              ) : !props.recording && !isRecording && props.playing ? (
                <img src={Recording} alt="recording" />
              ) : null}
            </IconButton>

            {/* Recording Status */}
            <Stack direction={'row'} sx={{ backgroundColor: '#FFFFFF', borderRadius: '50px' }}>
              {isRecording && props.recording && (
                <Box display="flex" alignItems="center" ml={2}>
                  <Box
                    sx={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      marginRight: '8px'
                    }}></Box>
                  <Typography color="black" variant="body1">
                    REC
                  </Typography>
                  <Typography color="black" variant="body1" ml={1}>
                    {formatTime(elapsedTime)}
                  </Typography>
                </Box>
              )}
              {isRecording && props.recording && (
                <Box>
                  <Divider
                    variant="middle"
                    orientation="vertical"
                    sx={{ height: '70%', padding: '0 10px' }}
                  />
                </Box>
              )}
              {/* Tagging Icon */}
              <Box>
                {isRecording && props.recording && (
                  <IconButton sx={{ color: 'black', marginLeft: '10px' }} onClick={handleTagClick}>
                    <LocalOfferIcon
                      sx={{ backgroundColor: 'unset !important', borderRadius: '0 !important' }}
                    />
                    {props.fullscreen && (
                      <Typography
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
                {isRecording && selectedTag && (
                  <Chip
                    label={selectedTag?.tag_name}
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
                sx={{ zIndex: 999 }}
                open={showTagOptions}
                onClose={handleTagClose}>
                {tags.map((tag) => (
                  <MenuItem key={tag.tag_id} onClick={() => handleTagSelect(tag)}>
                    {tag.tag_name}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
          </Grid>
        </Grid>
        <Grid display={'flex'} gap={1} alignItems={'center'}>
          <Grid margin={'auto'} align={'end'}>
            <IconButton
              sx={{ backgroundColor: '#fff' }}
              onClick={() => props.setIsMuted((isMuted) => !isMuted)}>
              {props.isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          </Grid>
          <Grid>
            <IconButton
              sx={{ backgroundColor: '#fff' }}
              onClick={() => props.setInPIPMode((inPIP) => !inPIP)}>
              <PictureInPictureAltRoundedIcon />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton sx={{ backgroundColor: '#fff' }} onClick={props.handleFullscreenToggle}>
              {props.fullscreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
            </IconButton>
          </Grid>
        </Grid>
        {props.streamRunning === false && location.pathname === '/recordings' && (
          <Grid item md={12} sm={12}>
            <Slider min={0} max={100} onChange={props.onSeek} value={props.played * 100} />
          </Grid>
        )}
        {isS3Url(props?.streamUrl) &&
          location?.state?.streamUrl &&
          location.pathname === '/watch-stream' && (
            <Grid item md={12} sm={12}>
              <Slider min={0} max={100} onChange={props.onSeek} value={props.played * 100} />
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
  inPIPMode: PropTypes.bool,
  fullscreen: PropTypes.bool,
  setPlaying: PropTypes.func,
  handleRecording: PropTypes.func,
  setRecording: PropTypes.func,
  setInPIPMode: PropTypes.func,
  handleFullscreenToggle: PropTypes.func,
  noOfCameras: PropTypes.number,
  isMuted: PropTypes.bool,
  setIsMuted: PropTypes.func,
  onSeek: PropTypes.func,
  played: PropTypes.number,
  streamRunning: PropTypes.bool,
  streamUrl: PropTypes.string
};
