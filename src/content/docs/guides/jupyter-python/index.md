---
title: "Настройка Jupyter: Google Colab и VS Code"
description: "Как запустить Jupyter Notebook в браузере или локально, установить зависимости и выбрать ядро."
contentKind: guide
draft: false
sidebar:
  label: "Jupyter: Colab и VS Code"
---


Эта инструкция подходит для ДЗ по классическому машинному обучению, а также для других учебных Python-ноутбуков (`.ipynb`). **Выберите один вариант**: запуск в браузере или локально на своём компьютере.

## Вариант А. Google Colab — без установки Python

1. Откройте [Google Colab](https://colab.research.google.com/) и войдите в Google-аккаунт.
2. В меню **File → Upload notebook** (или **File → Open notebook → Upload**, названия пунктов могут немного отличаться) выберите `hw01_starter.ipynb`.
3. Откройте слева панель **Files** (значок папки), нажмите **Upload** и загрузите `diamonds_hw01.csv`. Убедитесь, что файл появился по пути `/content/diamonds_hw01.csv`.
4. Запускайте ячейки сверху вниз кнопкой ▶ слева от ячейки или через **Runtime → Run all** после того, как заполните TODO.
5. Если понадобится библиотека, в новой кодовой ячейке выполните `!pip install pandas scikit-learn` (обычно основные пакеты уже установлены).
6. Для сдачи переименуйте копию в `solution.ipynb` и скачайте её через **File → Download → Download .ipynb**. Проверьте, что результаты и выводы сохранены.

> [!IMPORTANT] Пропавший CSV — не ошибка вашего кода
> Среда Colab временная. После переподключения или сброса среды загруженный в `/content` CSV может исчезнуть. Откройте **Files** и загрузите его повторно. Код ноутбука обычно сохраняется отдельно.

**Нужна ли видеокарта?** Нет, все модели из этого ДЗ работают на CPU.

## Вариант Б. Jupyter в Visual Studio Code (Windows)

### Шаг 1. Установка

Установите:

- [Python](https://www.python.org/downloads/) (рекомендуется Python 3.10 или новее);
- [Visual Studio Code](https://code.visualstudio.com/);
- расширения VS Code: **Python** (Microsoft) и **Jupyter** (Microsoft).

### Шаг 2. Подготовка папки

Создайте отдельную папку, например `C:\Study\hw01`. Положите туда **`hw01_starter.ipynb`**, **`diamonds_hw01.csv`**, **`requirements.txt`**. В VS Code выберите **File → Open Folder** и откройте эту папку.

### Шаг 3. Создание виртуального окружения

Откройте **Terminal → New Terminal**. Для Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Если команда `py` не найдена, используйте `python -m venv .venv` при условии, что Python установлен и доступен из терминала.

> [!TIP] Активация окружения не обязательна
> Команды выше напрямую запускают Python из `.venv`; не нужно менять системную политику выполнения скриптов PowerShell.

### Шаг 4. Выбор ядра

1. Откройте `hw01_starter.ipynb` в VS Code.
2. В правом верхнем углу ноутбука нажмите **Select Kernel**.
3. Выберите **Python Environments** → интерпретатор из папки `.venv` (если не виден, **Select Another Kernel**).
4. Запустите первую ячейку. Если в ноутбуке появилась ошибка `ModuleNotFoundError`, убедитесь, что выбрана именно `.venv`, а зависимости установлены в неё.

### Шаг 5. Выполнение и сдача

Работайте с ячейками последовательно; сохраните файл под именем `solution.ipynb`. Перед сдачей выберите перезапуск ядра и выполнение всех ячеек сверху вниз, затем сохраните ноутбук (`Ctrl+S`). Саму папку `.venv` сдавать не нужно.

## Вариант В. macOS / Linux (VS Code)

В терминале папки с заданием выполните:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements.txt
```

Далее используйте шаги с **Select Kernel** из варианта Windows, выбрав `.venv/bin/python`.

## Частые проблемы

| Что происходит | Что сделать |
|---|---|
| `FileNotFoundError: diamonds_hw01.csv` | CSV должен находиться в рабочей папке ноутбука; в Colab повторно загрузите CSV через Files. |
| `ModuleNotFoundError: sklearn` | Установите `scikit-learn` в то же окружение, которое выбрано как Kernel. |
| В VS Code нет `Select Kernel` | Установите расширение Jupyter, откройте `.ipynb` как Jupyter Notebook. |
| Ячейка ссылается на неизвестную переменную | Запустите ячейки сверху вниз, не пропускайте разделы. |
| Ошибка в `ColumnTransformer` | Проверьте названия столбцов и что завершены все TODO по числовым и категориальным признакам. |
| В Colab пропал загруженный файл | Colab мог пересоздать виртуальную машину. Загрузите CSV ещё раз. |

**Официальные инструкции:** [Google Colab — FAQ](https://research.google.com/colaboratory/faq.html), [Jupyter Notebooks in VS Code](https://code.visualstudio.com/docs/datascience/jupyter-notebooks), [управление ядрами Jupyter в VS Code](https://code.visualstudio.com/docs/datascience/jupyter-kernel-management).
