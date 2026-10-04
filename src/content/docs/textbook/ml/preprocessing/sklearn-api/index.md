---
title: "Sklearn-api"
contentKind: textbook
draft: true
---

`scikit-learn` часто рассматривают как библиотеку готовых реализаций классический моделей машинного обучения, и это правда. При этом помимо готовых реализаций sklearn предлагает интерфейс для реализации ворклфоу обучения моделей.

Можно выделить основные сущности:

1. **Трансформер данных** , который обязан реализовать
    - `fit(X, y=None) -> None` : вычислить параметры преобразования;
    - `transform(X) -> X_prepared`: применить преобразование к данным;
    - `fit_transform(X, y=None) -> X_prepared`:удобный одновременный вызов двуз предыдущих функций.
2. **Модель** (`Estimator`) реализует
    - `fit(X, y)`: осуществления обучения;
    - `predict(X)`: осуществление предсказания.
3. **Pipeline** — это последовательность преобразований данных перед подачей их на вход модели машинного обучения. При вызове `fit()` преобразования вызываются последовательно в том порядке, при котором был инициализирован пайплайн

Пример собственного трансформера:

```python
from sklearn.base import BaseEstimator, TransformerMixin
import numpy as np
import pandas as pd

class SimpleMinMaxScaler(BaseEstimator, TransformerMixin):
"""
    Масштабирует каждый столбец к интервалу [0, 1]
    x_scaled = (x - min_col) / (max_col - min_col)
"""

    # -------- fit: запоминаем мин и макс по столбцам --------
    def fit(self, X, y=None):
        X_arr = self._to_array(X)
        self.min_   = X_arr.min(axis=0)       # вектор: минимум по КАЖДОМУ столбцу
        self.max_   = X_arr.max(axis=0)       # то же для максимума
        self.range_ = self.max_ - self.min_

    # если весь столбец константный, range == 0 -> чтобы не делить на 0
        self.range_[self.range_ == 0] = 1
        return self

    # -------------- transform: применяем преобразование --------------
    def transform(self, X):
        X_arr = self._to_array(X)
        X_scaled = (X_arr - self.min_) / self.range_
        return X_scaled

    # вспомогательное преобразование DataFrame -> ndarray
    def _to_array(self, X):
        return X.values if isinstance(X, pd.DataFrame) else np.asarray(X)
```

Пример собственного эстиматора (модели, которая будет возвращать константу, среднее значение таргета из обучающей выборки):

```python
from sklearn.base import BaseEstimator, RegressorMixin
import numpy as np

class MeanModel(BaseEstimator, RegressorMixin):
    """
    на fit запоминает среднее y,
    на predict выдаёт его для любой X.
    Полезна как бенчмарк (baseline).
    """
    def fit(self, X, y):
        self.mean_ = np.mean(y)
        return self


    def predict(self, X):
        n_samples = X.shape[0]
        return np.full(shape=(n_samples,), fill_value=self.mean_, dtype=float)

```

Пример элементарного пайплайна:

```python
from sklearn.pipeline import make_pipeline
import numpy as np

# обучающие данные
X_train = np.random.randn(100, 4) * 10 + 50
y_train = np.random.randn(100) * 5 + 42

pipe = make_pipeline(
    SimpleMinMaxScaler(), # наш трансформер
    MeanModel() # простейший эстиматор
)

pipe.fit(X_train, y_train)
print("Первые 3 предсказания:", pipe.predict(X_train[:3]))
```

---

[Обзор раздела](../)

[Предыдущая тема: Обработка пропущенных значений](../missing-values/)
