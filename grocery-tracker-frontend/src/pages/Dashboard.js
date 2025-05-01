import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import config from '../config';

function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    expired: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }

    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError('User not found. Please log in again.');
        return;
      }

      const response = await axios.get(`${config.apiUrl}/api/items/${user.id}`);
      
      // Check if response is successful and has items
      if (!response.data.success || !Array.isArray(response.data.items)) {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }

      const items = response.data.items;
      console.log('Fetched items:', items); // Debug log
      setItems(items);
      
      // Calculate stats
      const today = new Date();
      const expiring = items.filter(item => {
        const expDate = new Date(item.expirationDate);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
      });
      
      const expired = items.filter(item => {
        const expDate = new Date(item.expirationDate);
        return expDate < today;
      });

      setStats({
        total: items.length,
        expiring: expiring.length,
        expired: expired.length,
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items');
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.delete(`${config.apiUrl}/api/items/${itemId}`, {
        data: { userId: user.id }
      });
      
      if (response.data.success) {
        fetchItems();
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleSendEmail = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError('User not found. Please log in again.');
        return;
      }

      console.log('Sending email alerts for user:', user.id);
      const response = await axios.post(`${config.apiUrl}/api/items/${user.id}/send-alerts`);
      console.log('Email response:', response.data);
      
      if (response.data.success) {
        setError('');
        // Show success message
        alert(response.data.message || 'Expiration alerts sent successfully!');
      } else {
        setError(response.data.message || 'Failed to send email alerts');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to send email alerts');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Dashboard
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Items</Typography>
                <Typography variant="h3">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expiring Soon</Typography>
                <Typography variant="h3">{stats.expiring}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expired</Typography>
                <Typography variant="h3">{stats.expired}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-item')}
          >
            Add New Item
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={handleSendEmail}
          >
            Send Expiration Alerts
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="grocery items table">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Expiration Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(item.expirationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/edit-item/${item.id}`)}
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        startIcon={<DeleteIcon />}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
}

export default Dashboard; 