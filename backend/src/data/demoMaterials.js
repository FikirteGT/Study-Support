/**
 * Demo course syllabus data for CS101: Introduction to Python Programming
 * Ground truth knowledge base for Tool 1 (search_material) and quiz grounding.
 */

const demoCourse = {
  id: "CS101",
  title: "Introduction to Python Programming",
  instructor: "Dr. Jane Doe",
  term: "Fall 2026"
};

const studentProfile = {
  id: "STU_101",
  name: "Jordan Lee",
  email: "jordan.lee@university.edu",
  major: "Computer Science"
};

const demoSections = [
  {
    id: "SEC-PY-101",
    number: 1,
    title: "Variables, Dynamic Typing & Core Data Structures",
    content: "Python is a dynamically typed language, meaning variable types do not need to be declared explicitly and are determined at runtime. The fundamental primitive data types include integers (int), floating-point numbers (float), strings (str), and booleans (bool). A core distinction in Python memory management is between mutable and immutable data structures. Lists (defined using square brackets `[]`) are mutable sequences that support in-place modifications such as `.append()`, `.pop()`, and item reassignment. Conversely, tuples (defined using parentheses `()`) are immutable sequences whose elements cannot be modified or reassigned after creation. Dictionaries (defined using curly braces `{}`) store key-value pairs where keys must be immutable types like strings or numbers. Understanding mutability is essential to avoiding unintentional side-effects when passing collections into functions."
  },
  {
    id: "SEC-PY-102",
    number: 2,
    title: "Control Flow, Iteration & Functions",
    content: "Control flow in Python relies strictly on indentation rather than braces to define code blocks. Conditional execution is driven by `if`, `elif`, and `else` statements evaluated sequentially. Iteration is achieved using `for` loops, commonly paired with `range()` for numeric stepping or iterating directly over iterable collections, and `while` loops driven by boolean conditions. Functions are defined with the `def` keyword, accepting positional and keyword arguments, and support default parameter values. If no explicit `return` statement is provided, Python functions implicitly return `None`. Variable scope within functions adheres to the LEGB rule (Local, Enclosing, Global, Built-in), ensuring variables declared inside a function body remain in local scope unless explicitly declared with the `global` keyword."
  },
  {
    id: "SEC-PY-103",
    number: 3,
    title: "Object-Oriented Programming: Classes & State",
    content: "Python supports object-oriented programming via the `class` keyword. A class acts as a blueprint for creating objects with encapsulated state and behavior. The `__init__` method serves as the constructor, automatically invoked upon object instantiation to initialize instance attributes. The first parameter of every instance method is conventionally named `self`, which explicitly references the specific object instance being operated upon, granting access to its attributes and methods. Encapsulation is supported by naming conventions: a single leading underscore indicates an internal protected attribute, while a double leading underscore triggers name mangling to prevent accidental overriding. Inheritance allows child classes to inherit attributes and methods from a parent class, and the `super()` function allows invocation of overridden parent methods."
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
