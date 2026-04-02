import ast
import operator
import tkinter as tk
from tkinter import ttk


OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_eval(expression: str) -> float:
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](visit(node.left), visit(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](visit(node.operand))
        raise ValueError("Unsupported expression")

    parsed = ast.parse(expression, mode="eval")
    return visit(parsed)


class CalculatorApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("Calculator")
        self.root.geometry("380x560")
        self.root.minsize(320, 460)
        self.root.configure(bg="#0b1320")

        self.expression = "0"
        self.should_reset = False

        self.style = ttk.Style()
        self.style.theme_use("clam")
        self._configure_styles()
        self._build_ui()
        self._bind_keys()

    def _configure_styles(self) -> None:
        self.style.configure("App.TFrame", background="#0b1320")
        self.style.configure("Card.TFrame", background="#111a2b")
        self.style.configure(
            "Display.TLabel",
            background="#172338",
            foreground="#f4f7fb",
            font=("Helvetica", 28, "bold"),
            anchor="e",
            padding=(16, 18),
        )
        self.style.configure(
            "Meta.TLabel",
            background="#111a2b",
            foreground="#9fb0c7",
            font=("Helvetica", 10, "bold"),
        )
        self.style.configure(
            "Title.TLabel",
            background="#111a2b",
            foreground="#f4f7fb",
            font=("Helvetica", 20, "bold"),
        )
        self.style.configure(
            "Calc.TButton",
            font=("Helvetica", 16, "bold"),
            padding=10,
            background="#253248",
            foreground="#f4f7fb",
            borderwidth=0,
        )
        self.style.map(
            "Calc.TButton",
            background=[("active", "#30415d"), ("pressed", "#1e2a40")],
        )
        self.style.configure(
            "Accent.TButton",
            font=("Helvetica", 16, "bold"),
            padding=10,
            background="#ff9f43",
            foreground="#1f1408",
            borderwidth=0,
        )
        self.style.map(
            "Accent.TButton",
            background=[("active", "#ffb15d"), ("pressed", "#f08b2a")],
        )
        self.style.configure(
            "Muted.TButton",
            font=("Helvetica", 16, "bold"),
            padding=10,
            background="#5a6577",
            foreground="#f4f7fb",
            borderwidth=0,
        )
        self.style.map(
            "Muted.TButton",
            background=[("active", "#687487"), ("pressed", "#4c5667")],
        )

    def _build_ui(self) -> None:
        outer = ttk.Frame(self.root, style="App.TFrame", padding=18)
        outer.pack(fill="both", expand=True)

        card = ttk.Frame(outer, style="Card.TFrame", padding=18)
        card.pack(fill="both", expand=True)

        header = ttk.Frame(card, style="Card.TFrame")
        header.pack(fill="x", pady=(0, 14))

        ttk.Label(header, text="Desktop App", style="Meta.TLabel").pack(anchor="w")
        ttk.Label(header, text="Calculator", style="Title.TLabel").pack(anchor="w")

        self.display_var = tk.StringVar(value="0")
        display = ttk.Label(
            card,
            textvariable=self.display_var,
            style="Display.TLabel",
        )
        display.pack(fill="x", pady=(0, 16))

        keypad = ttk.Frame(card, style="Card.TFrame")
        keypad.pack(fill="both", expand=True)

        for col in range(4):
            keypad.columnconfigure(col, weight=1, uniform="keys")
        for row in range(5):
            keypad.rowconfigure(row, weight=1, uniform="keys")

        buttons = [
            [("AC", self.clear_all, "Muted.TButton"), ("DEL", self.delete_last, "Muted.TButton"), ("%", lambda: self.append_value("%"), "Muted.TButton"), ("÷", lambda: self.append_value("/"), "Accent.TButton")],
            [("7", lambda: self.append_value("7"), "Calc.TButton"), ("8", lambda: self.append_value("8"), "Calc.TButton"), ("9", lambda: self.append_value("9"), "Calc.TButton"), ("×", lambda: self.append_value("*"), "Accent.TButton")],
            [("4", lambda: self.append_value("4"), "Calc.TButton"), ("5", lambda: self.append_value("5"), "Calc.TButton"), ("6", lambda: self.append_value("6"), "Calc.TButton"), ("-", lambda: self.append_value("-"), "Accent.TButton")],
            [("1", lambda: self.append_value("1"), "Calc.TButton"), ("2", lambda: self.append_value("2"), "Calc.TButton"), ("3", lambda: self.append_value("3"), "Calc.TButton"), ("+", lambda: self.append_value("+"), "Accent.TButton")],
        ]

        for row_index, row in enumerate(buttons):
          for col_index, (label, command, style_name) in enumerate(row):
                ttk.Button(
                    keypad,
                    text=label,
                    command=command,
                    style=style_name,
                ).grid(row=row_index, column=col_index, sticky="nsew", padx=6, pady=6)

        ttk.Button(
            keypad,
            text="0",
            command=lambda: self.append_value("0"),
            style="Calc.TButton",
        ).grid(row=4, column=0, columnspan=2, sticky="nsew", padx=6, pady=6)

        ttk.Button(
            keypad,
            text=".",
            command=lambda: self.append_value("."),
            style="Calc.TButton",
        ).grid(row=4, column=2, sticky="nsew", padx=6, pady=6)

        ttk.Button(
            keypad,
            text="=",
            command=self.calculate_result,
            style="Accent.TButton",
        ).grid(row=4, column=3, sticky="nsew", padx=6, pady=6)

    def _bind_keys(self) -> None:
        self.root.bind("<Key>", self._handle_keypress)
        self.root.bind("<Return>", lambda _event: self.calculate_result())
        self.root.bind("<KP_Enter>", lambda _event: self.calculate_result())
        self.root.bind("<BackSpace>", lambda _event: self.delete_last())
        self.root.bind("<Escape>", lambda _event: self.clear_all())

    def _handle_keypress(self, event: tk.Event) -> None:
        key = event.char
        if key and key in "0123456789+-*/.%":
            self.append_value(key)

    def update_display(self, value: str | None = None) -> None:
        self.display_var.set(value if value is not None else self.expression)

    def is_operator(self, char: str) -> bool:
        return char in "+-*/%"

    def append_value(self, value: str) -> None:
        if self.should_reset and not self.is_operator(value):
            self.expression = "0"
            self.should_reset = False

        if self.expression == "Error":
            self.expression = "0"
            self.should_reset = False

        if self.expression == "0" and not self.is_operator(value) and value != ".":
            self.expression = value
            self.update_display()
            return

        last_char = self.expression[-1]

        if self.is_operator(value) and self.is_operator(last_char):
            self.expression = f"{self.expression[:-1]}{value}"
            self.update_display()
            return

        if value == ".":
            current_segment = self._current_segment()
            if "." in current_segment:
                return

        self.expression += value
        self.update_display()

    def _current_segment(self) -> str:
        segment = ""
        for char in reversed(self.expression):
            if self.is_operator(char):
                break
            segment = char + segment
        return segment

    def clear_all(self) -> None:
        self.expression = "0"
        self.should_reset = False
        self.update_display()

    def delete_last(self) -> None:
        if self.should_reset or self.expression == "Error":
            self.clear_all()
            return

        self.expression = self.expression[:-1] if len(self.expression) > 1 else "0"
        self.update_display()

    def calculate_result(self) -> None:
        try:
            result = safe_eval(self.expression)
            if isinstance(result, float) and result.is_integer():
                self.expression = str(int(result))
            else:
                self.expression = str(round(result, 10))
            self.should_reset = True
            self.update_display()
        except Exception:
            self.expression = "Error"
            self.should_reset = True
            self.update_display()


def main() -> None:
    root = tk.Tk()
    CalculatorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
