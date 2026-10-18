# MVP-01 — отчёт о реализации и проверке

Дата: 18 октября 2026. Workspace: `E:\go_pr\FailureLab`.

## 1. Что реализовано

Рабочий пользовательский путь: Projects → Add Project → ручной абсолютный путь
или mock Browse → валидация → создание одной записи → Project Overview → возврат
и переключение проектов → reload с сохранением пользовательских данных.

Projects содержит отдельные empty/no-results/loading/error состояния, поиск по
имени и пути и статусы доступности. Overview содержит project header, вычисляемую
готовность, disabled-действия будущих MVP, превью окружений/сценариев, активный
демонстрационный запуск и отсортированную историю. Недоступность репозитория не
скрывает историю. Произвольные пути не считаются проверенными.

## 2. Структура изменений

Все frontend-файлы добавлены с нуля: ранее существовали только `go.mod` и `.idea/`.
Git-метаданных нет; `git status --short` вернул “not a git repository”. Коммиты
не создавались. Содержимое `go.mod` осталось `module FailureLab` (18 байт).

| Файлы | Назначение |
|---|---|
| `frontend/package.json`, `package-lock.json` | Зависимости, воспроизводимая установка и команды |
| `frontend/{vite.config.ts,tsconfig.json,eslint.config.js,playwright.config.ts}` | Сборка, строгие типы, lint, unit/E2E |
| `frontend/.prettier*`, корневой `.gitignore` | Форматирование и исключение generated-файлов |
| `frontend/index.html`, `src/main.tsx`, `public/favicon.svg` | Точка входа, providers, выбор mock-режима |
| `frontend/src/app/{App,Layout}.tsx` | Маршруты, рабочее пространство, project switcher, reset |
| `frontend/src/features/projects/model/` | Модели, пути, имена, readiness, ограничение и сортировка preview |
| `frontend/src/features/projects/data/api.ts` | Типизированные асинхронные операции |
| `frontend/src/features/projects/components/AddProject.tsx` | Dialog, Browse, RHF/Zod, pending и ошибки |
| `frontend/src/features/projects/pages/ProjectsPage.tsx` | Список, поиск и состояния |
| `frontend/src/features/project-overview/OverviewPage.tsx` | Header, readiness, previews, активный Run и история |
| `frontend/src/mocks/{fixtures,storage}.ts` | Отдельный demo dataset, schema v1 и сохранение |
| `frontend/src/shared/ui/`, `src/styles.css` | Доступный dialog, UI-состояния и responsive-стили |
| `frontend/src/**/*.test.*`, `frontend/e2e/projects.spec.ts` | 48 unit/component и 6 составных E2E-сценариев |
| `README.md`, `docs/frontend/mvp-01-spec.md`, этот отчёт | Запуск, контракт FR/AC, доказательства проверки |

## 3. Архитектурные решения

Использованы React 19.3.1, TypeScript 6.0.3, Vite 8.3.4, React Router 7.18.4,
Tailwind 4.3.3, TanStack Query 5, React Hook Form 7, Zod 4 и Lucide.
Для короткого dialog использован Radix с композицией shadcn/ui; полный CLI/набор
shadcn-компонентов не требовался. Tailwind обеспечивает preflight/theme-токены,
предметная раскладка задаётся CSS. Redux/Zustand и generic API framework отсутствуют.

`ProjectsApi` внедряется в App. UI не обращается к localStorage; его можно
подключить к будущему Go API без изменения presentation-компонентов. TanStack
Query управляет запросами и инвалидирует список после создания. Готовность всегда
вычисляется из исходных данных. Все выборки фильтруются по projectId.

Хранилище проверяет схему, уникальность ID и путей, ссылки на проекты и
принадлежность сценариев запусков. Ошибка не уничтожает исходные данные.
Demo имеет отдельное состояние в памяти и явно отмечено баннером; пользовательские
проекты оно не изменяет. Временные demo-изменения сбрасываются при reload.

Пути сравниваются текстово с сохранением регистра; физическая эквивалентность не
заявляется. Порядок runs — `createdAt DESC`, при равенстве `id ASC`.
Двойной submit блокируется UI и повторной проверкой дубликата в адаптере.

Документация проверена до установки:
[Vite](https://vite.dev/guide/),
[React Router](https://reactrouter.com/start/declarative/installation),
[Tailwind](https://tailwindcss.com/docs/installation/using-vite),
[shadcn Dialog](https://ui.shadcn.com/docs/components/radix/dialog),
[Vitest](https://vitest.dev/guide/).
Версии/engines/peer dependencies дополнительно проверены через npm view.
TypeScript ограничен 6.0 для совместимости с typescript-eslint `<6.1`; jsdom 29
совместим с Node 22.16, в отличие от jsdom 30. ESLint используется поддерживаемый 10.

## 4. Тесты и RED → GREEN

До основной реализации были написаны domain, adapter, component и E2E-тесты.
Для unit/component RED использовались типизированные заглушки с `Not implemented`.
Первый настоящий запуск: **26 failed, 12 passed, 3 failed test files**, exit 1.
Ошибки были вызваны отсутствующим поведением и UI, а не import/config failures.
12 отрицательных тестов уже проходили, поскольку заглушки отклоняли любой ввод;
это не считалось реализацией валидации. После реализации все эти тесты прошли.

После расширения проверок:

- `project.test.ts` — пути, пустые/неподдерживаемые форматы, сохранение регистра,
  basename/custom name, readiness, потеря prerequisites, max 3/5, порядок и
  tie-breaker, изоляция projectId.
- `api.test.ts` — пустой старт, persistence, одновременные submit, mock availability,
  повреждённая/неподдерживаемая схема, quota/read/reset errors, retry, отделение
  demo, проверка межпроектных связей.
- `App.test.tsx` — empty, Cancel/focus restoration, Browse, имена, required/
  duplicate errors, создание и переход, pending, retry, поиск, loading, not found.
- `OverviewPage.test.tsx` — компактный Ready, detailed Needs Attention,
  история при недоступности, disabled-actions, max 3/5 на увеличенном dataset,
  возврат к checklist при потере usable Scenario.
- `e2e/projects.spec.ts` — 6 составных сценариев покрывают E2E-01—E2E-10,
  клавиатуру, responsive layout, неизвестные маршруты, ошибки и явный reset.

Ни один тест не пропущен; retries = 0. E2E использует изолированные browser
contexts и проверяет отсутствие page errors, console errors и warnings.

## 5. Реальные технические проверки

Среда: Windows, Node 22.16.0, npm 10.9.2, установленный Google Chrome.
Команды запускались из `frontend/`, если не указано иное.

| Команда | Результат | Итог |
|---|---|---|
| `node --version` | v22.16.0 | Passed |
| `npm.cmd --version` | 10.9.2 | Passed |
| `npm.cmd install --no-fund --no-audit` | Установка завершена; создан lockfile | Passed |
| `npm.cmd ls --depth=0` | Все прямые зависимости разрешены | Passed |
| `npm.cmd run typecheck` | tsc без ошибок | Passed |
| `npm.cmd run lint` | ESLint без ошибок/предупреждений | Passed |
| `npm.cmd test -- --reporter=dot` | 48 passed, 4 test files | Passed |
| `npm.cmd run build` | Vite production bundle, 2136 modules | Passed |
| `npm.cmd run format:check` | Все файлы соответствуют Prettier | Passed |
| `$env:PW_CHANNEL='chrome'; npm.cmd run test:e2e` | 6 passed, 0 skipped, 0 retries | Passed |
| `npm.cmd run dev -- --port 5173 --strictPort` | Сервер запущен, GET /projects → 200 | Passed |
| `npm.cmd run preview -- --port 4173 --strictPort` | Production preview запущен | Passed |
| Production browser smoke через Playwright | empty → create → Overview → reload; demo deep link; console чистая | Passed |
| Повторное чтение `go.mod` | Исходный Go-модуль сохранён | Passed |

Исправленные ошибки и ограничения среды:

1. PowerShell запрещает npm.ps1 — использован npm.cmd, системная политика не менялась.
2. Первоначальный npm view в sandbox дал EACCES на registry.npmjs.org — разрешённый
   сетевой запуск завершился успешно; блокировок установки не осталось.
3. Начальные тестовые селекторы включали неподдерживаемый RTL-параметр `exact` и
   могли находить заголовок строки раньше перехода — исправлены типы селекторов и
   проверяется именно h1 Overview; требуемое поведение не ослаблялось.
4. Lint выявил передачу callback с ref в handleSubmit во время render — обработка
   перенесена внутрь submit-event, правило не отключалось.
5. После перехода на ESLint 10 выявлено различие версий ESLint и @eslint/js;
   `@eslint/js@^10.13.0` вызвал ETARGET. Исправлено на опубликованный 10.0.1,
   установка и lint повторены успешно.
6. Усиленный E2E-аудит консоли выявил 404 favicon.ico. Добавлен favicon.svg;
   финальные браузерные проверки проходят с чистой консолью.
7. Скриншоты выявили лишний outline вокруг main. Исправлен CSS; видимый фокус
   интерактивных элементов сохранён.

Терминал Playwright сообщает о конфликте переменных NO_COLOR/FORCE_COLOR хоста.
Это предупреждение раннера о цвете вывода, не предупреждение консоли приложения
и не ошибка тестов. Глобальные переменные среды не изменялись.

## 6. Браузерная и визуальная проверка

Фактически использован headless Google Chrome через Playwright, не DOM-эмуляция.
Пройдены ручной Windows-путь, mock Browse с пользовательским именем, пустой путь,
duplicate, double click, Overview, сохранение после reload, список и поиск,
Back/Forward, переключение двух пользовательских проектов и трёх demo-проектов,
Ready, Needs Attention с историей, load/create retry, unknown route/ID,
повреждённое хранилище с Cancel/Confirm reset.

Клавиатурой проверены Enter, Shift+Tab, фокус внутри dialog, Escape и возвращение
фокуса на Add Project. На 390×844 проверены длинный путь, форма и demo-Overview:
document.scrollWidth не превышает ширину окна. Таблица истории на узком экране
прокручивается горизонтально внутри focusable-region, а не раздвигает страницу.

Скриншоты сняты и просмотрены: desktop Projects/Overview (1440×1000), mobile
dialog, новый Overview и demo Overview (390×844). Проверены переносы путей,
отсутствие наложений и доступность основных действий. Файлы находятся в
`frontend/test-results/`; HTML-отчёт — `frontend/playwright-report/index.html`.
Эти generated-артефакты исключены из Git и пересоздаются E2E-тестами.

Production-сборка отдельно проверена в Chrome на порту 4173: создание проекта
`/production/smoke-api`, автоматический Overview, reload, прямая ссылка
`/projects/demo-auth?demo=1`. JavaScript/console errors и warnings отсутствовали.

## 7. Requirement → Implementation → Test → Result

Пути реализации ниже относительны к `frontend/src/`. E2E —
`frontend/e2e/projects.spec.ts`; номера относятся к исходному контракту.

| Requirement | Implementation | Test / проверка | Result |
|---|---|---|---|
| AC-01 Empty State | `features/projects/pages/ProjectsPage.tsx` | App: empty; E2E-01 | Passed |
| AC-02 Add Project | `features/projects/components/AddProject.tsx` | App: open/cancel; E2E-02 | Passed |
| AC-03 Browse demo | `AddProject.tsx`, `mocks/fixtures.ts` | App: Browse; E2E-03 | Passed |
| AC-04 Подстановка пути | `AddProject.tsx` | App: selected value; E2E-03 | Passed |
| AC-05 Имя из пути | `features/projects/model/project.ts` | basename unit; E2E-02 | Passed |
| AC-06 Custom name | `AddProject.tsx`, `project.ts` | custom name, path edits; E2E-03 | Passed |
| AC-07 Пустой путь | `project.ts`, Zod form | invalid paths, App required; E2E-04 | Passed |
| AC-08 Duplicate | `features/projects/data/api.ts` | concurrent/normalized duplicate, App; E2E-05 | Passed |
| AC-09 Cancel | `AddProject.tsx` | App cancel and focus; E2E | Passed |
| AC-10 Одна запись | `AddProject.tsx`, `api.ts` | concurrent adapter + pending App + double click E2E | Passed |
| AC-11 Переход Overview | `AddProject.tsx`, `app/App.tsx` | App h1 после submit; E2E-06 | Passed |
| AC-12 Проект в списке | Query invalidation, ProjectsPage | E2E-07: list count/name | Passed |
| AC-13 Поиск имя/путь | `ProjectsPage.tsx` | App CHECKOUT; E2E LEDGER/C:/work | Passed |
| AC-14 No Search Results | `ProjectsPage.tsx` | App и E2E: separate no-results | Passed |
| AC-15 Переключение | `app/Layout.tsx`, overview query key | E2E-08: custom projects и fixtures | Passed |
| AC-16 Setup Required | `project.ts`, `OverviewPage.tsx` | App new project; E2E-06 | Passed |
| AC-17 Ready | `project.ts`, `OverviewPage.tsx` | readiness unit, Overview component; E2E-09 | Passed |
| AC-18 Preview ≤3 | `project.ts`, ConfigurationPreview | oversized unit и rendered component | Passed |
| AC-19 Runs ≤5 | `project.ts`, Recent Experiments | oversized unit/component, newest-first/tie-breaker | Passed |
| AC-20 История недоступного | `OverviewPage.tsx` | Overview component; E2E-10, 4 runs | Passed |
| AC-21 Not verified | `api.ts`, AvailabilityBadge | adapter arbitrary path; E2E-02 | Passed |
| AC-22 Reload persistence | `mocks/storage.ts` | adapter reconstruction; E2E-07; production smoke | Passed |
| AC-23 Возврат Projects | `app/Layout.tsx`, query cache | E2E-07 + Back/Forward | Passed |
| AC-24 Future actions disabled | `OverviewPage.tsx` | disabled component и E2E-09 | Passed |
| AC-25 Unknown ID | `OverviewPage.tsx`, `shared/ui/States.tsx` | App unknown ID; E2E unknown route/ID | Passed |
| AC-26 Error + retry | adapter, form, ErrorState | adapter/App; E2E load/create retry | Passed |
| AC-27 Изоляция данных | `selectOverview`, query keys, demo adapter | unit foreign filtering, schema ownership; E2E-08 | Passed |
| AC-28 Клавиатура | Radix Dialog, labels, focus CSS | App focus restoration; E2E Enter/Shift+Tab/Escape | Passed |
| AC-29 Узкий экран | `styles.css`, table-scroll | 390×844 overflow assertions + screenshot inspection | Passed |
| AC-30 Технические проверки | configs и package scripts | typecheck/lint/48 tests/build/6 E2E/format | Passed |

## 8. Ограничения

Обязательных открытых blocker нет. Это frontend-first MVP, без реальной проверки
репозитория и выполнения инфраструктурных операций. Все конфигурации и runs —
fixtures; active run статичен. Demo-изменения не сохраняются. Пользовательское
хранилище ограничено origin и браузером; синхронизации конкурентных вкладок нет.
Firefox/Safari, screen reader и реальная мобильная ОС не тестировались.

Полноценные редакторы, Go API/SQLite/Git/Docker/k6/SSE/Toxiproxy и сравнение runs
остаются за границами этого задания. Production readiness не заявляется.

## 9. Запуск

```powershell
cd E:\go_pr\FailureLab\frontend
npm.cmd ci
npm.cmd run dev
```

Открыть http://127.0.0.1:5173/projects; demo — добавить `?demo=1`.
Полные команды unit/E2E, установки браузера, production preview и reset находятся
в корневом README. Локальные серверы, использованные при проверке, останавливаются
после завершения работы; для самостоятельного просмотра запустите команду выше.

## 10. Следующий этап

**Environment configuration:** создать пригодную конфигурацию окружения внутри
выбранного проекта и отразить её в уже реализованных preview и readiness.
