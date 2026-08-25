# Todo Everyday API

Внешний API позволяет создавать, получать, выполнять и удалять задачи Todo Everyday,
а также получать список категорий пользователя.

## Подключение

Базовый URL:

```text
https://todo-everyday.web.app/api
```

Все запросы:

- используют метод `POST`;
- передают данные в формате JSON;
- передают API-токен в поле `token`.

API-токен можно создать или обновить в настройках пользователя. После обновления
токена предыдущий токен перестаёт работать.

## Создание задач

```text
POST /tasks
```

Создание одной задачи:

```bash
curl -X POST https://todo-everyday.web.app/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "YOUR_API_TOKEN",
    "date": "2026-07-06",
    "category": "Work",
    "task": "Подготовить отчёт"
  }'
```

Создание нескольких задач:

```json
{
  "token": "YOUR_API_TOKEN",
  "date": "2026-07-06",
  "category": "Work",
  "tasks": [
    "Подготовить отчёт",
    "Отправить отчёт"
  ]
}
```

Поля:

| Поле | Обязательно | Описание |
| --- | --- | --- |
| `token` | Да | API-токен пользователя |
| `task` | Да, если нет `tasks` | Текст одной задачи |
| `tasks` | Да, если нет `task` | Массив текстов задач |
| `date` | Нет | Дата `YYYY-MM-DD`; без поля задача создаётся без даты |
| `category` | Нет | Название категории; неизвестная или отсутствующая категория означает «без категории» |

Успешный ответ (`201 Created`):

```json
{
  "ok": true,
  "date": "2026-07-06",
  "categoryId": "CATEGORY_ID",
  "created": [
    {
      "id": "TASK_ID",
      "title": "Подготовить отчёт"
    }
  ]
}
```

## Получение задач

```text
POST /tasks/get
```

```bash
curl -X POST https://todo-everyday.web.app/api/tasks/get \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "YOUR_API_TOKEN",
    "date": "2026-07-06",
    "category": "Work"
  }'
```

Поля:

| Поле | Обязательно | Описание |
| --- | --- | --- |
| `token` | Да | API-токен пользователя |
| `date` | Нет | Дата `YYYY-MM-DD`; по умолчанию текущая дата UTC |
| `category` | Нет | Фильтр по точному названию категории |

Успешный ответ (`200 OK`):

```json
{
  "date": "2026-07-06",
  "tasks": [
    {
      "id": "TASK_ID",
      "title": "Подготовить отчёт",
      "date": "2026-07-06",
      "done": false,
      "categoryId": "CATEGORY_ID",
      "order": 0
    }
  ]
}
```

## Получение категорий

```text
POST /categories/get
```

```bash
curl -X POST https://todo-everyday.web.app/api/categories/get \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "YOUR_API_TOKEN"
  }'
```

Поля:

| Поле | Обязательно | Описание |
| --- | --- | --- |
| `token` | Да | API-токен пользователя |

Успешный ответ (`200 OK`):

```json
{
  "categories": [
    {
      "id": "CATEGORY_ID",
      "title": "Work",
      "icon": "work",
      "background": "#3b82f6",
      "image": ""
    }
  ]
}
```

Категории отсортированы по названию. Поле `id` совпадает с `categoryId`,
который возвращается в задачах.

## Выполнение задач

```text
POST /tasks/complete
```

Одна задача:

```bash
curl -X POST https://todo-everyday.web.app/api/tasks/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "YOUR_API_TOKEN",
    "id": "TASK_ID"
  }'
```

Несколько задач:

```json
{
  "token": "YOUR_API_TOKEN",
  "ids": ["TASK_ID_1", "TASK_ID_2"]
}
```

Успешный ответ (`200 OK`):

```json
{
  "ok": true,
  "completed": ["TASK_ID"]
}
```

Все переданные задачи атомарно получают `done: true`. За один запрос можно
передать не более 500 уникальных ID.

## Удаление задач

```text
POST /tasks/delete
```

Одна задача:

```bash
curl -X POST https://todo-everyday.web.app/api/tasks/delete \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "YOUR_API_TOKEN",
    "id": "TASK_ID"
  }'
```

Несколько задач:

```json
{
  "token": "YOUR_API_TOKEN",
  "ids": ["TASK_ID_1", "TASK_ID_2"]
}
```

Успешный ответ (`200 OK`):

```json
{
  "ok": true,
  "deleted": ["TASK_ID"]
}
```

Все переданные задачи удаляются атомарно. За один запрос можно передать не более
500 уникальных ID.

## Ошибки

| HTTP-код | Причина |
| --- | --- |
| `400` | Отсутствуют обязательные поля, передан неверный ID или превышен лимит ID |
| `401` | API-токен отсутствует или недействителен |
| `404` | Маршрут или одна из указанных задач не найдены |
| `405` | Использован метод, отличный от `POST` |
| `500` | Внутренняя ошибка сервера |

Если при выполнении или удалении не найден хотя бы один ID, операция не
изменяет ни одну задачу:

```json
{
  "error": "Task not found",
  "missing": ["UNKNOWN_TASK_ID"]
}
```

ID задач возвращаются операциями создания и получения. API может работать
только с задачами владельца переданного токена.
