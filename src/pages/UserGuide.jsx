import React from 'react';
import { BookOpen, LayoutDashboard as DashboardIcon, PlusCircle, PieChart, ArrowRightLeft, Settings, Info } from 'lucide-react';

const GuideSection = ({ title, icon: Icon, description, image, steps }) => (
  <div className="card" style={{ marginBottom: '2.5rem', overflow: 'hidden', padding: 0 }}>
    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-color)', borderRadius: '8px', color: 'white' }}>
          <Icon size={20} />
        </div>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <p className="text-secondary" style={{ margin: 0 }}>{description}</p>
    </div>
    
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        <div>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Các bước thực hiện:</h4>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {steps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '0.75rem' }}>{step}</li>
            ))}
          </ul>
        </div>
        <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
          <img src={image} alt={title} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </div>
    </div>
  </div>
);

export default function UserGuide() {
  const sections = [
    {
      title: "1. Trang Tổng quan (Dashboard)",
      icon: PieChart,
      description: "Nơi bạn theo dõi số dư của tất cả các quỹ và tình hình tài chính tổng quát.",
      image: "/guide/dashboard.png",
      steps: [
        "Xem tổng số dư của 5 Quỹ lớn.",
        "Bấm vào nút 'Chi tiết' ở mỗi thẻ quỹ để xem các túi tiền (Quỹ nhỏ) bên trong.",
        "Dùng nút 'Thêm' nhanh ở từng quỹ nhỏ để ghi chép giao dịch ngay lập tức.",
        "Thông tin được sắp xếp theo đúng thứ tự ưu tiên: Gia đình -> Tiết kiệm -> Tạo phúc -> Tái đầu tư -> Chi tiêu."
      ]
    },
    {
      title: "2. Ghi chép Giao dịch (Transactions)",
      icon: PlusCircle,
      description: "Ghi lại mọi khoản chi tiêu hoặc thu nhập phát sinh hàng ngày.",
      image: "/guide/transactions.png",
      steps: [
        "Chọn loại giao dịch: Thu nhập (màu xanh) hoặc Chi tiêu (màu đỏ).",
        "Nhập số tiền và chọn đúng hạng mục (Ví dụ: Ăn uống, Lương...).",
        "Chọn Quỹ tiền thực hiện giao dịch (Ví dụ: Ví tiền mặt, Thẻ ngân hàng).",
        "Sử dụng ô Tìm kiếm để tra cứu lại các giao dịch cũ theo tên hoặc ghi chú."
      ]
    },
    {
      title: "3. Chia thu nhập (Income Allocation)",
      icon: PieChart,
      description: "Tính năng quan trọng nhất để quản lý tài chính theo công thức 5 quỹ.",
      image: "/guide/allocation.png",
      steps: [
        "Nhập tổng số tiền thu nhập mới nhận được.",
        "Phân bổ tỷ lệ (%) hoặc số tiền cụ thể vào từng quỹ theo kế hoạch tài chính của bạn.",
        "Sử dụng 'Lưu làm mẫu' để áp dụng nhanh cho các lần nhận lương sau.",
        "Hệ thống sẽ tự động cộng số dư vào các quỹ tương ứng sau khi bạn xác nhận."
      ]
    },
    {
      title: "4. Điều chuyển tiền (Transfer)",
      icon: ArrowRightLeft,
      description: "Di chuyển tiền qua lại giữa các túi tiền của bạn.",
      image: "/guide/transfer.png",
      steps: [
        "Chọn 'Quỹ nguồn' (nơi tiền đi) và 'Quỹ đích' (nơi tiền đến).",
        "Nhập số tiền muốn chuyển và ghi chú lý do.",
        "Hệ thống sẽ tự động cập nhật số dư của cả hai quỹ ngay lập tức.",
        "Hỗ trợ quản lý dòng tiền linh hoạt giữa các tài khoản ngân hàng và ví."
      ]
    },
    {
      title: "5. Quản lý Dữ liệu gốc (Master Data)",
      icon: Settings,
      description: "Cấu hình danh sách các quỹ và hạng mục chi tiêu cá nhân.",
      image: "/guide/master_data.png",
      steps: [
        "Thêm mới các túi tiền (Ví dụ: Thẻ Techcombank, Ví Momo) vào 5 Quỹ lớn.",
        "Tạo thêm các Hạng mục chi tiêu/thu nhập phù hợp với nhu cầu cá nhân.",
        "Xóa hoặc sửa các thông tin đã tạo để giữ hệ thống luôn gọn gàng."
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
          <BookOpen size={40} style={{ marginBottom: '1rem' }} /><br />
          Hướng dẫn sử dụng
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Chào mừng bạn đến với hệ thống Quản lý tài chính cá nhân. Hãy cùng tìm hiểu cách làm chủ dòng tiền của mình thông qua các tính năng dưới đây.
        </p>
      </header>

      {sections.map((section, index) => (
        <GuideSection key={index} {...section} />
      ))}

      <footer style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
        <Info size={24} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
        <p style={{ margin: 0, fontWeight: '500' }}>Bạn đã sẵn sàng quản lý tài chính hiệu quả?</p>
        <p className="text-secondary">Nếu có bất kỳ thắc mắc nào, hãy bắt đầu bằng việc ghi lại giao dịch đầu tiên của mình!</p>
      </footer>
    </div>
  );
}
