ДЗ №3. Классификация окружающих звуков (ESC-10)

1. Установите зависимости: python -m pip install -r requirements.txt
   При необходимости для PyTorch выберите CPU-инструкции на https://pytorch.org/get-started/locally/
2. Скачайте официальный ESC-50 ZIP (~600 MB):
   https://github.com/karolpiczak/ESC-50/archive/refs/heads/master.zip
3. Распакуйте его в data/ рядом с solution.ipynb.
   Ожидаются data/ESC-50-master/audio/ и data/ESC-50-master/meta/esc50.csv.
4. Запустите Jupyter и solution.ipynb. Он сам отберёт ESC-10 (400 файлов)
   и подготовит кэш log-Mel-признаков в data/.
5. Выполните задания TODO и сдайте только solution.ipynb.

Параметры данных и разбиение train folds 1-4 / val fold 5 не менять.
Никаких данных или весов модели сдавать не требуется.
