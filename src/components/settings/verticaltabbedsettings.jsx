/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Stack, Tabs, Tab, Typography, Paper, styled } from '@mui/material';
import { blue, grey } from '@mui/material/colors';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';

const tabData = [
  {
    label: 'Customer Profile',
    content: 'My Projects',
    icon: <ListAltOutlinedIcon />
  },
  {
    label: 'Locations',
    content: 'Account Settings',
    icon: <BuildCircleOutlinedIcon />
  },
  {
    label: 'Cameras',
    content: 'Payment Information',
    icon: <PaymentOutlinedIcon />
  }
];

export default function CustomThemeTextField() {
  const [value, setValue] = React.useState(0);
  return (
    <Stack direction="row" gap={2}>
      <Tabs
        orientation="vertical"
        indicatorColor="white"
        value={value}
        onChange={(_event, newValue) => setValue(newValue)}
        sx={{
          '& .MuiTabs-flexContainer': {
            gap: 1
          }
        }}>
        {tabData.map((tab, index) => (
          <StyledTab
            key={index}
            label={
              <Stack direction="row" alignItems="center" gap={1}>
                {tab.icon}
                <Box>
                  <Typography whiteSpace="nowrap">{tab.label}</Typography>
                </Box>
              </Stack>
            }
          />
        ))}
      </Tabs>
      {tabData.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Stack>
  );
}

const StyledTab = styled(Tab)(({ theme }) => ({
  alignItems: 'flex-start',
  border: '1px solid',
  borderColor: grey[300],
  textTransform: 'none',
  backgroundColor: grey[50],
  borderRadius: '12px',
  padding: '24px',
  transition: 'all 0.2s ease-in-out',
  '& p': {
    color: grey[600]
  },
  '& svg': {
    fontSize: 30,
    color: grey[500]
  },
  '&.Mui-selected, &:hover': {
    backgroundColor: '#fff',
    boxShadow: theme.shadows[3],
    '& p': {
      color: blue[500]
    },
    '& svg': {
      color: blue[400]
    }
  }
}));

const TabPanel = ({ children, value, index }) => {
  return (
    value === index && (
      <Paper elevation={3} sx={{ p: 3, width: '60%', borderRadius: '12px' }}>
        {children}
      </Paper>
    )
  );
};
