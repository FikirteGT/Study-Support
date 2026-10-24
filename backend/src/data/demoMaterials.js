/**
 * Demo course syllabus data for CS101: Introduction to Python Programming
 * Ground truth knowledge base for Tool 1 (search_material) and quiz grounding.
 */

const demoCourse = {
  id: "CS101",
  code: "CS101",
  title: "Introduction to Python Programming",
  name: "Introduction to Python Programming",
  instructor: "Dr. Jane Doe",
  term: "Fall 2026",
  description: "Foundational Python programming course covering core syntax, data structures, functional control flow, and object-oriented fundamentals."
};

const studentProfile = {
  id: "PY-2026-01",
  name: "Jordan Lee",
  email: "jordan.lee@university.edu",
  major: "Computer Science",
  semester: "Fall 2026",
  enrolledCourse: "CS101: Introduction to Python Programming"
};

const demoSections = [
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
    title: "Control Flow, Iteration & Functions",
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
    title: "Object-Oriented Programming: Classes & State",
    summary: "Covers classes, object instances, the __init__ constructor, instance methods, self reference, and single inheritance using super().",
    content: "Python supports object-oriented programming via the `class` keyword. A class acts as a blueprint for creating objects with encapsulated state and behavior. The `__init__` method serves as the constructor, automatically invoked upon object instantiation to initialize instance attributes. The first parameter of every instance method is conventionally named `self`, which explicitly references the specific object instance being operated upon, granting access to its attributes and methods. Encapsulation is supported by naming conventions: a single leading underscore indicates an internal protected attribute, while a double leading underscore triggers name mangling to prevent accidental overriding. Inheritance allows child classes to inherit attributes and methods from a parent class, and the `super()` function allows invocation of overridden parent methods.",
    keywords: ["oop", "object", "class", "instance", "constructor", "__init__", "self", "attribute", "method", "inheritance", "child", "parent", "super", "polymorphism"],
    key_concepts: [
      "The __init__ method initializes newly created class instances.",
      "The 'self' parameter refers to the current instance of the class in methods.",
      "The super() function calls parent class methods, allowing clean inheritance."
    ]
  }
];

function getSectionById(id) {
  return demoSections.find((s) => s.id === id || s.number === Number(id)) || null;
}

const demoMaterials = demoSections;

module.exports = {
  demoCourse,
  studentProfile,
  demoSections,
  demoMaterials,
  getSectionById
};
