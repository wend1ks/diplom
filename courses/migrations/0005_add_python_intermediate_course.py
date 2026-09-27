from django.db import migrations


COURSE = {
    'slug': 'python-practice',
    'title': 'Python: практика и алгоритмы',
    'description': 'Следующий уровень после основ Python: функции, коллекции, алгоритмическое мышление и работа с данными.',
}

MODULES = (
    {
        'title': 'Модуль 1. Функции и декомпозиция',
        'lessons': (
            ('Параметры и возвращаемые значения', 'text', '''# Параметры и возвращаемые значения

Функции принимают данные через параметры и передают результат обратно через `return`.

```python
def rectangle_area(width, height):
    return width * height
```

Параметры помогают повторно использовать один алгоритм для разных входных значений.'''),
            ('Аргументы по умолчанию', 'text', '''# Аргументы по умолчанию

Значение по умолчанию используется, если аргумент не передали:

```python
def greet(name, greeting="Привет"):
    return f"{greeting}, {name}!"
```

Параметры со значениями по умолчанию размещайте после обязательных параметров.'''),
            ('Область видимости переменных', 'text', '''# Область видимости

Переменная, созданная внутри функции, обычно доступна только внутри неё. Передавайте данные явно через параметры, а результаты возвращайте через `return`.

```python
def double(number):
    result = number * 2
    return result
```'''),
            ('Разделение задачи на функции', 'text', '''# Разделение задачи на функции

Большую программу проще читать, если выделить в функции отдельные действия. Каждая функция должна иметь понятное имя и небольшую ответственность.

Например, обработку заказа можно разделить на проверку данных, подсчёт суммы и форматирование результата.'''),
            ('Задача: среднее значение', 'task', '''# Задача: среднее значение

Напишите `solve(numbers)`, которая возвращает среднее арифметическое списка чисел. Список непустой.'''),
        ),
    },
    {
        'title': 'Модуль 2. Коллекции и алгоритмы',
        'lessons': (
            ('Срезы и копирование списков', 'text', '''# Срезы списков

Срез `items[start:stop]` создаёт новый список из выбранной части. Правая граница не включается.

```python
numbers = [2, 4, 6, 8]
middle = numbers[1:3]  # [4, 6]
copy = numbers[:]
```'''),
            ('Сортировка и ключ сортировки', 'text', '''# Сортировка

`sorted(items)` возвращает новый отсортированный список, а `items.sort()` меняет исходный список.

```python
words = ["pear", "fig", "banana"]
by_length = sorted(words, key=len)
```'''),
            ('Поиск и подсчёт элементов', 'text', '''# Поиск и подсчёт

Оператор `in` проверяет наличие элемента. Метод `count()` считает количество вхождений:

```python
values = [1, 2, 1, 3]
print(2 in values)       # True
print(values.count(1))  # 2
```'''),
            ('Словари и частотный анализ', 'text', '''# Частотный анализ

Словарь удобно использовать, чтобы посчитать, сколько раз встречается каждое значение:

```python
counts = {}
for item in ["a", "b", "a"]:
    counts[item] = counts.get(item, 0) + 1
```'''),
            ('Задача: удалить дубликаты', 'task', '''# Задача: удалить дубликаты

Напишите `solve(items)`, которая возвращает список без повторов, сохраняя порядок первого появления каждого элемента.'''),
        ),
    },
    {
        'title': 'Модуль 3. Строки, файлы и надёжность',
        'lessons': (
            ('Форматирование строк', 'text', '''# Форматирование строк

F-строки вставляют значения выражений прямо в текст:

```python
name = "Амина"
score = 92
message = f"{name}: {score} баллов"
```'''),
            ('Разбор и очистка текста', 'text', '''# Разбор текста

Методы `strip()`, `split()` и `join()` помогают очищать и делить строки.

```python
line = "  красный,синий  "
colors = line.strip().split(",")
result = " | ".join(colors)
```'''),
            ('Чтение и запись файлов', 'text', '''# Работа с файлами

Контекстный менеджер `with` закрывает файл автоматически:

```python
with open("notes.txt", "w", encoding="utf-8") as file:
    file.write("Заметка")
```'''),
            ('Обработка ошибок', 'text', '''# Обработка ошибок

Используйте `try` и `except`, когда операция может завершиться ожидаемой ошибкой. Обрабатывайте конкретные исключения и сообщайте понятную причину.

```python
try:
    number = int(raw_value)
except ValueError:
    number = 0
```'''),
            ('Задача: нормализовать строку', 'task', '''# Задача: нормализовать строку

Напишите `solve(text)`, которая убирает пробелы по краям, приводит строку к нижнему регистру и заменяет последовательности пробелов одним пробелом.'''),
        ),
    },
)

TASK_DETAILS = {
    'Задача: среднее значение': {
        'input_description': 'Список чисел `numbers`.',
        'output_description': 'Среднее арифметическое списка.',
        'code_template': 'def solve(numbers):\n    # Верните среднее арифметическое\n    pass\n',
        'testcases': (("numbers=[2, 4, 6]", '4.0'), ("numbers=[5]", '5.0'), ("numbers=[-2, 2]", '0.0')),
    },
    'Задача: удалить дубликаты': {
        'input_description': 'Список `items`.',
        'output_description': 'Список уникальных значений в исходном порядке.',
        'code_template': 'def solve(items):\n    # Сохраните порядок первого появления\n    pass\n',
        'testcases': (("items=[1, 2, 1, 3, 2]", '[1, 2, 3]'), ("items=['a', 'a', 'b']", "['a', 'b']"), ('items=[]', '[]')),
    },
    'Задача: нормализовать строку': {
        'input_description': 'Строка `text`.',
        'output_description': 'Строка в нижнем регистре без лишних пробелов.',
        'code_template': 'def solve(text):\n    # Очистите строку и объедините пробелы\n    pass\n',
        'testcases': (("text='  Hello   WORLD  '", 'hello world'), ("text='Python'", 'python'), ("text=' a  b '", 'a b')),
    },
}


def add_intermediate_course(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    Module = apps.get_model('courses', 'Module')
    Lesson = apps.get_model('courses', 'Lesson')
    TestCase = apps.get_model('courses', 'TestCase')

    course, _ = Course.objects.get_or_create(slug=COURSE['slug'], defaults={
        'title': COURSE['title'],
        'description': COURSE['description'],
    })
    for module_order, module_data in enumerate(MODULES, start=1):
        module, _ = Module.objects.get_or_create(
            course=course,
            order=module_order,
            defaults={'title': module_data['title']},
        )
        for lesson_order, (title, lesson_type, content) in enumerate(module_data['lessons'], start=1):
            defaults = {'lesson_type': lesson_type, 'content': content, 'order': lesson_order}
            task = TASK_DETAILS.get(title)
            if task:
                defaults.update({key: value for key, value in task.items() if key != 'testcases'})
            lesson, _ = Lesson.objects.get_or_create(
                module=module,
                order=lesson_order,
                defaults={'title': title, **defaults},
            )
            if task:
                for testcase_order, (input_data, expected_output) in enumerate(task['testcases'], start=1):
                    TestCase.objects.get_or_create(
                        lesson=lesson,
                        order=testcase_order,
                        defaults={'input_data': input_data, 'expected_output': expected_output},
                    )


class Migration(migrations.Migration):
    dependencies = [('courses', '0004_add_python_basics_course')]
    operations = [migrations.RunPython(add_intermediate_course, migrations.RunPython.noop)]
