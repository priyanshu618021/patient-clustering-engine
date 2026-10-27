let scatterChartInstance = null;
let elbowChartInstance = null;

const CLUSTER_COLORS = [
  'rgba(37, 99, 235, 0.85)',
  'rgba(220, 38, 38, 0.85)',
  'rgba(16, 185, 129, 0.85)',
  'rgba(245, 158, 11, 0.85)',
  'rgba(139, 92, 246, 0.85)'
];

async function fetchElbowData() {
  const res = await fetch('/api/elbow');
  const data = await res.json();
  if (data.success) {
    renderElbowChart(data.elbowData);
  }
}

async function runClustering(k) {
  const res = await fetch(`/api/cluster?k=${k}`);
  const data = await res.json();
  if (!data.success) return alert('Clustering error: ' + data.error);

  document.getElementById('silhouetteVal').innerText = data.silhouetteScore;
  document.getElementById('totalPatientsVal').innerText = data.clusteredPatients.length;
  renderScatterChart(data.clusteredPatients, data.centroids, k);
  renderCohortCards(data.clusterProfiles);
  renderPatientTable(data.clusteredPatients);
}

function renderElbowChart(elbowData) {
  const ctx = document.getElementById('elbowChart').getContext('2d');
  if (elbowChartInstance) elbowChartInstance.destroy();

  elbowChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: elbowData.map((d) => `k = ${d.k}`),
      datasets: [{
        label: 'Within-Cluster Sum of Squares (WCSS)',
        data: elbowData.map((d) => d.wcss),
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.15)',
        pointRadius: 6,
        fill: true,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { title: { display: true, text: 'WCSS (Inertia)' } },
        x: { title: { display: true, text: 'Number of Clusters (k)' } }
      }
    }
  });
}

function renderScatterChart(patients, centroids, k) {
  const ctx = document.getElementById('scatterChart').getContext('2d');
  if (scatterChartInstance) scatterChartInstance.destroy();

  const datasets = [];

  for (let c = 0; c < k; c++) {
    const pts = patients
      .filter((p) => p.cluster === c)
      .map((p) => ({ x: p.bmi, y: p.fasting_blood_sugar, id: p.patient_id }));

    datasets.push({
      label: `Cohort ${c}`,
      data: pts,
      backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
      pointRadius: 6
    });
  }

  datasets.push({
    label: 'Cluster Centroids',
    data: centroids.map((cent) => ({ x: cent.bmi, y: cent.fasting_blood_sugar })),
    backgroundColor: '#000000',
    borderColor: '#000000',
    pointRadius: 10,
    pointStyle: 'crossRot'
  });

  scatterChartInstance = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'BMI (kg/m²)' } },
        y: { title: { display: true, text: 'Fasting Blood Sugar (mg/dL)' } }
      }
    }
  });
}

function renderCohortCards(profiles) {
  const container = document.getElementById('cohortContainer');
  container.innerHTML = '';

  profiles.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'cohort-card';
    card.style.borderLeftColor = CLUSTER_COLORS[p.clusterId % CLUSTER_COLORS.length];
    card.innerHTML = `
      <h4>Cohort ${p.clusterId}: ${p.riskLevel}</h4>
      <p class="cohort-meta"><strong>Population:</strong> ${p.size} patients (${p.percentage}%)</p>
      <ul>
        <li><span>Mean Age:</span> <strong>${p.means.age} yrs</strong></li>
        <li><span>Mean BMI:</span> <strong>${p.means.bmi} (±${p.stdDev.bmi})</strong></li>
        <li><span>Mean Blood Sugar:</span> <strong>${p.means.fasting_blood_sugar} mg/dL</strong></li>
        <li><span>Mean Systolic BP:</span> <strong>${p.means.systolic_bp} mmHg</strong></li>
        <li><span>Mean Activity:</span> <strong>${p.means.physical_activity_days} days/wk</strong></li>
      </ul>
    `;
    container.appendChild(card);
  });
}

function renderPatientTable(patients) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  patients.slice().reverse().forEach((p) => {
    const row = document.createElement('tr');
    const color = CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length];
    row.innerHTML = `
      <td><strong>${p.patient_id}</strong></td>
      <td>${p.age}</td>
      <td>${p.bmi}</td>
      <td>${p.fasting_blood_sugar}</td>
      <td>${p.systolic_bp}</td>
      <td>${p.physical_activity_days}</td>
      <td><span class="badge" style="background:${color}; color:#fff;">Cohort ${p.cluster}</span></td>
    `;
    tbody.appendChild(row);
  });
}

document.getElementById('runBtn').addEventListener('click', () => {
  const k = document.getElementById('kSelect').value;
  runClustering(k);
});

document.getElementById('patientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    age: document.getElementById('age').value,
    bmi: document.getElementById('bmi').value,
    fasting_blood_sugar: document.getElementById('sugar').value,
    systolic_bp: document.getElementById('bp').value,
    physical_activity_days: document.getElementById('activity').value
  };

  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    e.target.reset();
    const k = document.getElementById('kSelect').value;
    await fetchElbowData();
    await runClustering(k);
  }
});

fetchElbowData();
runClustering(3);
