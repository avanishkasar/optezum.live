const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api', express.static('src/public'));

const limiter = rateLimit({windowMs: 60*1000, max: 60});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => res.json({ok: true}));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port', process.env.PORT || 3000);
});
