# ПРОМТ: Создание Telegram Mini App — Админ-панель CRYPTEXA

## Что нужно создать

Создай **Telegram Mini App** — админ-панель для управления крипто-биржей CRYPTEXA. Это **отдельное приложение** (отдельный репозиторий, отдельный сервис на Railway), которое работает как Telegram Mini App и подключается к основному backend CRYPTEXA через REST API.

Это НЕ обычный сайт. Это мини-приложение Telegram — оно открывается внутри Telegram через бота и использует Telegram WebApp SDK для интеграции с мессенджером.

---

## Стек технологий

```
Frontend: React + TypeScript + Vite + TailwindCSS
UI: shadcn/ui (тёмная тема)
Telegram: @telegram-apps/sdk-react (Telegram Mini App SDK)
Backend: Express.js (proxy-сервер для безопасности API ключа)
Деплой: Railway (отдельный сервис)
```

---

## Переменные окружения

```env
# URL основного приложения CRYPTEXA (backend API)
CRYPTEXA_API_URL=https://your-cryptexa-app.up.railway.app

# API ключ для авторизации запросов к CRYPTEXA
# Этот ключ передаётся в header X-Admin-API-Key
# Должен совпадать с ADMIN_API_KEY в CRYPTEXA
ADMIN_API_KEY=your_64_char_hex_key

# Пароль для входа в админ-панель (второй уровень защиты)
ADMIN_PASSWORD=your_admin_password

# Секрет для генерации JWT токенов сессии
JWT_SECRET=your_jwt_secret

# ID Telegram бота админ-панели (для Telegram Mini App)
BOT_TOKEN=your_admin_bot_token
```

---

## Архитектура приложения

```
admin-panel/
├── src/
│   ├── components/          # UI компоненты (таблицы, модалки, карточки)
│   │   ├── Layout.tsx       # Основной layout с навигацией
│   │   ├── Sidebar.tsx      # Боковая навигация
│   │   ├── StatsCard.tsx    # Карточка статистики
│   │   ├── DataTable.tsx    # Универсальная таблица с пагинацией
│   │   ├── Modal.tsx        # Модальные окна
│   │   ├── StatusBadge.tsx  # Бейджи статусов
│   │   └── ChatWindow.tsx   # Окно чата поддержки
│   ├── pages/
│   │   ├── LoginPage.tsx    # Страница входа (ввод пароля)
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── UserDetailPage.tsx
│   │   ├── LuckyModePage.tsx
│   │   ├── TradesPage.tsx
│   │   ├── WithdrawalsPage.tsx
│   │   ├── BroadcastPage.tsx
│   │   ├── ChecksPage.tsx
│   │   ├── SupportPage.tsx
│   │   ├── LogsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── useApi.ts        # Hook для API запросов через proxy
│   │   ├── useAuth.ts       # Авторизация (JWT)
│   │   └── usePolling.ts    # Автообновление данных
│   ├── lib/
│   │   ├── api.ts           # API client (fetch wrapper)
│   │   ├── utils.ts         # Утилиты (форматирование чисел, дат)
│   │   └── types.ts         # TypeScript типы
│   ├── App.tsx              # React Router
│   └── main.tsx             # Entry point + Telegram SDK init
├── server/
│   └── index.ts             # Express proxy server
├── .env.example
├── package.json
├── railway.json
├── vite.config.ts
└── tsconfig.json
```

---

## Telegram Mini App интеграция

### Инициализация
```typescript
// main.tsx
import { SDKProvider } from '@telegram-apps/sdk-react';

// Инициализировать Telegram Mini App SDK
// Установить тёмную тему
// Развернуть на весь экран (expand)
// Показать кнопку закрытия
```

### Особенности Mini App
1. **Адаптация под мобильный экран** — основной режим использования, но должно работать и на десктопе
2. **Тёмная тема** — использовать цвета из Telegram theme params как базу, дополнить своими
3. **Haptic feedback** — при нажатиях на важные кнопки (одобрить/отклонить вывод, блокировка)
4. **Back button** — использовать Telegram BackButton для навигации назад
5. **Popup/Alert** — использовать нативные Telegram попапы для подтверждений опасных действий
6. **Навигация** — нижний tab-bar (как в основном CRYPTEXA) вместо sidebar, т.к. это мобильное приложение. Но sidebar тоже нужен — для десктоп-режима (>768px)

### Бот для админ-панели
Нужно создать ОТДЕЛЬНОГО Telegram бота для админ-панели (не основной бот CRYPTEXA). Этот бот:
- Имеет команду `/start` → открывает Mini App
- Menu Button в боте → открывает Mini App
- Web App URL = домен этой админ-панели на Railway

---

## Авторизация и безопасность

### Двухуровневая защита:
1. **Telegram Mini App** — приложение открывается только через Telegram, initData подписан ботом
2. **Пароль** — при первом входе вводится пароль (ADMIN_PASSWORD), генерируется JWT, сохраняется в localStorage

### Поток авторизации:
1. Пользователь открывает Mini App в Telegram
2. Фронтенд отправляет Telegram initData + пароль → POST /auth/login на proxy-сервер
3. Proxy проверяет initData (валидация подписи), проверяет пароль → выдаёт JWT
4. JWT сохраняется в localStorage
5. Все последующие запросы идут с JWT в header Authorization
6. Proxy проверяет JWT → проксирует к CRYPTEXA API с header X-Admin-API-Key

### Proxy-сервер (Express)
```
POST /auth/login          → проверка initData + пароля, выдача JWT
GET/POST /proxy/admin/*   → проксирование к CRYPTEXA_API_URL/api/admin/* с X-Admin-API-Key
```

**КРИТИЧЕСКИ ВАЖНО**: `ADMIN_API_KEY` НИКОГДА не попадает на фронтенд. Только proxy-сервер знает этот ключ и добавляет его к запросам.

---

## Дизайн

### Цветовая схема (тёмная тема, стиль Binance/крипто)
```css
--bg-primary: #0a0e17;       /* Основной фон (как в CRYPTEXA) */
--bg-card: #131a2a;          /* Фон карточек */
--bg-card-hover: #1a2236;    /* Hover карточек */
--accent: #8b5cf6;           /* Фиолетовый акцент */
--accent-secondary: #e040fb; /* Розовый акцент (как в CRYPTEXA) */
--success: #00e676;          /* Зелёный (рост, одобрено) */
--danger: #ff5252;           /* Красный (падение, отклонено) */
--warning: #ffab40;          /* Оранжевый (ожидание) */
--text-primary: #e2e8f0;     /* Основной текст */
--text-secondary: #64748b;   /* Вторичный текст */
--border: #1e293b;           /* Границы */
```

### Стиль компонентов
- Стеклянные карточки: `backdrop-filter: blur(12px); background: rgba(19, 26, 42, 0.8); border: 1px solid rgba(255,255,255,0.06);`
- Градиентные кнопки для основных действий: `linear-gradient(135deg, #e040fb, #7c4dff)`
- Скруглённые углы: `border-radius: 16px` для карточек, `12px` для кнопок
- Тени: `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3)`

### Адаптивность
- **Mobile (< 768px)**: нижний tab-bar навигация (5 основных вкладок + "Ещё" для остальных)
- **Desktop (>= 768px)**: sidebar слева (collapsible)
- Карточки статистик: в 2 колонки на мобиле, 4 на десктопе

---

## Страницы и функционал

### 1. Страница входа (`/login`)
- Логотип CRYPTEXA Admin
- Поле ввода пароля
- Кнопка "Войти"
- При успехе → редирект на Dashboard
- При ошибке → сообщение "Неверный пароль"

---

### 2. Dashboard (`/`)
Главная страница со статистиками. Автообновление каждые 30 секунд.

**API вызовы:**
- `GET /api/admin/dashboard` → статистика
- `GET /api/admin/stats` → краткая статистика
- `GET /api/admin/online-count` → онлайн пользователи

**Карточки статистик (сетка 2x3 на мобиле, 4x2 на десктопе):**

| Карточка | Поле | Иконка | Цвет |
|---|---|---|---|
| Всего пользователей | `stats.total_users` | 👥 | default |
| Онлайн сейчас | `online.count` | 🟢 | зелёный, пульсация |
| Депозиты сегодня | `stats.deposits_today` | 💰 | зелёный |
| Депозиты за неделю | `stats.deposits_week` | 📊 | default |
| Депозиты за месяц | `stats.deposits_month` | 📈 | default |
| Активные сделки | `stats.active_trades` | ⚡ | фиолетовый |
| Ожидающие выводы | `stats.pending_withdrawals` | ⏳ | красный badge если > 0 |
| Общий баланс | `stats.total_balance` | 💎 | градиент |

**Блок "Онлайн пользователи":**
- Список пользователей из `online-count` endpoint
- Каждый пользователь: username, profile_id, последняя активность
- Клик → переход на страницу детали пользователя

**Формат ответа dashboard:**
```json
{
  "ok": true,
  "stats": {
    "total_users": 150,
    "active_24h": 45,
    "deposits_today": 5000.00,
    "deposits_week": 25000.00,
    "deposits_month": 80000.00,
    "pending_withdrawals": 3,
    "active_trades": 12,
    "total_balance": 150000.00
  }
}
```

**Формат ответа stats:**
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "online_count": 12,
    "total_deposits": 250000.00,
    "total_withdrawals": 50000.00,
    "total_trades": 5000,
    "active_trades": 12,
    "pending_withdrawals": 3
  }
}
```

**Формат ответа online-count:**
```json
{
  "success": true,
  "data": {
    "count": 12,
    "users": [
      {
        "telegram_id": "123456",
        "username": "john",
        "profile_id": 1001,
        "last_online_at": "2026-03-31T12:00:00"
      }
    ]
  }
}
```

---

### 3. Пользователи (`/users`)
Список всех пользователей с поиском, фильтрацией и пагинацией.

**API:** `GET /api/admin/users?page=1&limit=20&search=&filter=`

**Параметры:**
- `page` (int, default 1) — номер страницы
- `limit` (int, default 20, max 100) — записей на страницу
- `search` (string) — поиск по username, telegram_id, profile_id
- `filter` (string) — фильтр: `premium` | `blocked` | `verified` | `with_balance` | пусто (все)

**Таблица (на мобиле — карточки):**

| Поле | Описание |
|---|---|
| Profile ID | Уникальный ID в системе |
| Username | Telegram username |
| Telegram ID | ID в Telegram (кликабельная ссылка `tg://user?id=...`) |
| Баланс USDT | `balance_usdt`, формат с пробелами (65 250.00) |
| Статус | Бейджи: ⭐ premium, ✅ verified, 🚫 blocked, 🍀 lucky |
| Win Rate | `custom_win_rate` (процент) или "73%" если null |
| Онлайн | `last_online_at` (зелёный кружок если < 5 мин назад) |
| Реф. код | `referral_code` |

**Действия:**
- Клик по строке → `/users/:profileId` (детали пользователя)
- Поиск — debounce 300мс

**Формат ответа:**
```json
{
  "ok": true,
  "users": [
    {
      "id": 1,
      "telegram_id": "123456",
      "profile_id": 1001,
      "username": "john",
      "balance_usdt": 500.00,
      "is_verified": false,
      "is_premium": true,
      "is_blocked": false,
      "language": "ru",
      "lucky_mode": false,
      "custom_win_rate": null,
      "last_online_at": "2026-03-31T12:00:00",
      "telegram_link": "tg://user?id=123456",
      "created_at": "2026-01-15T10:00:00",
      "referral_code": "abc123"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

---

### 4. Детали пользователя (`/users/:profileId`)
Полная информация и управление конкретным пользователем.

**API:** `GET /api/admin/user/{profile_id}`

**Блок "Профиль" — карточка с информацией:**
- Profile ID, Telegram ID (кликабельная ссылка), Username, Язык
- Баланс USDT (крупным шрифтом, формат с пробелами)
- Крипто-кошельки — отобразить каждую валюту из `wallets` JSON: `{"BTC": 0.005, "ETH": 0.1, "TON": 50}`
- Реферальная информация: код, доход, кол-во рефералов, кем приглашён
- Статусы: верификация, premium, блокировка (с причиной)
- Win Rate: текущий `custom_win_rate` или "По умолчанию (73%)"
- Lucky Mode: вкл/выкл, до какого числа, макс. побед, использовано
- Дата регистрации, последний онлайн

**Кнопки действий:**

**💰 Изменить баланс** — модальное окно:
- Выбор действия: Добавить / Вычесть / Установить
- Ввод суммы USDT
- Кнопка "Применить"
```
POST /api/admin/user/{profile_id}/balance
Body: {"action": "add" | "subtract" | "set", "amount": 100.0}
Response: {"ok": true, "balance_usdt": 600.00}
```

**🎯 Установить Win Rate** — модальное окно:
- Слайдер или ввод 0-100%
- Кнопка "Сбросить на стандартный" (отправляет null)
```
POST /api/admin/user/{profile_id}/winrate
Body: {"custom_win_rate": 0.85}  // 85%, или null для сброса
Response: {"success": true, "data": {"profile_id": 1001, "custom_win_rate": 0.85}}
```
**ВАЖНО:** значение отправляется как float 0.0-1.0 (не проценты). В UI показывать как проценты.

**✅ Верификация / ⭐ Premium / 🚫 Блокировка** — toggle-кнопки:
```
POST /api/admin/user/{profile_id}/status
Body: {"action": "verify" | "premium" | "block" | "unblock", "reason": "текст причины"}
Response: {"ok": true, "is_verified": true, "is_premium": false, "is_blocked": false, "block_reason": null}
```
- `verify` и `premium` — toggle (включает/выключает)
- `block` — блокирует (нужна причина)
- `unblock` — разблокирует

**💬 Отправить сообщение** — модальное окно с текстовым полем:
```
POST /api/admin/user/{profile_id}/message
Body: {"text": "Текст сообщения"}
Response: {"ok": true, "message_sent": true}
```
Сообщение отправляется пользователю через Telegram-бота CRYPTEXA.

**Таблицы истории (tabs: Транзакции / Сделки / Выводы):**

Транзакции (из `response.transactions`):
| ID | Тип | Сумма | Валюта | Статус | Дата |

Сделки (из `response.trades`):
| ID | Пара | Сторона | Ставка | Старт-цена | Закрытие | Результат | Выплата | Дата |

Выводы (из `response.withdrawals`):
| ID | Сумма USDT | Адрес | Сеть | Статус | Дата |

**Формат ответа user detail:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "telegram_id": "123456",
    "profile_id": 1001,
    "username": "john",
    "balance_usdt": 500.00,
    "wallets": {"BTC": 0.005, "ETH": 0.1, "TON": 50},
    "is_verified": false,
    "is_premium": false,
    "is_blocked": false,
    "block_reason": null,
    "language": "ru",
    "referral_code": "abc123",
    "referred_by": null,
    "referral_earnings": 25.00,
    "referral_count": 3,
    "lucky_mode": false,
    "lucky_until": null,
    "lucky_max_wins": null,
    "lucky_wins_used": 0,
    "custom_win_rate": null,
    "last_online_at": "2026-03-31T12:00:00",
    "telegram_link": "tg://user?id=123456",
    "created_at": "2026-01-15T10:00:00"
  },
  "transactions": [
    {"id": 1, "type": "deposit", "amount": 100.0, "currency": "USDT", "status": "done", "details": {"method": "xrocket"}, "created_at": "2026-01-20T10:00:00"}
  ],
  "trades": [
    {"id": 1, "pair": "BTCUSDT", "side": "buy", "amount_usdt": 50.0, "start_price": 95000.0, "close_price": 95100.0, "duration_sec": 60, "status": "closed", "result": "win", "payout": 85.0, "opened_at": "2026-01-20T11:00:00", "closed_at": "2026-01-20T11:01:00"}
  ],
  "withdrawals": [
    {"id": 1, "amount_rub": 100.0, "usdt_required": 100.0, "card_number": "TRX...abc", "full_name": "TRC20", "status": "pending", "created_at": "2026-01-25T10:00:00"}
  ]
}
```

---

### 5. Lucky Mode (`/lucky`)
Управление гарантированными выигрышами для конкретных пользователей.

**API:**
- `GET /api/admin/lucky/users?search=&filter=on|off&page=1` — список
- `POST /api/admin/lucky/set` — включить/выключить
- `GET /api/admin/lucky/history/{profile_id}` — история изменений

**Таблица (карточки на мобиле):**
| Profile ID | Username | Баланс | Lucky Mode | До | Макс. побед | Использовано |

**Фильтры:** все / включён (`on`) / выключен (`off`)
**Поиск:** по telegram_id, username, profile_id

**Включение Lucky Mode** — модальное окно:
- Telegram ID пользователя (обязательно)
- Причина (обязательно!)
- Срок действия: дата или "Бессрочно" (null)
- Максимум побед: число или "Без лимита" (null)
```
POST /api/admin/lucky/set
Body: {
  "target_telegram_id": "123456",
  "enabled": true,
  "reason": "VIP клиент",
  "until": "2026-04-30T23:59:59",  // ISO 8601 или null
  "max_wins": 10                    // число или null
}
Response: {"ok": true, "lucky_mode": true, "lucky_until": "...", "lucky_max_wins": 10, "lucky_wins_used": 0}
```

**Выключение** — подтверждение + причина:
```
Body: {"target_telegram_id": "123456", "enabled": false, "reason": "Период закончился"}
```

**История изменений** — кнопка "История" для каждого пользователя:
```
GET /api/admin/lucky/history/{profile_id}
Response: {
  "ok": true,
  "history": [
    {"id": 1, "admin_id": "5394437781", "action": "LUCKY_ENABLE", "before": "lucky_mode=False...", "after": "lucky_mode=True...", "reason": "VIP клиент", "created_at": "2026-03-31T10:00:00"}
  ]
}
```

**Бизнес-логика Lucky Mode:**
- Когда включён → пользователь ВСЕГДА выигрывает сделки (100% win rate)
- `until` — дата автоматического выключения (проверяется при создании сделки)
- `max_wins` — максимум гарантированных побед (после исчерпания → обычный режим)
- `lucky_wins_used` — счётчик использованных побед

---

### 6. Сделки — Override (`/trades`)
Переопределение результата активных сделок в реальном времени.

**API:** `POST /api/admin/trades/{trade_id}/override-result`

**Интерфейс:**
- Ввод Trade ID
- Выбор результата: WIN / LOSS (два больших кнопки)
- Кнопка "Переопределить" → подтверждение через Telegram popup
- Результат операции: Success/Error сообщение

```
POST /api/admin/trades/{trade_id}/override-result
Body: {"result": "win" | "loss"}
Response: {"success": true, "data": {"trade_id": 5, "new_result": "win"}, "message": "Trade #5 result overridden to WIN"}
```

**Бизнес-логика:**
- Работает ТОЛЬКО с активными сделками (`status = "active"`)
- Меняет `predetermined_result` — это поле определяет результат при закрытии
- WIN: пользователь получает ставку × 0.7 (70% выплата) на `balance_usdt`
- LOSS: пользователь теряет ставку
- Если сделка уже закрыта → ошибка "Can only override active trades"

---

### 7. Выводы (`/withdrawals`)
Модерация запросов на вывод USDT.

**API:**
- `GET /api/admin/withdrawals?status=pending&page=1&limit=20` — список
- `POST /api/admin/withdrawal/{wd_id}/action` — действие

**Параметры:**
- `status`: `pending` | `completed` | `cancelled` | `all`
- `page`, `limit` — пагинация

**Таблица:**
| ID | Пользователь | Сумма USDT | Адрес | Сеть | Статус | Дата | Действия |

**ВАЖНО — Legacy названия полей в Withdrawal модели:**
- `amount_rub` = сумма в USDT (НЕ рубли! Legacy имя поля)
- `card_number` = крипто-адрес кошелька (сокращённый вид)
- `full_name` = название сети (TRC20 / ERC20 / BEP20 / SOL / TON)
- `usdt_required` = сколько USDT было списано с баланса
- `admin_notes` = заметки админа

**Действия для pending-выводов:**

✅ **Одобрить:**
```
POST /api/admin/withdrawal/{wd_id}/action
Body: {"action": "approve"}
Response: {"ok": true, "status": "completed"}
```

❌ **Отклонить** (с модалкой для ввода причины):
```
Body: {"action": "reject", "reason": "Подозрительная активность"}
Response: {"ok": true, "status": "cancelled", "refunded": 100.0}
```
При отклонении деньги **автоматически возвращаются** на баланс пользователя.

**Формат ответа:**
```json
{
  "ok": true,
  "withdrawals": [
    {
      "id": 1,
      "user_id": 1,
      "telegram_id": "123456",
      "profile_id": 1001,
      "username": "john",
      "amount_rub": 100.0,
      "usdt_required": 100.0,
      "card_number": "TRX...abc",
      "full_name": "TRC20",
      "status": "pending",
      "admin_notes": null,
      "created_at": "2026-01-25T10:00:00"
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

---

### 8. Рассылка (`/broadcast`)
Массовая отправка сообщений через Telegram-бот CRYPTEXA.

**API:** `POST /api/admin/broadcast`

**Интерфейс:**
- Большое текстовое поле для сообщения
- Поддержка HTML тегов: `<b>`, `<i>`, `<code>`, `<a href="...">`
- Предварительный просмотр (preview) текста
- Выбор фильтра получателей:
  - 📢 Все пользователи (без фильтра)
  - ⭐ Только premium (`filter: "premium"`)
  - ✅ Только verified (`filter: "verified"`)
  - 💰 Только с балансом > 0 (`filter: "with_balance"`)
- Кнопка "Отправить" → подтверждение
- Результат: `sent` / `failed` / `total`

```
POST /api/admin/broadcast
Body: {"text": "<b>Важное обновление!</b>\n\nНовая функция...", "filter": "premium"}
Response: {"ok": true, "sent": 120, "failed": 5, "total": 125}
```

---

### 9. Подарочные чеки (`/checks`)
Создание подарочных чеков с USDT.

**API:** `POST /api/admin/check/create`

**Интерфейс:**
- Ввод суммы USDT
- Срок действия в часах (по умолчанию 24)
- Кнопка "Создать чек"
- Результат: ссылка на чек (кнопка копирования)

```
POST /api/admin/check/create
Body: {"amount_usdt": 50.0, "expires_in_hours": 24}
Response: {
  "ok": true,
  "check_code": "abc123def456",
  "check_link": "https://t.me/Cryptexa_rubot?start=check_abc123def456",
  "amount_usdt": 50.0,
  "expires_at": "2026-04-01T10:00:00",
  "admin_balance": 450.0
}
```

**Бизнес-логика:**
- Чек списывает средства с баланса админского аккаунта в CRYPTEXA
- Ссылка на чек открывается в Telegram боте CRYPTEXA
- Пользователь активирует чек через бота → получает USDT
- `admin_balance` в ответе — оставшийся баланс админа

---

### 10. Чат поддержки (`/support`)
Общение с пользователями через чат (мессенджер-стиль).

**API:**
- `GET /api/admin/chat/unread` — список пользователей с непрочитанными сообщениями
- `GET /api/admin/chat/{user_id}` — история чата с пользователем
- `POST /api/admin/chat/{user_id}/send` — отправить сообщение

**Интерфейс (два панели):**

**Левая панель** — список чатов:
- Пользователи с непрочитанными сообщениями
- Бейдж с количеством непрочитанных
- Username, profile_id, telegram_id
- Клик → открыть чат справа

**Правая панель** — чат:
- Сообщения от пользователя слева (серый фон)
- Сообщения от админа справа (фиолетовый фон)
- Текстовое поле + кнопка отправки
- Автоскролл вниз при новых сообщениях

**На мобиле** — вместо двух панелей: список → клик → переход на отдельную страницу чата

**Автообновление:** каждые 10 секунд обновлять список непрочитанных и текущий чат

**Формат ответа unread:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "profile_id": 1001,
      "username": "john",
      "telegram_id": "123456",
      "unread_count": 3
    }
  ]
}
```

**Формат ответа chat history:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "profile_id": 1001,
      "telegram_id": "123456",
      "username": "john",
      "telegram_link": "tg://user?id=123456"
    },
    "messages": [
      {
        "id": 1,
        "text": "Привет, помогите...",
        "is_from_admin": false,
        "read": true,
        "created_at": "2026-03-31T10:00:00"
      },
      {
        "id": 2,
        "text": "Здравствуйте! Чем могу помочь?",
        "is_from_admin": true,
        "read": true,
        "created_at": "2026-03-31T10:05:00"
      }
    ]
  }
}
```

**Отправка:**
```
POST /api/admin/chat/{user_id}/send
Body: {"message": "Здравствуйте! Чем могу помочь?"}
Response: {"success": true, "message": "Message sent"}
```
Сообщение дублируется в Telegram пользователю через бота CRYPTEXA.

**ВАЖНО**: `user_id` в URL — это внутренний `id` пользователя ИЛИ `profile_id` (backend поддерживает оба). Лучше использовать `user_id` из списка unread.

---

### 11. Логи (`/logs`)
Журнал всех административных действий.

**API:** `GET /api/admin/logs?page=1&limit=50`

**Таблица:**
| ID | Действие | Пользователь (user_id) | До (before_value) | После (after_value) | Причина | Детали | Дата |

**Цветовое кодирование действий:**
- `balance_add` → зелёный
- `balance_subtract`, `balance_set` → оранжевый
- `block_user` → красный
- `unblock_user` → зелёный
- `LUCKY_ENABLE` → фиолетовый
- `LUCKY_DISABLE` → серый
- `approve_withdrawal` → зелёный
- `reject_withdrawal` → красный
- `broadcast` → голубой
- `send_message` → default
- `set_winrate` → оранжевый
- `override_trade` → красный

**Формат ответа:**
```json
{
  "ok": true,
  "logs": [
    {
      "id": 1,
      "admin_id": "5394437781",
      "user_id": 1,
      "action": "balance_add",
      "before_value": "100.00",
      "after_value": "200.00",
      "reason": null,
      "details": {"by": "admin"},
      "created_at": "2026-03-31T10:00:00"
    }
  ],
  "total": 250,
  "page": 1,
  "pages": 5
}
```

---

### 12. Настройки (`/settings`)
Информация о подключении и управление сессией.

**API:** `GET /api/admin/health`

**Элементы:**
- Статус подключения к CRYPTEXA (вызов health → зелёный/красный индикатор)
- Версия CRYPTEXA (`response.version`)
- Admin ID (`response.admin_id`)
- URL CRYPTEXA API (отображение, не редактируемое)
- Кнопка "Выход" → очистка JWT, редирект на логин

**Формат ответа:**
```json
{
  "ok": true,
  "app": "CRYPTEXA",
  "version": "1.0",
  "admin_id": "5394437781"
}
```

---

## Навигация

### Мобильный режим (< 768px) — нижний tab-bar:
```
📊 Главная  |  👥 Юзеры  |  💸 Выводы  |  💬 Чат  |  ⋯ Ещё
```

"Ещё" открывает полное меню:
```
🍀 Lucky Mode
📈 Сделки
📢 Рассылка
🎁 Чеки
📋 Логи
⚙️ Настройки
```

### Десктопный режим (>= 768px) — sidebar слева:
```
📊 Dashboard        /
👥 Пользователи     /users
🍀 Lucky Mode       /lucky
📈 Сделки           /trades
💸 Выводы           /withdrawals
📢 Рассылка         /broadcast
🎁 Чеки             /checks
💬 Поддержка        /support
📋 Логи             /logs
⚙️ Настройки        /settings
```

Бейдж на "Выводы" — количество pending. Бейдж на "Чат" — количество непрочитанных.

---

## Утилиты и форматирование

### Форматирование чисел
Все суммы форматировать с пробелом-разделителем тысяч:
```typescript
function fmtNum(value: number, decimals: number = 2): string {
  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}
// 65250.5 → "65 250.50"
// 1234567.89 → "1 234 567.89"
```

### Форматирование дат
```typescript
// ISO строку → "31 мар, 12:00" (для таблиц)
// ISO строку → "31 марта 2026, 12:00:00" (для деталей)
// "5 мин назад" / "2 часа назад" (для last_online_at)
```

### Онлайн статус
Пользователь считается онлайн если `last_online_at >= 5 минут назад`:
```typescript
function isOnline(lastOnline: string | null): boolean {
  if (!lastOnline) return false;
  const diff = Date.now() - new Date(lastOnline).getTime();
  return diff < 5 * 60 * 1000; // 5 минут
}
```

### Win Rate отображение
```typescript
// custom_win_rate = 0.85 → показывать "85%"
// custom_win_rate = null → показывать "73% (стандартный)"
// В API отправлять как float 0.0-1.0
```

---

## Форматы ответов API (два формата)

Исторически API использует два формата ответов:

**Формат 1** (большинство endpoints):
```json
{"ok": true, "users": [...], "total": 150}
{"ok": false, "error": "Error message"}
```

**Формат 2** (chat, stats, online-count, winrate, trade-override):
```json
{"success": true, "data": {...}}
{"success": false, "error": "Error message"}
```

API client должен обрабатывать оба формата:
```typescript
function isSuccess(response: any): boolean {
  return response.ok === true || response.success === true;
}
```

---

## Health Check endpoint (для проверки подключения)

```
GET /api/admin/health
Header: X-Admin-API-Key: {key}
Response: {"ok": true, "app": "CRYPTEXA", "version": "1.0", "admin_id": "5394437781"}
```

Вызывать:
1. При запуске приложения (проверка конфигурации)
2. На странице Settings
3. При ошибках API — показывать "Нет связи с CRYPTEXA"

---

## Деплой на Railway

### Структура
На Railway будут ДВА отдельных сервиса:
1. **CRYPTEXA** (основное приложение) — уже задеплоено
2. **CRYPTEXA Admin** (эта админ-панель) — новый сервис

### railway.json для админ-панели
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server/dist/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Переменные окружения в Railway

**В CRYPTEXA** (добавить после деплоя админ-панели):
```
ADMIN_PANEL_URL=https://admin-panel-production-xxxx.up.railway.app
```

**В Admin Panel:**
```
CRYPTEXA_API_URL=https://cryptexa-production-xxxx.up.railway.app
ADMIN_API_KEY=<тот же ключ что в CRYPTEXA>
ADMIN_PASSWORD=<пароль для входа>
JWT_SECRET=<случайная строка>
BOT_TOKEN=<токен бота админ-панели>
PORT=<автоматически задаётся Railway>
```

### Telegram бот для админ-панели
1. Создать нового бота через @BotFather
2. Установить Menu Button: BotFather → /setmenubutton → Web App URL = URL админ-панели на Railway
3. Добавить BOT_TOKEN нового бота в переменные окружения

---

## Критически важные моменты

1. **ADMIN_API_KEY** — НИКОГДА не отправлять на фронтенд. Только proxy-сервер
2. **Withdrawal поля**: `amount_rub` = USDT, `card_number` = адрес, `full_name` = сеть (TRC20/ERC20/BEP20/SOL/TON)
3. **Win Rate**: float 0.0-1.0 (НЕ проценты). NULL = стандартный (73%). В UI отображать как %
4. **Lucky Mode**: `reason` обязательно при включении и выключении
5. **Trade Override**: работает ТОЛЬКО с active сделками. Ошибка если сделка уже закрыта
6. **Balance actions**: "add" прибавляет, "subtract" вычитает, "set" устанавливает точную сумму
7. **Broadcast**: HTML теги поддерживаются (`<b>`, `<i>`, `<a href="...">`)
8. **Check create**: списывает средства с аккаунта админа в CRYPTEXA
9. **Online status**: `last_online_at >= 5 минут назад` = онлайн
10. **Числа**: ВСЕГДА форматировать с пробелами-разделителями тысяч (65 250.00)
11. **Proxy**: Express-сервер обслуживает и статику (build React) и API проксирование
12. **Это Telegram Mini App** — адаптация под мобильный экран, Telegram BackButton, haptic feedback, нативные попапы
