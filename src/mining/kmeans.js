const { kmeans } = require('ml-kmeans');
const ss = require('simple-statistics');
const { calculateSilhouetteScore } = require('./evaluate');

function runClustering(rawData, scaledMatrix, bounds, features, k = 3) {
  const model = kmeans(scaledMatrix, k, {
    maxIterations: 150,
    initialization: 'kmeans++',
    seed: 42
  });

  const clusteredPatients = rawData.map((patient, idx) => ({
    ...patient,
    cluster: model.clusters[idx]
  }));

  const denormalizedCentroids = model.centroids.map((centroid, clusterIdx) => {
    const clusterObj = { clusterId: clusterIdx };
    features.forEach((f, idx) => {
      const min = bounds[f].min;
      const max = bounds[f].max;
      clusterObj[f] = Number((centroid[idx] * (max - min) + min).toFixed(2));
    });
    return clusterObj;
  });

  const clusterProfiles = [];
  for (let c = 0; c < k; c++) {
    const cohort = clusteredPatients.filter((p) => p.cluster === c);
    if (cohort.length === 0) continue;

    const bmis = cohort.map((p) => p.bmi);
    const sugars = cohort.map((p) => p.fasting_blood_sugar);
    const bps = cohort.map((p) => p.systolic_bp);

    let riskLevel = 'Low Risk (Healthy)';
    const avgSugar = ss.mean(sugars);
    const avgBp = ss.mean(bps);

    if (avgSugar >= 135 || avgBp >= 140) {
      riskLevel = 'High Risk (Vulnerable / Chronic)';
    } else if (avgSugar >= 105 || avgBp >= 125) {
      riskLevel = 'Moderate Risk (Early Intervention)';
    }

    clusterProfiles.push({
      clusterId: c,
      size: cohort.length,
      percentage: Number(((cohort.length / rawData.length) * 100).toFixed(1)),
      riskLevel,
      means: {
        age: Number(ss.mean(cohort.map((p) => p.age)).toFixed(1)),
        bmi: Number(ss.mean(bmis).toFixed(1)),
        fasting_blood_sugar: Number(avgSugar.toFixed(1)),
        systolic_bp: Number(avgBp.toFixed(1)),
        physical_activity_days: Number(ss.mean(cohort.map((p) => p.physical_activity_days)).toFixed(1))
      },
      stdDev: {
        bmi: Number(ss.standardDeviation(bmis).toFixed(2)),
        sugar: Number(ss.standardDeviation(sugars).toFixed(2))
      }
    });
  }

  const silhouetteScore = calculateSilhouetteScore(scaledMatrix, model.clusters, k);

  return {
    clusteredPatients,
    centroids: denormalizedCentroids,
    clusterProfiles,
    silhouetteScore
  };
}

module.exports = { runClustering };
