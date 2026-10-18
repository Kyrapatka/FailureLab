# FailureLab — frontend MVP-01

Локальный frontend-прототип для регистрации проектов и просмотра их рабочего
пространства. Реализованы Projects, Add Project и Project Overview. Интерфейс
англоязычный, тёмный, адаптирован для desktop и узких окон.

Go-модуль не изменён. Backend, Git, Docker и исполнение экспериментов отсутствуют.
Никакие указанные в форме репозитории не читаются и не изменяются.

## Запуск в Windows PowerShell

Требуется Node.js **22.13+ в ветке 22**, **24.x** либо **26+**. Проверено на
Node 22.16.0 и npm 10.9.2. `npm.cmd` позволяет работать без изменения системной
политики выполнения PowerShell. На Linux/macOS вместо `npm.cmd` используйте `npm`.

```powershell
cd E:\go_pr\FailureLab\frontend
npm.cmd ci
npm.cmd run dev
```

Откройте адрес, выведенный Vite: обычно http://127.0.0.1:5173/projects.
Dev-сервер слушает только loopback. Для остановки нажмите Ctrl+C.

## Пользовательский сценарий

1. Откройте Projects. По умолчанию проектов нет.
2. Нажмите Add Project, введите абсолютный путь или выберите Browse.
3. Browse показывает **демонстрационные** директории, не файловую систему.
4. Укажите своё имя или оставьте имя директории. Нажмите Create Project.
5. Откроется Overview с состоянием подготовки и отдельными пустыми превью.
6. Вернитесь через All projects; поиск работает по имени и пути.
7. Reload сохраняет пользовательские проекты. В Overview можно переключать их
   через Project; работают прямые ссылки и Back/Forward браузера.

Дубликаты сравниваются текстово: обрезаются внешние пробелы и конечные разделители,
Windows `\` преобразуется в `/`. Регистр сохраняется для всех путей, включая букву
диска. UNC/device paths, относительные пути, корни, dot segments, неоднозначные
разделители и недопустимые Windows-имена отклоняются. Это не проверка физической
идентичности каталогов. Символические ссылки не разрешаются.

## Demo и сохранение

Откройте **http://127.0.0.1:5173/projects?demo=1** либо Explore demo projects:

| Проект | Репозиторий | Environments / Scenarios / Runs | Готовность |
|---|---|---|---|
| payment-api | Available, mock | 0 / 0 / 0 | Setup Required |
| auth-service | Available, mock | 2 / 3 / 5 | Ready |
| order-service | Unavailable, mock | 1 / 2 / 4 | Needs Attention; история видна |

Demo хранится в памяти, никогда не записывается в пользовательское хранилище.
Параметр `demo=1` сохраняется при навигации; reload восстанавливает исходные
fixtures. Созданные в demo проекты исчезают при reload, что отмечено в баннере.
Exit demo возвращает пользовательские проекты. В обычном режиме выбор известной
директории создаёт **новый пустой проект**, без копирования демо-конфигураций.

Пользовательские проекты сохраняются в localStorage текущего origin, ключ
`failurelab.projects.v1`, оболочка `{ version: 1, data: ... }`. Другой порт,
`localhost` вместо `127.0.0.1` или другой браузер — другое хранилище. При ошибке
чтения, неверной схеме или несогласованных связях исходные байты не перезаписываются.
Можно исправить данные через DevTools и нажать Retry. Для удаления тестовых данных
используйте **Reset local data → Confirm reset**. Cancel ничего не удаляет.
Сброс действует только на этот ключ и никогда не удаляет исходные репозитории.

## Проверки

```powershell
cd E:\go_pr\FailureLab\frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run format:check
```

Для стандартного Playwright Chromium при первом запуске:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Для уже установленного Chrome, как в выполненной проверке:

```powershell
$env:PW_CHANNEL = 'chrome'
npm.cmd run test:e2e
```

Альтернатива — `PW_CHANNEL=msedge` при установленном Edge. Playwright автоматически
поднимает Vite на 127.0.0.1:5173 либо использует уже работающий сервер на этом порту.
Каждый E2E-тест получает отдельный browser context и localStorage; повторные прогоны
не зависят друг от друга и не трогают пользовательский профиль браузера.
Отчёт: `frontend/playwright-report/index.html`; скриншоты: `frontend/test-results/`.
После изменений форматирование выполняется командой `npm.cmd run format`.

Production preview:

```powershell
npm.cmd run build
npm.cmd run preview -- --port 4173
```

Откройте http://127.0.0.1:4173/projects. Для размещения `frontend/dist/` на другом
сервере необходим SPA fallback неизвестных URL на `index.html`.

## Управляемые mock-ошибки

Только в dev-сборке доступны параметры URL, читаемые при полной загрузке:

- `/projects?failLoad=1` — первый запрос данных завершается ошибкой; Retry успешен.
- `/projects?failCreate=1` — первая попытка создания завершается ошибкой, поля
  остаются заполненными; следующий submit успешен.
- `/projects?delay=1000` — фиксированная задержка 1000 мс (предел 5000 мс).
- Параметры можно сочетать: `/projects?demo=1&failLoad=1&delay=1000`.

Обычный режим имеет фиксированную задержку 250 мс и не содержит случайных ошибок.
При полном reload счётчики ошибок начинаются заново. В production эти параметры
ошибок/задержки игнорируются; явный demo-режим остаётся доступен.

## Архитектура

React 19, TypeScript 6.0, Vite 8, React Router 7, Tailwind 4, Lucide, TanStack Query,
React Hook Form и Zod. Dialog построен на Radix с композиционным подходом shadcn/ui;
полный CLI/набор shadcn-компонентов не добавлялся ради одного dialog. Tailwind
используется для базовых стилей и theme-токенов, предметные стили — в `styles.css`.

- `frontend/src/app/` — маршруты, layout, навигация, подтверждаемый reset.
- `frontend/src/features/projects/` — модели, чистые правила, async adapter, форма
  и список. Для Go API достаточно реализовать интерфейс `ProjectsApi` и подставить
  его при создании App; UI не обращается к localStorage.
- `frontend/src/features/project-overview/` — готовность, preview и история.
- `frontend/src/mocks/` — fixtures, проверка схемы и связей, хранение.
- `frontend/src/shared/ui/` — dialog и состояния loading/error/not found.
- `frontend/e2e/` — браузерные сценарии.
- `docs/frontend/` — спецификация и проверка всех acceptance criteria.

Точные версии зафиксированы в package-lock.json. TypeScript 6.0 выбран из-за
ограничения typescript-eslint `<6.1`, jsdom 29 — из-за установленного Node 22.16
(jsdom 30 требует более новый Node). Эти ограничения проверены в npm metadata.
Настройка Vite, Router и Tailwind сверена с
[Vite](https://vite.dev/guide/),
[React Router](https://reactrouter.com/start/declarative/installation),
[Tailwind](https://tailwindcss.com/docs/installation/using-vite) и
[shadcn Dialog](https://ui.shadcn.com/docs/components/radix/dialog).

## Границы MVP

Repository availability, конфигурации, Git branch, revision и история — mock.
Произвольный путь получает Not verified. Ready означает наличие обязательных
условий подготовки, не успешность будущего запуска. Failed Run не меняет Ready.
Активный Run — статичный snapshot без выдуманного процента прогресса.

Редакторы Environment/Scenario, мастер и исполнение эксперимента, Run Details,
сравнение, Project Settings, Go API, SQLite, Git Worktree, Docker, k6, SSE и
Toxiproxy не реализованы. Будущие кнопки и вкладки disabled с объяснениями.
localStorage не заменяет backend; одновременное редактирование из нескольких
вкладок не синхронизируется. Это проверенный frontend-прототип, не production-ready
платформа.

Следующий функциональный этап: **настройка Environment** с созданием и проверкой
пригодности конфигурации для выбранного проекта.

Полный результат проверок: [MVP-01 report](docs/frontend/mvp-01-report.md).
#   F a i l u r e L a b  
 