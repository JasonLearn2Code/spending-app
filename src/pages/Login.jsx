import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="card text-center animate-fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary-color), var(--fund-family))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>W</span>
          </div>
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Kiểm soát chi tiêu</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Hệ thống quản lý chi tiêu cá nhân thông minh theo nguyên tắc 5 Quỹ.</p>
        
        <button className="btn btn-outline" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.75rem' }} onClick={signInWithGoogle}>
          <LogIn size={20} />
          Đăng nhập với Google
        </button>
      </div>
    </div>
  );
}
