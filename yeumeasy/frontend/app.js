const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const webRoutes = require('./routes/web');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
  next();
});

app.use('/', webRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});