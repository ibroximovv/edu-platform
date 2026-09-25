# Bilimdon — universitet o'quv platformasi

HEMIS'ga o'xshash, lekin zamonaviy va yengil LMS: topshiriqlar, dars mavzulari, materiallar (video/rasm/PDF), testlar, oraliq va yakuniy nazorat, elektron jurnal, davomat, dars jadvali, reyting, guruhlar, fanlar, o'quv yillari — **talaba, o'qituvchi va administrator** uchun yagona tizimda. Bitta foydalanuvchi bir nechta rolga ega bo'lishi mumkin.

> Hozircha faqat **frontend** tayyor. Backend (NestJS) o'rniga brauzer ichidagi mock-server ishlaydi — API kontrakti to'liq tayyor.

## Ishga tushirish

```bash
bun install
bun run dev          # nx run web:dev → http://localhost:5173
bun run build        # nx run web:build
bun run typecheck    # nx run-many -t typecheck
```

### Demo hisoblar (mock rejim)

| Rol | Email | Parol |
| --- | --- | --- |
| Administrator (+ o'qituvchi + talaba) | `ibroximov@gmail.com` | `Ibroximov@1` |
| O'qituvchi | `teacher@bilimdon.uz` | `Demo@1234` |
| Talaba | `student@bilimdon.uz` | `Demo@1234` |

Qolgan barcha seed foydalanuvchilar paroli ham `Demo@1234`. Ro'yxatdan o'tishda email yuborilmaydi — tasdiqlash kodi ekranda ko'rsatiladi.

## Texnologiyalar

| Qatlam | Tanlov |
| --- | --- |
| Monorepo | Nx (package-based), bun workspaces |
| UI | React 19, TypeScript, Tailwind CSS v4, Plus Jakarta Sans |
| Animatsiya | motion (framer-motion) |
| 3D | three.js + @react-three/fiber + drei (login sahnasi, banner yulduzlari, reyting podiumi) — faqat kerak bo'lganda lazy yuklanadi |
| Holat | zustand (auth, UI, test urinishlari), React Context (tema, tasdiqlash dialogi, forma maydonlari) |
| Server holati | TanStack Query (kesh, invalidatsiya, optimistik yangilanish) |
| Formalar | react-hook-form + zod |
| Routing | react-router v7, har bir sahifa alohida chunk (`React.lazy`) |
| Realtime | socket.io-client (`http` rejimda), mock rejimda ichki event bus + BroadcastChannel (tablar orasida sinxron) |

## Tuzilma

```
apps/web/                 React ilova
  src/api/http.ts         yagona HTTP klient (mock ↔ http almashadi)
  src/api/files.ts        fayl yuklash (multer uchun multipart + progress; mock'da IndexedDB)
  src/api/queries/*       React Query hooklari (domen bo'yicha)
  src/api/mock/           brauzer ichidagi REST server + deterministik seed
  src/components/ui       dizayn tizimi (Button, Modal, Drawer, DataTable, Tabs...)
  src/components/domain   domen komponentlari (CourseCard, Gradebook, ScheduleGrid...)
  src/components/three    3D sahnalar
  src/pages/{auth,student,teacher,admin,common}
libs/shared/              frontend va backend uchun umumiy tiplar + baholash formulalari
```

## Backendga ulash

1. `apps/web/.env` → `VITE_API_MODE=http`, `VITE_API_URL`, `VITE_WS_URL`.
2. NestJS `apps/api` loyihasi `@edu/shared` tiplarini import qiladi — javob shakllari (`CourseView`, `Gradebook`, `AttemptView`, ...) `libs/shared/src/views.ts` da.
3. Endpointlar ro'yxati va biznes-qoidalar (ruxsatlar, konflikt tekshiruvi, test baholash, JN/ON/YN hisobi) `apps/web/src/api/mock/handlers/*.ts` da — NestJS kontrollerlari uchun tayyor spetsifikatsiya.
4. Fayllar: `POST /files` (multipart, `file` maydoni) → `FileRef`.
5. Realtime: socket.io gateway `notification` va `db:changed` eventlarini yuboradi, `auth.token` bilan ulanadi.

## Baholash

`JN (joriy) + ON (oraliq) + YN (yakuniy) = 100`, kurs bo'yicha sozlanadi. 86+ → 5, 71+ → 4, 55+ → 3. Semestr davomida baho «prognoz» sifatida (baholangan qismlar ulushidan) ko'rsatiladi; GPA 4.0 shkalada, kreditlar bo'yicha vaznli.
# edu-platform
