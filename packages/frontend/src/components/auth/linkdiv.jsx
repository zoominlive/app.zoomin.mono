import { Box, Stack } from '@mui/material';

const LinkDiv = () => {
  return (
    <Stack direction="row" justifyContent="space-evenly" px={5} mt={2} className="link-wraper">
      <a href="https://www.zoominlive.com/privacy-policy" rel="noreferrer" target="_blank">
        Privacy Policy
      </a>
      <Box component="span">.</Box>
      <a href="https://www.zoominlive.com/terms-conditions" rel="noreferrer" target="_blank">
        Terms Of Service
      </a>
    </Stack>
  );
};

export default LinkDiv;
