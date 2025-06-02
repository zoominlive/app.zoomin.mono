/* eslint-disable no-unused-vars */
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  RestartAlt,
  Update,
  Edit,
  MonitorHeart,
  ExpandMore,
  Code as CodeIcon,
  Close,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
// import './App.css';
import { Grid, Alert, Collapse } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PropTypes from 'prop-types';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import AuthContext from '../../context/authcontext';
import LayoutContext from '../../context/layoutcontext';
import { fetchContainerMetrics } from '../../utils/containerMetricsApi';
import LinerLoader from '../common/linearLoader';
import { Package } from 'react-feather';
import API from '../../api';

// Utility function to format date based on timezone
const formatDateTime = (dateString, timeZone = 'UTC', options = {}) => {
  try {
    const date = new Date(dateString);

    // Default options for date formatting
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timeZone,
      hourCycle: 'h23', // Use 24-hour format
      timeZoneName: 'short'
    };

    // Merge default options with any custom options
    const mergedOptions = { ...defaultOptions, ...options };

    return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if there's an error
  }
};

// Utility function to convert a time string to a full ISO date
// For demo purposes, we'll assume all time strings are for the current day in UTC
const timeStringToFullDate = (timeString) => {
  if (!timeString) return '';
  // If already an ISO string or not in HH:mm format, return as is
  if (typeof timeString !== 'string') return '';
  if (/T\d{2}:\d{2}:\d{2}/.test(timeString) || timeString.length > 5) {
    return timeString;
  }
  // Only convert if in HH:mm format
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeString;
  const today = new Date();
  today.setUTCHours(hours, minutes, 0, 0);
  return today.toISOString();
};

// Move theme creation outside App
function getTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb' },
      secondary: { main: '#a855f7' },
      background: {
        default: mode === 'dark' ? '#101624' : '#edf2f7', // Lighter background for better contrast
        paper: mode === 'dark' ? 'rgba(24,28,44,0.85)' : '#ffffff'
      },
      warning: { main: '#ff9800' },
      success: { main: '#22c55e' },
      info: { main: '#06b6d4' },
      text: {
        primary: '#ffffff', // Always white text regardless of mode
        secondary: '#ffffff' // Always white text regardless of mode
      }
    },
    typography: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-1px' },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 }
    },
    shape: { borderRadius: 18 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            ...(mode === 'dark'
              ? {
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
                  backgroundColor: 'rgba(24,28,44,0.85)',
                  border: '1.5px solid #232a3a'
                }
              : {
                  // High-contrast for light mode
                  background: '#ffffff',
                  boxShadow: '0 12px 24px 0 rgba(0,0,0,0.06)',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#ffffff'
                })
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600
          },
          outlined: {
            ...(mode === 'light' && {
              borderColor: '#bfdbfe',
              '&:hover': {
                borderColor: '#93c5fd',
                backgroundColor: 'rgba(37,99,235,0.04)'
              }
            })
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            ...(mode === 'light' && {
              '&.MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2563eb'
                }
              }
            })
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: mode === 'light' ? 'white' : undefined
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...(mode === 'light' && {
              backgroundColor: '#334155',
              '& .MuiMenuItem-root': {
                color: 'white'
              }
            })
          }
        }
      }
    }
  });
}

function AlertSection({ alerts, onExpand, timeZone, setFilters, setExpandedState }) {
  const theme = useMuiTheme();
  const isLight = theme.palette.mode === 'light';
  // Use localStorage to remember accordion state between sessions
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('alertsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Dialog states for actions
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyConfirmDialogOpen, setModifyConfirmDialogOpen] = useState(false);
  const [updateConfirmDialogOpen, setUpdateConfirmDialogOpen] = useState(false); // NEW
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [currentContainer, setCurrentContainer] = useState(null);

  // Handlers for container actions
  const handleRestartClick = (container) => {
    setCurrentContainer(container);
    setRestartDialogOpen(true);
  };

  const handleUpdateClick = (container) => {
    setCurrentContainer(container);
    setUpdateDialogOpen(true);
  };

  const handleModifyClick = (container) => {
    setCurrentContainer(container);
    setModifyDialogOpen(true);
  };

  const handleDebugClick = (container) => {
    setCurrentContainer(container);
    setDebugDialogOpen(true);
  };

  // Sync internal expanded state with external state control
  const handleExpandChange = (newExpandedValue) => {
    setExpanded(newExpandedValue);
    setExpandedState(newExpandedValue);
  };

  // Save the expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('alertsExpanded', JSON.stringify(expanded));
  }, [expanded]);

  // Don't show the section at all if there are no alerts
  if (alerts.length === 0) return null;

  // Function to collapse alerts and update host filter
  const handleShowFull = (hostValue) => {
    setFilters((f) => ({ ...f, host: hostValue.toLowerCase() }));
    handleExpandChange(false);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => handleExpandChange(!expanded)}
      elevation={0}
      disableGutters
      TransitionProps={{ unmountOnExit: false, timeout: 400 }}
      sx={{
        mb: 3,
        background: 'transparent',
        '&:before': { display: 'none' }, // Remove the default divider
        border: 'none',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        '& .MuiCollapse-root': {
          transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }}>
      <AccordionSummary
        expandIcon={
          <Box
            sx={{
              transition: 'transform 0.3s ease, background-color 0.3s ease',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: expanded ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,59,48,0.25)'
              }
            }}>
            <ExpandMore
              sx={{
                color: 'error.main',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </Box>
        }
        sx={{
          minHeight: 56,
          px: 2,
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          bgcolor: isLight ? 'rgba(255,59,48,0.08)' : 'rgba(255,59,48,0.05)',
          borderLeft: '3px solid',
          borderColor: 'error.main',
          '&:hover': {
            bgcolor: isLight ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.08)'
          },
          '&.Mui-expanded': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
          }
        }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between'
          }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              color: 'error.main',
              transition: 'opacity 0.3s ease',
              opacity: expanded ? 1 : 0.9
            }}>
            <WarningIcon
              sx={{
                mr: 1,
                fontSize: 20,
                animation: expanded && alerts.length >= 3 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                  '100%': { opacity: 1 }
                }
              }}
            />
            Active Alerts ({alerts.length})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              mr: 2,
              transition: 'opacity 0.3s ease',
              opacity: 0.8,
              '&:hover': {
                opacity: 1
              }
            }}>
            {expanded ? 'Click to hide' : 'Click to show'}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          p: 2,
          pt: 3,
          transition: 'all 0.4s ease',
          opacity: expanded ? 1 : 0
        }}>
        <Grid container spacing={2} className="alert-grid">
          {alerts
            .slice(0, alerts.length > 5 && !onExpand ? 5 : alerts.length)
            .map((container, index) => {
              // Use customer from BE response
              const customerName = container.customer;

              // Get max value to determine severity
              const cpuValue = Math.round(container.stats[container.stats.length - 1].cpu);
              const memValue = Math.round(container.stats[container.stats.length - 1].mem);
              const maxValue = Math.max(cpuValue, memValue);
              const isCritical = maxValue >= 90;

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={container.id}
                  sx={{
                    opacity: 0,
                    animation: `fadeIn 0.5s ${index * 0.1}s forwards`,
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'translateY(10px)' },
                      '100%': { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}>
                  <Paper
                    elevation={2}
                    className="alert-card"
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1.5px solid',
                      borderColor: isCritical ? 'error.main' : 'error.light',
                      borderRadius: 3,
                      background: isLight
                        ? `linear-gradient(135deg, #334155 0%, ${
                            isCritical ? '#472a2a' : '#1e293b'
                          } 100%)`
                        : `linear-gradient(135deg, rgba(24,28,44,0.95) 0%, ${
                            isCritical ? 'rgba(54,17,17,0.95)' : 'rgba(17,27,54,0.95)'
                          } 100%)`,
                      boxShadow: isCritical
                        ? '0 4px 20px rgba(255,59,48,0.15)'
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      '&:hover': {
                        boxShadow: isCritical
                          ? '0 8px 25px rgba(255,59,48,0.2)'
                          : '0 8px 25px rgba(0,0,0,0.2)',
                        transform: 'translateY(-2px)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      },
                      position: 'relative', // Add relative positioning to the paper container
                      overflow: 'hidden' // Ensure alert badge doesn't overflow
                    }}>
                    {/* Customer name - first row */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: 'secondary.main',
                        mb: 0.5,
                        pr: 7.5 // Add padding to the right to not overlap with the alert badge
                      }}>
                      {customerName}
                    </Typography>

                    {/* Alert badge in absolute position in top-right corner */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        display: 'inline-flex',
                        px: 1,
                        py: 0.25,
                        bgcolor: isCritical ? 'error.main' : 'error.light',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: 'white',
                        alignItems: 'center',
                        zIndex: 2,
                        ...(isCritical && {
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1, transform: 'scale(1)' },
                            '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                            '100%': { opacity: 1, transform: 'scale(1)' }
                          }
                        })
                      }}>
                      <MonitorHeart sx={{ fontSize: 14, mr: 0.5 }} />{' '}
                      {isCritical ? 'Critical' : 'Alert'}
                    </Box>

                    {/* Hostname - second row */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1
                      }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {container.label}
                      </Typography>
                    </Box>

                    {/* Alert values - third row */}
                    <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          CPU
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color:
                              cpuValue >= 90
                                ? 'error.main'
                                : cpuValue >= 80
                                ? 'error.light'
                                : 'white',
                            ...(cpuValue >= 90 && {
                              animation: 'valueFlash 1.5s infinite',
                              '@keyframes valueFlash': {
                                '0%': { color: 'error.main' },
                                '50%': { color: 'white' },
                                '100%': { color: 'error.main' }
                              }
                            })
                          }}>
                          {cpuValue}%
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Memory
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color:
                              memValue >= 90
                                ? 'error.main'
                                : memValue >= 80
                                ? 'error.light'
                                : 'white',
                            ...(memValue >= 90 && {
                              animation: 'valueFlash 1.5s infinite',
                              '@keyframes valueFlash': {
                                '0%': { color: 'error.main' },
                                '50%': { color: 'white' },
                                '100%': { color: 'error.main' }
                              }
                            })
                          }}>
                          {memValue}%
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1.5 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Last Updated
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: 'white',
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                            mt: 0.5
                          }}>
                          {(() => {
                            const t = container.stats[container.stats.length - 1].time;
                            if (typeof t === 'string' && t.length === 5 && t.includes(':')) {
                              return formatDateTime(timeStringToFullDate(t), timeZone, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZoneName: 'short'
                              });
                            } else {
                              return formatDateTime(t, timeZone, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZoneName: 'short'
                              });
                            }
                          })()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action buttons - fourth row */}
                    <Box
                      sx={{
                        mt: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                      {/* Show Full Button in left corner */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleShowFull(container.label)}
                        sx={{
                          fontSize: '0.7rem',
                          py: 0.5,
                          minWidth: 'auto',
                          px: 1.5,
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(37,99,235,0.1)',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
                          },
                          transition: 'all 0.2s'
                        }}>
                        Show Full
                      </Button>

                      {/* Clear Alert Button in right corner */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 9L9 15"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 9L15 15"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          ...(isCritical && {
                            bgcolor: 'rgba(255,59,48,0.1)',
                            borderColor: 'error.main',
                            '&:hover': {
                              bgcolor: 'rgba(255,59,48,0.2)',
                              borderColor: 'error.main'
                            }
                          }),
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(255,59,48,0.2)'
                          },
                          transition: 'all 0.2s'
                        }}>
                        Clear Alert
                      </Button>
                    </Box>
                    {/* Action buttons row */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<RestartAlt />}
                        color="info"
                        variant="outlined"
                        onClick={() => handleRestartClick(container)}>
                        Restart
                      </Button>
                      <MuiTooltip title="Update container tag and run arguments">
                        <Button
                          size="small"
                          startIcon={<Update />}
                          color="secondary"
                          variant="outlined"
                          onClick={() => handleUpdateClick(container)}>
                          Update
                        </Button>
                      </MuiTooltip>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        color="primary"
                        variant="outlined"
                        onClick={() => handleModifyClick(container)}>
                        Modify
                      </Button>
                      <MuiTooltip title="Enable enhanced monitoring">
                        <Button
                          size="small"
                          startIcon={<CodeIcon />}
                          color="warning"
                          variant="outlined"
                          onClick={() => handleDebugClick(container)}>
                          Debug
                        </Button>
                      </MuiTooltip>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
        </Grid>

        {/* Only show the "Show all" button when there are 5+ alerts and we're not already showing all */}
        {alerts.length > 5 && !expanded && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 3,
              opacity: 0,
              animation: 'fadeIn 0.5s 0.5s forwards',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={onExpand}
              startIcon={
                <Box
                  component="span"
                  sx={{
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'rgba(37,99,235,0.15)'
                  }}>
                  +
                </Box>
              }
              sx={{
                fontWeight: 600,
                px: 3,
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  background:
                    'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 70%)',
                  transform: 'translateX(-100%)'
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
                  '&::after': {
                    transition: 'transform 1s',
                    transform: 'translateX(100%)'
                  }
                }
              }}>
              {`Show all (${alerts.length})`}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

AlertSection.propTypes = {
  alerts: PropTypes.array.isRequired,
  onExpand: PropTypes.func,
  timeZone: PropTypes.string,
  setFilters: PropTypes.func,
  setExpandedState: PropTypes.func
};

function FiltersSection({ filters, setFilters }) {
  const theme = useMuiTheme();
  const isLight = theme.palette.mode === 'light';

  // Common styles for text fields and selects in light mode
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' }
    },
    '& .MuiSelect-icon': { color: 'white' },
    '& .MuiInputBase-input': { color: 'white' }
  };

  // Common props for inputs
  const inputProps = {
    sx: {
      color: 'white',
      '& input': { color: 'white' },
      '& .MuiInputAdornment-root': { color: 'white' },
      '& input::placeholder': { color: 'rgba(255,255,255,0.6)' }
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        ...(isLight
          ? {
              backgroundColor: '#334155',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              border: '2px solid #475569',
              color: 'white'
            }
          : {})
      }}>
      <Grid container spacing={2} alignItems="center" wrap="nowrap">
        <Grid item xs={7} sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography gutterBottom sx={{ color: 'white' }}>
              Customer Name
            </Typography>
            <TextField
              fullWidth
              value={filters.customer}
              onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))}
              placeholder="Search childcare centers..."
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
                ...inputProps
              }}
              sx={inputStyles}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography gutterBottom sx={{ color: 'white' }}>
              Host Name
            </Typography>
            <TextField
              fullWidth
              value={filters.host}
              onChange={(e) => setFilters((f) => ({ ...f, host: e.target.value }))}
              placeholder="Search hostname or server..."
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">@</InputAdornment>,
                ...inputProps
              }}
              sx={inputStyles}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography gutterBottom sx={{ color: 'white' }}>
              Region
            </Typography>
            <Select
              fullWidth
              multiple
              value={filters.region}
              onChange={(e) => {
                const value = e.target.value;

                // Check if "all" is selected
                if (value.includes('all')) {
                  // If "all" was just added, select all regions
                  if (!filters.region.includes('all')) {
                    setFilters((f) => ({
                      ...f,
                      region: ['all', 'us-east-1', 'us-west-2', 'On-Prem']
                    }));
                  } else {
                    // If "all" was already selected, clear selection
                    setFilters((f) => ({ ...f, region: [] }));
                  }
                } else {
                  // Regular selection (without "all")
                  setFilters((f) => ({ ...f, region: value }));
                }
              }}
              size="small"
              displayEmpty
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <span style={{ opacity: 0.6 }}>All regions</span>;
                }

                if (selected.includes('all')) {
                  return <span>All regions</span>;
                }

                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(37,99,235,0.3)',
                          color: 'white',
                          fontSize: '0.75rem',
                          height: 20,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    ))}
                  </Box>
                );
              }}
              sx={inputStyles}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#334155',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(37,99,235,0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(37,99,235,0.4)'
                        }
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }
                  }
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left'
                },
                slotProps: {
                  paper: {
                    elevation: 4,
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                      maxHeight: 300
                    }
                  }
                }
              }}>
              <MenuItem value="all" sx={{ fontWeight: 'bold' }}>
                Select All Regions
              </MenuItem>
              <MenuItem value="us-east-1">us-east-1</MenuItem>
              <MenuItem value="us-west-2">us-west-2</MenuItem>
              <MenuItem value="On-Prem">On-Prem</MenuItem>
              {/* Add more regions as needed */}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Box>
            <Typography gutterBottom sx={{ color: 'white' }}>
              CPU Usage (%)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                value={filters.cpuOp}
                onChange={(e) => setFilters((f) => ({ ...f, cpuOp: e.target.value }))}
                size="small"
                sx={{ minWidth: 80, ...inputStyles }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#334155',
                      '& .MuiMenuItem-root': {
                        color: 'white'
                      }
                    }
                  }
                }}>
                <MenuItem value=">">&gt;</MenuItem>
                <MenuItem value=">=">&ge;</MenuItem>
                <MenuItem value="<">&lt;</MenuItem>
                <MenuItem value="<=">&le;</MenuItem>
              </Select>
              <TextField
                type="number"
                value={filters.cpu}
                onChange={(e) => setFilters((f) => ({ ...f, cpu: Number(e.target.value) }))}
                inputProps={{ min: 0, max: 100, step: 1 }}
                InputProps={inputProps}
                size="small"
                sx={{ width: 80, ...inputStyles }}
              />
              <Typography sx={{ color: 'white' }}>%</Typography>
            </Box>
          </Box>
          <Box>
            <Typography gutterBottom sx={{ color: 'white' }}>
              Memory Usage (%)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                value={filters.memOp}
                onChange={(e) => setFilters((f) => ({ ...f, memOp: e.target.value }))}
                size="small"
                sx={{ minWidth: 80, ...inputStyles }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#334155',
                      '& .MuiMenuItem-root': {
                        color: 'white'
                      }
                    }
                  }
                }}>
                <MenuItem value=">">&gt;</MenuItem>
                <MenuItem value=">=">&ge;</MenuItem>
                <MenuItem value="<">&lt;</MenuItem>
                <MenuItem value="<=">&le;</MenuItem>
              </Select>
              <TextField
                type="number"
                value={filters.mem}
                onChange={(e) => setFilters((f) => ({ ...f, mem: Number(e.target.value) }))}
                inputProps={{ min: 0, max: 100, step: 1 }}
                InputProps={inputProps}
                size="small"
                sx={{ width: 80, ...inputStyles }}
              />
              <Typography sx={{ color: 'white' }}>%</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

FiltersSection.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired
};

function HeaderBar({ mode, setMode, timeZone, setTimeZone, isFullScreen, onToggleFullScreen }) {
  const theme = useMuiTheme();
  const isLight = theme.palette.mode === 'light';

  // Common time zones with common names
  const timeZones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'ET (New York)' },
    { value: 'America/Chicago', label: 'CT (Chicago)' },
    { value: 'America/Denver', label: 'MT (Denver)' },
    { value: 'America/Los_Angeles', label: 'PT (Los Angeles)' },
    { value: 'Europe/London', label: 'GMT (London)' },
    { value: 'Europe/Paris', label: 'CET (Paris)' },
    { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
    { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
  ];

  return (
    <Box
      sx={{
        height: 64,
        bgcolor: mode === 'dark' ? 'rgba(24,28,44,0.92)' : '#334155',
        display: 'flex',
        alignItems: 'center',
        px: 4,
        zIndex: 1100,
        borderBottom: '1.5px solid',
        borderColor: mode === 'dark' ? 'rgba(80,80,120,0.10)' : '#475569'
      }}>
      {/* Time Zone Selector */}
      <Box sx={{ mr: 2, display: 'flex', flex: 1, alignItems: 'center' }}>
        <Box
          component="span"
          sx={{
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 500,
            mr: 1,
            opacity: 0.8
          }}>
          Time Zone:
        </Box>
        <Select
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          size="small"
          sx={{
            minWidth: 150,
            height: 36,
            color: '#ffffff',
            '& .MuiSelect-select': {
              py: 0.75,
              pl: 1.5,
              pr: 3,
              fontSize: '0.85rem'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.3)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            },
            '& .MuiSelect-icon': {
              color: 'white'
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
                '& .MuiMenuItem-root': {
                  color: 'white',
                  fontSize: '0.85rem',
                  minHeight: 'auto',
                  py: 1
                }
              }
            }
          }}>
          {timeZones.map((tz) => (
            <MenuItem key={tz.value} value={tz.value}>
              {tz.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <IconButton
        sx={{
          mr: 1,
          color: '#ffffff',
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'transparent',
          '&:hover': {
            bgcolor: mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'
          }
        }}
        onClick={onToggleFullScreen}
        title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
        {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
      <IconButton
        sx={{
          mr: 1,
          color: '#ffffff',
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'transparent',
          '&:hover': {
            bgcolor: mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'
          }
        }}
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
}

HeaderBar.propTypes = {
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
  timeZone: PropTypes.string.isRequired,
  setTimeZone: PropTypes.func.isRequired,
  isFullScreen: PropTypes.bool,
  onToggleFullScreen: PropTypes.func
};

const StyledTooltip = styled('div')(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
  color: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 5px 20px 0 rgba(0,20,80,0.15)',
  padding: '12px 18px',
  fontSize: 14,
  fontWeight: 500,
  border:
    theme.palette.mode === 'dark'
      ? `1.5px solid ${theme.palette.primary.main}22`
      : `1.5px solid ${theme.palette.primary.main}55`,
  minWidth: 120
}));

function CustomTooltip({ active, payload, label, timeZone }) {
  if (!active || !payload || !payload.length) return null;
  // Find cpu and mem values from payload
  let cpu, mem;
  payload.forEach((p) => {
    if (p.dataKey === 'cpu') cpu = p.value;
    if (p.dataKey === 'mem') mem = p.value;
  });

  // Convert the time string to a full date string
  const fullDateTime = timeStringToFullDate(label);
  const formattedTime = formatDateTime(fullDateTime, timeZone || 'UTC', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <StyledTooltip>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'white' }}>Time: {formattedTime}</div>
      <div style={{ color: '#2563eb', marginBottom: 2 }}>
        CPU: <b>{cpu ?? '-'}%</b>
      </div>
      <div style={{ color: '#a855f7' }}>
        Mem: <b>{mem ?? '-'}%</b>
      </div>
    </StyledTooltip>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  timeZone: PropTypes.string
};

// Adapt ContainerTile to new data structure
function ContainerTile({ container }) {
  const theme = useMuiTheme();

  // Use BE fields directly
  const customerName = container.customer;
  const label = container.label || container.id || container.container_id;
  const cpu = container.cpu;
  const tag = container.tag;
  const upSince = container.upSince || container.up_since || container.timestamp;
  const region = container.region;
  const host = container.host || container.container_host;
  const onPrem = container.onPrem;
  const stats = container.stats || [];

  // Use memory from BE and round for display
  const memoryValue = container.memory ? Math.round(Number(container.memory)) : '-';

  // Filtered stats for chart (show last 6)
  const filteredStats = stats.slice(-6);

  // Dialog state for actions
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyConfirmDialogOpen, setModifyConfirmDialogOpen] = useState(false);
  const [updateConfirmDialogOpen, setUpdateConfirmDialogOpen] = useState(false); // NEW
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // REMOVE
  const [newTagValue, setNewTagValue] = useState(container.tag || '1.3.14'); // REMOVE
  const [updateRunArgs, setUpdateRunArgs] = useState('-p 8080:8080'); // REMOVE
  const [dockerArgs, setDockerArgs] = useState(`{
        "image": "zoominlive/muxly:1.3.01_9d61ed460c52cea2aeaebec5fb90f6e66d198e48",
        "detach": true,
        "interactive": true,
        "env": [
            "RTSP_STREAM_AUTH_JWT_ENABLED=false",
            "RTSP_STREAM_KEY_URI=https://rtspdev.zoominlive.com",
            "RTSP_STREAM_ENVIRONMENT=stage",
            "RTSP_STREAM_AUTH_JWT_SECRET=zoominlivesecretkey",
            "RTSP_STREAM_JWT_REQUEST_SECRET=p7FQj}9p9wD$N;L1kC&X<MCa[UV%",
            "RTSP_STREAM_AWS_ACCESS_KEY=AKIAYEUNNGGXRXVN5XNN",
            "RTSP_STREAM_AWS_ACCESS_SECRET=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"
        ],
        "port_bindings": {
            "8080":"80"
        }
    }
 `);
  const [updateConfigJson, setUpdateConfigJson] = useState(`{
    "image": "${container.image || 'muxly1:3'}",
    "env": [
      "RTSP_STREAM_AUTH_JWT_ENABLED=true",
      "RTSP_STREAM_KEY_URI=https://rtspdev.zoominlive.com",
      "RTSP_STREAM_ENVIRONMENT=stage",
      "RTSP_STREAM_AUTH_JWT_SECRET=zoominlivesecretkey",
      "RTSP_STREAM_JWT_REQUEST_SECRET=p7FQj}9p9wD$N;L1kC&X<MCa[UV%",
      "RTSP_STREAM_AWS_ACCESS_KEY=AKIAYEUNNGGXRXVN5XNN",
      "RTSP_STREAM_AWS_ACCESS_SECRET=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"
    ],
    "port_bindings": {
      "8080": "80"
    }
  }`); // NEW
  const [updateNotification, setUpdateNotification] = useState(false);
  const [debugNotification, setDebugNotification] = useState(false);
  const [debugActive, setDebugActive] = useState(false);
  const [debugTimeRemaining, setDebugTimeRemaining] = useState(60);

  // Notification states for API actions
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Handlers for dialogs
  const handleRestartClick = () => {
    setRestartDialogOpen(true);
    setActionError('');
    setActionSuccess('');
  };
  const handleUpdateClick = () => {
    setUpdateConfigJson(dockerArgs); // Use current config as base
    setUpdateDialogOpen(true);
    setActionError('');
    setActionSuccess('');
  };
  const handleModifyClick = () => {
    setDockerArgs(`{
        "image": "zoominlive/muxly:1.3.01_9d61ed460c52cea2aeaebec5fb90f6e66d198e48",
        "detach": true,
        "interactive": true,
        "env": [
            "RTSP_STREAM_AUTH_JWT_ENABLED=false",
            "RTSP_STREAM_KEY_URI=https://rtspdev.zoominlive.com",
            "RTSP_STREAM_ENVIRONMENT=stage",
            "RTSP_STREAM_AUTH_JWT_SECRET=zoominlivesecretkey",
            "RTSP_STREAM_JWT_REQUEST_SECRET=p7FQj}9p9wD$N;L1kC&X<MCa[UV%",
            "RTSP_STREAM_AWS_ACCESS_KEY=AKIAYEUNNGGXRXVN5XNN",
            "RTSP_STREAM_AWS_ACCESS_SECRET=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"
        ],
        "port_bindings": {
            "8080":"80"
        }
    }
 `);
    setModifyDialogOpen(true);
    setActionError('');
    setActionSuccess('');
  };
  const handleDebugClick = () => {
    setDebugDialogOpen(true);
    setDebugTimeRemaining(60);
  };
  const handleCloseDialog = () => {
    setUpdateDialogOpen(false);
    setDebugDialogOpen(false);
    setNewTagValue(container.tag || '1.3.14');
  };
  const handleCancelModifyConfirm = () => {
    setModifyConfirmDialogOpen(false);
  };
  const handleProceedToConfirm = () => {
    setUpdateDialogOpen(false);
    setUpdateConfirmDialogOpen(true);
  };
  const handleConfirmUpdate = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const config = JSON.parse(updateConfigJson);
      await API.post('/agents/run-image', {
        url: `https://${label}`,
        config
      });
      setActionSuccess('Container image update initiated.');
    } catch (err) {
      setActionError('Failed to update container image.');
    }
    setUpdateConfirmDialogOpen(false);
    setUpdateNotification(true);
    setTimeout(() => setUpdateNotification(false), 5000);
  };
  const handleCancelConfirm = () => {
    setConfirmDialogOpen(false);
    setNewTagValue(container.tag || '1.3.14');
  };
  const handleCancelRestart = () => setRestartDialogOpen(false);
  const handleConfirmRestart = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      await API.post('/agents/restart', {
        domain: `https://${label}`
      });
      setActionSuccess('Container restart initiated.');
    } catch (err) {
      setActionError('Failed to restart container.');
    }
    setRestartDialogOpen(false);
  };
  const handleCancelModify = () => setModifyDialogOpen(false);
  const handleProceedToModifyConfirm = () => {
    setModifyDialogOpen(false);
    setModifyConfirmDialogOpen(true);
  };
  const handleConfirmModify = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const config = JSON.parse(dockerArgs);
      await API.post('/agents/update-config', {
        url: `https://${label}`,
        config
      });
      setActionSuccess('Container config update initiated.');
    } catch (err) {
      setActionError('Failed to update container config.');
    }
    setModifyConfirmDialogOpen(false);
  };

  useEffect(() => {
    let debugInterval;
    if (debugActive) {
      debugInterval = setInterval(() => {
        setDebugTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(debugInterval);
            setDebugActive(false);
            setDebugNotification(false);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
    return () => {
      if (debugInterval) clearInterval(debugInterval);
    };
  }, [debugActive]);

  return (
    <Paper
      className="container-tile"
      elevation={3}
      sx={{
        p: 3,
        mb: 2,
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
      {/* Customer name row with Tag - first row */}
      <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
          {customerName}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'info.main',
            fontWeight: 600,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center'
          }}>
          Tag: <span style={{ marginLeft: '4px' }}>{tag || '1.3.14'}</span>
        </Typography>
      </Box>
      {/* Hostname and Up since - second row */}
      <Box
        sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
            CPU: {cpu !== null && cpu !== undefined ? cpu : '-'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
            Memory: {memoryValue} MB
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
            Up since
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', lineHeight: 1.3 }}>
            {formatDateTime(upSince, 'UTC', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: onPrem ? 'warning.main' : 'info.main',
              fontWeight: 600,
              display: 'block',
              mt: 0.5,
              fontSize: '0.675rem'
            }}>
            On-Prem: {onPrem ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </Box>
      {/* Stats chart - third row */}
      <Box sx={{ flex: 1, minHeight: 160, mb: 2, mt: 2 }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={filteredStats} margin={{ top: 12, right: 8, left: 0, bottom: 12 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'white' }}
              label={{
                value: 'Time',
                position: 'insideBottomRight',
                offset: 0,
                fontSize: 12,
                fill: 'white',
                dy: 10
              }}
            />
            <YAxis
              domain={[0, 100]}
              label={{
                value: 'Usage (%)',
                angle: -90,
                position: 'insideLeft',
                fontSize: 12,
                fill: 'white'
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: theme.palette.primary.main, strokeWidth: 1, opacity: 0.2 }}
            />
            <Legend
              verticalAlign="top"
              height={24}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: 'white' }}
            />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="CPU %"
            />
            <Line
              type="monotone"
              dataKey="mem"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              name="Mem %"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {/* Last reported values - fourth row */}
      <Box
        sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Last Reported
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                CPU: <b>{stats.length > 0 ? Math.round(stats[stats.length - 1].cpu) : '-'}%</b>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                Mem: <b>{stats.length > 0 ? Math.round(stats[stats.length - 1].mem) : '-'}%</b>
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', mt: 0.5 }}>
              {stats.length > 0
                ? formatDateTime(timeStringToFullDate(stats[stats.length - 1].time), 'UTC', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })
                : ''}
            </Typography>
          </Box>
        </Box>
      </Box>
      {/* Action buttons row */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
        <Button
          size="small"
          startIcon={<RestartAlt />}
          color="info"
          variant="outlined"
          onClick={handleRestartClick}>
          Restart
        </Button>
        <MuiTooltip title="Update container tag and run arguments">
          <Button
            size="small"
            startIcon={<Update />}
            color="secondary"
            variant="outlined"
            onClick={handleUpdateClick}>
            Update
          </Button>
        </MuiTooltip>
        <Button
          size="small"
          startIcon={<Edit />}
          color="primary"
          variant="outlined"
          onClick={handleModifyClick}>
          Modify
        </Button>
        <MuiTooltip title="Enable enhanced monitoring">
          <Button
            size="small"
            startIcon={<CodeIcon />}
            color="warning"
            variant="outlined"
            onClick={handleDebugClick}>
            Debug
          </Button>
        </MuiTooltip>
      </Box>
      {/* Notifications */}
      <Collapse in={!!actionSuccess}>
        <Alert
          severity="success"
          sx={{
            mt: 2,
            bgcolor: 'rgba(46, 125, 50, 0.2)',
            color: 'white',
            border: '1px solid',
            borderColor: 'rgba(46, 125, 50, 0.5)'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setActionSuccess('')}>
              <Close fontSize="inherit" />
            </IconButton>
          }>
          {actionSuccess}
        </Alert>
      </Collapse>
      <Collapse in={!!actionError}>
        <Alert
          severity="error"
          sx={{
            mt: 2,
            bgcolor: 'rgba(255,59,48,0.15)',
            color: 'white',
            border: '1px solid',
            borderColor: 'rgba(255,59,48,0.5)'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setActionError('')}>
              <Close fontSize="inherit" />
            </IconButton>
          }>
          {actionError}
        </Alert>
      </Collapse>
      {/* Modify Confirmation Dialog */}
      <Dialog
        open={modifyConfirmDialogOpen}
        onClose={handleCancelModifyConfirm}
        aria-labelledby="modify-confirm-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '450px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="modify-confirm-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Confirm Configuration Changes
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Are you sure you want to apply this configuration to <b>{label}</b>? The container will
            need to be recreated with the new configuration.
          </DialogContentText>
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.15)',
              p: 1.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflowX: 'auto'
            }}>
            <pre style={{ margin: 0, color: '#2563eb' }}>{dockerArgs}</pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelModifyConfirm}>Cancel</Button>
          <Button onClick={handleConfirmModify} variant="contained">
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
      {/* Update Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        aria-labelledby="update-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="update-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Update Container Image Configuration
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Enter new configuration for container <b>{label}</b>:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Config JSON"
            type="text"
            fullWidth
            multiline
            minRows={10}
            maxRows={20}
            variant="outlined"
            value={updateConfigJson}
            onChange={(e) => setUpdateConfigJson(e.target.value)}
            placeholder={`{\n  "image": "muxly1:3",\n  ...\n}`}
            InputProps={{
              sx: {
                color: 'white',
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'secondary.main' }
              }
            }}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
          />
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.15)',
              p: 1.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflowX: 'auto',
              mb: 2
            }}>
            <pre style={{ margin: 0, color: '#2563eb' }}>{updateConfigJson}</pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProceedToConfirm} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      {/* Update Confirmation Dialog */}
      <Dialog
        open={updateConfirmDialogOpen}
        onClose={() => setUpdateConfirmDialogOpen(false)}
        aria-labelledby="update-confirm-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '450px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="update-confirm-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Confirm Update
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Are you sure you want to update container <b>{label}</b> with this configuration?
          </DialogContentText>
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.15)',
              p: 1.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflowX: 'auto'
            }}>
            <pre style={{ margin: 0, color: '#2563eb' }}>{updateConfigJson}</pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUpdateConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmUpdate} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Restart Dialog */}
      <Dialog
        open={restartDialogOpen}
        onClose={handleCancelRestart}
        aria-labelledby="restart-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="restart-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Confirm Restart
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white' }}>
            Are you sure you want to restart container <b>{label}</b>? This may cause a brief
            service interruption.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCancelRestart}
            sx={{ '&.MuiButton-root': { color: '#fff !important' } }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRestart}
            variant="contained"
            sx={{ '&.MuiButton-root': { color: '#fff !important' } }}>
            Restart
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modify Dialog */}
      <Dialog
        open={modifyDialogOpen}
        onClose={handleCancelModify}
        aria-labelledby="modify-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="modify-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Modify Container Configuration
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Enter new configuration for container <b>{label}</b>.<br />
            <b>Note:</b> This will send the following payload:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Config JSON"
            type="text"
            fullWidth
            multiline
            minRows={10}
            maxRows={20}
            variant="outlined"
            value={dockerArgs}
            onChange={(e) => setDockerArgs(e.target.value)}
            placeholder={`{
              "image": "muxly1:3",
              "env": [
                "RTSP_STREAM_AUTH_JWT_ENABLED=true",
                "RTSP_STREAM_KEY_URI=https://rtspdev.zoominlive.com",
                "RTSP_STREAM_ENVIRONMENT=stage",
                "RTSP_STREAM_AUTH_JWT_SECRET=zoominlivesecretkey",
                "RTSP_STREAM_JWT_REQUEST_SECRET=p7FQj}9p9wD$N;L1kC&X<MCa[UV%",
                "RTSP_STREAM_AWS_ACCESS_KEY=AKIAYEUNNGGXRXVN5XNN",
                "RTSP_STREAM_AWS_ACCESS_SECRET=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"
              ],
              "port_bindings": {
                "8080": "80"
              }
            }`}
            InputProps={{
              sx: {
                color: 'white',
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }
            }}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
          />
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.15)',
              p: 1.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflowX: 'auto',
              mb: 2
            }}>
            <pre style={{ margin: 0, color: '#2563eb' }}>{dockerArgs}</pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelModify}>Cancel</Button>
          <Button onClick={handleProceedToModifyConfirm} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      {/* Debug Dialog */}
      <Dialog
        open={debugDialogOpen}
        // onClose={handleCancelDebug}
        aria-labelledby="debug-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '450px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}>
        <DialogTitle
          id="debug-dialog-title"
          sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
            pb: 2
          }}>
          Enable Debug Mode
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Turning on Debug mode will set this container`&lsquo`s reporting interval to every{' '}
            <b>(1) minute</b> for the next hour.
          </DialogContentText>
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.15)',
              p: 1.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              mb: 2
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
              <CodeIcon sx={{ color: 'warning.main' }} />
              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                Container: <b>{label}</b>
              </Typography>
            </Box>
            <Box sx={{ pl: 3, borderLeft: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                • CPU & Memory monitoring: <b>every 1 minute</b>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                • Logging level: <b>DEBUG</b>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                • Duration: <b>60 minutes</b>
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            Debug mode helps diagnose issues by temporarily increasing monitoring frequency. This
            can impact container performance.
          </Typography>
          {/* Error handling for debug */}
          <Collapse in={!!actionError && debugDialogOpen}>
            <Alert
              severity="error"
              sx={{
                mt: 2,
                bgcolor: 'rgba(255,59,48,0.15)',
                color: 'white',
                border: '1px solid',
                borderColor: 'rgba(255,59,48,0.5)'
              }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setActionError('')}>
                  <Close fontSize="inherit" />
                </IconButton>
              }>
              {actionError}
            </Alert>
          </Collapse>
          <Collapse in={!!actionSuccess && debugDialogOpen}>
            <Alert
              severity="success"
              sx={{
                mt: 2,
                bgcolor: 'rgba(46, 125, 50, 0.2)',
                color: 'white',
                border: '1px solid',
                borderColor: 'rgba(46, 125, 50, 0.5)'
              }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setActionSuccess('')}>
                  <Close fontSize="inherit" />
                </IconButton>
              }>
              {actionSuccess}
            </Alert>
          </Collapse>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={() => {
              console.log('Debug mode enabled for 60 minutes');
            }}
            variant="contained"
            startIcon={<CodeIcon />}>
            Enable for 60 minutes
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

ContainerTile.propTypes = {
  container: PropTypes.object.isRequired
};

function ContainerMetrics() {
  const authCtx = useContext(AuthContext);
  const layoutCtx = useContext(LayoutContext);
  const [filters, setFilters] = useState({
    cpu: 0,
    cpuOp: '>=',
    mem: 10,
    memOp: '>=',
    region: [],
    host: '',
    customer: '',
    timeRange: '24h'
  });
  const [alertExpand, setAlertExpand] = useState(false);
  const [mode, setMode] = useState('dark');
  const [timeZone, setTimeZone] = useState(() => {
    const savedTimeZone = localStorage.getItem('preferredTimeZone');
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return savedTimeZone || browserTimeZone || 'UTC';
  });
  const [containerData, setContainerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('cpu');
  const [sortOrder, setSortOrder] = useState('desc');
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimeout = useRef();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dashboardRef = useRef(null);

  // Debounce filters for searching
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    // Build query params for BE
    const params = {
      customername: debouncedFilters.customer || undefined,
      hostname: debouncedFilters.host || undefined,
      minCpu:
        debouncedFilters.cpuOp === '>=' || debouncedFilters.cpuOp === '>'
          ? debouncedFilters.cpu
          : undefined,
      maxCpu:
        debouncedFilters.cpuOp === '<=' || debouncedFilters.cpuOp === '<'
          ? debouncedFilters.cpu
          : undefined,
      minMemory:
        debouncedFilters.memOp === '>=' || debouncedFilters.memOp === '>'
          ? debouncedFilters.mem
          : undefined,
      maxMemory:
        debouncedFilters.memOp === '<=' || debouncedFilters.memOp === '<'
          ? debouncedFilters.mem
          : undefined,
      sortField,
      sortOrder
    };
    fetchContainerMetrics(params)
      .then((data) => {
        if (isMounted) {
          setContainerData(data.data || data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to load container metrics');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [debouncedFilters, sortField, sortOrder]);

  useEffect(() => {
    layoutCtx.setActive(12);
    layoutCtx.setBreadcrumb(['Container Metrics']);
    return () => {
      authCtx.setPreviosPagePath(window.location.pathname);
    };
  }, []);

  // Update time zone in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredTimeZone', timeZone);
  }, [timeZone]);

  // Update document body attribute for CSS selectors
  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = getTheme(mode);

  // Fullscreen API handlers
  const handleToggleFullScreen = useCallback(() => {
    const elem = dashboardRef.current;
    if (!isFullScreen && elem) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }, [isFullScreen]);

  useEffect(() => {
    function onFullScreenChange() {
      setIsFullScreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        )
      );
    }
    document.addEventListener('fullscreenchange', onFullScreenChange);
    document.addEventListener('webkitfullscreenchange', onFullScreenChange);
    document.addEventListener('mozfullscreenchange', onFullScreenChange);
    document.addEventListener('MSFullscreenChange', onFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullScreenChange);
      document.removeEventListener('mozfullscreenchange', onFullScreenChange);
      document.removeEventListener('MSFullscreenChange', onFullScreenChange);
    };
  }, []);

  // Filter logic (mocked for now)
  const cpuCompare = (val, op, ref) => {
    switch (op) {
      case '>':
        return val > ref;
      case '>=':
        return val >= ref;
      case '<':
        return val < ref;
      case '<=':
        return val <= ref;
      default:
        return true;
    }
  };
  console.log('Container data:', containerData);

  const filteredContainers = containerData.filter((c) => {
    // Use customer from BE response
    const customerName = c.customer;

    // Region filter logic
    const regionFilterPassed =
      filters.region.length === 0 ||
      filters.region.includes('all') ||
      (filters.region.includes('On-Prem') && c.onPrem === true) ||
      (c.region && filters.region.some((r) => r !== 'On-Prem' && r === c.region));

    const customerFilterPassed =
      filters.customer === '' ||
      (customerName && customerName.toLowerCase().includes(filters.customer.toLowerCase()));

    const hostFilterPassed =
      filters.host === '' ||
      (c.host && c.host.includes(filters.host)) ||
      (c.label && c.label.toLowerCase().includes(filters.host.toLowerCase()));

    return (
      regionFilterPassed &&
      customerFilterPassed &&
      hostFilterPassed &&
      c.stats &&
      (c.stats.some((s) => cpuCompare(s.cpu, filters.cpuOp, filters.cpu)) ||
        c.stats.some((s) => cpuCompare(s.mem, filters.memOp, filters.mem)))
    );
  });
  // Filter containers that have CPU or Memory values over 80% to display as alerts
  const alertContainers = containerData
    .filter((c) => c.stats && c.stats.some((s) => s.cpu >= 80 || s.mem >= 80))
    .sort((a, b) => {
      const maxA = Math.max(
        a.stats[a.stats.length - 1]?.cpu || 0,
        a.stats[a.stats.length - 1]?.mem || 0
      );
      const maxB = Math.max(
        b.stats[b.stats.length - 1]?.cpu || 0,
        b.stats[b.stats.length - 1]?.mem || 0
      );
      return maxB - maxA;
    });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HeaderBar
        mode={mode}
        setMode={setMode}
        timeZone={timeZone}
        setTimeZone={setTimeZone}
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
      />
      {/* Show LinearLoader at the top when loading */}
      <LinerLoader loading={loading} />
      <Box
        ref={dashboardRef}
        sx={{
          bgcolor: mode === 'dark' ? '#101624' : '#edf2f7',
          paddingX: 4,
          minHeight: '100vh',
          transition: 'padding 0.2s',
          position: 'relative', // Ensure stacking context
          zIndex: 1 // Lower than sidebar/header
        }}>
        {/* Sorting UI */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}>
            <MenuItem value="cpu">CPU</MenuItem>
            <MenuItem value="memory">Memory</MenuItem>
            <MenuItem value="timestamp">Timestamp</MenuItem>
          </Select>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}>
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </Box>
        {/* Always render FiltersSection and main content, even when loading */}
        <AlertSection
          alerts={alertExpand ? alertContainers : alertContainers}
          onExpand={() => setAlertExpand(!alertExpand)}
          timeZone={timeZone}
          setFilters={setFilters}
          setExpandedState={(expanded) => {
            setAlertExpand(expanded);
            localStorage.setItem('alertsExpanded', JSON.stringify(expanded));
          }}
        />
        <FiltersSection filters={filters} setFilters={setFilters} />
        <Box>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : containerData.length === 0 && !loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 220,
                py: 6,
                color: 'text.secondary'
              }}>
              <Package size={48} style={{ marginBottom: 12, opacity: 0.7 }} />
              <Typography>No containers found.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {containerData.map((container) => (
                <Grid item xs={12} sm={6} md={3} key={container.container_id}>
                  <ContainerTile container={container} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default ContainerMetrics;
