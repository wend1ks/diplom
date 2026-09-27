from django.db import migrations


COURSE_SLUG = 'osnovy-python'


MODULES = (
    {
        'title': 'Модуль 1. Первые шаги в Python',
        'lessons': (
            ('Что такое Python', 'text', '''# Что такое Python

Python — простой и выразительный язык программирования. Его используют в веб-разработке, анализе данных, автоматизации и машинном обучении.

Программа на Python состоит из последовательности инструкций. Начните с маленьких программ и запускайте их часто — так вы быстрее увидите результат своего кода.'''),
            ('Установка Python и первая программа', 'text', '''# Первая программа

Установите актуальную версию Python с официального сайта или используйте онлайн-среду разработки.

Создайте файл `hello.py` и напишите:

```python
print("Привет, Python!")
```

Функция `print()` выводит значение на экран.'''),
            ('Переменные и типы данных', 'text', '''# Переменные и типы данных

Переменная хранит значение под именем:

```python
name = "Алия"      # строка — str
age = 18            # целое число — int
height = 1.72       # дробное число — float
is_student = True   # логическое значение — bool
```

Используйте понятные имена переменных и знак `=` для присваивания.'''),
            ('Ввод и вывод данных', 'text', '''# Ввод и вывод

`input()` читает строку, введённую пользователем. Если нужен номер, преобразуйте строку функцией `int()`:

```python
name = input("Ваше имя: ")
year = int(input("Год рождения: "))
print("Привет,", name)
```

В одной строке `print()` можно выводить несколько значений через запятую.'''),
            ('Сумма двух чисел', 'task', '''# Задача: сумма двух чисел

Напишите функцию `solve(a, b)`, которая возвращает сумму двух целых чисел.

Например, `solve(2, 3)` должна вернуть `5`.'''),
        ),
    },
    {
        'title': 'Модуль 2. Условия и циклы',
        'lessons': (
            ('Операторы сравнения', 'text', '''# Операторы сравнения

Операторы `==`, `!=`, `>`, `<`, `>=` и `<=` сравнивают значения и возвращают `True` или `False`.

```python
age = 20
print(age >= 18)  # True
```

Не путайте `=` (присваивание) и `==` (сравнение).'''),
            ('Ветвление if, elif и else', 'text', '''# Условия

Конструкция `if` выполняет код только при истинном условии:

```python
score = 75
if score >= 90:
    print("Отлично")
elif score >= 60:
    print("Зачёт")
else:
    print("Попробуйте ещё")
```

Отступ в четыре пробела определяет блок кода.'''),
            ('Цикл for', 'text', '''# Цикл for

Цикл `for` повторяет действия для каждого элемента последовательности.

```python
for number in range(1, 6):
    print(number)
```

`range(1, 6)` создаёт числа от 1 до 5: правая граница не включается.'''),
            ('Цикл while', 'text', '''# Цикл while

`while` повторяет код, пока условие истинно:

```python
count = 3
while count > 0:
    print(count)
    count -= 1
```

Не забывайте изменять переменные в условии, иначе цикл может стать бесконечным.'''),
            ('Чётное или нечётное', 'task', '''# Задача: чётное или нечётное

Напишите функцию `solve(number)`. Она должна вернуть строку `"чётное"`, если число делится на 2 без остатка, и `"нечётное"` в противном случае.

Используйте оператор остатка от деления `%`.'''),
        ),
    },
    {
        'title': 'Модуль 3. Коллекции и функции',
        'lessons': (
            ('Списки', 'text', '''# Списки

Список хранит упорядоченную коллекцию значений:

```python
fruits = ["яблоко", "банан", "груша"]
print(fruits[0])
fruits.append("апельсин")
```

Индексы начинаются с нуля. Метод `append()` добавляет элемент в конец списка.'''),
            ('Строки', 'text', '''# Строки

Строка — последовательность символов. Её можно перебирать, измерять и изменять методами:

```python
text = "Python"
print(len(text))
print(text.lower())
```

Строки неизменяемы: методы возвращают новую строку.'''),
            ('Словари', 'text', '''# Словари

Словарь связывает ключи со значениями:

```python
student = {"name": "Дана", "grade": 5}
print(student["name"])
student["grade"] = 4
```

Ключи должны быть уникальными; обычно это строки или числа.'''),
            ('Создание функций', 'text', '''# Функции

Функция объединяет повторяющийся код под именем:

```python
def greet(name):
    return f"Привет, {name}!"
```

`return` передаёт результат работы функции туда, где она была вызвана.'''),
            ('Максимум в списке', 'task', '''# Задача: максимум в списке

Напишите функцию `solve(numbers)`, которая возвращает наибольшее число из списка `numbers`.

Для решения можно использовать встроенную функцию `max()`.'''),
        ),
    },
)


TASK_DETAILS = {
    'Сумма двух чисел': {
        'input_description': 'Два целых числа: `a` и `b`.',
        'output_description': 'Их сумма.',
        'code_template': 'def solve(a, b):\n    # Верните сумму a и b\n    pass\n',
        'testcases': (('a=2\nb=3', '5'), ('a=-4\nb=10', '6'), ('a=0\nb=0', '0')),
    },
    'Чётное или нечётное': {
        'input_description': 'Одно целое число `number`.',
        'output_description': 'Строка `чётное` или `нечётное`.',
        'code_template': 'def solve(number):\n    # Верните "чётное" или "нечётное"\n    pass\n',
        'testcases': (('number=8', 'чётное'), ('number=13', 'нечётное'), ('number=0', 'чётное')),
    },
    'Максимум в списке': {
        'input_description': 'Список целых чисел `numbers`.',
        'output_description': 'Наибольшее число списка.',
        'code_template': 'def solve(numbers):\n    # Верните наибольшее число списка\n    pass\n',
        'testcases': (('numbers=[3, 7, 2]', '7'), ('numbers=[-5, -1, -9]', '-1'), ('numbers=[42]', '42')),
    },
}


def add_python_basics_course(apps, schema_editor):
    Course = apps.get_model('courses', 'Course')
    Module = apps.get_model('courses', 'Module')
    Lesson = apps.get_model('courses', 'Lesson')
    TestCase = apps.get_model('courses', 'TestCase')

    course, _ = Course.objects.get_or_create(
        slug=COURSE_SLUG,
        defaults={
            'title': 'Основы Python',
            'description': 'Стартовый курс по Python: переменные, условия, циклы, коллекции и функции.',
        },
    )

    for module_order, module_data in enumerate(MODULES, start=1):
        module, _ = Module.objects.get_or_create(
            course=course,
            order=module_order,
            defaults={'title': module_data['title']},
        )
        for lesson_order, (title, lesson_type, content) in enumerate(module_data['lessons'], start=1):
            defaults = {
                'lesson_type': lesson_type,
                'content': content,
                'order': lesson_order,
            }
            if lesson_type == 'task':
                defaults.update(TASK_DETAILS[title])
                defaults.pop('testcases')
            lesson, _ = Lesson.objects.get_or_create(
                module=module,
                order=lesson_order,
                defaults={'title': title, **defaults},
            )
            if lesson_type == 'task':
                for testcase_order, (input_data, expected_output) in enumerate(TASK_DETAILS[title]['testcases'], start=1):
                    TestCase.objects.get_or_create(
                        lesson=lesson,
                        order=testcase_order,
                        defaults={
                            'input_data': input_data,
                            'expected_output': expected_output,
                        },
                    )


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_rename_legacy_students_tables'),
    ]

    operations = [
        migrations.RunPython(add_python_basics_course, migrations.RunPython.noop),
    ]
