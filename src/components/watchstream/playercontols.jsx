import { Box, Grid, IconButton, Slider } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PictureInPictureAltRoundedIcon from '@mui/icons-material/PictureInPictureAltRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import React from 'react';
import PropTypes from 'prop-types';

const PlayerControls = (props) => {
  return (
    <Box className="controls-wrapper">
      <Grid container spacing={2} p={2}>
        <Grid item md={props.noOfCameras === 2 ? 6 : 9} sm={6}>
          <IconButton onClick={() => props.setPlaying((playing) => !playing)}>
            {props.playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </IconButton>
        </Grid>
        <Grid item md={props.noOfCameras === 2 ? 2 : 1} sm={2} margin={'auto'} align={'end'}>
          <IconButton onClick={() => props.setIsMuted((isMuted) => !isMuted)}>
            {props.isMuted ? (
              <VolumeOffIcon className="volume-icon" />
            ) : (
              <VolumeUpIcon className="volume-icon" />
            )}
          </IconButton>
        </Grid>
        <Grid item md={props.noOfCameras === 2 ? 2 : 1} sm={2}>
          <IconButton onClick={() => props.setInPIPMode((inPIP) => !inPIP)}>
            <PictureInPictureAltRoundedIcon />
          </IconButton>
        </Grid>
        <Grid item md={props.noOfCameras === 2 ? 2 : 1} sm={2}>
          <IconButton onClick={props.handleFullscreenToggle}>
            {props.fullscreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
          </IconButton>
        </Grid>
        {props.streamRunning === false && (
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
  inPIPMode: PropTypes.bool,
  fullscreen: PropTypes.bool,
  setPlaying: PropTypes.func,
  setInPIPMode: PropTypes.func,
  handleFullscreenToggle: PropTypes.func,
  noOfCameras: PropTypes.number,
  isMuted: PropTypes.bool,
  setIsMuted: PropTypes.func,
  onSeek: PropTypes.func,
  played: PropTypes.number,
  streamRunning: PropTypes.bool
};
