
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS only for your frontend origin (change as needed)
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend origin in production
}));

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Forward the fetch request to the actual scraping backend URL
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
    }

    // Assuming backend returns JSON data
    const data = await response.json();

    // Respond to frontend with scraped data and CORS headers
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server listening at http://localhost:${PORT}`);
});
