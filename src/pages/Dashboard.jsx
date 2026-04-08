import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, PlusCircle, PieChart, Info, BookOpen } from 'lucide-react';
import { sortMasterFunds, sortDetailedFunds, formatCurrency } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFundId, setExpandedFundId] = useState(null);
  useEffect(() => {
    fetchMasterFunds();
  }, [user]);

  const fetchMasterFunds = async () => {
    try {
      const { data: mFunds, error: mError } = await supabase
        .from('master_funds')
        .select('*')
        .order('name');
      
      let { data: dFunds, error: dError } = await supabase
        .from('detailed_funds')
        .select('master_fund_id, balance, id, name, master_funds(name)')
        .eq('user_id', user.id);

      if (mError) throw mError;
      if (dError) throw dError;

      // Logic tạo quỹ Mặc định
      const missingDefaults = mFunds.filter(mf => !dFunds.some(df => df.master_fund_id === mf.id));
      if (missingDefaults.length > 0) {
        const defaultFunds = missingDefaults.map(mf => ({
          user_id: user.id,
          master_fund_id: mf.id,
          name: 'Mặc định',
          balance: 0
        }));
        await supabase.from('detailed_funds').insert(defaultFunds);
        // Fetch lại thư mục con
        const newDRes = await supabase.from('detailed_funds').select('master_fund_id, balance, id, name').eq('user_id', user.id);
        if (newDRes.data) {
           dFunds = newDRes.data;
        }
      }

      const sortedMasterFunds = sortMasterFunds(mFunds);

      const fundsWithBalances = sortedMasterFunds.map(mf => {
        let relatedDetailed = dFunds?.filter(df => df.master_fund_id === mf.id) || [];
        relatedDetailed = sortDetailedFunds(relatedDetailed);
        const totalBalance = relatedDetailed.reduce((sum, df) => sum + Number(df.balance || 0), 0);
        return { ...mf, totalBalance, children: relatedDetailed };
      });

      setFunds(fundsWithBalances);
    } catch (error) {
      console.error('Error fetching funds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFundColor = (name) => {
    if (name.includes('Gia đình')) return 'var(--fund-family)';
    if (name.includes('Tiết kiệm')) return 'var(--fund-savings)';
    if (name.includes('Tạo phúc')) return 'var(--fund-charity)';
    if (name.includes('Tái đầu tư')) return 'var(--fund-reinvest)';
    if (name.includes('Chi tiêu')) return 'var(--fund-personal)';
    return 'var(--primary-color)';
  };

  return (
    <>
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', borderLeft: '4px solid var(--success-color)', borderRadius: '8px', marginBottom: '2rem', boxShadow: 'var(--box-shadow)' }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontStyle: 'italic', fontWeight: 600 }}>"Không quan trọng bạn kiếm được bao nhiêu, mà quan trọng là bạn giữ được bao nhiêu và trong bao lâu"</h4>
        <h4 style={{ color: 'var(--danger-color)', margin: 0, fontStyle: 'italic' }}>"Không lo xa ắt có họa gần"</h4>
      </div>

      <div style={{ padding: '1.25rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--primary-color)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h5 style={{ margin: 0, color: 'var(--text-primary)' }}>Bạn là người mới?</h5>
            <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>Hãy xem qua hướng dẫn để làm chủ hệ thống 5 quỹ tài chính của mình hiệu quả nhất.</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/guide')} style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
          Xem hướng dẫn
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3>Tổng quan 5 Quỹ</h3>
          <button className="btn btn-primary" onClick={() => navigate('/transactions')} style={{ gap: '0.5rem' }}>
            <PlusCircle size={18} /> Giao dịch mới
          </button>
        </div>

        {loading ? (
          <p className="text-center text-secondary">Đang tải dữ liệu...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {funds.map((fund) => (
              <div key={fund.id} className="card" style={{ borderTop: `4px solid ${getFundColor(fund.name)}` }}>
                <h4 style={{ marginBottom: '0.5rem', color: getFundColor(fund.name) }}>{fund.name}</h4>
                <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem', minHeight: '40px' }}>{fund.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span className="text-secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Tổng số dư</span>
                    <strong style={{ fontSize: '1.25rem' }}>{formatCurrency(fund.totalBalance)} ₫</strong>
                  </div>
                  <button onClick={() => setExpandedFundId(expandedFundId === fund.id ? null : fund.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderColor: 'var(--text-secondary)' }}>
                    {expandedFundId === fund.id ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                </div>

                {expandedFundId === fund.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    {fund.children.length === 0 ? (
                      <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Chưa có quỹ chi tiết nào.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {fund.children.map(child => (
                           <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                               <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{child.name}</div>
                               <div style={{ fontSize: '0.9rem' }}>{formatCurrency(child.balance)} ₫</div>
                             </div>
                             <button
                               onClick={() => navigate('/transactions', { state: { preselectFundId: child.id, showForm: true } })}
                               className="btn btn-primary"
                               style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                               title="Thêm giao dịch"
                             >
                               <PlusCircle size={14} /> Thêm
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="card mt-4" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <Info color="var(--primary-color)" />
          <div>
            <h4 style={{ marginBottom: '0.25rem', color: 'var(--primary-color)' }}>Phân bổ thu nhập</h4>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Sử dụng tính năng này để chia thu nhập tự động vào hệ thống 5 quỹ.</p>
            <button onClick={() => navigate('/allocation')} className="btn btn-primary" style={{ gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              <PieChart size={16} /> Chia thu nhập
            </button>
          </div>
        </div>


      </>
  );
}
