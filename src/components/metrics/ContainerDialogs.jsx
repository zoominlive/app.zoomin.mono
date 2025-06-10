import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  TextField,
  Collapse,
  Alert,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import PropTypes from 'prop-types';

const ContainerDialogs = ({
  container,
  dialogs,
  setDialogs,
  onConfirm,
  theme,
  setContainerState,
  fullscreenContainerRef
}) => {
  const {
    updateConfigJson,
    dockerArgs,
    actionError,
    actionSuccess,
    setUpdateConfigJson,
    setDockerArgs
  } = container;

  const { handleConfirmRestart, handleConfirmUpdate, handleConfirmModify, handleDebugMode } =
    onConfirm;

  return (
    <>
      {/* Modify Confirmation Dialog */}
      <Dialog
        open={dialogs.modifyConfirmDialogOpen}
        onClose={() => setDialogs((prev) => ({ ...prev, modifyConfirmDialogOpen: false }))}
        aria-labelledby="modify-confirm-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 600,
            maxWidth: 800
          }
        }}>
        <DialogTitle id="modify-confirm-dialog-title" sx={{ color: 'white' }}>
          Confirm Configuration Changes
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
            Please review the configuration changes before applying:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
              borderRadius: 1,
              overflowX: 'auto'
            }}>
            <pre style={{ margin: 0, color: 'white' }}>{dockerArgs}</pre>
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, modifyConfirmDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmModify}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Apply Changes
          </Button>
        </Box>
      </Dialog>

      {/* Update Dialog */}
      <Dialog
        open={dialogs.updateDialogOpen}
        onClose={() => setDialogs((prev) => ({ ...prev, updateDialogOpen: false }))}
        aria-labelledby="update-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 600,
            maxWidth: 800
          }
        }}>
        <DialogTitle id="update-dialog-title" sx={{ color: 'white' }}>
          Run Container Image
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
            Edit the container configuration:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            maxRows={20}
            variant="outlined"
            value={updateConfigJson}
            onChange={(e) => setUpdateConfigJson(e.target.value)}
            placeholder={`{\n  "image": "muxly1:3",\n  ...\n}`}
            InputProps={{
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'white'
              }
            }}
          />
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
              borderRadius: 1,
              mb: 2
            }}>
            <pre style={{ margin: 0, color: 'white' }}>{updateConfigJson}</pre>
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, updateDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, updateConfirmDialogOpen: true }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            OK
          </Button>
        </Box>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog
        open={dialogs.updateConfirmDialogOpen}
        onClose={() => setDialogs((prev) => ({ ...prev, updateConfirmDialogOpen: false }))}
        aria-labelledby="update-confirm-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 600,
            maxWidth: 800
          }
        }}>
        <DialogTitle id="update-confirm-dialog-title" sx={{ color: 'white' }}>
          Confirm Run Container
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
            Please review the update configuration before proceeding:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
              borderRadius: 1,
              overflowX: 'auto'
            }}>
            <pre style={{ margin: 0, color: 'white' }}>{updateConfigJson}</pre>
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, updateConfirmDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpdate}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Confirm
          </Button>
        </Box>
      </Dialog>

      {/* Restart Dialog */}
      <Dialog
        open={dialogs.restartDialogOpen}
        onClose={() => setDialogs((prev) => ({ ...prev, restartDialogOpen: false }))}
        aria-labelledby="restart-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 400
          }
        }}>
        <DialogTitle id="restart-dialog-title" sx={{ color: 'white' }}>
          Confirm Container Restart
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'white' }}>
            Are you sure you want to restart this container <strong>{container.label}</strong>? This
            will temporarily interrupt service.
          </Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, restartDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRestart}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Restart
          </Button>
        </Box>
      </Dialog>

      {/* Modify Dialog */}
      <Dialog
        open={dialogs.modifyDialogOpen}
        onClose={() => setDialogs((prev) => ({ ...prev, modifyDialogOpen: false }))}
        aria-labelledby="modify-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 600,
            maxWidth: 800
          }
        }}>
        <DialogTitle id="modify-dialog-title" sx={{ color: 'white' }}>
          Modify Container Configuration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
            Edit the container configuration:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            maxRows={20}
            variant="outlined"
            value={dockerArgs}
            onChange={(e) => setDockerArgs(e.target.value)}
            placeholder={`{\n              "image": "muxly1:3",\n              ...\n            }`}
            InputProps={{
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'white'
              }
            }}
          />
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
              borderRadius: 1,
              mb: 2
            }}>
            <pre style={{ margin: 0, color: 'white' }}>{dockerArgs}</pre>
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, modifyDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, modifyConfirmDialogOpen: true }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            OK
          </Button>
        </Box>
      </Dialog>

      {/* Debug Dialog */}
      <Dialog
        open={dialogs.debugDialogOpen}
        aria-labelledby="debug-dialog-title"
        sx={{ zIndex: 99999 }}
        container={fullscreenContainerRef.current}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            minWidth: 400
          }
        }}>
        <DialogTitle id="debug-dialog-title">Enable Debug Mode</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enable debug mode for this container? This will provide detailed logging for 60 minutes.
          </Typography>
          {/* Error handling for debug */}
          <Collapse in={!!actionError && dialogs.debugDialogOpen}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setContainerState((prev) => ({ ...prev, actionError: '' }))}>
                  <Close fontSize="inherit" />
                </IconButton>
              }>
              {actionError}
            </Alert>
          </Collapse>
          <Collapse in={!!actionSuccess && dialogs.debugDialogOpen}>
            <Alert
              severity="success"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setContainerState((prev) => ({ ...prev, actionSuccess: '' }))}>
                  <Close fontSize="inherit" />
                </IconButton>
              }>
              {actionSuccess}
            </Alert>
          </Collapse>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, pb: 3, mt: 2 }}>
          <Button
            onClick={() => setDialogs((prev) => ({ ...prev, debugDialogOpen: false }))}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDebugMode();
            }}
            variant="contained"
            sx={{ color: '#fff !important' }}
            style={{ color: '#fff !important' }}>
            Enable Debug
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ContainerDialogs;

ContainerDialogs.propTypes = {
  container: PropTypes.shape({
    label: PropTypes.string.isRequired,
    updateConfigJson: PropTypes.string.isRequired,
    dockerArgs: PropTypes.string.isRequired,
    actionError: PropTypes.string,
    actionSuccess: PropTypes.string,
    setUpdateConfigJson: PropTypes.func.isRequired,
    setDockerArgs: PropTypes.func.isRequired
  }).isRequired,
  dialogs: PropTypes.shape({
    modifyConfirmDialogOpen: PropTypes.bool.isRequired,
    updateDialogOpen: PropTypes.bool.isRequired,
    updateConfirmDialogOpen: PropTypes.bool.isRequired,
    restartDialogOpen: PropTypes.bool.isRequired,
    modifyDialogOpen: PropTypes.bool.isRequired,
    debugDialogOpen: PropTypes.bool.isRequired
  }).isRequired,
  setDialogs: PropTypes.func.isRequired,
  onConfirm: PropTypes.shape({
    handleConfirmRestart: PropTypes.func.isRequired,
    handleConfirmUpdate: PropTypes.func.isRequired,
    handleConfirmModify: PropTypes.func.isRequired,
    handleDebugMode: PropTypes.func.isRequired
  }).isRequired,
  theme: PropTypes.object.isRequired,
  setContainerState: PropTypes.func.isRequired,
  fullscreenContainerRef: PropTypes.object
};
