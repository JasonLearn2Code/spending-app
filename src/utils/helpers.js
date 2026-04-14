export const sortMasterFunds = (funds) => {
  const orderMap = [
    'gia đình',
    'tiết kiệm',
    'tạo phúc',
    'tái đầu tư',
    'chi tiêu'
  ];
  return [...funds].sort((a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    let aIndex = orderMap.findIndex(k => aName.includes(k));
    let bIndex = orderMap.findIndex(k => bName.includes(k));
    if (aIndex === -1) aIndex = 99;
    if (bIndex === -1) bIndex = 99;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return (a.name || '').localeCompare(b.name || '', 'vi-VN');
  });
};

export const sortDetailedFunds = (funds) => {
  const orderMap = [
    'gia đình',
    'tiết kiệm',
    'tạo phúc',
    'tái đầu tư',
    'chi tiêu'
  ];
  return [...funds].sort((a, b) => {
    const aMasterName = (a.master_funds?.name || '').toLowerCase();
    const bMasterName = (b.master_funds?.name || '').toLowerCase();
    
    let aMasterIndex = orderMap.findIndex(k => aMasterName.includes(k));
    let bMasterIndex = orderMap.findIndex(k => bMasterName.includes(k));
    
    if (aMasterIndex === -1) aMasterIndex = 99;
    if (bMasterIndex === -1) bMasterIndex = 99;
    
    if (aMasterIndex !== bMasterIndex) return aMasterIndex - bMasterIndex;
    
    // Within same master fund, sort by detailed fund name
    return (a.name || '').localeCompare(b.name || '', 'vi-VN');
  });
};

export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('vi-VN');
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
