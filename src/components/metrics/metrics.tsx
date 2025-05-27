import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Paper, Button, IconButton, TextField, InputAdornment, Select, MenuItem, Chip, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip as MuiTooltip } from '@mui/material';
import { Warning as WarningIcon, RestartAlt, Update, Edit, MonitorHeart, ExpandMore, Code as CodeIcon, Close } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from 'react'
import './App.css'
import { Grid, Alert, Collapse } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Utility function to format date based on timezone
const formatDateTime = (dateString: string, timeZone: string = 'UTC', options: Intl.DateTimeFormatOptions = {}) => {
  try {
    const date = new Date(dateString);
    
    // Default options for date formatting
    const defaultOptions: Intl.DateTimeFormatOptions = {
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
const timeStringToFullDate = (timeString: string) => {
  // Demo conversion - for real implementation, you would need proper timestamp data
  // This creates a date for today with the given time
  const today = new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  today.setUTCHours(hours, minutes, 0, 0);
  return today.toISOString();
};

// Mock data for containers
const mockContainers = [
  {
    id: '1',
    label: 'tc1.zoominlive.com',
    cpu: 'Intel Xeon E5-2676 v3',
    upSince: '2025-05-10T08:00:00Z',
    region: 'us-east-1',
    host: 'host-1',
    onPrem: false,
    stats: [
      { time: '09:00', cpu: 55, mem: 65 },
      { time: '09:30', cpu: 58, mem: 67 },
      { time: '10:00', cpu: 60, mem: 70 },
      { time: '10:30', cpu: 70, mem: 75 },
      { time: '11:00', cpu: 85, mem: 78 },
      { time: '11:30', cpu: 88, mem: 80 },
      { time: '12:00', cpu: 90, mem: 82 },
      { time: '12:30', cpu: 87, mem: 81 },
      { time: '13:00', cpu: 75, mem: 80 },
      { time: '13:30', cpu: 72, mem: 78 },
      { time: '14:00', cpu: 68, mem: 76 },
      { time: '14:30', cpu: 65, mem: 74 },
    ],
  },
  {
    id: '2',
    label: 'tc2.zoominlive.com',
    cpu: 'Intel Xeon E5-2676 v3',
    upSince: '2025-05-12T10:00:00Z',
    region: 'us-west-2',
    host: 'host-2',
    onPrem: false,
    stats: [
      { time: '09:00', cpu: 20, mem: 80 },
      { time: '09:30', cpu: 22, mem: 78 },
      { time: '10:00', cpu: 25, mem: 75 },
      { time: '10:30', cpu: 30, mem: 72 },
      { time: '11:00', cpu: 35, mem: 70 },
      { time: '11:30', cpu: 40, mem: 68 },
      { time: '12:00', cpu: 45, mem: 65 },
      { time: '12:30', cpu: 50, mem: 62 },
      { time: '13:00', cpu: 55, mem: 60 },
      { time: '13:30', cpu: 60, mem: 58 },
      { time: '14:00', cpu: 65, mem: 55 },
      { time: '14:30', cpu: 70, mem: 52 },
    ],
  },
  {
    id: '3', label: 'tc3.zoominlive.com', cpu: 'AMD EPYC 7501', upSince: '2025-05-15T09:00:00Z', region: 'us-east-1', host: 'host-3', onPrem: false, stats: [
      { time: '10:00', cpu: 10, mem: 90 }, { time: '11:00', cpu: 15, mem: 85 }, { time: '12:00', cpu: 12, mem: 80 }, { time: '13:00', cpu: 18, mem: 75 },
    ] },
  {
    id: '4', label: 'tc4.zoominlive.com', cpu: 'Intel Xeon Gold 6130', upSince: '2025-05-16T12:00:00Z', region: 'us-west-2', host: 'host-4', onPrem: false, stats: [
      { time: '10:00', cpu: 95, mem: 30 }, { time: '11:00', cpu: 92, mem: 32 }, { time: '12:00', cpu: 89, mem: 35 }, { time: '13:00', cpu: 91, mem: 38 },
    ] },
  {
    id: '5', label: 'tc5.zoominlive.com', cpu: 'Intel Xeon E5-2676 v3', upSince: '2025-05-17T14:00:00Z', region: 'eu-central-1', host: 'host-5', onPrem: false, stats: [
      { time: '10:00', cpu: 10, mem: 15 }, { time: '11:00', cpu: 12, mem: 18 }, { time: '12:00', cpu: 14, mem: 20 }, { time: '13:00', cpu: 11, mem: 16 },
    ] },
  {
    id: '6', label: 'tc6.zoominlive.com', cpu: 'AMD EPYC 7501', upSince: '2025-05-18T08:00:00Z', region: 'us-east-1', host: 'host-6', onPrem: true, stats: [
      { time: '10:00', cpu: 78, mem: 82 }, { time: '11:00', cpu: 80, mem: 85 }, { time: '12:00', cpu: 83, mem: 88 }, { time: '13:00', cpu: 85, mem: 90 },
    ] },
  {
    id: '7', label: 'tc7.zoominlive.com', cpu: 'Intel Xeon Gold 6130', upSince: '2025-05-19T10:00:00Z', region: 'us-west-2', host: 'host-7', onPrem: false, stats: [
      { time: '10:00', cpu: 55, mem: 60 }, { time: '11:00', cpu: 58, mem: 62 }, { time: '12:00', cpu: 60, mem: 65 }, { time: '13:00', cpu: 62, mem: 68 },
    ] },
  {
    id: '8', label: 'tc8.zoominlive.com', cpu: 'Intel Xeon E5-2676 v3', upSince: '2025-05-20T11:00:00Z', region: 'eu-central-1', host: 'host-8', onPrem: false, stats: [
      { time: '10:00', cpu: 30, mem: 40 }, { time: '11:00', cpu: 32, mem: 42 }, { time: '12:00', cpu: 35, mem: 45 }, { time: '13:00', cpu: 38, mem: 48 },
    ] },
  {
    id: '9', label: 'tc9.zoominlive.com', cpu: 'AMD EPYC 7501', upSince: '2025-05-20T12:00:00Z', region: 'us-east-1', host: 'host-9', onPrem: true, stats: [
      { time: '10:00', cpu: 88, mem: 92 }, { time: '11:00', cpu: 90, mem: 95 }, { time: '12:00', cpu: 93, mem: 97 }, { time: '13:00', cpu: 95, mem: 99 },
    ] },
  {
    id: '10', label: 'tc10.zoominlive.com', cpu: 'Intel Xeon Gold 6130', upSince: '2025-05-20T13:00:00Z', region: 'us-west-2', host: 'host-10', onPrem: false, stats: [
      { time: '10:00', cpu: 65, mem: 70 }, { time: '11:00', cpu: 68, mem: 72 }, { time: '12:00', cpu: 70, mem: 75 }, { time: '13:00', cpu: 72, mem: 78 },
    ] },
  {
    id: '11', label: 'tc11.zoominlive.com', cpu: 'Intel Xeon E5-2676 v3', upSince: '2025-05-20T14:00:00Z', region: 'eu-central-1', host: 'host-11', onPrem: true, stats: [
      { time: '10:00', cpu: 5, mem: 95 }, { time: '11:00', cpu: 7, mem: 92 }, { time: '12:00', cpu: 9, mem: 90 }, { time: '13:00', cpu: 6, mem: 88 },
    ] },
  {
    id: '12', label: 'tc12.zoominlive.com', cpu: 'AMD EPYC 7501', upSince: '2025-05-20T15:00:00Z', region: 'us-east-1', host: 'host-12', onPrem: true, stats: [
      { time: '10:00', cpu: 82, mem: 40 }, { time: '11:00', cpu: 85, mem: 42 }, { time: '12:00', cpu: 87, mem: 45 }, { time: '13:00', cpu: 89, mem: 48 },
    ] },
];

// Move theme creation outside App
function getTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb' },
      secondary: { main: '#a855f7' },
      background: {
        default: mode === 'dark' ? '#101624' : '#edf2f7', // Lighter background for better contrast
        paper: mode === 'dark' ? 'rgba(24,28,44,0.85)' : '#ffffff',
      },
      warning: { main: '#ff9800' },
      success: { main: '#22c55e' },
      info: { main: '#06b6d4' },
      text: {
        primary: '#ffffff', // Always white text regardless of mode
        secondary: '#ffffff', // Always white text regardless of mode
      }
    },
    typography: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-1px' },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
    },
    shape: { borderRadius: 18 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            ...(mode === 'dark' ? {
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
              backgroundColor: 'rgba(24,28,44,0.85)',
              border: '1.5px solid #232a3a',
            } : {
              // High-contrast for light mode
              background: '#ffffff',
              boxShadow: '0 12px 24px 0 rgba(0,0,0,0.06)',
              border: '2px solid #e5e7eb',
              backgroundColor: '#ffffff',
            })
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
          outlined: {
            ...(mode === 'light' && {
              borderColor: '#bfdbfe',
              '&:hover': {
                borderColor: '#93c5fd',
                backgroundColor: 'rgba(37,99,235,0.04)',
              },
            }),
          },
        },
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
            }),
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: mode === 'light' ? 'white' : undefined,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            ...(mode === 'light' && {
              backgroundColor: '#334155',
              '& .MuiMenuItem-root': {
                color: 'white'
              }
            }),
          },
        },
      },
    },
  });
}

function AlertSection({ alerts, onExpand, timeZone, setFilters, setExpandedState }: { 
  alerts: typeof mockContainers, 
  onExpand: () => void,
  timeZone: string,
  setFilters: React.Dispatch<React.SetStateAction<{
    cpu: number;
    cpuOp: string;
    mem: number;
    memOp: string;
    region: string[];
    host: string;
    customer: string;
    timeRange: string;
  }>>,
  setExpandedState: (expanded: boolean) => void
}) {
  const theme = useMuiTheme();
  const isLight = theme.palette.mode === 'light';
  // Use localStorage to remember accordion state between sessions
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('alertsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Sync internal expanded state with external state control
  const handleExpandChange = (newExpandedValue: boolean) => {
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
  const handleShowFull = (hostValue: string) => {
    // Set the host filter
    setFilters(f => ({ ...f, host: hostValue.toLowerCase() }));
    // Collapse the alerts section
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
      }}
    >
      <AccordionSummary
        expandIcon={
          <Box sx={{ 
            transition: 'transform 0.3s ease, background-color 0.3s ease',
            width: 28, 
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: expanded ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)',
            '&:hover': {
              bgcolor: 'rgba(255,59,48,0.25)',
            }
          }}>
            <ExpandMore 
              sx={{ 
                color: 'error.main',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.3s ease',
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
          bgcolor: isLight ? 
            'rgba(255,59,48,0.08)' : 
            'rgba(255,59,48,0.05)',
          borderLeft: '3px solid',
          borderColor: 'error.main',
          '&:hover': {
            bgcolor: isLight ? 
              'rgba(255,59,48,0.12)' : 
              'rgba(255,59,48,0.08)',
          },
          '&.Mui-expanded': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            color: 'error.main',
            transition: 'opacity 0.3s ease',
            opacity: expanded ? 1 : 0.9,
          }}>
            <WarningIcon sx={{ 
              mr: 1, 
              fontSize: 20,
              animation: expanded && alerts.length >= 3 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 }
              }
            }} /> 
            Active Alerts ({alerts.length})
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary', 
            fontWeight: 500, 
            mr: 2,
            transition: 'opacity 0.3s ease',
            opacity: 0.8,
            '&:hover': {
              opacity: 1,
            } 
          }}>
            {expanded ? 'Click to hide' : 'Click to show'}
          </Typography>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ 
        p: 2, 
        pt: 3,
        transition: 'all 0.4s ease',
        opacity: expanded ? 1 : 0,
      }}>
        <Grid container spacing={2} className="alert-grid">
          {alerts.slice(0, alerts.length > 5 && !onExpand ? 5 : alerts.length).map((container, index) => {
            // Use the same customer name logic as in container tiles
            const getCustomerName = (id: string) => {
              const customerNames = [
                "Tiny Tots Daycare", 
                "Little Learners Academy", 
                "Sunshine Kids Center", 
                "Happy Hearts Preschool", 
                "Bright Beginnings", 
                "Rainbow Children's Place", 
                "Precious Moments Childcare", 
                "Growing Stars Montessori", 
                "Playful Pandas Learning", 
                "Butterfly Fields Daycare", 
                "Cuddle Bears Nursery", 
                "Stepping Stones Kids"
              ];
              
              if (id === '1' || id === '7') {
                return "Tiny Tots Daycare";
              }
              
              if (id === '3' || id === '9') {
                return "Sunshine Kids Center";
              }
              
              return customerNames[parseInt(id) % customerNames.length];
            };
            
            const customerName = getCustomerName(container.id);
            
            // Get max value to determine severity
            const cpuValue = container.stats[container.stats.length-1].cpu;
            const memValue = container.stats[container.stats.length-1].mem;
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
                }}
              >
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
                    background: isLight ? 
                      `linear-gradient(135deg, #334155 0%, ${isCritical ? '#472a2a' : '#1e293b'} 100%)` : 
                      `linear-gradient(135deg, rgba(24,28,44,0.95) 0%, ${isCritical ? 'rgba(54,17,17,0.95)' : 'rgba(17,27,54,0.95)'} 100%)`,
                    boxShadow: isCritical ? 
                      '0 4px 20px rgba(255,59,48,0.15)' : 
                      '0 4px 20px rgba(0,0,0,0.15)',
                    '&:hover': {
                      boxShadow: isCritical ? 
                        '0 8px 25px rgba(255,59,48,0.2)' : 
                        '0 8px 25px rgba(0,0,0,0.2)',
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    },
                    position: 'relative', // Add relative positioning to the paper container
                    overflow: 'hidden' // Ensure alert badge doesn't overflow
                  }}
                >
                  {/* Customer name - first row */}
                  <Typography variant="subtitle1" sx={{ 
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
                    }}
                  >
                    <MonitorHeart sx={{ fontSize: 14, mr: 0.5 }} /> {isCritical ? 'Critical' : 'Alert'}
                  </Box>
                  
                  {/* Hostname - second row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {container.label}
                    </Typography>
                  </Box>
                  
                  {/* Alert values - third row */}
                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>CPU</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 700, 
                          color: cpuValue >= 90 ? 'error.main' : 
                                 cpuValue >= 80 ? 'error.light' : 'white',
                          ...(cpuValue >= 90 && {
                            animation: 'valueFlash 1.5s infinite',
                            '@keyframes valueFlash': {
                              '0%': { color: 'error.main' },
                              '50%': { color: 'white' },
                              '100%': { color: 'error.main' }
                            }
                          })
                        }}
                      >
                        {cpuValue}%
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Memory</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 700, 
                          color: memValue >= 90 ? 'error.main' : 
                                 memValue >= 80 ? 'error.light' : 'white',
                          ...(memValue >= 90 && {
                            animation: 'valueFlash 1.5s infinite',
                            '@keyframes valueFlash': {
                              '0%': { color: 'error.main' },
                              '50%': { color: 'white' },
                              '100%': { color: 'error.main' }
                            }
                          })
                        }}
                      >
                        {memValue}%
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Last Updated</Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 500, 
                        color: 'white',
                        fontSize: '0.75rem',
                        lineHeight: 1.3,
                        mt: 0.5
                      }}>
                        {formatDateTime(
                          timeStringToFullDate(container.stats[container.stats.length-1].time), 
                          timeZone, 
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          }
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Action buttons - fourth row */}
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      Show Full
                    </Button>
                    
                    {/* Clear Alert Button in right corner */}
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      startIcon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                            borderColor: 'error.main',
                          }
                        }),
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(255,59,48,0.2)',
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      Clear Alert
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        
        {/* Only show the "Show all" button when there are 5+ alerts and we're not already showing all */}
        {alerts.length > 5 && !expanded && (
          <Box sx={{ 
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
              startIcon={<Box 
                component="span" 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'rgba(37,99,235,0.15)',
                }} 
              >+</Box>}
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
                  background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 70%)',
                  transform: 'translateX(-100%)',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
                  '&::after': {
                    transition: 'transform 1s',
                    transform: 'translateX(100%)',
                  }
                }
              }}
            >
              {`Show all (${alerts.length})`}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function FiltersSection({ filters, setFilters }: { 
  filters: {
    cpu: number;
    cpuOp: string;
    mem: number;
    memOp: string;
    region: string[];
    host: string;
    customer: string;
    timeRange: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    cpu: number;
    cpuOp: string;
    mem: number;
    memOp: string;
    region: string[];
    host: string;
    customer: string;
    timeRange: string;
  }>>;
}) {
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
    <Paper sx={{ 
      p: 2, 
      mb: 3,
      ...(isLight ? {
        backgroundColor: '#334155',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        border: '2px solid #475569',
        color: 'white',
      } : {})
    }}>
      <Grid container spacing={2} alignItems="center" wrap="nowrap">
        <Grid item xs={7} sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography gutterBottom sx={{ color: 'white' }}>Customer Name</Typography>
            <TextField
              fullWidth
              value={filters.customer}
              onChange={e => setFilters((f: any) => ({ ...f, customer: e.target.value }))}
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
            <Typography gutterBottom sx={{ color: 'white' }}>Host Name</Typography>
            <TextField
              fullWidth
              value={filters.host}
              onChange={e => setFilters((f: any) => ({ ...f, host: e.target.value }))}
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
            <Typography gutterBottom sx={{ color: 'white' }}>Region</Typography>
            <Select
              fullWidth
              multiple
              value={filters.region}
              onChange={(e) => {
                const value = e.target.value as string[];
                
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
                if ((selected as string[]).length === 0) {
                  return <span style={{ opacity: 0.6 }}>All regions</span>;
                }
                
                if ((selected as string[]).includes('all')) {
                  return <span>All regions</span>;
                }
                
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
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
                          backgroundColor: 'rgba(37,99,235,0.4)',
                        }
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }
                    }
                  }
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
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
              }}
            >
              <MenuItem value="all" sx={{ fontWeight: 'bold' }}>Select All Regions</MenuItem>
              <MenuItem value="us-east-1">us-east-1</MenuItem>
              <MenuItem value="us-west-2">us-west-2</MenuItem>
              <MenuItem value="On-Prem">On-Prem</MenuItem>
              {/* Add more regions as needed */}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Box>
            <Typography gutterBottom sx={{ color: 'white' }}>CPU Usage (%)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                value={filters.cpuOp}
                onChange={e => setFilters((f: any) => ({ ...f, cpuOp: e.target.value }))}
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
                }}
              >
                <MenuItem value=">">&gt;</MenuItem>
                <MenuItem value=">=">&ge;</MenuItem>
                <MenuItem value="<">&lt;</MenuItem>
                <MenuItem value="<=">&le;</MenuItem>
              </Select>
              <TextField
                type="number"
                value={filters.cpu}
                onChange={e => setFilters((f: any) => ({ ...f, cpu: Number(e.target.value) }))}
                inputProps={{ min: 0, max: 100, step: 1 }}
                InputProps={inputProps}
                size="small"
                sx={{ width: 80, ...inputStyles }}
              />
              <Typography sx={{ color: 'white' }}>%</Typography>
            </Box>
          </Box>
          <Box>
            <Typography gutterBottom sx={{ color: 'white' }}>Memory Usage (%)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                value={filters.memOp}
                onChange={e => setFilters((f: any) => ({ ...f, memOp: e.target.value }))}
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
                }}
              >
                <MenuItem value=">">&gt;</MenuItem>
                <MenuItem value=">=">&ge;</MenuItem>
                <MenuItem value="<">&lt;</MenuItem>
                <MenuItem value="<=">&le;</MenuItem>
              </Select>
              <TextField
                type="number"
                value={filters.mem}
                onChange={e => setFilters((f: any) => ({ ...f, mem: Number(e.target.value) }))}
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

function HeaderBar({ mode, setMode, timeZone, setTimeZone }: { 
  mode: 'light' | 'dark', 
  setMode: (m: 'light' | 'dark') => void,
  timeZone: string,
  setTimeZone: (tz: string) => void 
}) {
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
    <Box sx={{
      position: 'fixed',
      left: 0,
      right: 0,
      top: 0,
      height: 64,
      bgcolor: mode === 'dark' ? 'rgba(24,28,44,0.92)' : '#334155', // Dark background in light mode
      display: 'flex',
      alignItems: 'center',
      px: 4,
      zIndex: 1100,
      borderBottom: '1.5px solid',
      borderColor: mode === 'dark' ? 'rgba(80,80,120,0.10)' : '#475569',
    }}>
      <Typography variant="h4" sx={{ color: 'primary.main', flex: 1, fontWeight: 800, letterSpacing: '-1px' }}>
        ZOOMiN LiVE
      </Typography>
      
      {/* Time Zone Selector */}
      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        <Box component="span" sx={{ 
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
              fontSize: '0.85rem',
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
          }}
        >
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
          color: '#ffffff', // Ensure icon is white
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'transparent',
          '&:hover': {
            bgcolor: mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
          }
        }} 
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <IconButton 
        sx={{ 
          color: '#ffffff', // Ensure icon is white
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'transparent',
          '&:hover': {
            bgcolor: mode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
          }
        }}
      >
        <AccountCircle fontSize="large" />
      </IconButton>
    </Box>
  );
}

import type { TooltipProps } from 'recharts';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';

const StyledTooltip = styled('div')(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
  color: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 5px 20px 0 rgba(0,20,80,0.15)',
  padding: '12px 18px',
  fontSize: 14,
  fontWeight: 500,
  border: theme.palette.mode === 'dark' 
    ? `1.5px solid ${theme.palette.primary.main}22` 
    : `1.5px solid ${theme.palette.primary.main}55`,
  minWidth: 120,
}));

function CustomTooltip({ active, payload, label, timeZone }: TooltipProps<any, any> & { timeZone?: string }) {
  if (!active || !payload || !payload.length) return null;
  // Find cpu and mem values from payload
  let cpu, mem;
  payload.forEach((p: any) => {
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
      <div style={{ color: '#2563eb', marginBottom: 2 }}>CPU: <b>{cpu ?? '-'}%</b></div>
      <div style={{ color: '#a855f7' }}>Mem: <b>{mem ?? '-'}%</b></div>
    </StyledTooltip>
  );
}

function ContainerTile({ container, timeRange, setFilters, timeZone }: { 
  container: { 
    id: string; 
    label: string; 
    cpu: string; 
    upSince: string; 
    region: string; 
    host: string; 
    onPrem?: boolean;
    stats: { time: string; cpu: number; mem: number }[];
  }; 
  timeRange: string;
  timeZone: string;
  setFilters: React.Dispatch<React.SetStateAction<{
    cpu: number;
    cpuOp: string;
    mem: number;
    memOp: string;
    region: string[];
    host: string;
    customer: string;
    timeRange: string;
  }>>;
}) {
  // For demo, generate a fake memory value per container (e.g., 2024, 4096, 8192, etc.)
  const fakeMemMb = 2024 + (parseInt(container.id) % 4) * 2048; // 2024, 4072, 6120, 8168
  const theme = useMuiTheme();
  
  // Add state for tag and update dialog
  const [tag, setTag] = useState("1.3.14");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const [updateRunArgs, setUpdateRunArgs] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyConfirmDialogOpen, setModifyConfirmDialogOpen] = useState(false);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [dockerArgs, setDockerArgs] = useState("");
  const [updateNotification, setUpdateNotification] = useState(false);
  const [debugNotification, setDebugNotification] = useState(false);
  const [debugTimeRemaining, setDebugTimeRemaining] = useState(60); // Debug time in minutes
  const [debugActive, setDebugActive] = useState(false);
  
  // Handler for update dialog
  const handleUpdateClick = () => {
    setNewTagValue(tag); // Initialize with current tag
    setUpdateRunArgs("-p 8080:8080"); // Initialize with some default run args
    setUpdateDialogOpen(true);
  };
  
  // Handler for restart dialog
  const handleRestartClick = () => {
    setRestartDialogOpen(true);
  };
  
  // Handler for modify dialog
  const handleModifyClick = () => {
    // Initialize with some default args as example
    setDockerArgs("-p 8080:8080 --memory=2g --cpus=1.5");
    setModifyDialogOpen(true);
  };
  
  // Handler for proceeding to modify confirmation
  const handleProceedToModifyConfirm = () => {
    setModifyDialogOpen(false);
    setModifyConfirmDialogOpen(true);
  };
  
  // Handler for confirming modify
  const handleConfirmModify = () => {
    // Here you would add the actual modify logic to apply the Docker args
    setModifyConfirmDialogOpen(false);
  };
  
  // Handler for canceling modify
  const handleCancelModify = () => {
    setModifyDialogOpen(false);
  };
  
  // Handler for canceling modify confirmation
  const handleCancelModifyConfirm = () => {
    setModifyConfirmDialogOpen(false);
  };
  
  // Helper function to format time remaining in a user-friendly way
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 1) return "Less than a minute";
    if (minutes === 1) return "1 minute";
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return hours === 1 ? "1 hour" : `${hours} hours`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Handler for debug dialog
  const handleDebugClick = () => {
    setDebugDialogOpen(true);
    // Reset timer to 60 minutes when opening the dialog
    setDebugTimeRemaining(60);
  };
  
  // Handler for confirming debug
  const handleConfirmDebug = () => {
    // Here you would add the actual debug mode logic
    setDebugDialogOpen(false);
    
    // Show notification that debug mode is enabled
    setDebugNotification(true);
    setDebugActive(true);
    
    console.log("Debug mode activated for container:", container.label);
  };
  
  // Debug mode timer effect
  useEffect(() => {
    let debugInterval: ReturnType<typeof setInterval>;
    
    if (debugActive) {
      // Start countdown timer
      debugInterval = setInterval(() => {
        setDebugTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Clear interval when time is up
            clearInterval(debugInterval);
            setDebugActive(false);
            setDebugNotification(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 60000); // Update every minute
    }
    
    // Clean up interval on unmount or when debug mode is turned off
    return () => {
      if (debugInterval) clearInterval(debugInterval);
    };
  }, [debugActive]);
  
  // Handler for canceling debug
  const handleCancelDebug = () => {
    setDebugDialogOpen(false);
  };
  
  // Handler for confirming restart
  const handleConfirmRestart = () => {
    // Here you would add the actual restart logic
    setRestartDialogOpen(false);
  };
  
  // Handler for canceling restart
  const handleCancelRestart = () => {
    setRestartDialogOpen(false);
  };
  
  // Handler for closing dialog
  const handleCloseDialog = () => {
    setUpdateDialogOpen(false);
    setNewTagValue("");
  };
  
  // Handler for proceeding to confirmation
  const handleProceedToConfirm = () => {
    setUpdateDialogOpen(false);
    setConfirmDialogOpen(true);
  };
  
  // Handler for confirming update
  const handleConfirmUpdate = () => {
    setTag(newTagValue); // Update the tag
    // Here you would add the actual update logic with both tag and run arguments
    console.log(`Updating container with tag ${newTagValue} and args: ${updateRunArgs}`);
    setConfirmDialogOpen(false);
    
    // Show notification
    setUpdateNotification(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setUpdateNotification(false);
    }, 5000);
  };
  
  // Handler for canceling confirmation
  const handleCancelConfirm = () => {
    setConfirmDialogOpen(false);
    setNewTagValue("");
  };
  
  // Filter data based on selected time range
  const getFilteredStats = () => {
    // Default to showing all stats if we don't have enough data for filtering
    if (container.stats.length <= 4) return container.stats;
    
    // Filter based on time range
    switch(timeRange) {
      case '24h':
        // For demo, show last 4-6 entries (simulate 24 hours)
        return container.stats.slice(-Math.min(6, container.stats.length));
      case '48h':
        // For demo, show last 6-8 entries (simulate 48 hours)
        return container.stats.slice(-Math.min(8, container.stats.length));
      case '7d':
        // For demo, show last 8-10 entries (simulate 7 days)
        return container.stats.slice(-Math.min(10, container.stats.length));
      case '30d':
        // For 30d, show all available data points
        return container.stats;
      default:
        return container.stats.slice(-Math.min(6, container.stats.length)); // Default to 24h
    }
  };
  
  // Get filtered stats based on selected time range
  const filteredStats = getFilteredStats();
  
  // Create light mode specific styles
  const lightModeStyles = theme.palette.mode === 'light' ? {
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', 
    border: '2px solid #475569',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
    backgroundColor: '#334155', // Dark background for light mode tiles
  } : {};
  
  // Get customer name - must match the same logic in the App component
  const getCustomerName = (id: string) => {
    const customerNames = [
      "Tiny Tots Daycare", 
      "Little Learners Academy", 
      "Sunshine Kids Center", 
      "Happy Hearts Preschool", 
      "Bright Beginnings", 
      "Rainbow Children's Place", 
      "Precious Moments Childcare", 
      "Growing Stars Montessori", 
      "Playful Pandas Learning", 
      "Butterfly Fields Daycare", 
      "Cuddle Bears Nursery", 
      "Stepping Stones Kids"
    ];
    
    // Make containers with IDs 1 and 7 share "Tiny Tots Daycare"
    if (id === '1' || id === '7') {
      return "Tiny Tots Daycare";
    }
    
    // Make containers with IDs 3 and 9 share "Sunshine Kids Center"
    if (id === '3' || id === '9') {
      return "Sunshine Kids Center";
    }
    
    // For all other containers, use the modulo approach
    return customerNames[parseInt(id) % customerNames.length];
  };
  
  // Use container id to pick a name (ensuring consistency)
  const customerName = getCustomerName(container.id);
  
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
        position: 'relative',
        ...lightModeStyles, // Apply light mode styles directly
        '&:hover': {
          boxShadow: '0 16px 40px rgba(0,20,80,0.12)',
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        },
      }}
    >
      {/* Customer name row with Tag - first row */}
      <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
          {customerName}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'info.main', 
          fontWeight: 600, 
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          Tag: <span style={{ marginLeft: '4px' }}>{tag}</span>
        </Typography>
      </Box>

      {/* Hostname and Up since - second row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>{container.label}</Typography>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>CPU: {container.cpu}</Typography>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>Memory: {fakeMemMb} MB</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Up since</Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              display: 'block',
              fontSize: '0.7rem',
              lineHeight: 1.3
            }}
          >
            {formatDateTime(container.upSince, timeZone, {
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
              color: container.onPrem ? 'warning.main' : 'info.main',
              fontWeight: 600,
              display: 'block',
              mt: 0.5,
              fontSize: '0.675rem'
            }}
          >
            On-Prem: {container.onPrem ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 160, mb: 2, mt: 2 }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={filteredStats} margin={{ top: 12, right: 8, left: 0, bottom: 12 }}>
            <XAxis dataKey="time" hide={false} tick={{ fontSize: 10, fill: 'white' }} label={{ value: 'Time', position: 'insideBottomRight', offset: 0, fontSize: 12, fill: 'white', dy: 10 }} />
            <YAxis domain={[0, 100]} hide={false} label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'white' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: theme.palette.primary.main, strokeWidth: 1, opacity: 0.2 }} />
            <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 12, color: 'white' }} />
            <Line type="monotone" dataKey="cpu" stroke="#2563eb" strokeWidth={2} dot={false} name="CPU %" />
            <Line type="monotone" dataKey="mem" stroke="#a855f7" strokeWidth={2} dot={false} name="Mem %" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Last Reported</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>CPU: <b>{container.stats[container.stats.length-1].cpu}%</b></Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>Mem: <b>{container.stats[container.stats.length-1].mem}%</b></Typography>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                display: 'block',
                fontSize: '0.7rem',
                mt: 0.5
              }}
            >
              {formatDateTime(
                timeStringToFullDate(container.stats[container.stats.length-1].time), 
                timeZone, 
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                }
              )}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Select
            size="small"
            value={timeRange}
            onChange={(e) => {
              // Use any because TypeScript doesn't know about our filter structure
              const newTimeRange = e.target.value as string;
              setFilters((f: any) => ({ ...f, timeRange: newTimeRange }));
            }}
            sx={{ 
              minWidth: '70px',
              color: 'white',
              height: '28px',
              fontSize: '0.75rem',
              '& .MuiSelect-select': {
                padding: '2px 10px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)'
              },
              '& .MuiSelect-icon': {
                color: 'white'
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: '#334155',
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    fontSize: '0.75rem',
                    minHeight: '30px',
                    paddingTop: '2px',
                    paddingBottom: '2px'
                  }
                }
              }
            }}
          >
            <MenuItem value="24h">24h</MenuItem>
            <MenuItem value="48h">48h</MenuItem>
            <MenuItem value="7d">7d</MenuItem>
            <MenuItem value="30d">30d</MenuItem>
          </Select>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button 
          size="small" 
          startIcon={<RestartAlt />} 
          color="info" 
          variant="outlined"
          onClick={handleRestartClick}
        >
          Restart
        </Button>
        <MuiTooltip title="Update container tag and run arguments">
          <Button 
            size="small" 
            startIcon={<Update />} 
            color="secondary" 
            variant="outlined"
            onClick={handleUpdateClick}
          >
            Update
          </Button>
        </MuiTooltip>
        <Button 
          size="small" 
          startIcon={<Edit />} 
          color="primary" 
          variant="outlined"
          onClick={handleModifyClick}
        >
          Modify
        </Button>
        <MuiTooltip title="Enable enhanced monitoring">
          <Button 
            size="small" 
            startIcon={<CodeIcon />} 
            color="warning" 
            variant="outlined"
            onClick={handleDebugClick}
          >
            Debug
          </Button>
        </MuiTooltip>
      </Box>
      
      {/* Update Notification */}
      <Collapse in={updateNotification}>
        <Alert 
          severity="success" 
          sx={{ 
            mt: 2, 
            bgcolor: 'rgba(46, 125, 50, 0.2)', 
            '& .MuiAlert-icon': { color: '#4caf50' },
            color: 'white',
            border: '1px solid',
            borderColor: 'rgba(46, 125, 50, 0.5)'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setUpdateNotification(false);
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          Container updated to tag <b>{tag}</b> with run arguments: <code style={{ marginLeft: '4px', padding: '2px 4px', background: 'rgba(0,0,0,0.2)' }}>{updateRunArgs}</code>
        </Alert>
      </Collapse>
      
      {/* Debug Notification */}
      <Collapse in={debugNotification}>
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2, 
            bgcolor: 'rgba(245, 158, 11, 0.2)', 
            '& .MuiAlert-icon': { color: '#f59e0b' },
            color: 'white',
            border: '1px solid',
            borderColor: 'rgba(245, 158, 11, 0.5)'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setDebugNotification(false);
                setDebugActive(false);
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Debug mode enabled for <b>{container.label}</b>
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.9 }}>
              Enhanced monitoring active with 1-minute reporting intervals
            </Typography>
          </Box>
        </Alert>
      </Collapse>
      
      {/* Update Tag Dialog */}
      <Dialog 
        open={updateDialogOpen} 
        onClose={handleCloseDialog}
        aria-labelledby="update-dialog-title"
        aria-describedby="update-dialog-description"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}
      >
        <DialogTitle id="update-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Update Container Configuration
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Please enter the new tag and run command arguments for container <b>{container.label}</b>:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.target.value)}
            InputProps={{
              sx: { 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.main'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          <TextField
            margin="dense"
            label="Run Command Arguments"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={updateRunArgs}
            onChange={(e) => setUpdateRunArgs(e.target.value)}
            placeholder="e.g. -p 8080:8080 --memory=2g"
            sx={{ mt: 2 }}
            InputProps={{
              sx: { 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.main'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>Cancel</Button>
          <Button 
            onClick={handleProceedToConfirm} 
            variant="contained" 
            color="secondary"
            disabled={!newTagValue.trim()}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelConfirm}
        aria-labelledby="confirm-dialog-title"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}
      >
        <DialogTitle id="confirm-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Confirm Update
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Are you sure you want to update container <b>{container.label}</b> to tag <b>{newTagValue}</b>?
          </DialogContentText>
          {updateRunArgs && (
            <Box sx={{ 
              bgcolor: 'rgba(0,0,0,0.15)', 
              p: 1.5, 
              borderRadius: 1, 
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflowX: 'auto',
              mt: 1
            }}>
              <Typography variant="caption" sx={{ color: 'info.main', display: 'block', mb: 1 }}>
                Run command arguments:
              </Typography>
              <pre style={{ margin: 0, color: '#2563eb' }}>
                {updateRunArgs}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelConfirm} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleConfirmUpdate} variant="contained" color="secondary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Restart Confirmation Dialog */}
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
        }}
      >
        <DialogTitle id="restart-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Confirm Restart
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white' }}>
            Are you sure you want to restart container <b>{container.label}</b>? This may cause a brief service interruption.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelRestart} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleConfirmRestart} variant="contained" color="info">
            Restart
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modify Docker Arguments Dialog */}
      <Dialog 
        open={modifyDialogOpen} 
        onClose={handleCancelModify}
        aria-labelledby="modify-dialog-title"
        aria-describedby="modify-dialog-description"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24,28,44,0.95)' : '#334155',
            color: 'white',
            minWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1.5px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569'
          }
        }}
      >
        <DialogTitle id="modify-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Modify Container Configuration
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Enter new Docker run command arguments for container <b>{container.label}</b>:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Docker Arguments"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={dockerArgs}
            onChange={(e) => setDockerArgs(e.target.value)}
            placeholder="e.g. -p 8080:8080 --memory=2g --cpus=1.5"
            InputProps={{
              sx: { 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelModify} sx={{ color: 'white' }}>Cancel</Button>
          <Button 
            onClick={handleProceedToModifyConfirm} 
            variant="contained" 
            color="primary"
            disabled={!dockerArgs.trim()}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
      
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
        }}
      >
        <DialogTitle id="modify-confirm-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Confirm Configuration Changes
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Are you sure you want to apply these Docker arguments to <b>{container.label}</b>? 
            The container will need to be recreated with the new configuration.
          </DialogContentText>
          <Box sx={{ 
            bgcolor: 'rgba(0,0,0,0.15)', 
            p: 1.5, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            overflowX: 'auto'
          }}>
            <pre style={{ margin: 0, color: '#2563eb' }}>
              docker run {dockerArgs} {container.label}:{tag}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelModifyConfirm} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleConfirmModify} variant="contained" color="primary">
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Debug Mode Confirmation Dialog */}
      <Dialog
        open={debugDialogOpen}
        onClose={handleCancelDebug}
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
        }}
      >
        <DialogTitle id="debug-dialog-title" sx={{ 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(80,80,120,0.15)' : '#475569',
          pb: 2
        }}>
          Enable Debug Mode
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: 'white', mb: 2 }}>
            Turning on Debug mode will set this container's reporting interval to every <b>(1) minute</b> for the next hour.
          </DialogContentText>
          
          <Box sx={{ 
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
                Container: <b>{container.label}</b> 
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
          
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            Debug mode helps diagnose issues by temporarily increasing monitoring frequency.
            This can impact container performance.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelDebug} sx={{ color: 'white' }}>Cancel</Button>
          <Button 
            onClick={handleConfirmDebug} 
            variant="contained" 
            color="warning"
            startIcon={<CodeIcon />}
          >
            Enable for 60 minutes
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function App() {
  const [filters, setFilters] = useState<{
    cpu: number;
    cpuOp: string;
    mem: number;
    memOp: string;
    region: string[];
    host: string;
    customer: string;
    timeRange: string;
  }>({
    cpu: 80,
    cpuOp: '>=',
    mem: 80,
    memOp: '>=',
    region: [], // Changed to empty array for multi-select
    host: '',
    customer: '',
    timeRange: '24h', // Default time range is 24 hours
  });
  const [alertExpand, setAlertExpand] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [timeZone, setTimeZone] = useState(() => {
    // Try to get the saved time zone from localStorage, default to UTC
    const savedTimeZone = localStorage.getItem('preferredTimeZone');
    // Attempt to get the user's browser time zone as an alternative default
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return savedTimeZone || browserTimeZone || 'UTC';
  });

  // Update time zone in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredTimeZone', timeZone);
  }, [timeZone]);

  // Update document body attribute for CSS selectors
  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = getTheme(mode);

  // Generate customer name function to ensure consistency
  const getCustomerName = (id: string) => {
    const customerNames = [
      "Tiny Tots Daycare", 
      "Little Learners Academy", 
      "Sunshine Kids Center", 
      "Happy Hearts Preschool", 
      "Bright Beginnings", 
      "Rainbow Children's Place", 
      "Precious Moments Childcare", 
      "Growing Stars Montessori", 
      "Playful Pandas Learning", 
      "Butterfly Fields Daycare", 
      "Cuddle Bears Nursery", 
      "Stepping Stones Kids"
    ];
    
    // Make containers with IDs 1 and 7 share "Tiny Tots Daycare"
    if (id === '1' || id === '7') {
      return "Tiny Tots Daycare";
    }
    
    // Make containers with IDs 3 and 9 share "Sunshine Kids Center"
    if (id === '3' || id === '9') {
      return "Sunshine Kids Center";
    }
    
    // For all other containers, use the modulo approach
    return customerNames[parseInt(id) % customerNames.length];
  };

  // Filter logic (mocked for now)
  const cpuCompare = (val: number, op: string, ref: number) => {
    switch (op) {
      case '>': return val > ref;
      case '>=': return val >= ref;
      case '<': return val < ref;
      case '<=': return val <= ref;
      default: return true;
    }
  };
  const filteredContainers = mockContainers.filter(c => {
    // Get customer name for current container (same as what's displayed in the tile)
    const customerName = getCustomerName(c.id);
    
    // Region filter logic
    const regionFilterPassed = 
      filters.region.length === 0 || 
      filters.region.includes('all') || 
      (filters.region.includes('On-Prem') && c.onPrem === true) || 
      (filters.region.some(r => r !== 'On-Prem' && r === c.region));
    
    // Customer name filter
    const customerFilterPassed = 
      filters.customer === '' || 
      customerName.toLowerCase().includes(filters.customer.toLowerCase());
    
    // Hostname filter
    const hostFilterPassed = 
      filters.host === '' || 
      c.host.includes(filters.host) || 
      c.label.toLowerCase().includes(filters.host.toLowerCase());
    
    return regionFilterPassed && 
           customerFilterPassed && 
           hostFilterPassed &&
           (c.stats.some(s => cpuCompare(s.cpu, filters.cpuOp, filters.cpu)) ||
            c.stats.some(s => cpuCompare(s.mem, filters.memOp, filters.mem)));
  });
  // Filter containers that have CPU or Memory values over 80% to display as alerts
  const alertContainers = mockContainers.filter(c =>
    c.stats.some(s => s.cpu >= 80 || s.mem >= 80)
  ).sort((a, b) => {
    // Sort by the highest max value (either CPU or Memory) in descending order
    const maxA = Math.max(
      a.stats[a.stats.length-1].cpu,
      a.stats[a.stats.length-1].mem
    );
    const maxB = Math.max(
      b.stats[b.stats.length-1].cpu,
      b.stats[b.stats.length-1].mem
    );
    return maxB - maxA;
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <Sidebar /> */}
      <HeaderBar 
        mode={mode} 
        setMode={setMode} 
        timeZone={timeZone} 
        setTimeZone={setTimeZone} 
      />
      <Box sx={{
        // Remove sidebar padding
        pl: 0,
        pt: 10,
        bgcolor: mode === 'dark' ? '#101624' : '#edf2f7', // Hard-code background color
        minHeight: '100vh',
        transition: 'padding 0.2s',
      }}>
        <Box sx={{ maxWidth: '100%', mx: 0, pb: 6, px: { xs: 1, sm: 2, md: 4, lg: 6 } }}>
          <AlertSection 
            alerts={alertExpand ? alertContainers : alertContainers} 
            onExpand={() => setAlertExpand(!alertExpand)} 
            timeZone={timeZone}
            setFilters={setFilters}
            setExpandedState={(expanded) => {
              // Update the state and persist to localStorage
              setAlertExpand(expanded);
              localStorage.setItem('alertsExpanded', JSON.stringify(expanded));
            }}
          />
          <FiltersSection filters={filters} setFilters={setFilters} />
          <Box>
            {filteredContainers.length === 0 ? (
              <Typography>No containers match the filters.</Typography>
            ) : (
              <Grid container spacing={3}>
                {filteredContainers.map(container => (
                  <Grid item xs={12} sm={6} md={3} key={container.id}>
                    <ContainerTile 
                      container={container} 
                      timeRange={filters.timeRange}
                      setFilters={setFilters}
                      timeZone={timeZone}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
