export const demoCourse = {
  code: "CS101",
  name: "Introduction to Python Programming",
  description: "Foundational Python programming course covering core syntax, data structures, functional control flow, and object-oriented fundamentals."
};

export const studentProfile = {
  id: "PY-2026-01",
  name: "Jordan Lee",
  semester: "Fall 2026",
  enrolledCourse: "CS101: Introduction to Python Programming"
};

export const demoSections = [
  {
    id: "SEC-PY-101",
    number: 1,
    title: "Variables, Dynamic Typing & Core Data Structures",
    summary: "Covers Python variable assignments, dynamic typing rules, primitive data types, and distinguishing mutable lists from immutable tuples.",
    content: "Python is a dynamically typed language, meaning variable types do not need to be declared explicitly and are determined at runtime. The fundamental primitive data types include integers (int), floating-point numbers (float), strings (str), and booleans (bool). A core distinction in Python memory management is between mutable and immutable data structures. Lists (defined using square brackets `[]`) are mutable sequences that support in-place modifications such as `.append()`, `.pop()`, and item reassignment. Conversely, tuples (defined using parentheses `()`) are immutable sequences whose elements cannot be modified or reassigned after creation. Dictionaries (defined using curly braces `{}`) store key-value pairs where keys must be immutable types like strings or numbers. Understanding mutability is essential to avoiding unintentional side-effects when passing collections into functions.",
    keywords: ["variable", "typing", "dynamic", "primitive", "int", "float", "str", "bool", "list", "tuple", "mutable", "immutable", "dictionary", "dict", "key-value"],
    key_concepts: [
      "Dynamic typing means variables can be reassigned to different types at runtime.",
      "Lists are mutable and can be modified in place; tuples are immutable.",
      "Dictionary keys must be of an immutable type (strings, integers, tuples)."
    ]
  },
  {
    id: "SEC-PY-102",
    number: 2,
    title: "Control Flow, Loops & Functions",
    summary: "Covers conditional branching (if/elif/else), iteration loops (for/while), function declarations, arguments, and variable scoping.",
    content: "Control flow in Python relies strictly on indentation rather than braces to define code blocks. Conditional logic is evaluated using `if`, `elif`, and `else` statements with logical operators (`and`, `or`, `not`). Iteration is commonly handled via `for` loops traversing iterables or generating sequences using `range(start, stop, step)`. The `while` loop executes code as long as a boolean condition remains True, requiring manual loop-variant updates to avoid infinite loops. Functions are declared using the `def` keyword followed by the function name, parameter list, and a colon. Functions return values to the caller using the `return` statement; if no return statement is present, the function implicitly returns `None`. Parameters can have default values, and variable scope follows the LEGB rule (Local, Enclosing, Global, Built-in), meaning variables defined inside a function body cannot be accessed outside unless explicitly declared global.",
    keywords: ["control flow", "condition", "if", "elif", "else", "loop", "for", "while", "range", "function", "def", "parameter", "return", "scope", "indentation", "LEGB"],
    key_concepts: [
      "Python blocks are determined by indentation (typically 4 spaces).",
      "Functions return None by default if no return statement is reached.",
      "Variables defined within a function belong to local scope and cannot be accessed globally."
    ]
  },
  {
    id: "SEC-PY-103",
    number: 3,
    title: "Object-Oriented Programming (OOP) in Python",
    summary: "Covers classes, object instances, the __init__ constructor, instance methods, self reference, and single inheritance using super().",
    content: "Python is a multi-paradigm language with comprehensive support for Object-Oriented Programming (OOP). A class is a blueprint for creating objects, defined using the `class` keyword. An object is an instantiated instance of a class. The `__init__` method serves as the class constructor and is automatically invoked when a new instance is created. The first parameter of every instance method and the constructor is conventionally named `self`, which represents the specific instance being operated on and allows access to instance attributes. Inheritance enables a child class to inherit attributes and methods from a parent class by specifying the parent class in parentheses during class definition: `class Child(Parent):`. The `super()` function allows child classes to invoke methods from the parent class, such as calling `super().__init__()` to reuse base class initialization logic without duplicating code.",
    keywords: ["oop", "object", "class", "instance", "constructor", "__init__", "self", "attribute", "method", "inheritance", "child", "parent", "super", "polymorphism"],
    key_concepts: [
      "The __init__ method initializes newly created class instances.",
      "The 'self' parameter refers to the current instance of the class in methods.",
      "The super() function calls parent class methods, allowing clean inheritance."
    ]
  }
];
