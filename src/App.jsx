import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Transactions from './pages/Transactions';
import IncomeAllocation from './pages/IncomeAllocation';
import Transfer from './pages/Transfer';
import Layout from './components/Layout';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/transactions" 
        element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/allocation" 
        element={
          <PrivateRoute>
            <IncomeAllocation />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/transfer" 
        element={
          <PrivateRoute>
            <Transfer />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/master-data" 
        element={
          <PrivateRoute>
            <MasterData />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
