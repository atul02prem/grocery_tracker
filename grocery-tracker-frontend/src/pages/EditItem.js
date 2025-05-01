import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function EditItem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    item_name: '',
    purchase_date: '',
    expiration_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          setError('User not found. Please log in again.');
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/items/${user.id}`);
        const item = response.data.items.find(item => item.id === parseInt(id));
        
        if (item) {
          setFormData({
            item_name: item.itemName,
            purchase_date: item.purchaseDate.split('T')[0],
            expiration_date: item.expirationDate.split('T')[0],
          });
        } else {
          setError('Item not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError('User not found. Please log in again.');
        return;
      }

      const response = await axios.put(`http://localhost:3000/api/items/${id}`, {
        userId: user.id,
        itemName: formData.item_name,
        purchaseDate: formData.purchase_date,
        expirationDate: formData.expiration_date
      });

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to update item');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Edit Item
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Item Name"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Purchase Date"
            name="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={handleChange}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="Expiration Date"
            name="expiration_date"
            type="date"
            value={formData.expiration_date}
            onChange={handleChange}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Update Item
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default EditItem; 