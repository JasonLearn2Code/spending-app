import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, Wallet, Tag } from 'lucide-react';

import { toast } from 'react-hot-toast';
import { sortMasterFunds, sortDetailedFunds, formatCurrency } from '../utils/helpers';

export default function MasterData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('funds'); // 'funds' | 'categories'
  const [loading, setLoading] = useState(true);
  
  const [masterFunds, setMasterFunds] = useState([]);
  const [detailedFunds, setDetailedFunds] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form states
  const [newFundName, setNewFundName] = useState('');
  const [selectedMasterFund, setSelectedMasterFund] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mfRes, dfRes, catRes] = await Promise.all([
        supabase.from('master_funds').select('*').order('name'),
        supabase.from('detailed_funds').select('*, master_funds(name)').eq('user_id', user.id).order('created_at'),
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at')
      ]);

      const sortedMFs = sortMasterFunds(mfRes.data || []);
      const sortedDFs = sortDetailedFunds(dfRes.data || []);

      setMasterFunds(sortedMFs);
      setDetailedFunds(sortedDFs);
      setCategories(catRes.data || []);
      
      if (sortedMFs.length > 0) {
        setSelectedMasterFund(sortedMFs[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFund = async (e) => {
    e.preventDefault();
    if (!newFundName || !selectedMasterFund) return;

    try {
      const { data, error } = await supabase.from('detailed_funds').insert([
        { name: newFundName, master_fund_id: selectedMasterFund, user_id: user.id }
      ]).select();
      
      if (error) throw error;
      setDetailedFunds([...detailedFunds, data[0]]);
      setNewFundName('');
      toast.success('Đã tạo quỹ mới!');
    } catch (error) {
      toast.error('Lỗi tạo quỹ: ' + error.message);
    }
  };

  const handleDeleteFund = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa quỹ này?')) return;
    try {
      const { error } = await supabase.from('detailed_funds').delete().eq('id', id);
      if (error) throw error;
      setDetailedFunds(detailedFunds.filter(f => f.id !== id));
      toast.success('Đã xóa quỹ!');
    } catch (error) {
      toast.error('Lỗi xóa quỹ: ' + error.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const { data, error } = await supabase.from('categories').insert([
        { name: newCatName, type: newCatType, user_id: user.id }
      ]).select();
      
      if (error) throw error;
      setCategories([...categories, data[0]]);
      setNewCatName('');
      toast.success('Đã tạo hạng mục mới!');
    } catch (error) {
      toast.error('Lỗi tạo hạng mục: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hạng mục này?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Đã xóa hạng mục!');
    } catch (error) {
      toast.error('Lỗi xóa hạng mục: ' + error.message);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Quản lý Hệ thống (Master Data)</h3>
        <p className="text-secondary">Thiết lập các quỹ chi tiết và các khoản mục giao dịch của riêng bạn.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--text-secondary)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('funds')}
          style={{ background: 'none', border: 'none', color: activeTab === 'funds' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'funds' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Wallet size={18} /> Quỹ chi tiết
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{ background: 'none', border: 'none', color: activeTab === 'categories' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'categories' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Tag size={18} /> Hạng mục thu/chi
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : activeTab === 'funds' ? (
        <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
          <div className="card">
            <h4 className="mb-4">Tạo Quỹ Mới</h4>
            <form onSubmit={handleAddFund}>
              <div className="mb-4">
                <label className="input-label">Tên Quỹ</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ví dụ: VPBank, Ví Momo..." 
                  value={newFundName} 
                  onChange={e => setNewFundName(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="input-label">Thuộc Quỹ Cha</label>
                <select className="input-field" value={selectedMasterFund} onChange={e => setSelectedMasterFund(e.target.value)} required>
                  {masterFunds.map(mf => (
                    <option key={mf.id} value={mf.id}>{mf.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
                <Plus size={18} /> Thêm Quỹ
              </button>
            </form>
          </div>

          <div className="card">
            <h4 className="mb-4">Danh sách Quỹ Chi Tiết</h4>
            {detailedFunds.length === 0 ? (
              <p className="text-secondary text-center py-4">Bạn chưa tạo quỹ chi tiết nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {masterFunds.map(mf => {
                  const items = detailedFunds.filter(df => df.master_fund_id === mf.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={mf.id} style={{ marginBottom: '1rem' }}>
                      <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{mf.name}</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {items.map(df => (
                          <div key={df.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
                            <div>
                              <strong>{df.name}</strong>
                              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Số dư: {formatCurrency(df.balance)} ₫</div>
                            </div>
                            <button onClick={() => handleDeleteFund(df.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.2rem' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
          <div className="card">
            <h4 className="mb-4">Tạo Hạng Mục Mới</h4>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label className="input-label">Tên Hạng Mục</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ví dụ: Ăn uống, Lương..." 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="input-label">Loại</label>
                <select className="input-field" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                  <option value="expense">Khoản Chi</option>
                  <option value="income">Khoản Thu</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
                <Plus size={18} /> Thêm Hạng Mục
              </button>
            </form>
          </div>

          <div className="card">
            <h4 className="mb-4">Danh sách Hạng Mục</h4>
            {categories.length === 0 ? (
              <p className="text-secondary text-center py-4">Bạn chưa tạo hạng mục nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ color: 'var(--text-secondary)' }}>Khoản Thu</h5>
                {categories.filter(c => c.type === 'income').map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--success-color)' }}>
                    <strong>{c.name}</strong>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <h5 style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Khoản Chi</h5>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--danger-color)' }}>
                    <strong>{c.name}</strong>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
