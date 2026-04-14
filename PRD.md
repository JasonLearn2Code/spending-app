# 📋 Product Requirements Document (PRD)

> **⚠️ AI INSTRUCTION: Đây là tài liệu bắt buộc phải đọc trước khi thực hiện BẤT KỲ thay đổi nào vào codebase này.**
> Mọi tính năng mới, sửa đổi, hay refactor đều phải tuân thủ các nguyên tắc và ràng buộc được định nghĩa trong tài liệu này.

---

## 1. Tổng quan sản phẩm

- **Tên ứng dụng:** Kiểm soát chi tiêu
- **Mô tả ngắn:** Ứng dụng quản lý tài chính cá nhân dựa trên triết lý **hệ thống 5 Quỹ**, giúp người dùng phân bổ thu nhập có chủ đích, theo dõi chi tiêu và kiểm soát dòng tiền một cách kỷ luật.
- **Triết lý cốt lõi:** *"Không quan trọng bạn kiếm được bao nhiêu, mà quan trọng là bạn giữ được bao nhiêu và trong bao lâu."* — Tiền được chia trước khi tiêu, không tiêu trước rồi mới tính.
- **Đối tượng người dùng:** Cá ## 2. Triết lý thiết kế & nguyên tắc bất biến

### 2.1 Hệ thống 5 Quỹ cha (KHÔNG THAY ĐỔI)

Đây là nền tảng của toàn bộ ứng dụng. 5 Quỹ cha này là **cố định (is_fixed = true)**, được khởi tạo sẵn trong DB và **KHÔNG** cho phép người dùng thêm/xóa/sửa tên:

| Thứ tự | Tên Quỹ | Mục đích |
|--------|---------|----------|
| 1 | **Quỹ Gia đình** | Chi phí sinh hoạt thiết yếu của gia đình |
| 2 | **Quỹ Tiết kiệm** | Tích lũy dài hạn, quỹ khẩn cấp |
| 3 | **Quỹ Tạo phúc Trả nợ** | Từ thiện, biếu tặng, trả nợ |
| 4 | **Quỹ Tái đầu tư tiêu dùng** | Học tập, phát triển bản thân, mua sắm lớn |
| 5 | **Quỹ Chi tiêu bản thân** | Nhu cầu giải trí, cá nhân |

> **Thứ tự hiển thị** luôn theo đúng thứ tự ưu tiên trên, dùng hàm `sortMasterFunds()`.

### 2.2 Mô hình dữ liệu phân cấp 2 tầng

```
Master Fund (Quỹ Cha) → [1..N] Detailed Fund (Túi)
                                    ↓
                              Transactions (Giao dịch)
```

- **Master Fund:** Cố định, 5 quỹ, không sửa được.
- **Detailed Fund (Túi):** Do người dùng tạo ra (VD: Techcombank, Ví Momo). Mặc định hệ thống tự sinh:
  - Quỹ Gia đình: "Ăn uống", "Sinh hoạt phí"
  - Quỹ Tạo phúc Trả nợ: "Tạo phúc trả nợ 6T", "Lộ phí gia tiên"
  - Các Quỹ khác: "Mặc định"
- **Transaction:** Mọi giao dịch đều gắn với một Túi, không gắn trực tiếp với Master Fund.

### 2.3 Nguyên tắc kiểm soát chi tiêu ("Budget integrity")

- Chuyển tiền giữa 2 túi thuộc **khác** Master Fund phải có cảnh báo xác nhận.
- Tổng phân bổ trong Income Allocation **không được vượt quá** tổng thu nhập.
- Việc xóa giao dịch phải **hoàn trả** số dư túi tương ứng.
- Khi sửa giao dịch phải **hoàn trả số dư cũ** trước khi áp dụng số dư mới.

---

## 3. Kiến trúc kỹ thuật

### 3.1 Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| UI Library | Vanilla CSS (CSS variables), Lucide React icons, Emojis |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth — **chỉ Google OAuth** |
| Hosting | Vercel |
| Notifications | `react-hot-toast` |

### 3.2 Cấu trúc thư mục

```
src/
├── pages/          # Các trang chính (1 file = 1 page)
├── components/     # Navbar, Layout (dùng chung)
├── contexts/       # AuthContext (global auth state)
├── hooks/          # Custom React hooks
├── lib/            # supabase.js client
├── styles/         # Global CSS
├── utils/          # helpers.js (formatCurrency, formatDate, sortMasterFunds, sortDetailedFunds)
└── App.jsx         # Router, PrivateRoute
```

### 3.3 Database Schema (Supabase)

| Bảng | Mô tả |
|------|-------|
| `profiles` | User profile, link với `auth.users` |
| `master_funds` | 5 quỹ cha cố định (shared, không theo user_id) |
| `detailed_funds` | Túi do mỗi user tạo (có `user_id`) |
| `categories` | Hạng mục thu/chi do user tạo |
| `transactions` | Lịch sử giao dịch |
| `income_templates` | Mẫu phân bổ thu nhập (JSONB) |

**Row Level Security (RLS):** Bật cho tất cả bảng. User chỉ đọc/ghi dữ liệu của mình. Master funds cho phép tất cả user đọc.

### 3.4 Routing

| Route | Page | Mô tả |
|-------|------|-------|
| `/login` | Login.jsx | Trang đăng nhập (Google OAuth) |
| `/` | Dashboard.jsx | Tổng quan 5 quỹ |
| `/transactions` | Transactions.jsx | Ghi chép giao dịch |
| `/allocation` | IncomeAllocation.jsx | Chia thu nhập |
| `/transfer` | Transfer.jsx | Điều chuyển tiền |
| `/master-data` | MasterData.jsx | Quản lý danh mục |
| `/guide` | UserGuide.jsx | Hướng dẫn sử dụng |

Tất cả route (trừ `/login`) đều được bảo vệ bởi `PrivateRoute`.

---

## 4. Chi tiết tính năng hiện tại

### 4.1 Authentication (Login)

- **Phương thức:** Google OAuth duy nhất qua Supabase Auth.
- **Auto-redirect:** Nếu đã đăng nhập → redirect về `/`. Nếu chưa đăng nhập → redirect về `/login`.
- **Trigger:** Khi user đăng ký lần đầu, tự động tạo profile qua DB trigger `handle_new_user()`.
- **Không có:** Email/password login, register form, forgot password.

### 4.2 Dashboard — Tổng quan

**Mục tiêu:** Cung cấp cái nhìn tổng thể về sức khỏe tài chính.

**Tính năng:**
- Hiển thị quote tài chính động lực ở đầu trang.
- Banner mời xem Hướng dẫn cho người dùng mới.
- Danh sách 5 thẻ quỹ, sắp xếp theo thứ tự ưu tiên (dùng `sortMasterFunds`).
- Mỗi thẻ hiện: tên quỹ, mô tả, tổng số dư.
- Nút "Chi tiết" expand/collapse → hiện danh sách Túi bên trong.
- Trong expand: nút "Thêm" nhanh → navigate đến `/transactions` với túi được preselect.
- Banner "Phân bổ thu nhập" dẫn sang `/allocation`.
- Màu sắc của mỗi quỹ: được xác định bởi `getFundColor()` dựa trên tên quỹ (CSS variables).
- **Auto-create Mặc định:** Khi user đăng nhập lần đầu, tự động tạo các Hạng mục mặc định (Ăn uống, Tiền điện, Đổ xăng, Tiền lương, Tiền thưởng) và Túi mặc định (Sinh hoạt phí, Lộ phí...).

**Không có trên Dashboard:** Form nhập liệu trực tiếp, biểu đồ thống kê, lọc theo thời gian.

### 4.3 Transactions — Giao dịch

**Mục tiêu:** Ghi lại mọi khoản thu chi phát sinh hàng ngày.

**Form tạo/sửa giao dịch:**
- Loại: **Khoản Chi (expense)** | **Khoản Thu (income)** — toggle button, màu đỏ/xanh.
- Trường bắt buộc: Số tiền, Ngày giao dịch, Túi (Detailed Fund), Hạng mục.
- Trường tuỳ chọn: Ghi chú.
- Số tiền: format `toLocaleString('vi-VN')` khi hiển thị, lưu dưới dạng số nguyên.
- Dropdown Túi: hiện `[Tên Quỹ] \ [Tên Túi] (Số dư: Xđ)`.

**Danh sách giao dịch:**
- Sắp xếp theo `transaction_date DESC`, `created_at DESC`.
- Tìm kiếm realtime: theo tên hạng mục, ghi chú, số tiền, tên túi.
- Mỗi giao dịch: icon màu (đỏ/xanh), emoji hạng mục, tên túi, ngày (dd/mm/yyyy), ghi chú, số tiền.
- Actions: Sửa (Edit2 icon), Xóa (Trash2 icon).

**Cơ chế số dư:**
- Chi tiêu → trừ balance của Túi.
- Thu nhập → cộng balance của Túi.
- Sửa giao dịch → hoàn lại số dư cũ, áp dụng số dư mới.
- Xóa giao dịch → hoàn lại số dư (có confirm dialog).

**Preselector từ Dashboard:** Nếu navigate từ Dashboard với `state.preselectFundId`, form tự mở và chọn đúng túi đó.

**Không có:** Filter theo ngày, filter theo quỹ, export CSV, pagination.

### 4.4 Income Allocation — Chia thu nhập

**Mục tiêu:** Giúp người dùng phân bổ toàn bộ thu nhập vào 5 Quỹ theo kế hoạch trước.

**Layout 2 cột (Responsive Mobile-first):**
- Cột trái: Nhập tổng thu nhập, chọn hạng mục thu, ghi chú, hiển thị đã phân bổ & còn lại, chọn/lưu mẫu, nút "CHIA TIỀN NGAY".
- Cột phải: Bảng cấu hình 5 quỹ (Có thể chia % hoặc số tiền cụ thể).

**Chế độ phân bổ:**
- **Theo %:** Nhập %, tự tính số tiền = % × tổng thu nhập.
- **Theo Số tiền:** Nhập trực tiếp số tiền, tự tính % = số tiền / tổng.

**Phân bổ đa túi:** Mỗi Quỹ có thể chia vào nhiều Túi con (thêm/xóa dòng).

**Mẫu phân bổ (Templates):**
- Lưu cấu hình hiện tại thành mẫu (có tên).
- Áp dụng mẫu sẵn có để tự động điền tỷ lệ.
- Lưu dưới dạng JSONB trong `income_templates`.

**Validation:**
- Tổng phân bổ ≤ Tổng thu nhập (không được âm "Còn lại").
- Nút "CHIA TIỀN NGAY" disabled nếu không hợp lệ.
- Mỗi dòng có amount > 0 phải có Túi được chọn.
- Xử lý mượt UI trên tab switch bằng cách fix dependency của `useEffect`.

**Khi thực hiện:**
- Insert nhiều transactions cùng lúc (type: 'income').
- Cộng balance vào các Túi tương ứng (gộp nếu cùng túi).
- Ghi chú tự động: "Phân bổ tự động - [allocationNote]".

**Không có:** Chia theo số lần nhận lương, lịch sử phân bổ, biểu đồ tỷ lệ.

### 4.5 Transfer — Điều chuyển tiền

**Mục tiêu:** Di chuyển tiền giữa các "Túi" mà không làm thay đổi tổng tài sản.

**Form:**
- Túi Nguồn (trừ tiền).
- Túi Đích (cộng tiền).
- Số tiền, Ngày, Ghi chú.

**Validation:**
- Nguồn ≠ Đích.
- Số dư Nguồn ≥ Số tiền chuyển.
- Chuyển giữa 2 Quỹ khác nhau → hiện confirm cảnh báo về nguyên tắc kiểm soát chi tiêu.

**Cơ chế:** Tạo 2 transactions (1 expense ở Nguồn + 1 income ở Đích) + cập nhật balance 2 túi.

**Không có:** Lịch sử điều chuyển riêng (xem trong Transactions chung), điều chuyển định kỳ.

### 4.6 Master Data — Quản lý danh mục

**Mục tiêu:** Cho phép user tùy chỉnh hệ thống theo nhu cầu cá nhân.

**Tab 1: Các Túi (Quỹ con)**
- Form tạo mới: Tên túi + chọn Quỹ.
- Danh sách: nhóm theo Quỹ, hiển thị tên + số dư.
- Có thể **Sửa tên túi** hoặc **Xóa túi** (có confirm).
- **Không có:** Sửa số dư trực tiếp (phải qua giao dịch chuyển tiền).

**Tab 2: Hạng mục thu/chi (Categories)**
- Form tạo mới: Tên + loại (Thu/Chi) + **Chọn Icon (Emoji)**.
- Danh sách: Nhóm Thu và Chi có màu border tương ứng.
- Có thể **Sửa tên hạng mục** hoặc **Xóa hạng mục** (có confirm).

### 4.7 User Guide — Hướng dẫn sử dụng

**Mục tiêu:** Onboard người dùng mới, giải thích cách dùng từng tính năng.

- Được sắp xếp theo đúng hành trình (User Journey):
  1. Quản lý Hệ thống (Master Data) — Thiết lập ban đầu
  2. Ghi chép Giao dịch (Transactions)
  3. Nhận lương / Chia thu nhập (Income Allocation)
  4. Trang Tổng quan (Dashboard)
  5. Điều chuyển (Transfer)
- Mỗi phần đều có hướng dẫn, ảnh minh họa (`/public/guide/`).
- Thuật ngữ nhất quán: "Quỹ" (Master) và "Túi" (Detailed).

---

## 5. Luồng người dùng chính (User Flows)

### Flow 1: Thiết lập ban đầu (Onboarding)
1. Đăng nhập Google → profile tự tạo.
2. Hệ thống tự tạo các Túi mặc định (Sinh hoạt phí, Lộ phí...).
3. Đọc ngay **Hướng dẫn** bước 1 (Quản lý Master Data).
4. Vào **Master Data** → tạo thêm Túi thực tế (Techcombank, Momo...) và thêm category với các Emoji dễ thương.

### Flow 2: Nhận lương / Thu nhập lớn
1. **Chia Thu Nhập** → nhập tổng, phân bổ % vào các Túi → CHIA TIỀN NGAY.
2. Kiểm tra số dư cập nhật trên **Dashboard**.

### Flow 3: Ghi chép chi tiêu hàng ngày
1. **Giao dịch** → Thêm giao dịch → loại Khoản Chi → chọn Túi, hạng mục, số tiền, ngày (dd/mm/yyyy) → Lưu.
2. Hoặc từ **Dashboard** → bấm "Thêm" tại Túi → mở form nhanh.

### Flow 4: Điều chuyển tiền
1. **Điều chuyển** → chọn Nguồn, Đích → nhập số tiền → Thực hiện.

---

## 6. Thiết kế UI/UX

### 6.1 Design System

- **Màu sắc:** Dùng CSS variables (không hard-code hex trực tiếp trong JSX):
  - `--primary-color`: Xanh dương chính.
  - `--success-color`: Xanh lá (Thu nhập, tích cực).
  - `--danger-color`: Đỏ (Chi tiêu, cảnh báo).
  - `--surface-color`: Nền card/navbar.
  - `--bg-color`: Nền trang chính.
  - `--text-primary`, `--text-secondary`: Text màu chính/phụ.
  - `--border-color`: Màu viền.
  - `--box-shadow`: Shadow chuẩn.
  - `--fund-family`, `--fund-savings`, `--fund-charity`, `--fund-reinvest`, `--fund-personal`: Màu riêng cho từng quỹ.
- **Hỗ trợ Dark Mode:** Đọc rõ trên cả 2 theme qua `prefers-color-scheme`.

- **Typography:** Font hiện đại (Inter, hoặc system-ui).
- **Icons:** Lucide React + Emojis (cho hạng mục).

### 6.2 Layout

- **Navbar:** Sticky top, logo + nav links + avatar + logout. Tất cả trang authenticated đều có navbar.
- **Content:** Tối đa `1200px`, căn giữa, padding đủ rộng.
- **Responsive Web Mobile:** Dùng `grid` với các breakpoint ở `768px` và `480px` để collapse các UI phức tạp (đặc biệt là Income Allocation).
- **Cards:** Class `.card` cho tất cả các khối nội dung.

### 6.3 Quy tắc UI

- Số tiền Việt Nam: Format `toLocaleString('vi-VN')` + ký hiệu `₫`.
- Ngày tháng: Format `dd/mm/yyyy`.
- Loading state: Text "Đang tải...".
- Thông báo lỗi/thành công: `react-hot-toast` — Tiếng Việt toàn 100%.
- Confirm nguy hiểm (xóa, điều chuyển khác quỹ): `window.confirm()` (Tiếng Việt).
- Form xác nhận: Dùng native HTML `<form onSubmit>` với `required` validation.

---

## 7. Ràng buộc kỹ thuật (Technical Constraints)

| Ràng buộc | Chi tiết |
|-----------|---------|
| **Không thay đổi DB schema** nếu không có lý do rõ ràng | Schema đã được định nghĩa trong `supabase.sql` |
| **Không thêm thư viện CSS framework** | Dùng Vanilla CSS + CSS variables |
| **Không thay đổi cấu trúc 5 Quỹ cha** | Đây là core concept của sản phẩm |
| **Dependency useEffect Hooks** | Dùng `[user?.id]` thay vì `[user]` để tránh wipe form khi alt+tab (onVisibilityChange). |
| **Phân bổ thu nhập không được vượt quá tổng thu nhập** | Business rule bất biến |
| **Tất cả routes (trừ /login) phải qua PrivateRoute** | Auth security |
| **Ngôn ngữ thuần Việt** | Toàn bộ error handling/alerts phải tiếng Việt. |

---

## 8. Tính năng KHÔNG nên build (Out of Scope)

*Các tính năng này nằm ngoài phạm vi hiện tại. Nếu muốn thêm, phải thảo luận & cập nhật PRD trước.*

- 📊 Biểu đồ thống kê / báo cáo tổng hợp phức tạp (có grid view là đủ).
- 📅 Lọc giao dịch theo khoảng thời gian.
- 📤 Export CSV/Excel.
- 🔔 Thông báo / nhắc nhở push notifications.
- 👥 Multi-user / chia sẻ quỹ gia đình.
- 📱 Native Mobile App (PWA / Web Mobile đã đủ tốt).
- 🏦 Tích hợp ngân hàng bằng API (Open Banking).

---

## 9. Quy trình thêm tính năng mới

Trước khi code, AI cần tự hỏi:

1. **Có phá vỡ cấu trúc 5 Quỹ không?** → Nếu có, reject hoặc thảo luận lại.
2. **Có cần thay đổi DB schema không?** → Nếu có, phải cập nhật `supabase.sql` và document rõ migration steps.
3. **Tính năng mới có làm lệch triết lý "chia tiền trước, tiêu sau" không?** → Nếu có, cần thảo luận với User.
4. **Có thêm thư viện mới không?** → Hỏi User trước. Ưu tiên dùng những gì đã có.
5. **Cập nhật PRD này** nếu tính năng mới được approve và hoàn thành.

---

## 10. Lịch sử thay đổi PRD

| Ngày | Version | Thay đổi | Người thực hiện |
|------|---------|----------|----------------|
| 2026-04-14 | v1.0 | Khởi tạo PRD từ codebase hiện tại | AI (Antigravity) |
| 2026-04-14 | v1.1 | Update terminology (Quỹ, Túi), Date formatting, Default categories/funds, Mobile Responsive Fixes (IncomeAllocation). | AI (Antigravity) |

## 7. Ràng buộc kỹ thuật (Technical Constraints)

| Ràng buộc | Chi tiết |
|-----------|---------|
| **Không thay đổi DB schema** nếu không có lý do rõ ràng | Schema đã được định nghĩa trong `supabase.sql` |
| **Không thêm thư viện CSS framework** | Dùng Vanilla CSS + CSS variables |
| **Không thay đổi cấu trúc 5 Quỹ cha** | Đây là core concept của sản phẩm |
| **Không xóa RLS policies** | Bảo mật dữ liệu user |
| **Phân bổ thu nhập không được vượt quá tổng thu nhập** | Business rule bất biến |
| **Xóa giao dịch phải hoàn trả số dư** | Data integrity |
| **Tất cả routes (trừ /login) phải qua PrivateRoute** | Auth security |
| **Không thêm auth method mới** | Chỉ Google OAuth |

---

## 8. Tính năng KHÔNG nên build (Out of Scope)

*Các tính năng này nằm ngoài phạm vi hiện tại. Nếu muốn thêm, phải thảo luận & cập nhật PRD trước.*

- 📊 Biểu đồ thống kê / báo cáo tổng hợp.
- 📅 Lọc giao dịch theo khoảng thời gian.
- 📤 Export CSV/Excel.
- 🔔 Thông báo / nhắc nhở.
- 👥 Multi-user / chia sẻ quỹ gia đình.
- 📱 Mobile app (tuy nhiên responsive web là ưu tiên).
- 🏦 Tích hợp ngân hàng tự động.
- 💳 Quản lý nợ / khoản vay.
- 🌐 Đa ngôn ngữ (app hiện chỉ tiếng Việt).

---

## 9. Quy trình thêm tính năng mới

Trước khi code, AI cần tự hỏi:

1. **Có phá vỡ cấu trúc 5 Quỹ không?** → Nếu có, reject hoặc thảo luận lại.
2. **Có cần thay đổi DB schema không?** → Nếu có, phải cập nhật `supabase.sql` và document rõ migration steps.
3. **Tính năng mới có làm lệch triết lý "chia tiền trước, tiêu sau" không?** → Nếu có, cần thảo luận với User.
4. **Có thêm thư viện mới không?** → Hỏi User trước. Ưu tiên dùng những gì đã có.
5. **Cập nhật PRD này** nếu tính năng mới được approve và hoàn thành.

---

## 10. Lịch sử thay đổi PRD

| Ngày | Version | Thay đổi | Người thực hiện |
|------|---------|----------|----------------|
| 2026-04-14 | v1.0 | Khởi tạo PRD từ codebase hiện tại | AI (Antigravity) |

---

*📌 File này được lưu tại: `e:/Vibe-code-apps/spending-app/PRD.md`*
*📌 Cập nhật file này mỗi khi có thay đổi lớn về tính năng hoặc kiến trúc.*
