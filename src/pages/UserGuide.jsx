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
      title: "1. Quản lý Hệ thống (Master Data)",
      icon: Settings,
      description: "Cấu hình danh sách các túi tiền và hạng mục chi tiêu cá nhân để bắt đầu.",
      image: "/guide/master_data.png",
      steps: [
        "Thêm mới các túi tiền (Ví dụ: Sinh hoạt phí, Lộ phí gia tiên, Techcombank, Ví Momo) vào 5 Quỹ lớn.",
        "Tạo thêm các Hạng mục chi/thu có icon theo ý thích.",
        "Xóa hoặc sửa tên túi và hạng mục để giữ hệ thống luôn gọn gàng."
      ]
    },
    {
      title: "2. Ghi chép Giao dịch (Transactions)",
      icon: PlusCircle,
      description: "Ghi lại mọi khoản chi tiêu hoặc thu nhập phát sinh hàng ngày.",
      image: "/guide/transactions.png",
      steps: [
        "Chọn loại giao dịch: Khoản Thu (màu xanh) hoặc Khoản Chi (màu đỏ).",
        "Nhập số tiền và chọn đúng hạng mục (Ví dụ: Ăn uống, Tiền lương...).",
        "Chọn Túi thực hiện giao dịch (Ví dụ: Sinh hoạt phí, Lộ phí gia tiên).",
        "Sử dụng ô Tìm kiếm để tra cứu lại các giao dịch cũ theo tên hoặc ghi chú."
      ]
    },
    {
      title: "3. Nhận lương / Chia thu nhập (Income Allocation)",
      icon: PieChart,
      description: "Tính năng quan trọng nhất để thiết lập công thức 5 quỹ tự động cho thu nhập hàng tháng.",
      image: "/guide/allocation.png",
      steps: [
        "Nhập tổng số tiền thu nhập mới nhận được.",
        "Phân bổ tỷ lệ (%) hoặc số tiền cụ thể vào từng Túi theo kế hoạch tài chính của bạn.",
        "Sử dụng 'Lưu lại thành Mẫu mới' để lưu công thức cho lần nhận lương sau.",
        "Hệ thống sẽ tự động tự chia số tiền vào các Túi ngay khi bạn xác nhận."
      ]
    },
    {
      title: "4. Trang Tổng quan (Dashboard)",
      icon: DashboardIcon,
      description: "Nơi bạn theo dõi số dư của tất cả các Quỹ và bức tranh tổng thể tài chính.",
      image: "/guide/dashboard.png",
      steps: [
        "Xem tổng số tiền ở 5 Quỹ chính.",
        "Bấm vào nút 'Chi tiết' ở mỗi thẻ Quỹ để xem số dư của các túi con.",
        "Dùng nút 'Thêm' nhanh trong chi tiết Túi để ghi chép nhanh giao dịch.",
        "Thông tin được sắp xếp theo chuẩn thứ tự: Gia đình -> Tiết kiệm -> Tạo phúc -> Tái đầu tư -> Chi tiêu."
      ]
    },
    {
      title: "5. Điều chuyển (Transfer)",
      icon: ArrowRightLeft,
      description: "Di chuyển tiền qua lại giữa các Túi.",
      image: "/guide/transfer.png",
      steps: [
        "Chọn 'Túi Nguồn' (nơi tiền đi) và 'Túi Đích' (nơi tiền đến).",
        "Nhập số tiền cần chuyển và ghi chú.",
        "Hệ thống tự động cập nhật số dư của hai Túi ngay lập tức.",
        "Nên hạn chế chuyển tiền chéo giữa các Quỹ lớn khác nhau để đảm bảo sự kỷ luật."
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
