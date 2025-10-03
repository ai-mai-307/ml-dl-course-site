# Как работать с датасетами в Yandex Datasphere?

*Датасет в DataSphere* — это механизм хранения информации, который предоставляет быстрый доступ к большим объемам данных.

Все данные, которые будут нужны для выполнения практических заданий, будут доступны как датасеты. Для вас они будут выглядеть как примонтированная директории.

![1759494523670](image/what_is_dataset/1759494523670.png)

![1759494532441](image/what_is_dataset/1759494532441.png)

* project -- директория вашего проекта в Yandex Datasphere
* **datasets** -- точка монтирования датасетов

Проверить доступность датасета можно как в интерфейсе Jupyer Lab, перейдя в директории и найдя там файлы, так и из кода следующим образом:

```python
from pathlib import Path

DATASET_PATH = '/home/jupyter/datasphere/datasets/{DATASET_NAME}'

Path(DATASET_PATH).is_dir()
```

Подробнее про датасеты вы можете узнать из [документации](https://yandex.cloud/ru/docs/datasphere/concepts/dataset).
