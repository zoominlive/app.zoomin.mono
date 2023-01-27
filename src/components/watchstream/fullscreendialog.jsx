import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Box, Card } from '@mui/material';
import CustomPlayer from './customplayer';
const FullScreenDialog = (props) => {
  console.log('-----', props.isFullScreenDialogOpen);
  return (
    <Card
      style={{
        backgroundColor: props.isFullScreenDialogOpen ? 'black' : '#cfc9c9',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0'
      }}>
      {props.selectedCameras.length === 1 && props.playing && props.submitted && (
        <Grid
          container
          alignContent={'center'}
          spacing={props.isFullScreenDialogOpen ? 0 : 1}
          sx={{ border: props.isFullScreenDialogOpen ? '' : '16px solid white', height: '100vh' }}>
          <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box mt={2} height={'75%'} width="75%">
              <CustomPlayer
                streamUri={props.selectedCameras[0]?.stream_uri}
                camDetails={props.camLabel[0]}
                timeOut={props.timeOut}
                setTimeOut={props.setTimeOut}
                setPlaying={props.setPlaying}
                setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
              />
            </Box>
          </Grid>
        </Grid>
      )}
      {props.selectedCameras.length === 2 && props.playing && props.submitted && (
        <Grid
          container
          alignContent={'center'}
          spacing={props.isFullScreenDialogOpen ? 0 : 2}
          sx={{ border: props.isFullScreenDialogOpen ? '' : '16px solid white', height: '100vh' }}>
          {props.selectedCameras?.map((value, index) => (
            <Grid key={index} item md={6} sm={12}>
              <CustomPlayer
                noOfCameras={2}
                camDetails={props.camLabel[index]}
                streamUri={value?.stream_uri}
                timeOut={props.timeOut}
                setTimeOut={props.setTimeOut}
                setPlaying={props.setPlaying}
                setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
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
            spacing={props.isFullScreenDialogOpen ? 0 : 2}
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
                  setTimeOut={props.setTimeOut}
                  setPlaying={props.setPlaying}
                  setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
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
            spacing={props.isFullScreenDialogOpen ? 0 : 2}
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
                  setTimeOut={props.setTimeOut}
                  setPlaying={props.setPlaying}
                  setIsDeleteDialogOpen={props.setIsDeleteDialogOpen}
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
  timeOut: PropTypes.number,
  setTimeOut: PropTypes.func,
  setPlaying: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
