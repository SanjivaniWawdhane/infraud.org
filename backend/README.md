# 🛡️ INFRAUD Backend — URL Analyzer Guide

This service provides transparent, explainable heuristic analysis for URLs without making external network calls or storing confidential user inputs.

---

## 🚀 Running the Backend Server

Open Windows PowerShell and run:

```powershell
cd d:\InFraud.org\backend
npm.cmd start
```

For live development with auto-reloading (Node 24 native watch mode):

```powershell
npm.cmd run dev
```

---

## 📡 Endpoints

### 1. Health Check
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/health`
* **Test via PowerShell:**
  ```powershell
  curl.exe -s http://localhost:5000/api/health
  ```

---

### 2. URL Analysis
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/analyze/url`
* **Headers:** `Content-Type: application/json`
* **Body Format:**
  ```json
  {
    "url": "https://example.com"
  }
  ```

---

## 🧪 Testing in Windows PowerShell

In Windows PowerShell, **`Invoke-RestMethod`** is the recommended native command because it avoids quote-escaping issues:

### 1. Test a Normal URL (Score: 0, Low Risk)
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/analyze/url -Method Post -ContentType "application/json" -Body '{"url":"https://google.com"}'
```

### 2. Test an Insecure HTTP URL (Score: 15, Low Risk)
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/analyze/url -Method Post -ContentType "application/json" -Body '{"url":"http://example.com"}'
```

### 3. Test an IP-Address Hostname (Score: 60, High Risk)
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/analyze/url -Method Post -ContentType "application/json" -Body '{"url":"http://192.168.1.1/login"}'
```

### 4. Test a Suspicious Spoofed Pattern (Score: 95, Critical Risk)
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/analyze/url -Method Post -ContentType "application/json" -Body '{"url":"http://secure-login.paypal.verify-account.tk/update"}'
```

---

### Alternative: Testing with `curl.exe`
```powershell
curl.exe -s -X POST http://localhost:5000/api/analyze/url -H "Content-Type: application/json" -d "{\"url\":\"https://google.com\"}"
```

---

## 🤖 Running Automated Unit Test Suite

To verify all test cases programmatically:

```powershell
cd d:\InFraud.org\backend
node test_url_analyzer.js
```
