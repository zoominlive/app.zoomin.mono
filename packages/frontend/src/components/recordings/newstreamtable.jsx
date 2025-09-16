/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Box,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip
} from '@mui/material';
import PropTypes from 'prop-types';
import PlayRecording from '../../assets/play-recording.svg';
import ShareRecording from '../../assets/share-recording.svg';
import EditRecording from '../../assets/edit-recording.svg';
import { Link } from 'react-router-dom';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { formatTimestamp } from '../../utils/timestampformatter';
import RecordingForm from './recordingForm';
import DeleteRecordingDialog from './deleterecordingdialog';
import MobileStreamEditForm from './mobilestreameditform';
import CustomPlayer from '../watchstream/customplayer';
import CloseIcon from '@mui/icons-material/Close';
import NoLiveStreamDiv from '../common/nolivestreams';
import ShareRecordingForm from './sharerecordingform';

export default function NewStreamTable({ rows, columns, title, type, getRecordingData }) {
  const [recordingData, setRecordingData] = useState();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditMobileStreamDialogOpen, setIsEditMobileStreamDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null); // Track clicked camera
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleEditRecording = (data) => {
    setRecordingData(data);
    setIsEditDialogOpen(true);
  };

  const handleEditMobileStreamRecording = (data) => {
    setRecordingData(data);
    setIsEditMobileStreamDialogOpen(true);
  };

  const handleDeleteRecording = (data) => {
    setRecordingData(data);
    setIsDeleteDialogOpen(true);
  };

  const handleClick = (camRow) => {
    setSelectedCamera(camRow);
    setDialogOpen(true);
    setIsStreamDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setIsStreamDialogOpen(false);
    setSelectedCamera(null);
  };

  const handleShareRecording = (data) => {
    setRecordingData(data);
    setIsShareDialogOpen(true);
  };

  return (
    <>
      {type == 'FIXED_CAMERA' ? (
        <>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>

          <TableContainer
            sx={{
              height: '443px',
              overflowX: 'auto'
            }}>
            <Table stickyHeader={rows.length > 0}>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell
                      align={column === 'Actions' ? 'center' : 'left'}
                      sx={{
                        borderTop: '1px solid rgba(224, 224, 224, 1)',
                        ...(column === 'Actions' && {
                          position: 'sticky',
                          right: 0,
                          background: '#fff',
                          zIndex: 2
                        })
                      }}
                      key={index}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows && rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow className="fixed-camera-recordings-table" key={index} hover>
                      {/* Other columns */}
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <img
                            src={row.thumbnail_url}
                            width={'88px'}
                            height={'64px'}
                            style={{ borderRadius: '10px', cursor: 'pointer' }}
                            onClick={() => handleClick(row?.video_url)}
                          />
                          <Tooltip
                            title={row.record_camera_tag?.cam_name}
                            disableHoverListener={row.record_camera_tag?.cam_name.length < 10}>
                            <Chip
                              sx={{ marginLeft: '10px' }}
                              label={
                                row.record_camera_tag?.cam_name.length > 10
                                  ? row.record_camera_tag?.cam_name.slice(0, 10) + '...'
                                  : row.record_camera_tag?.cam_name
                              }
                              variant="outlined"
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={formatTimestamp(row.start_time)} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={row.zone_name}
                          disableHoverListener={row.zone_name?.length < 10}>
                          <Chip
                            label={
                              row.zone_name
                                ? row.zone_name.length > 10
                                  ? row.zone_name.slice(0, 10) + '...'
                                  : row.zone_name
                                : 'No Data'
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={row.event_name}
                          disableHoverListener={row.event_name?.length < 10}>
                          <Chip
                            label={
                              row.event_name
                                ? row.event_name.length > 10
                                  ? row.event_name.slice(0, 10) + '...'
                                  : row.event_name
                                : 'Unnamed'
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={row.record_tag?.tag_name}
                          disableHoverListener={row.record_tag?.tag_name.length < 10}>
                          <Chip
                            label={
                              row.record_tag?.tag_name
                                ? row.record_tag?.tag_name.length > 10
                                  ? row.record_tag?.tag_name.slice(0, 10) + '...'
                                  : row.record_tag?.tag_name
                                : 'Unselected'
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Sticky Actions column */}
                      <TableCell
                        sx={{
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          right: 0,
                          background: '#fff',
                          zIndex: 1
                        }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          <IconButton color="primary" sx={{ padding: '4px' }}>
                            <Link onClick={() => handleClick(row?.video_url)}>
                              <img src={PlayRecording} />
                            </Link>
                          </IconButton>
                          <IconButton
                            color="primary"
                            sx={{ padding: '4px' }}
                            onClick={() => handleEditRecording(row)}>
                            <img src={EditRecording} alt="edit-recording" />
                          </IconButton>
                          <IconButton
                            sx={{ padding: '4px' }}
                            onClick={() => handleShareRecording(row)}>
                            <img src={ShareRecording} />
                          </IconButton>
                          <IconButton
                            sx={{
                              '.MuiSvgIcon-root': { color: '#DD5853 !important' },
                              padding: '4px'
                            }}
                            onClick={() => handleDeleteRecording(row)}>
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                          minHeight: '443px'
                        }}>
                        <NoLiveStreamDiv />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <TableContainer sx={{ height: '443px' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell
                      align={column === 'Actions' ? 'center' : 'left'}
                      sx={{
                        borderTop: '1px solid rgba(224, 224, 224, 1)',
                        ...(column === 'Actions' && {
                          position: 'sticky',
                          right: 0,
                          background: '#fff',
                          zIndex: 2
                        })
                      }}
                      key={index}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows && rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow className="fixed-camera-recordings-table" key={index} hover>
                      <TableCell>
                        <Chip label={formatTimestamp(row.stream_start_time)} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={row.zone?.zone_name}
                          disableHoverListener={row.zone?.zone_name.length < 10}>
                          <Chip
                            label={
                              row.zone.zone_name
                                ? row.zone.zone_name.length > 10
                                  ? row.zone.zone_name.slice(0, 10) + '...'
                                  : row.zone.zone_name
                                : 'No Data'
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={row.stream_name}
                          disableHoverListener={row.stream_name.length < 10}>
                          <Chip
                            label={
                              row.stream_name
                                ? row.stream_name.length > 10
                                  ? row.stream_name.slice(0, 10) + '...'
                                  : row.stream_name
                                : 'Unnamed'
                            }
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          right: 0,
                          background: '#fff',
                          zIndex: 1
                        }}>
                        <IconButton color="primary" sx={{ padding: '4px' }}>
                          <Link
                            onClick={() =>
                              handleClick(
                                row?.presigned_url || row?.zone?.live_stream_cameras[0]?.stream_uri
                              )
                            }>
                            <img src={PlayRecording} alt="play-recording" />
                          </Link>
                        </IconButton>
                        <IconButton
                          sx={{ padding: '4px' }}
                          color="primary"
                          onClick={() => handleEditMobileStreamRecording(row)}>
                          <img src={EditRecording} alt="share-recording" />
                        </IconButton>
                        {/* <IconButton
                          sx={{ padding: '4px' }}
                          onClick={() => handleShareRecording(row)}>
                          <img src={ShareRecording} />
                        </IconButton> */}
                        <IconButton
                          sx={{
                            '.MuiSvgIcon-root': { color: '#DD5853 !important' },
                            padding: '4px'
                          }}
                          onClick={() => handleDeleteRecording(row)}>
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '443px'
                        }}>
                        <NoLiveStreamDiv />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {isEditDialogOpen && (
        <RecordingForm
          open={isEditDialogOpen}
          setOpen={setIsEditDialogOpen}
          recordingData={recordingData}
          setRecordingData={setRecordingData}
          getRecordingData={getRecordingData}
        />
      )}
      {isEditMobileStreamDialogOpen && (
        <MobileStreamEditForm
          open={isEditMobileStreamDialogOpen}
          setOpen={setIsEditMobileStreamDialogOpen}
          recordingData={recordingData}
          setRecordingData={setRecordingData}
          getRecordingData={getRecordingData}
        />
      )}
      <DeleteRecordingDialog
        open={isDeleteDialogOpen}
        title="Delete Recording"
        contentText="Are you sure you want to delete this?"
        recordingData={recordingData}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        handleDialogClose={() => {
          setRecordingData();
          setIsDeleteDialogOpen(false);
          getRecordingData();
        }}
      />
      {isStreamDialogOpen && (
        <Dialog open={dialogOpen} onClose={handleClose} fullWidth>
          <DialogTitle>
            {`Recording`}
            <IconButton
              aria-label="close"
              onClick={() => {
                handleClose();
              }}
              sx={{
                position: 'absolute',
                right: 18
              }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <CustomPlayer
              noOfCameras={2}
              streamUri={
                (selectedCamera !== null || selectedCamera !== undefined) && selectedCamera
              }
              camDetails={{}}
              recordedPlayback={true}
              dialogOpen={true}
            />
          </DialogContent>
        </Dialog>
      )}
      {isShareDialogOpen && (
        <ShareRecordingForm
          open={isShareDialogOpen}
          setOpen={setIsShareDialogOpen}
          recordingData={recordingData}
          setRecordingData={setRecordingData}
          getRecordingData={getRecordingData}
        />
      )}
    </>
  );
}

NewStreamTable.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  title: PropTypes.string,
  type: PropTypes.string,
  subtitle: PropTypes.string,
  isLoading: PropTypes.bool,
  getRecordingData: PropTypes.func
};
