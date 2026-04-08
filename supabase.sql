-- Bảng người dùng (liên kết với auth.users của Supabase)
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng 5 Quỹ Cha (Master Funds)
CREATE TABLE public.master_funds (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- Quỹ Gia đình, Quỹ Tiết kiệm, Quỹ Tạo phúc Trả nợ, Quỹ Tái đầu tư tiêu dùng, Quỹ Chi tiêu bản thân
  description text,
  is_fixed boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Thêm Data mặc định cho 5 Quỹ Cha
INSERT INTO public.master_funds (name, description) VALUES
  ('Quỹ Gia đình', 'Dành cho các chi phí sinh hoạt thiết yếu của gia đình'),
  ('Quỹ Tiết kiệm', 'Dành cho các mục tiêu dài hạn, phòng ứng phó khẩn cấp'),
  ('Quỹ Tạo phúc Trả nợ', 'Dành cho từ thiện, biếu tặng hoặc trả nợ'),
  ('Quỹ Tái đầu tư tiêu dùng', 'Dành cho học tập, phát triển bản thân, mua sắm lớn'),
  ('Quỹ Chi tiêu bản thân', 'Dành cho nhu cầu giải trí, mua sắm cá nhân');

-- Bảng Quỹ Chi Tiết (Detailed Funds) - có thể có nhiều quỹ con cho mỗi user thuộc các Quỹ Cha
CREATE TABLE public.detailed_funds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  master_fund_id uuid references public.master_funds(id) on delete cascade not null,
  name text not null, -- Phân loại quỹ con (Ví dụ: Tiền tiết kiệm Techcombank)
  balance numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Hạng mục chi tiêu/thu nhập (Categories)
CREATE TABLE public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'income' hoặc 'expense'
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Giao dịch (Transactions)
CREATE TABLE public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detailed_fund_id uuid references public.detailed_funds(id) on delete cascade not null,
  category_id uuid references public.categories(id),
  amount numeric not null,
  type text not null, -- 'income', 'expense', 'transfer'
  transaction_date date not null default CURRENT_DATE,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bảng Mẫu Phân Bổ (Income Templates)
CREATE TABLE public.income_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  allocations jsonb not null, -- {"master_fund_id": percentage_or_amount, ...}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BẬT RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailed_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_templates ENABLE ROW LEVEL SECURITY;

-- CÁC POLICY ĐỂ BẢO VỆ DỮ LIỆU
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Master funds thì ai cũng xem được
CREATE POLICY "Anyone can view master funds" ON public.master_funds FOR SELECT USING (true);

-- Các bảng khác: user chỉ được xem & sửa dữ liệu do mình tạo ra
CREATE POLICY "Users can view own detailed_funds" ON public.detailed_funds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own detailed_funds" ON public.detailed_funds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own detailed_funds" ON public.detailed_funds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own detailed_funds" ON public.detailed_funds FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own templates" ON public.income_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.income_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.income_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.income_templates FOR DELETE USING (auth.uid() = user_id);

-- TRIGGER TỰ ĐỘNG TẠO PROFILE KHI SIGN UP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
