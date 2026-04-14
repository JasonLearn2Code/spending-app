import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Trash2, Edit2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sortMasterFunds, sortDetailedFunds, formatCurrency, formatDate } from '../utils/helpers';

export default function Transactions() {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [detailedFunds, setDetailedFunds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [transType, setTransType] = useState('expense'); // 'income' | 'expense' | 'transfer'
  const [amount, setAmount] = useState('');
  const [fundId, setFundId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, fRes, cRes] = await Promise.all([
        supabase.from('transactions').select('*, categories(name, icon), detailed_funds(name)').eq('user_id', user.id).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('detailed_funds').select('id, name, balance, master_funds(name)').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id)
      ]);

      const dfData = sortDetailedFunds(fRes.data || []);
      const catsData = cRes.data || [];
      
      setTransactions(tRes.data || []);
      setDetailedFunds(dfData);
      setCategories(catsData);
      
      if (dfData.length > 0 && !fundId) {
        if (location.state?.preselectFundId) {
          setFundId(location.state.preselectFundId);
          if (location.state?.showForm) setShowForm(true);
        } else {
          const d = dfData.find(f => f.name === 'Mặc định') || dfData[0];
          setFundId(d.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !fundId || !categoryId || !transDate) return;

    try {
      const numericAmount = parseFloat(amount.toString().replace(/\D/g, ''));
      let currentFunds = [...detailedFunds];
      
      if (editingId) {
        const oldTrans = transactions.find(t => t.id === editingId);
        if (oldTrans) {
          const oldFundIndex = currentFunds.findIndex(f => f.id === oldTrans.detailed_fund_id);
          if (oldFundIndex !== -1) {
             let ob = Number(currentFunds[oldFundIndex].balance);
             if (oldTrans.type === 'expense') ob += Number(oldTrans.amount);
             if (oldTrans.type === 'income') ob -= Number(oldTrans.amount);
             currentFunds[oldFundIndex] = { ...currentFunds[oldFundIndex], balance: ob };
             await supabase.from('detailed_funds').update({ balance: ob }).eq('id', oldTrans.detailed_fund_id);
          }
        }
        
        const { error } = await supabase.from('transactions').update({
          detailed_fund_id: fundId, category_id: categoryId, amount: numericAmount, type: transType, transaction_date: transDate, note: note
        }).eq('id', editingId);
        if (error) throw error;
        
      } else {
        const { error } = await supabase.from('transactions').insert([
          { user_id: user.id, detailed_fund_id: fundId, category_id: categoryId, amount: numericAmount, type: transType, transaction_date: transDate, note: note }
        ]);
        if (error) throw error;
      }
      
      const newFundIndex = currentFunds.findIndex(f => f.id === fundId);
      if (newFundIndex !== -1) {
         let nb = Number(currentFunds[newFundIndex].balance);
         if (transType === 'expense') nb -= numericAmount;
         if (transType === 'income') nb += numericAmount;
         await supabase.from('detailed_funds').update({ balance: nb }).eq('id', fundId);
      }

      setShowForm(false);
      setEditingId(null);
      setAmount('');
      setNote('');
      fetchData(); // reload alles
      toast.success(editingId ? 'Cập nhật thành công!' : 'Đã lưu giao dịch!');
    } catch (error) {
      toast.error('Lỗi lưu giao dịch: ' + error.message);
    }
  };

  const handleEditClick = (t) => {
    setEditingId(t.id);
    setTransType(t.type);
    setAmount(t.amount.toString());
    setFundId(t.detailed_fund_id);
    setCategoryId(t.category_id || '');
    setNote(t.note || '');
    setTransDate(t.transaction_date);
    setShowForm(true);
  };

  const handleDelete = async (id, fund_id, amount, type) => {
    if (!window.confirm('Bạn có chắc muốn xoá giao dịch này? (Số dư quỹ sẽ được hoàn lại tương ứng).')) return;
    try {
      // 1. Phục hồi số dư
      const fund = detailedFunds.find(f => f.id === fund_id);
      if (fund) {
        let newBalance = Number(fund.balance || 0);
        if (type === 'expense') newBalance += Number(amount);
        if (type === 'income') newBalance -= Number(amount);
        await supabase.from('detailed_funds').update({ balance: newBalance }).eq('id', fund_id);
      }

      // 2. Xóa giao dịch
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== id));
      fetchData(); // reload balances
      toast.success('Đã xóa giao dịch!');
    } catch (error) {
      toast.error('Lỗi xóa giao dịch: ' + error.message);
    }
  };

  const filteredCategories = categories.filter(c => c.type === transType);

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const catName = t.categories?.name?.toLowerCase() || '';
    const note = t.note?.toLowerCase() || '';
    const amount = t.amount?.toString() || '';
    const fundName = t.detailed_funds?.name?.toLowerCase() || '';
    return catName.includes(query) || note.includes(query) || amount.includes(query) || fundName.includes(query);
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>Giao Dịch</h3>
          <p className="text-secondary">Quản lý các khoản thu chi tiền bạc của bạn.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ gap: '0.5rem' }}>
          <PlusCircle size={18} /> {showForm ? 'Đóng' : 'Thêm Giao Dịch'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--text-secondary)' }}>
          <h4 className="mb-4">{editingId ? 'Sửa Giao Dịch' : 'Tạo Giao Dịch Mới'}</h4>
          <form onSubmit={handleAddTransaction}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setTransType('expense')}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: transType === 'expense' ? '2px solid var(--danger-color)' : '1px solid var(--text-secondary)', backgroundColor: transType === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: transType === 'expense' ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              >
                <ArrowDownCircle size={20} /> Khoản Chi
              </button>
              <button 
                type="button"
                onClick={() => setTransType('income')}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: transType === 'income' ? '2px solid var(--success-color)' : '1px solid var(--text-secondary)', backgroundColor: transType === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: transType === 'income' ? 'var(--success-color)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              >
                <ArrowUpCircle size={20} /> Khoản Thu
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="input-label">Số Tiền (₫)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={amount ? Number(amount.toString().replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} 
                  placeholder="0" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="input-label">Ngày Giao Dịch</label>
                <input type="date" className="input-field" value={transDate} onChange={e => setTransDate(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="input-label">Túi (Nguồn tiền)</label>
                <select className="input-field" value={fundId} onChange={e => setFundId(e.target.value)} required>
                  <option value="">-- Chọn Túi --</option>
                  {detailedFunds.map(f => (
                    <option key={f.id} value={f.id}>{f.master_funds?.name} \ {f.name} (Số dư: {formatCurrency(f.balance)}đ)</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="input-label">Hạng Mục {transType === 'expense' ? 'Chi' : 'Thu'}</label>
                <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                  <option value="">-- Chọn Hạng mục --</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="input-label">Ghi Chú</label>
              <textarea className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú cho giao dịch..." rows="2" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu Giao Dịch</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--text-secondary)', paddingBottom: '1rem' }}>
          <h4>Lịch sử</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '150px' }} 
            />
          </div>
        </div>

        {loading ? (
          <p className="text-secondary text-center py-4">Đang tải lịch sử giao dịch...</p>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-secondary mb-4">{searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có giao dịch nào được ghi nhận.'}</p>
            {!searchQuery && <button className="btn btn-primary" onClick={() => setShowForm(true)}>Ghi sổ ngay</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredTransactions.map(t => {
              const isExpense = t.type === 'expense';
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--bg-color)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: isExpense ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isExpense ? 'var(--danger-color)' : 'var(--success-color)' }}>
                      {isExpense ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1rem' }}>{t.categories?.icon && `${t.categories.icon} `}{t.categories?.name || 'Chưa phân loại'}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                        {t.detailed_funds?.name} • {formatDate(t.transaction_date)} {t.note && ` • ${t.note}`}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: isExpense ? 'var(--text-primary)' : 'var(--success-color)' }}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.amount)} ₫
                    </strong>
                    <button 
                      onClick={() => handleEditClick(t)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id, t.detailed_fund_id, t.amount, t.type)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
