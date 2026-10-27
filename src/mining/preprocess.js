const fs = require('fs');
const csv = require('csv-parser');

const FEATURES = ['age', 'bmi', 'fasting_blood_sugar', 'systolic_bp', 'physical_activity_days'];

function loadDataset(filePath) {
  return new Promise((resolve, reject) => {
    const rawData = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rawData.push({
          patient_id: row.patient_id,
          age: parseFloat(row.age),
          bmi: parseFloat(row.bmi),
          fasting_blood_sugar: parseFloat(row.fasting_blood_sugar),
          systolic_bp: parseFloat(row.systolic_bp),
          physical_activity_days: parseFloat(row.physical_activity_days)
        });
      })
      .on('end', () => resolve(rawData))
      .on('error', (err) => reject(err));
  });
}

function minMaxScale(data, features) {
  const bounds = {};
  features.forEach((f) => {
    const values = data.map((d) => d[f]);
    bounds[f] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });

  const scaledMatrix = data.map((d) =>
    features.map((f) => {
      const range = bounds[f].max - bounds[f].min;
      return range === 0 ? 0 : (d[f] - bounds[f].min) / range;
    })
  );

  return { scaledMatrix, bounds, features };
}

module.exports = { loadDataset, minMaxScale, FEATURES };
