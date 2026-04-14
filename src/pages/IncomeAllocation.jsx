import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Save, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sortMasterFunds, sortDetailedFunds, formatCurrency } from '../utils/helpers';

export default function IncomeAllocation() {
  const { user } = useAuth();
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [masterFunds, setMasterFunds] = useState([]);
  const [detailedFunds, setDetailedFunds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [allocationMode, setAllocationMode] = useState('percentage'); // 'percentage' | 'amount'
  const [allocationNote, setAllocationNote] = useState('');
  
  // Trạng thái phân bổ: { master_fund_id: [ { id: string, percentage: 0, amount: 0, target_detailed_fund: string } ] }
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes, tRes, cRes] = await Promise.all([
        supabase.from('master_funds').select('*').order('name'),
        supabase.from('detailed_funds').select('*, master_funds(name)').eq('user_id', user.id).order('name'),
        supabase.from('income_templates').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'income')
      ]);

      const mfData = sortMasterFunds(mRes.data || []);
      const dfData = sortDetailedFunds(dRes.data || []);
      setMasterFunds(mfData);
      setDetailedFunds(dfData);
      setTemplates(tRes.data || []);
      setCategories(cRes.data || []);

      // Khởi tạo state allocations mặc định (mỗi quỹ cha 1 dòng Mặc định)
      const initialAllocations = {};
      mfData.forEach(mf => {
        const defaultFund = dfData.find(df => df.master_fund_id === mf.id && df.name === 'Mặc định');
        const defaultFundId = defaultFund ? defaultFund.id : (dfData.find(df => df.master_fund_id === mf.id)?.id || '');
        
        initialAllocations[mf.id] = [{
          id: Math.random().toString(36).substr(2, 9),
          percentage: 0,
          amount: 0,
          target_detailed_fund: defaultFundId
        }];
      });
      setAllocations(initialAllocations);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu:', error);
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTotalIncomeChange = (val) => {
    setTotalIncome(val);
    
    // Tự động tính lại số tiền nếu người dùng đã nhập %
    const newAlloc = { ...allocations };
    Object.keys(newAlloc).forEach(key => {
      newAlloc[key] = newAlloc[key].map(line => {
        if (line.percentage > 0) {
          line.amount = Math.round(val * (line.percentage / 100));
        }
        return line;
      });
    });
    setAllocations(newAlloc);
  };

  const handleAddLine = (mfId) => {
    const newAlloc = { ...allocations };
    const defaultFundId = detailedFunds.find(df => df.master_fund_id === mfId)?.id || '';
    newAlloc[mfId] = [...newAlloc[mfId], {
      id: Math.random().toString(36).substr(2, 9),
      percentage: 0,
      amount: 0,
      target_detailed_fund: defaultFundId
    }];
    setAllocations(newAlloc);
  };

  const handleRemoveLine = (mfId, lineId) => {
    const newAlloc = { ...allocations };
    if (newAlloc[mfId].length > 1) {
      newAlloc[mfId] = newAlloc[mfId].filter(l => l.id !== lineId);
      setAllocations(newAlloc);
    }
  };

  const handlePercentageChange = (mfId, lineId, percent) => {
    const newAlloc = { ...allocations };
    newAlloc[mfId] = newAlloc[mfId].map(line => {
      if (line.id === lineId) {
        line.percentage = percent;
        if (allocationMode === 'percentage') {
          line.amount = Math.round(totalIncome * (percent / 100));
        }
      }
      return line;
    });
    setAllocations(newAlloc);
  };

  const handleAmountChange = (mfId, lineId, amt) => {
    const newAlloc = { ...allocations };
    newAlloc[mfId] = newAlloc[mfId].map(line => {
      if (line.id === lineId) {
        line.amount = amt;
        if (allocationMode === 'amount' && totalIncome > 0) {
          line.percentage = Number(((amt / totalIncome) * 100).toFixed(1));
        }
      }
      return line;
    });
    setAllocations(newAlloc);
  };

  const handleDetailedFundChange = (mfId, lineId, dfId) => {
    const newAlloc = { ...allocations };
    newAlloc[mfId] = newAlloc[mfId].map(line => {
      if (line.id === lineId) {
        line.target_detailed_fund = dfId;
      }
      return line;
    });
    setAllocations(newAlloc);
  };

  const calculateTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, lines) => {
      const lineSum = lines.reduce((ls, l) => ls + Number(l.amount || 0), 0);
      return sum + lineSum;
    }, 0);
  };

  const handleSaveTemplate = async () => {
    const name = window.prompt("Nhập tên bảng cấu hình mẫu (Ví dụ: Tiêu chuẩn 55-10-5...):");
    if (!name) return;

    try {
      const templateData = {};
      Object.keys(allocations).forEach(mfId => {
        templateData[mfId] = allocations[mfId].map(line => ({
          percentage: line.percentage,
          target_detailed_fund: line.target_detailed_fund
        }));
      });

      const { error } = await supabase.from('income_templates').insert([
        { user_id: user.id, name, allocations: templateData }
      ]);
      if (error) throw error;
      
      toast.success('Đã lưu mẫu thành công!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi lưu mẫu: ' + error.message);
    }
  };

  const handleApplyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newAlloc = { ...allocations };
    Object.keys(template.allocations).forEach(mfId => {
      const lines = template.allocations[mfId];
      if (Array.isArray(lines)) {
        newAlloc[mfId] = lines.map(tLine => ({
          id: Math.random().toString(36).substr(2, 9),
          percentage: tLine.percentage || 0,
          amount: Math.round(totalIncome * ((tLine.percentage || 0) / 100)),
          target_detailed_fund: tLine.target_detailed_fund || ''
        }));
      } else {
        // Fallback for old templates
        newAlloc[mfId] = [{
          id: Math.random().toString(36).substr(2, 9),
          percentage: lines.percentage || 0,
          amount: Math.round(totalIncome * ((lines.percentage || 0) / 100)),
          target_detailed_fund: lines.target_detailed_fund || ''
        }];
      }
    });
    setAllocations(newAlloc);
    toast.success('Đã áp dụng mẫu phân bổ!');
  };

  const handleExecuteAllocation = async () => {
    const totalAlloc = calculateTotalAllocated();
    if (totalIncome <= 0 || totalAlloc <= 0) {
      return toast.error("Vui lòng nhập Tổng Thu Nhập và phân bổ hợp lệ!");
    }
    if (totalAlloc > totalIncome) {
      return toast.error("Lỗi: Tổng chia đang vượt quá Tổng Thu Nhập!");
    }

    const transactionsToInsert = [];
    const balancesToUpdate = [];

    // Combine identical target funds if any
    const fundUpdatesMap = {};

    for (let mf of masterFunds) {
      const lines = allocations[mf.id];
      for (let alloc of lines) {
        if (alloc.amount > 0) {
          if (!alloc.target_detailed_fund) {
            return toast.error(`Vui lòng chọn "Túi" cho ${mf.name}!`);
          }
          
          transactionsToInsert.push({
            user_id: user.id,
            detailed_fund_id: alloc.target_detailed_fund,
            category_id: selectedCategoryId || null,
            amount: alloc.amount,
            type: 'income',
            transaction_date: new Date().toISOString().split('T')[0],
            note: "Phân bổ tự động " + (allocationNote ? `- ${allocationNote}` : '')
          });

          if (!fundUpdatesMap[alloc.target_detailed_fund]) {
            fundUpdatesMap[alloc.target_detailed_fund] = 0;
          }
          fundUpdatesMap[alloc.target_detailed_fund] += Number(alloc.amount);
        }
      }
    }

    if (transactionsToInsert.length === 0) return toast.error("Không có khoản tiền nào để phân bổ!");

    const loader = toast.loading('Đang thực hiện phân bổ tiền...');

    Object.keys(fundUpdatesMap).forEach(dfId => {
      const currentFund = detailedFunds.find(df => df.id === dfId);
      if (currentFund) {
        balancesToUpdate.push({
          id: currentFund.id,
          balance: Number(currentFund.balance) + fundUpdatesMap[dfId]
        });
      }
    });

    try {
      const { error: tError } = await supabase.from('transactions').insert(transactionsToInsert);
      if (tError) throw tError;

      for (const updates of balancesToUpdate) {
        await supabase.from('detailed_funds').update({ balance: updates.balance }).eq('id', updates.id);
      }

      toast.success("Phân bổ tiền thành công!", { id: loader });
      setTotalIncome(0);
      fetchData(); // Reset and get new balances
    } catch (error) {
      toast.error('Lỗi khi chia tiền: ' + error.message, { id: loader });
    }
  };

  const totalAllocated = calculateTotalAllocated();
  const remaining = totalIncome - totalAllocated;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>Chia Thu Nhập</h3>
          <p className="text-secondary">Trích lập lương tự động vào hệ thống 5 Quỹ thiết yếu (Có thể chia vào nhiều túi nhỏ).</p>
        </div>
      </div>

      <div className="allocation-layout grid gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
            <h4 className="mb-4 text-center">TỔNG THU NHẬP</h4>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={totalIncome ? formatCurrency(totalIncome) : ''} 
                onChange={(e) => handleTotalIncomeChange(Number(e.target.value.replace(/\D/g, '')))} 
                className="input-field" 
                style={{ fontSize: '2rem', textAlign: 'center', fontWeight: 'bold', padding: '1rem', color: 'var(--success-color)' }}
                placeholder="0 ₫"
              />
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label className="input-label">Hạng mục thu (Phân loại tự động)</label>
                <select className="input-field" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
                  <option value="">-- Chọn hạng mục thu --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Diễn giải (Áp dụng cho mọi giao dịch)</label>
                <input 
                  type="text"
                  className="input-field"
                  value={allocationNote}
                  onChange={e => setAllocationNote(e.target.value)}
                  placeholder="Ví dụ: Lương tháng 7"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: remaining === 0 && totalIncome > 0 ? 'rgba(16, 185, 129, 0.1)' : remaining < 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)', borderRadius: '8px' }}>
              <div>
                <span className="text-secondary" style={{ display: 'block', fontSize: '0.85rem' }}>Đã phân bổ:</span>
                <strong style={{ color: remaining < 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{formatCurrency(totalAllocated)} ₫</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="text-secondary" style={{ display: 'block', fontSize: '0.85rem' }}>Còn lại:</span>
                <strong style={{ color: remaining < 0 ? 'var(--danger-color)' : remaining === 0 ? 'var(--success-color)' : 'initial' }}>{formatCurrency(remaining)} ₫</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="mb-4">Mẫu Phân Bổ</h4>
            <select className="input-field mb-4" value={selectedTemplate} onChange={e => handleApplyTemplate(e.target.value)}>
              <option value="">-- Chọn cấu hình mẫu --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <button className="btn btn-outline" style={{ width: '100%', gap: '0.5rem' }} onClick={handleSaveTemplate}>
              <Save size={16} /> Lưu lại thành Mẫu mới
            </button>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', gap: '0.5rem', opacity: totalAllocated === 0 || remaining < 0 ? 0.5 : 1 }}
            onClick={handleExecuteAllocation}
            disabled={totalAllocated === 0 || remaining < 0}
          >
            <CheckCircle size={20} /> CHIA TIỀN NGAY
          </button>
        </div>

        <div className="card">
          <h4 className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <PieChart size={20} color="var(--primary-color)" /> Cấu hình 5 Quỹ
            </span>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 'normal' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={allocationMode === 'percentage'} onChange={() => setAllocationMode('percentage')} />
                Theo %
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={allocationMode === 'amount'} onChange={() => setAllocationMode('amount')} />
                Theo Số tiền
              </label>
            </div>
          </h4>
          
          {loading ? <p>Đang tải...</p> : masterFunds.map(mf => (
            <div key={mf.id} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--primary-color)' }}>{mf.name}</strong>
                <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', gap: '0.2rem' }} onClick={() => handleAddLine(mf.id)}>
                   <PlusCircle size={14} /> Thêm túi
                </button>
              </div>
              
              {allocations[mf.id]?.map((line, index) => (
                <div key={line.id} className="grid grid-allocation-row gap-2 mb-2 items-end">
                  <div>
                    {index === 0 && <label className="input-label" style={{ fontSize: '0.8rem' }}>Tỷ lệ (%)</label>}
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: allocationMode === 'amount' ? '#f3f4f6' : 'white' }}
                      value={line.percentage || ''}
                      onChange={(e) => handlePercentageChange(mf.id, line.id, Number(e.target.value))}
                      disabled={allocationMode === 'amount'}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="input-label" style={{ fontSize: '0.8rem' }}>Số tiền (₫)</label>}
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.5rem', backgroundColor: allocationMode === 'percentage' ? '#f3f4f6' : 'white' }}
                      value={line.amount ? formatCurrency(line.amount) : ''}
                      onChange={(e) => handleAmountChange(mf.id, line.id, Number(e.target.value.replace(/\D/g, '')))}
                      disabled={allocationMode === 'percentage'}
                    />
                  </div>
                  <div>
                    {index === 0 && <label className="input-label" style={{ fontSize: '0.8rem' }}>Chọn Túi (Quỹ con)</label>}
                    <select 
                      className="input-field" 
                      style={{ padding: '0.5rem' }}
                      value={line.target_detailed_fund || ''} 
                      onChange={(e) => handleDetailedFundChange(mf.id, line.id, e.target.value)}
                    >
                      {detailedFunds.filter(df => df.master_fund_id === mf.id).map(df => (
                        <option key={df.id} value={df.id}>{df.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ paddingBottom: '0.5rem' }}>
                     {allocations[mf.id].length > 1 && (
                        <button onClick={() => handleRemoveLine(mf.id, line.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                           <Trash2 size={18} />
                        </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
