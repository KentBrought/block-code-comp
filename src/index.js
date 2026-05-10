import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const publicUrl = process.env.PUBLIC_URL || '';
let basename = '';
try {
  basename = publicUrl ? new URL(publicUrl).pathname : '';
} catch {
  basename = publicUrl;
}
if (basename.endsWith('/')) basename = basename.slice(0, -1);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
