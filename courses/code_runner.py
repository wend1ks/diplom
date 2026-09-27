import ast
import tempfile
import subprocess
import sys
import os
import json
from typing import List, Tuple, Dict


def parse_testcase_input(raw_input: str) -> Tuple[List[Tuple[str, str]], str]:
    raw_input = (raw_input or '').strip()
    if not raw_input:
        return [], ''

    lines = [line.strip() for line in raw_input.splitlines() if line.strip()]
    if lines and all('=' in line for line in lines):
        pairs = []
        stdin_values = []
        for line in lines:
            name, value = line.split('=', 1)
            pairs.append((name.strip(), value.strip()))
            stdin_values.append(value.strip())
        return pairs, '\n'.join(stdin_values)

    try:
        value = json.loads(raw_input)
    except json.JSONDecodeError:
        return [], raw_input

    if isinstance(value, dict):
        return [(str(name), repr(item)) for name, item in value.items()], raw_input
    if isinstance(value, list):
        return [(f'arg{index + 1}', repr(item)) for index, item in enumerate(value)], raw_input
    return [('value', repr(value))], raw_input


def run_user_code(
    user_code: str,
    inputs: List[Tuple[str, str]],
    timeout: int = 5,
    stdin_data: str = '',
) -> Dict[str, str]:
    fd, path = tempfile.mkstemp(suffix='.py', prefix='usercode_')
    os.close(fd)

    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write('# Auto-generated wrapper to run user code\n')
            f.write('import contextlib, io, sys, traceback\n')
            f.write(f'USER_CODE = {user_code!r}\n')
            f.write(f'sys.stdin = io.StringIO({stdin_data!r})\n')
            for varname, raw_value in inputs:
                if not varname.isidentifier():
                    return {"output": "", "error": f"Invalid input variable: {varname}"}
                try:
                    value = ast.literal_eval(raw_value)
                except (SyntaxError, ValueError):
                    value = raw_value
                f.write(f"{varname} = {value!r}\n")

            f.write('\n# Run code first; solve(...) gets the testcase arguments if present.\n')
            f.write('captured = io.StringIO()\n')
            f.write('try:\n')
            f.write('    with contextlib.redirect_stdout(captured):\n')
            f.write('        exec(compile(USER_CODE, "<student-code>", "exec"), globals())\n')
            f.write('    if "solve" in globals() and callable(globals()["solve"]):\n')
            arg_names = [var for var, _ in inputs]
            if arg_names:
                f.write('        result = globals()["solve"](' + ','.join(arg_names) + ')\n')
            else:
                f.write('        result = globals()["solve"]()\n')
            f.write('        print(result)\n')
            f.write('    else:\n')
            f.write('        sys.stdout.write(captured.getvalue())\n')
            f.write('except BaseException:\n')
            f.write('    traceback.print_exc(file=sys.stderr)\n')


        completed = subprocess.run(
            [sys.executable, path],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        output = completed.stdout or ""
        error = completed.stderr or ""

        return {"output": output, "error": error}

    except subprocess.TimeoutExpired as e:
        return {"output": "", "error": f"TimeoutExpired: execution exceeded {timeout} seconds"}
    except Exception as e:
        return {"output": "", "error": f"{type(e).__name__}: {e}"}
    finally:
        try:
            os.remove(path)
        except Exception:
            pass
