import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightLeft } from 'lucide-react';

import { toast } from 'react-hot-toast';
import { sortDetailedFunds, formatCurrency } from '../utils/helpers';

export default function Transfer() {
  const { user } = useAuth();
  const [detailedFunds, setDetailedFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sourceFundId, setSourceFundId] = useState('');
  const [targetFundId, setTargetFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.id) fetchFunds();
  }, [user?.id]);

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('detailed_funds')
        .select('*, master_funds(name)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setDetailedFunds(sortDetailedFunds(data || []));
    } catch (error) {
      console.error('Lỗi lấy dữ liệu quỹ:', error);
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!sourceFundId || !targetFundId || !amount) {
      return toast.error('Vui lòng điền đủ thông tin bắt buộc.');
    }
    if (sourceFundId === targetFundId) {
      return toast.error('Túi nguồn và Túi đích phải khác nhau.');
    }

    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (numericAmount <= 0) return toast.error('Số tiền không hợp lệ.');

    const sourceFund = detailedFunds.find(f => f.id === sourceFundId);
    const targetFund = detailedFunds.find(f => f.id === targetFundId);

    if (!sourceFund || !targetFund) return toast.error('Không tìm thấy túi hợp lệ.');

    if (Number(sourceFund.balance) < numericAmount) {
       return toast.error('Túi nguồn không đủ số dư để điều chuyển.');
    }

    if (sourceFund.master_fund_id !== targetFund.master_fund_id) {
       const confirmMsg = "Theo nguyên lý về Kiểm soát chi tiêu, phải kiểm soát và gói ghém trong từng khoản chứ không được để lẹm sang khoản khác. Bạn có chắc muốn điều chuyển?";
       if (!window.confirm(confirmMsg)) {
         return;
       }
    }

    const loader = toast.loading('Đang thực hiện điều chuyển...');
    try {
      // 1. Transaction chi (Nguồn)
      const transSource = {
        user_id: user.id,
        detailed_fund_id: sourceFundId,
        category_id: null,
        amount: numericAmount,
        type: 'expense',
        transaction_date: transDate,
        note: `Điều chuyển tới ${targetFund.master_funds?.name}/${targetFund.name} ` + (note ? `- ${note}` : '')
      };

      // 2. Transaction thu (Đích)
      const transTarget = {
        user_id: user.id,
        detailed_fund_id: targetFundId,
        category_id: null,
        amount: numericAmount,
        type: 'income',
        transaction_date: transDate,
        note: `Nhận điều chuyển từ ${sourceFund.master_funds?.name}/${sourceFund.name} ` + (note ? `- ${note}` : '')
      };

      const { error: tError } = await supabase.from('transactions').insert([transSource, transTarget]);
      if (tError) throw tError;

      // Cập nhật số dư
      const newSourceBalance = Number(sourceFund.balance) - numericAmount;
      const { error: sError } = await supabase.from('detailed_funds').update({ balance: newSourceBalance }).eq('id', sourceFundId);
      if (sError) throw sError;

      const newTargetBalance = Number(targetFund.balance) + numericAmount;
      const { error: dError } = await supabase.from('detailed_funds').update({ balance: newTargetBalance }).eq('id', targetFundId);
      if (dError) throw dError;

      toast.success('Điều chuyển thành công!', { id: loader });
      
      setAmount('');
      setNote('');
      setSourceFundId('');
      setTargetFundId('');
      fetchFunds();
    } catch (error) {
       toast.error('Có lỗi xảy ra: ' + error.message, { id: loader });
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Điều chuyển</h3>
        <p className="text-secondary">Chuyển tiền giữa các túi.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <p className="text-secondary text-center">Đang tải biểu mẫu...</p>
        ) : (
          <form onSubmit={handleTransfer}>
            <div className="mb-4">
              <label className="input-label">Túi Nguồn (Trừ tiền)</label>
              <select className="input-field" value={sourceFundId} onChange={(e) => setSourceFundId(e.target.value)} required>
                <option value="">-- Chọn túi nguồn --</option>
                {detailedFunds.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.master_funds?.name} \ {f.name} (Số dư: {formatCurrency(f.balance)}đ)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <div style={{ background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '50%' }}>
                 <ArrowRightLeft size={20} color="var(--primary-color)" />
              </div>
            </div>

            <div className="mb-4">
              <label className="input-label">Túi Đích (Nhận tiền)</label>
              <select className="input-field" value={targetFundId} onChange={(e) => setTargetFundId(e.target.value)} required>
                <option value="">-- Chọn túi đích --</option>
                {detailedFunds.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.master_funds?.name} \ {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="input-label">Số Tiền Điều Chuyển (₫)</label>
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
              <label className="input-label">Ngày Điều Chuyển</label>
              <input 
                type="date" 
                className="input-field" 
                value={transDate} 
                onChange={e => setTransDate(e.target.value)} 
                required 
              />
            </div>

            <div className="mb-4">
              <label className="input-label">Ghi Chú</label>
              <input 
                type="text" 
                className="input-field" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                placeholder="Lý do điều chuyển..." 
              />
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem', justifyContent: 'center' }}>
                <ArrowRightLeft size={16} /> Thực hiện điều chuyển
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
