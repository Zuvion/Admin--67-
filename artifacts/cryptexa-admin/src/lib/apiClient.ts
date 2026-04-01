import { setAuthTokenGetter } from "@workspace/api-client-react";

// Всегда читаем актуальный токен из localStorage — нет проблем с устаревшим замыканием
setAuthTokenGetter(() => localStorage.getItem("admin_jwt"));
