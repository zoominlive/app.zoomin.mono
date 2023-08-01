import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import Map from './map';

const MapDialog = (props) => {
  return (
    <Dialog open={props.open} onClose={props.close} maxWidth={'md'} fullWidth={true}>
      <DialogTitle id="map-dialog-title" sx={{ paddingTop: 3.5 }}>
        {'Location of Recent Viewers'}
      </DialogTitle>
      <DialogContent>
        <Map data={props.mapsData} height={391} />
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;
MapDialog.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
  mapsData: PropTypes.array
};
