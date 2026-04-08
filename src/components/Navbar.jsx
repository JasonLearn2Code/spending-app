import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Settings, PieChart, List, ArrowRightLeft } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header style={{ backgroundColor: 'var(--surface-color)', padding: '0.75rem 0', boxShadow: 'var(--box-shadow)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'nowrap' }}>
          <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Kiểm soát chi tiêu</h2>
          
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <NavLink to="/" end style={({ isActive }) => ({ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.6rem', 
              borderRadius: '8px', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', fontSize: '0.9rem'
            })}>
              <Home size={18} /> Tổng quan
            </NavLink>
            <NavLink to="/transactions" style={({ isActive }) => ({ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.6rem', 
              borderRadius: '8px', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', fontSize: '0.9rem'
            })}>
              <List size={18} /> Giao dịch
            </NavLink>
            <NavLink to="/allocation" style={({ isActive }) => ({ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.6rem', 
              borderRadius: '8px', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', fontSize: '0.9rem'
            })}>
              <PieChart size={18} /> Chia Thu Nhập
            </NavLink>
            <NavLink to="/transfer" style={({ isActive }) => ({ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.6rem', 
              borderRadius: '8px', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', fontSize: '0.9rem'
            })}>
              <ArrowRightLeft size={18} /> Điều chuyển
            </NavLink>
            <NavLink to="/master-data" style={({ isActive }) => ({ 
              display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.6rem', 
              borderRadius: '8px', color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', fontSize: '0.9rem'
            })}>
              <Settings size={18} /> Master Data
            </NavLink>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user?.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : <div style={{width:'32px', height:'32px', borderRadius:'50%', backgroundColor:'var(--primary-color)'}}></div>}
          </div>
          <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', gap: '0.25rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={signOut}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
