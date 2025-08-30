import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add debugging for environment variables
if (import.meta.env.DEV) {
  console.log('Environment variables:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
}

createRoot(document.getElementById("root")!).render(<App />)