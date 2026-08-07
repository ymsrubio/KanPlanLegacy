// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Note: React.StrictMode removed because @hello-pangea/dnd is incompatible
// with StrictMode's double-invocation in React 19. This is a known issue.
// See: https://github.com/hello-pangea/dnd/issues/1637
ReactDOM.createRoot(document.getElementById('root')).render(<App />);