# Backend Website Ban Dien Thoai

Backend duoc xay dung bang `Node.js (Express.js)` va `MongoDB (Mongoose)` de phuc vu website ban dien thoai di dong.

## Chuc nang chinh

- Xac thuc: dang ky, dang nhap, quen mat khau, doi mat khau, social login demo
- Tai khoan nguoi dung: profile, dia chi, thong bao, lich su don hang
- San pham: danh muc, thuong hieu, bien the, tim kiem, loc, goi y, chi tiet
- Gio hang va ma giam gia
- Don hang va thanh toan
- Danh gia san pham
- Admin/Staff: quan ly san pham, danh muc, voucher, khuyen mai, don hang, ton kho, giao hang, doi tra, ho tro khach hang, thong ke

## Cai dat

```bash
npm install
copy .env.example .env
npm run dev
```

## Chay local voi MongoDB bang Docker

```bash
docker compose up -d
npm run seed
npm run dev
```

- MongoDB: `mongodb://127.0.0.1:27017/webbandt`
- Backend API: `http://localhost:5000`
- File test nhanh API: `api.http`

## Bien moi truong

- `PORT`: Cong server
- `MONGO_URI`: Chuoi ket noi MongoDB
- `JWT_SECRET`: Khoa ky JWT
- `JWT_EXPIRES_IN`: Thoi han token
- `CLIENT_URL`: URL frontend

## Route goc

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/orders`
- `GET /api/admin/analytics/overview`

## Ghi chu

- Tich hop `VNPay`, `MoMo`, `Google`, `Facebook` trong project nay duoc mo phong o muc backend logic de ban de noi frontend va nang cap sau.
- Neu can du lieu mau, ban co the viet them script seed duoi `src/scripts/seed.js`.
