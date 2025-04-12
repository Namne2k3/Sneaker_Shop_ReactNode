# SneakerShop - Website Bán Giày Thể Thao

## Giới thiệu

SneakerShop là một nền tảng thương mại điện tử đầy đủ chức năng được xây dựng với mục đích bán giày thể thao trực tuyến. Dự án được phát triển sử dụng công nghệ MERN stack (MongoDB, Express, React, Node.js) cùng với TypeScript, cung cấp trải nghiệm mua sắm trực tuyến mượt mà và hiệu quả.

## Cấu trúc dự án

Dự án được chia thành 3 phần chính:

1. **Client**: Frontend của ứng dụng (React + TypeScript)
2. **Server**: Backend API (Node.js + Express + MongoDB)
3. **CDN**: Dịch vụ lưu trữ và phân phối hình ảnh

## Công nghệ sử dụng

### Client
- **React** + **TypeScript**: Phát triển giao diện người dùng
- **React Router DOM**: Điều hướng trong ứng dụng
- **Redux Toolkit**: Quản lý trạng thái toàn cục
- **TanStack React Query**: Quản lý và cache dữ liệu từ API
- **Tailwind CSS**: Framework CSS để phát triển giao diện người dùng
- **Axios**: Thực hiện các yêu cầu HTTP
- **React Toastify**: Hiển thị thông báo
- **React Hook Form**: Quản lý form và xác thực form
- **Vite**: Build tool

### Server
- **Node.js** + **Express**: Xây dựng RESTful APIs
- **MongoDB** + **Mongoose**: Cơ sở dữ liệu và ODM
- **JWT**: Xác thực người dùng
- **Bcrypt**: Mã hóa mật khẩu
- **Express Validator**: Xác thực dữ liệu từ client
- **Multer**: Xử lý tải lên file
- **Axios**: Gọi API tới CDN server
- **Cors**: Xử lý CORS

### CDN
- **Express**: Xây dựng server
- **Multer**: Xử lý tải lên và lưu trữ hình ảnh

## Tính năng chính

### Phía khách hàng
- Đăng ký, đăng nhập và quản lý tài khoản
- Xem danh sách sản phẩm với các bộ lọc và tìm kiếm
- Xem chi tiết sản phẩm và các biến thể (màu sắc, kích cỡ)
- Thêm sản phẩm vào giỏ hàng
- Quản lý giỏ hàng (thêm, xóa, cập nhật số lượng)
- Đặt hàng và thanh toán
- Xem lịch sử đơn hàng và chi tiết đơn hàng
- Quản lý thông tin cá nhân

### Phía quản trị
- Dashboard với các thống kê và báo cáo
- Quản lý sản phẩm (thêm, sửa, xóa)
- Quản lý danh mục và thương hiệu
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý các biến thể sản phẩm (màu sắc, kích cỡ)

## Cấu trúc cơ sở dữ liệu

### Các collection chính
- **Users**: Thông tin người dùng
- **Products**: Thông tin sản phẩm
- **ProductVariants**: Biến thể sản phẩm (kích cỡ, màu sắc, số lượng tồn kho)
- **Categories**: Danh mục sản phẩm
- **Brands**: Thương hiệu
- **Orders**: Đơn hàng
- **Carts**: Giỏ hàng
- **Wishlists**: Danh sách yêu thích
- **Reviews**: Đánh giá sản phẩm
- **Colors**: Các màu sắc
- **Sizes**: Các kích cỡ
- **Coupons**: Mã giảm giá

## Hướng dẫn cài đặt

### Yêu cầu
- Node.js v16+
- MongoDB
- NPM hoặc Yarn

### Cài đặt Server
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt các dependencies
npm install

# Tạo file .env với các biến môi trường
# Mẫu:
# PORT=5000
# MONGO_URI=your-mongodb-uri
# JWT_SECRET=your-jwt-secret
# JWT_EXPIRE=30d
# CDN_URL=http://localhost:5050

# Khởi động server ở chế độ development
npm run dev
```

### Cài đặt CDN
```bash
# Di chuyển vào thư mục cdn
cd cdn

# Cài đặt các dependencies
npm install

# Tạo file .env
# PORT=5050
```

### Cài đặt Client
```bash
# Khởi động CDN server
npm run dev

# Di chuyển vào thư mục client
cd client

# Cài đặt các dependencies
npm install

# Khởi động ứng dụng client
npm run dev
```

### Danh mục hình ảnh

Dự án đi kèm với các hình ảnh minh họa cho các chức năng chính, được lưu trong thư mục `pics`:

#### Giao diện khách hàng
- **Trang chủ**: [`trang_chu_1.png`](./pics/trang_chu_1.png), [`trang_chu_2.png`](./pics/trang_chu_2.png)
- **Sản phẩm**: [`san_pham.png`](./pics/san_pham.png), [`chi_tiet_sp.png`](./pics/chi_tiet_sp.png)
- **Tài khoản**: [`tai_khoan.png`](./pics/tai_khoan.png), [`dang_ky.png`](./pics/dang_ky.png), [`dang_nhap.png`](./pics/dang_nhap.png), [`thay_doi_mat_khau.png`](./pics/thay_doi_mat_khau.png)
- **Giỏ hàng và thanh toán**: [`gio_hang.png`](./pics/gio_hang.png), [`thanh_toan.png`](./pics/thanh_toan.png), [`dang_hang_thanh_cong.png`](./pics/dang_hang_thanh_cong.png)
- **Đơn hàng**: [`don_hang.png`](./pics/don_hang.png), [`chi_tiet_don_hang.png`](./pics/chi_tiet_don_hang.png)
- **Khác**: [`lien_he.png`](./pics/lien_he.png)

#### Giao diện quản trị
- **Quản lý thông tin chung**: [`thong_tin_chung_admin.png`](./pics/thong_tin_chung_admin.png)
- **Quản lý danh mục**: [`quan_ly_danh_muc.png`](./pics/quan_ly_danh_muc.png)
- **Quản lý sản phẩm**: [`quan_ly_san_pham.png`](./pics/quan_ly_san_pham.png)
- **Quản lý đơn hàng**: [`quan_ly_don_hang.png`](./pics/quan_ly_don_hang.png)
- **Quản lý thương hiệu**: [`quan_ly_thuong_hieu.png`](./pics/quan_ly_thuong_hieu.png)
- **Quản lý người dùng**: [`quan_ly_nguoi_dung.png`](./pics/quan_ly_nguoi_dung.png)
- **Quản lý mã giảm giá**: [`quan_ly_ma_giam_gia.png`](./pics/quan_ly_ma_giam_gia.png)

Các hình ảnh này minh họa trực quan cho các chức năng và giao diện của ứng dụng SneakerShop, giúp người dùng và nhà phát triển dễ dàng nắm bắt các tính năng của hệ thống.
