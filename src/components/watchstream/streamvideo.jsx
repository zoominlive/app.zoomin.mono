import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useLocation } from 'react-router-dom';
import API from '../../api';
import { errorMessageHandler } from '../../utils/errormessagehandler';
import { useSnackbar } from 'notistack';
import AuthContext from '../../context/authcontext';
import LayoutContext from '../../context/layoutcontext';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  List,
  SpeedDial,
  SpeedDialAction,
  Stack,
  Typography
} from '@mui/material';
import moment from 'moment';
import deleterecordingicon from '../../assets/trash-delete-shared-clip.svg';
import play from '../../assets/play-playback.svg';
import LinerLoader from '../common/linearLoader';
import VideoExpirationTimer from './videoexpirationtime';
import NewDeleteDialog from '../common/newdeletedialog';
import TechnicalIssue from '../../assets/technicalissue.svg';
import InappropriateContent from '../../assets/inappropriatecontent.svg';
import SafetyViolation from '../../assets/safetyviolation.svg';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import noselectedclips from '../../assets/nosharedclipfound.svg';
import noselectedvideo from '../../assets/noselectedvideo.svg';
import { useApiErrorHandler } from '../../utils/corserrorhandler';

const isShareIdValid = (s3Url, userId) => {
  if (!s3Url || !userId) return false;
  const match = s3Url.match(/-share-(\w{4})\.mp4$/);
  if (!match) return false;
  const extractedPart = match[1];
  return userId.includes(extractedPart);
};

const actions = [
  { icon: <img src={TechnicalIssue} alt="technicalIssue" />, name: 'Technical Issue' },
  {
    icon: <img src={InappropriateContent} alt="InappropriateContent" />,
    name: 'Inappropriate Content'
  },
  { icon: <img src={SafetyViolation} alt="SafetyViolation" />, name: 'Safety Violation' }
];

const VideoPlayer = () => {
  const { enqueueSnackbar } = useSnackbar();
  const handleApiError = useApiErrorHandler();
  const authCtx = useContext(AuthContext);
  const layoutCtx = useContext(LayoutContext);
  const location = useLocation();
  const [isExpired, setIsExpired] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [url, setUrl] = useState(null);
  const [shareHistory, setShareHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportLoader, setReportLoader] = useState(false);
  const [share_id, setShareId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(shareHistory[0]);
  const [selectedClip, setSelectedClip] = useState();
  const [hasFetched, setHasFetched] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // Track which action is loading
  const playerRef = useRef(null); // Create a ref for ReactPlayer

  useEffect(() => {
    layoutCtx.setActive(10);
    layoutCtx.setBreadcrumb(['Recorded Clips', 'Explore Shared Clips ']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  useEffect(() => {
    if (!authCtx.user || hasFetched) {
      return; // Prevent API call if user is not available or has already been fetched
    }
    setHasFetched(true); // Ensure API is called only once
    setIsLoading(true);
    API.get('recordings/share-history', {
      params: {
        user_id:
          authCtx.user?.role == 'Family' ? authCtx.user.family_member_id : authCtx.user.user_id
      }
    })
      .then((response) => {
        if (response.status === 200) {
          const data = response.data.Data;
          // Retrieve seen clips from local storage
          const seenClips = JSON.parse(localStorage.getItem('seenClips')) || [];

          // Mark unseen clips
          const updatedData = data.map((clip) => ({
            ...clip,
            seen: seenClips.includes(clip.share_id) ? true : false // ✅ Ensures unseen clips stay unseen
          }));
          setShareHistory(updatedData);
          setSelectedClip(response.data.Data[0]);
          let shared_cf_link = response.data.Data[0].shared_cf_link;
          const url = new URL(shared_cf_link, window.location.origin);
          const encodedVideoUrl = url.searchParams.get('video');
          const shareId = url.searchParams.get('shareId');
          const videoUrl = encodedVideoUrl ? decodeURIComponent(encodedVideoUrl) : '';
          setSelectedVideo(videoUrl);
          setShareId(shareId);
        } else {
          handleApiError(response);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('API error:', error);
        errorMessageHandler(
          enqueueSnackbar,
          'Failed to load shared history or No Data found',
          500,
          authCtx.setAuthError
        );
      });
  }, [authCtx.user]);

  const searchParams = new URLSearchParams(location.search);
  const encodedVideoUrl = searchParams.get('video');
  const shareId = searchParams.get('shareId');

  // Decode the video URL from window.location only once here

  const videoUrl = encodedVideoUrl ? decodeURIComponent(encodedVideoUrl) : '';

  useEffect(() => {
    if (shareId || share_id) {
      // Avoid redundant API calls by checking previous values
      if (prevShareIdRef.current === shareId || prevShareIdRef.current === share_id) {
        return;
      }
      prevShareIdRef.current = shareId || share_id;
      setIsLoading(true);
      API.get('recordings/stream-video', { params: { share_id: shareId || share_id } })
        .then((response) => {
          if (response.status === 200) {
            const s3Url = response.data.url;
            const userId = authCtx.user.user_id;
            const isValid = isShareIdValid(s3Url, userId);
            setAllowed(isValid);
            setUrl(videoUrl); // Use the already-decoded video URL
          } else {
            handleApiError(response);
            setIsExpired(true);
          }
        })
        .catch(() => {
          setIsExpired(true);
        })
        .finally(() => {
          setTimeout(() => setIsLoading(false), 300); // Hide loader when API call completes
        });
    }
  }, [shareId, share_id, videoUrl, enqueueSnackbar]);
  const prevShareIdRef = useRef(null);

  const handleRecordSelection = (rec) => {
    const url = new URL(rec.shared_cf_link, window.location.origin);
    const encodedVideoUrl = url.searchParams.get('video');
    const videoUrl = encodedVideoUrl ? decodeURIComponent(encodedVideoUrl) : '';
    setSelectedVideo(videoUrl);
    setShareId(rec.share_id);
    setSelectedClip(rec);

    try {
      // ✅ Immediately update state to mark the clicked clip as seen
      setShareHistory((prev) => {
        const updatedHistory = prev.map((clip) =>
          clip.share_id === rec.share_id ? { ...clip, seen: true } : clip
        );

        // ✅ Calculate remaining unseen clips using latest state
        const remainingUnseen = updatedHistory.filter((clip) => !clip.seen).length;

        if (remainingUnseen === 0) {
          authCtx.setShowRedDot(false); // 🔴 Hide red dot when all are seen
        }

        return updatedHistory; // Return new state
      });
      API.patch('recordings/mark-seen', { share_id: rec.share_id });

      // Store seen clip in localStorage to persist
      const seenClips = JSON.parse(localStorage.getItem('seenClips')) || [];
      if (!seenClips.includes(rec.share_id)) {
        seenClips.push(rec.share_id);
        localStorage.setItem('seenClips', JSON.stringify(seenClips));
      }
      // ✅ Ensure video starts playing when selected
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(0); // Restart video
        }
      }, 300);
    } catch (error) {
      console.error('Error marking as seen:', error);
    }
  };

  const handleDeleteRecord = (data) => {
    // setIsLoading(true);
    setDeleteLoading(true);
    API.delete('recordings/invalidate-link', {
      data: {
        share_id: data?.share_id
      }
    })
      .then((response) => {
        if (response.status === 201) {
          enqueueSnackbar('Recording Deleted successfully!', { variant: 'success' });
          API.get('recordings/share-history', {
            params: {
              user_id:
                authCtx.user?.role == 'Family'
                  ? authCtx.user.family_member_id
                  : authCtx.user.user_id
            }
          })
            .then((response) => {
              if (response.status === 200) {
                setShareHistory(response.data.Data);
                setSelectedClip(response.data.Data[0]);
                let shared_cf_link = response.data.Data[0].shared_cf_link;
                const url = new URL(shared_cf_link, window.location.origin);
                const encodedVideoUrl = url.searchParams.get('video');
                const shareId = url.searchParams.get('shareId');
                const videoUrl = encodedVideoUrl ? decodeURIComponent(encodedVideoUrl) : '';

                setSelectedVideo(videoUrl);
                setShareId(shareId);
              } else {
                if (response.response.status !== 404) {
                  errorMessageHandler(
                    enqueueSnackbar,
                    response?.response?.data?.Message || 'Something Went Wrong.',
                    response?.response?.status,
                    authCtx.setAuthError
                  );
                }
              }
            })
            .catch((error) => {
              console.error('API error:', error);
              errorMessageHandler(
                enqueueSnackbar,
                'Failed to load shared history.',
                500,
                authCtx.setAuthError
              );
            })
            .finally(() => {
              // setIsLoading(false); // Hide loader when API call completes
              setDeleteLoading(false);
              setIsDeleteDialogOpen(false);
            });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      })
      .catch(() => setIsLoading(false));
  };

  const handleReportAction = (event, data, selectedClip) => {
    event.stopPropagation(); // Prevent SpeedDial from closing immediately
    setReportLoader(true); // Start Loader
    setLoadingAction(data); // Show loader only for clicked action
    let reporterName = authCtx.user.first_name + '' + authCtx.user.last_name;
    let reporterEmail = authCtx.user.email;
    API.post('recordings/report-issue', {
      issueType: data,
      issueReportedAt: new Date().toISOString(),
      eventName: selectedClip?.record_rtsp?.event_name,
      custName: selectedClip?.senderUser?.customer?.company_name,
      location: selectedClip?.record_rtsp?.record_camera_tag?.customer_location?.loc_name,
      camName: selectedClip?.record_rtsp?.record_camera_tag?.cam_name,
      zoneName: selectedClip?.record_rtsp?.zone_name,
      url: selectedClip?.shared_link,
      thumbnail_url: selectedClip?.thumbnail_url,
      reporterName: reporterName,
      reporterEmail: reporterEmail
    })
      .then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(response.data.Message, { variant: 'success' });
        } else {
          errorMessageHandler(
            enqueueSnackbar,
            response?.response?.data?.Message || 'Something Went Wrong.',
            response?.response?.status,
            authCtx.setAuthError
          );
        }
      })
      .catch((error) => {
        errorMessageHandler(
          enqueueSnackbar,
          error?.response?.data?.Message || 'Something Went Wrong.',
          error?.response?.status,
          authCtx.setAuthError
        );
      })
      .finally(() => {
        setReportLoader(false);
        setLoadingAction(null);
        setTimeout(() => setOpen(false), 500); // Close menu slightly after request completes
      });
  };

  return (
    <>
      {/* Sidebar with Recordings List */}
      {isLoading ? (
        <Box display="flex" minHeight="100vh" alignItems="center" justifyContent="center">
          <LinerLoader loading={isLoading} />
        </Box>
      ) : shareHistory.length > 0 ? (
        <>
          <Box display="flex" p={2} gap={2}>
            <Box
              bgcolor="#ffffff"
              width="35%"
              p={2}
              borderRadius={'15px'}
              sx={{ overflowY: 'auto' }}>
              <List sx={{ padding: 0 }}>
                {shareHistory.map((rec, index) => (
                  <>
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        mt: index === 0 ? 0 : 2,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        boxShadow: 'none',
                        alignItems: 'center',
                        borderRadius: '10px',
                        bgcolor: share_id == rec.share_id ? '#5A53DD1A' : 'unset',
                        position: 'relative'
                      }}
                      onClick={() => handleRecordSelection(rec)}>
                      <CardContent>
                        <Stack direction={'row'} gap={0.5} alignItems={'center'}>
                          <Typography variant="h6">
                            {rec.record_rtsp?.event_name
                              ? rec.record_rtsp?.event_name
                              : 'Unnamed Event'}{' '}
                            {!rec.seen && (
                              <span style={{ color: 'red', marginLeft: '5px' }}>🔴</span>
                            )}
                          </Typography>
                        </Stack>
                        <Typography lineHeight={2}>
                          Recorded On:{' '}
                          <span style={{ color: '#5A53DD' }}>
                            {moment(rec.record_rtsp?.start_time).format('MM-DD-YYYY')}
                          </span>
                        </Typography>
                        <Typography lineHeight={2}>
                          Camera:{' '}
                          <span style={{ color: '#5A53DD' }}>
                            {rec.record_rtsp?.record_camera_tag?.cam_name} (
                            {rec.record_rtsp?.zone_name})
                          </span>
                        </Typography>
                        <Typography lineHeight={2}>
                          Shared By:{' '}
                          <span style={{ color: '#5A53DD' }}>
                            {rec.senderUser?.first_name + ' ' + rec.senderUser?.last_name}
                          </span>
                        </Typography>
                        <Stack direction={'row'} gap={3}>
                          <Typography lineHeight={2}>
                            Shared On:{' '}
                            <span style={{ color: '#5A53DD' }}>
                              {moment(rec.shared_on).format('MM-DD-YYYY')}
                            </span>
                          </Typography>
                          <Typography lineHeight={2}>
                            Expires On:{' '}
                            <span style={{ color: '#D52C2C' }}>
                              {moment(rec.expires_on).format('MM-DD-YYYY')}
                            </span>
                          </Typography>
                        </Stack>
                      </CardContent>
                      <Stack
                        direction="row"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10
                        }}>
                        <IconButton color="primary" onClick={() => handleRecordSelection(rec)}>
                          <img src={play} alt="reshareicon" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setIsDeleteDialogOpen(true);
                            setSelectedClip(rec);
                          }}>
                          {deleteLoading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            <img src={deleterecordingicon} alt="deleterecordingicon" />
                          )}
                          {/* <img src={deleterecordingicon} alt="deleterecordingicon" /> */}
                        </IconButton>
                      </Stack>
                    </Card>
                    <Divider />
                  </>
                ))}
              </List>
            </Box>
            {/* Main Video Section */}
            <Box width="65%" p={2} bgcolor="#ffffff" borderRadius={'15px'}>
              {selectedVideo ? (
                <>
                  <Box
                    sx={{
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
                      onContextMenu={(e) => e.preventDefault()} // Prevents right-click only on the video container
                    >
                      {(url && !isExpired && allowed) || selectedVideo ? (
                        <>
                          <ReactPlayer
                            ref={playerRef} // Attach ref
                            url={url || selectedVideo}
                            controls
                            playing
                            width="100%"
                            height="auto"
                            style={{ aspectRatio: '16 / 9', borderRadius: '8px' }}
                            onPlay={() => {
                              if (selectedClip && !selectedClip.seen) {
                                setShareHistory((prev) => {
                                  const updatedHistory = prev.map((clip) =>
                                    clip.share_id === selectedClip.share_id
                                      ? { ...clip, seen: true }
                                      : clip
                                  );

                                  const remainingUnseen = updatedHistory.filter(
                                    (clip) => !clip.seen
                                  ).length;

                                  if (remainingUnseen === 0) {
                                    authCtx.setShowRedDot(false);
                                  }

                                  return updatedHistory;
                                });

                                API.patch('recordings/mark-seen', {
                                  share_id: selectedClip.share_id
                                });

                                // Store seen clip in localStorage
                                const seenClips =
                                  JSON.parse(localStorage.getItem('seenClips')) || [];
                                if (!seenClips.includes(selectedClip.share_id)) {
                                  seenClips.push(selectedClip.share_id);
                                  localStorage.setItem('seenClips', JSON.stringify(seenClips));
                                }
                              }
                            }}
                            config={{
                              file: { attributes: { controlsList: 'nodownload' } }
                            }}
                          />
                        </>
                      ) : (
                        <p>No video URL provided or This link has expired or is no longer valid.</p>
                      )}
                    </div>
                  </Box>
                  <Stack
                    direction={'row'}
                    justifyContent={authCtx.user.role == 'Family' ? 'end' : 'space-between'}>
                    {authCtx.user.role == 'Admin' && (
                      <VideoExpirationTimer
                        expirationTime={selectedClip?.expires_on}
                        handleDeleteRecord={() => {
                          setIsDeleteDialogOpen(true);
                          setSelectedClip(selectedClip);
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        transform: 'translateZ(0px)',
                        flexGrow: 1,
                        position: 'relative'
                      }}
                      onMouseEnter={() => setOpen(true)}
                      onMouseLeave={() => setOpen(false)}>
                      <SpeedDial
                        ariaLabel="Report Actions"
                        sx={{
                          position: 'absolute',
                          bottom: -4,
                          right: 0,
                          '& .MuiFab-primary': {
                            backgroundColor: '#6246ea', // Purple button
                            color: '#fff', // White text/icon
                            borderRadius: '50px', // Pill shape
                            width: '100%',
                            height: '45px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0 16px',
                            '&:hover': { backgroundColor: '#4a38c5' }
                          }
                        }}
                        open={open || reportLoader}
                        onOpen={() => setOpen(true)}
                        onClose={() => !reportLoader && setOpen(false)}
                        icon={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 'bold',
                                fontSize: '14px',
                                textTransform: 'capitalize'
                              }}>
                              Report
                            </Typography>
                            {open ? (
                              <CloseIcon sx={{ fontSize: '18px', color: 'white !important' }} />
                            ) : (
                              <AddIcon sx={{ fontSize: '18px', color: 'white !important' }} />
                            )}
                          </Box>
                        }>
                        {actions.map((action) => (
                          <SpeedDialAction
                            key={action.name}
                            icon={
                              <Box
                                sx={{
                                  textTransform: 'capitalize',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  backgroundColor: '#fff',
                                  borderRadius: '24px',
                                  padding: '8px 12px',
                                  width: 'auto',
                                  justifyContent: 'space-between', // Ensure icon is properly aligned with text,
                                  whiteSpace: 'nowrap',
                                  position: 'absolute',
                                  right: '-30px'
                                }}>
                                <Typography
                                  sx={{ fontSize: '13px', fontWeight: 500, color: '#000000' }}>
                                  {action.name}
                                </Typography>
                                {loadingAction === action.name ? (
                                  <CircularProgress size={14} sx={{ color: '#000' }} />
                                ) : (
                                  action.icon
                                )}
                              </Box>
                            }
                            sx={{
                              backgroundColor: 'transparent', // Transparent to avoid default MUI styling
                              boxShadow: 'none',
                              minWidth: 'unset',
                              '&:hover': { backgroundColor: 'transparent' },
                              right: 0
                            }}
                            onClick={(event) =>
                              handleReportAction(event, action.name, selectedClip)
                            }
                          />
                        ))}
                      </SpeedDial>
                    </Box>
                  </Stack>
                </>
              ) : (
                <Typography variant="h6" color="text.secondary">
                  Select a video to play.
                </Typography>
              )}
            </Box>
          </Box>
          <NewDeleteDialog
            open={isDeleteDialogOpen}
            title="Stop Sharing"
            stopSharing={true}
            contentText="Are you sure you want to stop sharing this clip? Once stopped, the share link will no longer work."
            loading={deleteLoading}
            handleDialogClose={() => {
              setIsDeleteDialogOpen(false);
            }}
            handleDelete={() => handleDeleteRecord(selectedClip)}
          />
        </>
      ) : (
        <Box display="flex" p={2} gap={2} height="calc(100vh - 190px)">
          {/* Shared Clips Section */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            bgcolor="#F1F0FC"
            width="35%"
            p={2}
            borderRadius="15px"
            sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
            <Stack>
              <img src={noselectedclips} style={{ width: '80px', height: '80px' }} alt="" />
              <Typography textAlign="center" fontWeight={600} fontSize="18px">
                No Shared Clips
              </Typography>
            </Stack>
          </Box>

          {/* Main Video Section */}
          <Box
            width="65%"
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={2}
            bgcolor="#F1F0FC"
            borderRadius="15px"
            sx={{ flexGrow: 1, minHeight: 0 }}>
            <Stack>
              <img src={noselectedvideo} style={{ width: '80px', height: '80px' }} alt="" />
              <Typography textAlign="center" fontWeight={600} fontSize="18px">
                No Video Selected
              </Typography>
            </Stack>
          </Box>
        </Box>
      )}
    </>
  );
};

export default VideoPlayer;
