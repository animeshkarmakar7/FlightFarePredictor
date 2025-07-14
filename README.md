# ✈️ SkyWay

**Flight Price Predictor** is a web-based application that uses **machine learning** to predict the fare of flights based on user inputs like departure time, arrival time, airline, source, destination, and more.

This project leverages **Flask (Python)** for the backend ML model and **React** for the frontend UI, giving users an intuitive and fast way to estimate flight prices using historical trends.

🌐 **Live Demo**: [SkyWay](https://your-flight-predictor-app.com)

---

## 📌 Features

- 📤 User-friendly form to input flight details
- 🤖 Real-time prediction using trained ML model
- 📈 Uses historical flight dataset for training
- 🔥 Fast and responsive frontend with React
- 🔍 Provides insights on how features affect fare

---

## 🧠 How It Works

1. User enters flight details like:
   - Airline
   - Source & Destination
   - Departure and Arrival time
   - Duration
   - Total stops

2. The React frontend sends this data to a Flask API.

3. The trained ML model ( XGBoost ) processes the input and returns a **predicted flight fare**.

4. Result is displayed instantly on the frontend.

---

## ⚙️ Tech Stack

| Layer       | Technologies Used                     |
|-------------|----------------------------------------|
| 💻 Frontend  | React, Tailwind CSS, Axios            |
| 🧠 Backend   | Flask, Python, Pandas, Scikit-learn    |
| 🧪 Model     | Random Forest Regressor / XGBoost     |
| 📊 Dataset   | Cleaned & preprocessed flight dataset |
| ☁️ Hosting   | Vercel (Frontend), Render (Backend) |

---

## 🖼️ UI Preview

| Home Input Form | Prediction Result |
|-----------------|-------------------|
| ![Form](https://via.placeholder.com/400x200?text=Flight+Input+Form) | ![Result](https://via.placeholder.com/400x200?text=Predicted+Fare+Display) |

---

## 🛠️ Getting Started (Local Setup)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/flight-price-predictor.git
cd flight-price-predictor
