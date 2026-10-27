Patient Segmentation & Health Clustering Engine
An unsupervised data mining web application built with Node.js, Express, and ml-kmeans to automatically stratify hospital outpatients into clinical risk cohorts based on metabolic and lifestyle indicators.

📌 Features
Data Mining Algorithm: K-Means++ Clustering on multi-dimensional patient vectors.
Data Preprocessing: Min-Max Feature Scaling ([0, 1]) to prevent scale dominance.
Model Evaluation:
Elbow Method (WCSS): Identifies optimal cluster count (
k
=
3
).
Silhouette Coefficient: Evaluates cluster cohesion vs. separation (Score: ~0.5995).
Interactive Visualizations: Dynamic Scatter Plot (Sugar vs BMI) & WCSS Elbow Curve using Chart.js.
Live Re-Clustering: Add new outpatient records dynamically and observe real-time model re-clustering.
🛠 Tech Stack
Backend: Node.js, Express.js
Machine Learning & Statistics: ml-kmeans, simple-statistics, csv-parser
Frontend / Templating: EJS, Chart.js, Vanilla CSS
🚀 Getting Started
1. Clone the repository
git clone https://github.com/codwithHarsh/patient-clustering-engine.git cd patient-clustering-engine

2. Install dependencies
npm install

3. Run the application
npm start

Open your browser and navigate to:
http://localhost:3000
