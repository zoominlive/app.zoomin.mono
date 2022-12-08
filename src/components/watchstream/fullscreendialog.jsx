import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, Grid, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CustomPlayer from './customplayer';
const FullScreenDialog = (props) => {
  return (
    <div>
      <Dialog
        fullScreen
        open={props.open}
        onClose={() => {
          props.handleDialogClose();
        }}>
        <DialogContent>
          <>
            <IconButton
              aria-label="close"
              onClick={() => {
                props.handleDialogClose();
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500]
              }}>
              <CloseIcon />
            </IconButton>
            <Grid container spacing={1} sx={{ marginTop: '2px' }}>
              <Grid item md={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                {props.selectedCameras.length === 1 && props.playing && props.submitted && (
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
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ marginTop: '2px' }}>
              {props.selectedCameras.length === 2 &&
                props.playing &&
                props.submitted &&
                props.selectedCameras?.map((value, index) => (
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
            <Grid container spacing={2} sx={{ marginTop: '2px' }}>
              {props.selectedCameras.length > 2 &&
                props.selectedCameras.length <= 4 &&
                props.playing &&
                props.submitted &&
                props.selectedCameras?.map((value, index) => (
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
            <Grid container spacing={2} sx={{ marginTop: '2px' }}>
              {props.selectedCameras.length > 4 &&
                props.selectedCameras.length <= 16 &&
                props.playing &&
                props.submitted &&
                props.selectedCameras?.map((value, index) => (
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
          </>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FullScreenDialog;

FullScreenDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  handleDialogClose: PropTypes.func,
  selectedCameras: PropTypes.array,
  playing: PropTypes.bool,

  submitted: PropTypes.bool,
  camLabel: PropTypes.array,
  timeOut: PropTypes.number,
  setTimeOut: PropTypes.func,
  setPlaying: PropTypes.func,
  setIsDeleteDialogOpen: PropTypes.func
};
