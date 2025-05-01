import React from 'react';
import { Container, Typography, Button, Grid, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Home() {
  return (
    <Box>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Never Miss an Expiration Date Again
          </Typography>
          <Typography variant="h5" paragraph>
            Track your grocery items, get expiration alerts, and manage your food inventory with ease.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mr: 2 }}
            >
              Sign Up
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="inherit"
              size="large"
            >
              Login
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Track Expiration Dates
              </Typography>
              <Typography>
                Keep track of all your grocery items and their expiration dates in one place.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Get Email Alerts
              </Typography>
              <Typography>
                Receive timely notifications when your items are about to expire.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="h5" component="h2" gutterBottom color="primary">
                Easy Management
              </Typography>
              <Typography>
                Add, edit, and remove items with a simple and intuitive interface.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Home; 