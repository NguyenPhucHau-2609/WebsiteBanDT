# API Testing Guide

## 1. Start local environment

### Option A: Run step by step

```powershell
docker compose up -d
npm run seed
npm run dev
```

### Option B: Run one command

```powershell
npm run start:local
```

## 2. Local addresses

- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- MongoDB: `mongodb://127.0.0.1:27017/webbandt`

## 3. Why server may look like it is not running

- If `docker` is not running, backend cannot connect to MongoDB.
- If you start server in a temporary task window, the process may stop when that window closes.
- You should keep `npm run dev` open in a terminal tab while testing.
- If port `5000` is already in use, server will fail to bind that port.

## 4. Quick checks

### Check MongoDB container

```powershell
docker ps
```

You should see `webbandt-mongodb`.

### Check backend health

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/health"
```

Expected result:

```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

## 5. Seed admin account

Tai khoan admin khong con duoc hardcode trong source.

Truoc khi chay `npm run seed`, them vao `.env`:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PHONE=0900000000
SEED_ADMIN_PASSWORD=doi-mat-khau-admin-manh-hon
```

Sau do moi thuc hien login admin bang thong tin ban vua dat.

## 6. Test flow for customer APIs

### 6.1 Register customer

```powershell
$body = @{
  fullName = "Nguyen Van A"
  email = "a@example.com"
  phone = "0911111111"
  password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/register" `
  -ContentType "application/json" `
  -Body $body
```

### 6.2 Login customer

```powershell
$body = @{
  emailOrPhone = "a@example.com"
  password = "123456"
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body $body

$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }
```

### 6.3 Get profile

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/user/profile" -Headers $headers
```

### 6.4 Add address

```powershell
$body = @{
  fullName = "Nguyen Van A"
  phone = "0911111111"
  province = "Ho Chi Minh"
  district = "Thu Duc"
  ward = "Linh Trung"
  street = "1 Vo Van Ngan"
  note = "Gan nha sach"
  type = "home"
  isDefault = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/address" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### 6.5 Get product list

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/products"
```

### 6.6 Search product

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/products?q=iphone"
```

### 6.7 Product suggestion

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/products/suggest?q=ip"
```

### 6.8 Get product detail

Use the product id from `/api/products`.

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/products/{productId}"
```

### 6.9 Add to cart

Use `productId` and `variantId` from `/api/products`.

```powershell
$body = @{
  productId = "{productId}"
  variantId = "{variantId}"
  quantity = 1
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/cart" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### 6.10 View cart

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/cart" -Headers $headers
```

### 6.11 Apply voucher

Seed voucher code: `WELCOME10`

```powershell
$body = @{ code = "WELCOME10" } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/voucher/apply" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### 6.12 Create order

```powershell
$address = Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/address" -Headers $headers
$addressId = $address.data[0]._id

$body = @{
  addressId = $addressId
  paymentMethod = "cod"
  shippingFee = 30000
  note = "Giao gio hanh chinh"
} | ConvertTo-Json

$order = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/orders" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### 6.13 Get order history

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/orders/user" -Headers $headers
```

### 6.14 Get order detail

```powershell
$orderId = $order.data._id
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/orders/$orderId" -Headers $headers
```

### 6.15 Customer support ticket

```powershell
$body = @{
  subject = "Can ho tro don hang"
  message = "Minh muon hoi ve thoi gian giao hang"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/support" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

## 7. Test flow for admin APIs

### 7.1 Login admin

```powershell
$body = @{
  emailOrPhone = "admin@example.com"
  password = "doi-mat-khau-admin-manh-hon"
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body $body

$adminToken = $adminLogin.data.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
```

### 7.2 Get users

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/users" -Headers $adminHeaders
```

### 7.3 Get all orders

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/orders" -Headers $adminHeaders
```

### 7.4 Confirm order

```powershell
Invoke-RestMethod -Method Put -Uri "http://localhost:5000/api/admin/orders/{orderId}/confirm" `
  -Headers $adminHeaders
```

### 7.5 Update order status

```powershell
$body = @{
  status = "processing"
  message = "Don hang dang duoc xu ly"
} | ConvertTo-Json

Invoke-RestMethod -Method Put -Uri "http://localhost:5000/api/admin/orders/{orderId}/status" `
  -Headers $adminHeaders `
  -ContentType "application/json" `
  -Body $body
```

### 7.6 Get inventory

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/inventory" -Headers $adminHeaders
```

### 7.7 Adjust stock

```powershell
$body = @{
  quantityChange = 5
  note = "Nhap them hang"
} | ConvertTo-Json

Invoke-RestMethod -Method Put -Uri "http://localhost:5000/api/admin/inventory/variants/{variantId}/adjust" `
  -Headers $adminHeaders `
  -ContentType "application/json" `
  -Body $body
```

### 7.8 Analytics overview

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/analytics/overview" -Headers $adminHeaders
```

## 8. Useful API groups

- Auth: `/api/auth/*`
- User profile: `/api/user/profile`
- Address: `/api/address`
- Products: `/api/products`
- Cart: `/api/cart`
- Voucher: `/api/voucher/apply`
- Orders: `/api/orders`
- Payment: `/api/payment`
- Notifications: `/api/notifications`
- Support: `/api/support`
- Returns: `/api/returns`
- Shipment tracking: `/api/shipments/{trackingCode}`
- Admin: `/api/admin/*`

## 9. Recommended test order

1. `GET /api/health`
2. `POST /api/auth/login` with admin
3. `GET /api/products`
4. `POST /api/auth/register`
5. `POST /api/auth/login` with customer
6. `POST /api/address`
7. `POST /api/cart`
8. `POST /api/voucher/apply`
9. `POST /api/orders`
10. `GET /api/orders/user`
11. `GET /api/admin/orders`
12. `PUT /api/admin/orders/{id}/confirm`

## 10. If localhost still does not work

Run these checks:

```powershell
docker ps
Get-NetTCPConnection -LocalPort 5000
Get-Content .env
```

If port 5000 is busy, change `PORT` in `.env`, for example:

```env
PORT=5001
```

## 11. Forgot password testing

- `POST /api/auth/forgot-password` mac dinh chi tra thong bao chung, khong tra raw reset token.
- Neu can debug local, dat `EXPOSE_RESET_TOKEN_FOR_TESTING=true` trong `.env` roi goi lai endpoint.
