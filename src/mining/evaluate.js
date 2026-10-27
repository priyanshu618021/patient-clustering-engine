const { kmeans } = require('ml-kmeans');

function euclideanDistanceSq(a, b) {
  return a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0);
}

function euclideanDistance(a, b) {
  return Math.sqrt(euclideanDistanceSq(a, b));
}

function calculateElbow(matrix, minK = 2, maxK = 6) {
  const elbowData = [];

  for (let k = minK; k <= maxK; k++) {
    const model = kmeans(matrix, k, { maxIterations: 100, initialization: 'kmeans++', seed: 42 });
    let wcss = 0;

    matrix.forEach((point, i) => {
      const clusterIdx = model.clusters[i];
      const centroid = model.centroids[clusterIdx];
      wcss += euclideanDistanceSq(point, centroid);
    });

    elbowData.push({ k, wcss: Number(wcss.toFixed(4)) });
  }

  return elbowData;
}

function calculateSilhouetteScore(matrix, clusters, k) {
  const n = matrix.length;
  if (k <= 1 || n <= k) return 0;

  const clusterPoints = Array.from({ length: k }, () => []);
  matrix.forEach((pt, i) => clusterPoints[clusters[i]].push({ pt, index: i }));

  let totalSilhouette = 0;

  for (let i = 0; i < n; i++) {
    const currentPoint = matrix[i];
    const currentCluster = clusters[i];
    const sameCluster = clusterPoints[currentCluster];

    let a_i = 0;
    if (sameCluster.length > 1) {
      let sumDist = 0;
      sameCluster.forEach((other) => {
        if (other.index !== i) sumDist += euclideanDistance(currentPoint, other.pt);
      });
      a_i = sumDist / (sameCluster.length - 1);
    }

    let b_i = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === currentCluster) continue;
      const otherCluster = clusterPoints[c];
      if (otherCluster.length === 0) continue;

      let sumDist = 0;
      otherCluster.forEach((other) => {
        sumDist += euclideanDistance(currentPoint, other.pt);
      });
      const avgDist = sumDist / otherCluster.length;
      if (avgDist < b_i) b_i = avgDist;
    }

    const s_i = (b_i - a_i) / Math.max(a_i, b_i);
    totalSilhouette += isNaN(s_i) ? 0 : s_i;
  }

  return Number((totalSilhouette / n).toFixed(4));
}

module.exports = { calculateElbow, calculateSilhouetteScore };
