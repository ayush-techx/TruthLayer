const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// A simple test route to make sure the server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the TruthLayer backend!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});