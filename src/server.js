const express = require('express');
const path = require('path');
const fs = require('fs');
const { loadDataset, minMaxScale, FEATURES } = require('./mining/preprocess');
const { calculateElbow } = require('./mining/evaluate');
const { runClustering } = require('./mining/kmeans');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, '../data/patients.csv');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/cluster', async (req, res) => {
  try {
    const k = parseInt(req.query.k) || 3;
    const rawData = await loadDataset(DATA_PATH);
    const { scaledMatrix, bounds, features } = minMaxScale(rawData, FEATURES);
    const result = runClustering(rawData, scaledMatrix, bounds, features, k);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/elbow', async (req, res) => {
  try {
    const rawData = await loadDataset(DATA_PATH);
    const { scaledMatrix } = minMaxScale(rawData, FEATURES);
    const elbowData = calculateElbow(scaledMatrix, 2, 6);
    res.json({ success: true, elbowData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a new patient dynamically from the UI
app.post('/api/patients', async (req, res) => {
  try {
    const { age, bmi, fasting_blood_sugar, systolic_bp, physical_activity_days } = req.body;
    const rawData = await loadDataset(DATA_PATH);
    const nextId = 'P' + String(rawData.length + 1).padStart(3, '0');
    const newRow = `\n${nextId},${age},${bmi},${fasting_blood_sugar},${systolic_bp},${physical_activity_days}`;
    fs.appendFileSync(DATA_PATH, newRow);
    res.json({ success: true, patient_id: nextId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Patient Clustering Server running on port ${PORT}`);
  console.log(` Open in browser: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
