import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Box, Card } from '@mui/material';
import CustomPlayer from './customplayer';
const FullScreenDialog = (props) => {
  return (
    <Card
      className="player-card"
      style={{
        //backgroundColor: props.isFullScreenDialogOpen ? 'black' : '#cfc9c9',
        backgroundColor: props.isFullScreenDialogOpen ? 'black' : '',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0'
      }}>
      {props.selectedCameras.length === 1 && props.playing && props.submitted && (
        <Grid
          container
          alignContent={'center'}
          spacing={props.isFullScreenDialogOpen ? 0 : 1}
          sx={{ border: props.isFullScreenDialogOpen ? '' : '16px solid white' }}
          className="player-grid-container">
          <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box mt={2} height={'75%'} width="75%">
              <CustomPlayer
                streamUri={props.selectedCameras[0]?.stream_uri}
                camDetails={props.camLabel[0]}
                activeRecordingCameras={props?.cameraIdsWithRecording}
                startTime={
                  props.activeRecordings.find(
                    (item) => item.cam_id === props.selectedCameras[0]?.cam_id
                  )?.start_time || 'Not Found'
                }
                tagName={
                  props.activeRecordings.find(
                    (item) => item.cam_id === props.selectedCameras[0]?.cam_id
                  )?.record_tag?.tag_name || 'Not Found'
                }
                recordingCameraId={
                  props.activeRecordings.find(
                    (item) => item.cam_id === props.selectedCameras[0]?.cam_id
                  )?.cam_id || 'Not Found'
                }
                timeOut={props.timeOut}
                isRecording={props?.cameraIdsWithRecording.includes(
                  props.selectedCameras[0]?.cam_id
                )}
                setActiveCameras={props.setActiveCameras}
                setTimeOut={props.setTimeOut}
                setPlaying={props.setPlaying}
                setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
                cam_id={props.selectedCameras[0]?.cam_id}
              />
            </Box>
          </Grid>
        </Grid>
      )}
      {props.selectedCameras.length === 2 && props.playing && props.submitted && (
        <Grid
          container
          alignContent={'center'}
          spacing={props.isFullScreenDialogOpen ? 0 : '5px'}
          sx={{ border: props.isFullScreenDialogOpen ? '' : '16px solid white', height: '100vh' }}>
          {props.selectedCameras?.map((value, index) => (
            <Grid key={index} item md={6} sm={12}>
              <CustomPlayer
                noOfCameras={2}
                camDetails={props.camLabel[index]}
                streamUri={value?.stream_uri}
                timeOut={props.timeOut}
                activeRecordingCameras={props?.cameraIdsWithRecording}
                isRecording={props?.cameraIdsWithRecording.includes(value?.cam_id)}
                startTime={
                  props.activeRecordings.find((item) => item.cam_id === value?.cam_id)
                    ?.start_time || 'Not Found'
                }
                tagName={
                  props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.record_tag
                    ?.tag_name || 'Not Found'
                }
                recordingCameraId={
                  props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.cam_id ||
                  'Not Found'
                }
                setActiveCameras={props.setActiveCameras}
                setTimeOut={props.setTimeOut}
                setPlaying={props.setPlaying}
                setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
                cam_id={value?.cam_id}
              />
            </Grid>
          ))}
        </Grid>
      )}
      {props.selectedCameras.length > 2 &&
        props.selectedCameras.length <= 4 &&
        props.playing &&
        props.submitted && (
          <Grid
            container
            alignContent={'center'}
            spacing={props.isFullScreenDialogOpen ? 0 : '4px'}
            sx={{
              border: props.isFullScreenDialogOpen ? '' : '16px solid white',
              height: '100vh'
            }}>
            {props.selectedCameras?.map((value, index) => (
              <Grid key={index} item md={6} sm={12}>
                <CustomPlayer
                  noOfCameras={2}
                  camDetails={props.camLabel[index]}
                  streamUri={value?.stream_uri}
                  timeOut={props.timeOut}
                  activeRecordingCameras={props?.cameraIdsWithRecording}
                  isRecording={props?.cameraIdsWithRecording.includes(value?.cam_id)}
                  startTime={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)
                      ?.start_time || 'Not Found'
                  }
                  tagName={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.record_tag
                      ?.tag_name || 'Not Found'
                  }
                  recordingCameraId={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.cam_id ||
                    'Not Found'
                  }
                  setActiveCameras={props.setActiveCameras}
                  setTimeOut={props.setTimeOut}
                  setPlaying={props.setPlaying}
                  setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
                  cam_id={value?.cam_id}
                />
              </Grid>
            ))}
          </Grid>
        )}
      {props.selectedCameras.length > 4 &&
        props.selectedCameras.length <= 16 &&
        props.playing &&
        props.submitted && (
          <Grid
            container
            alignContent={'center'}
            spacing={props.isFullScreenDialogOpen ? 0 : '3px'}
            sx={{
              border: props.isFullScreenDialogOpen ? '16px solid black' : '16px solid white',
              height: '100vh'
            }}>
            {props.selectedCameras?.map((value, index) => (
              <Grid key={index} item md={3} sm={6}>
                <CustomPlayer
                  noOfCameras={2}
                  camDetails={props.camLabel[index]}
                  streamUri={value?.stream_uri}
                  timeOut={props.timeOut}
                  activeRecordingCameras={props?.cameraIdsWithRecording}
                  isRecording={props?.cameraIdsWithRecording.includes(value?.cam_id)}
                  startTime={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)
                      ?.start_time || 'Not Found'
                  }
                  tagName={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.record_tag
                      ?.tag_name || 'Not Found'
                  }
                  recordingCameraId={
                    props.activeRecordings.find((item) => item.cam_id === value?.cam_id)?.cam_id ||
                    'Not Found'
                  }
                  setActiveCameras={props.setActiveCameras}
                  setTimeOut={props.setTimeOut}
                  setPlaying={props.setPlaying}
                  setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
                  cam_id={value?.cam_id}
                />
              </Grid>
            ))}
          </Grid>
        )}
    </Card>
  );
};

export default FullScreenDialog;

FullScreenDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  handleDialogClose: PropTypes.func,
  selectedCameras: PropTypes.array,
  playing: PropTypes.bool,
  isFullScreenDialogOpen: PropTypes.bool,
  submitted: PropTypes.bool,
  camLabel: PropTypes.array,
  cameraIdsWithRecording: PropTypes.array,
  activeRecordings: PropTypes.array,
  setActiveCameras: PropTypes.func,
  timeOut: PropTypes.number,
  setTimeOut: PropTypes.func,
  setPlaying: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
