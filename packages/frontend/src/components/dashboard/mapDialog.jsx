import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import Map from './map';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const MapDialog = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth={'md'}
      fullWidth={true}
      className={props.open ? 'map-dialog' : ''}>
      <DialogTitle
        id="map-dialog-title"
        sx={{ paddingTop: 3.5, display: 'flex', justifyContent: 'space-between' }}>
        {'Location of Recent Viewers'}
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <Typography style={{ color: '#5A53DD', fontWeight: 500, fontSize: 15 }} variant="h6">
            <FiberManualRecordIcon fontSize={'13'} /> Recent
          </Typography>
          <IconButton aria-label="close" onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Map data={props.mapsData} height={391} isMapIcon={false} />
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;
MapDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  mapsData: PropTypes.array
};
