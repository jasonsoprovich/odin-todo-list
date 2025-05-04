const STORAGE_KEY = 'todos-app';
let todos = [];
let nextID = 1;

export function loadTodos() {
  const jsonItem = localStorage.getItem(STORAGE_KEY);
  if (!jsonItem) return;
  try {
    todos = JSON.parse(jsonItem);
    const maxID = todos.reduce((max, todo) => Math.max(max, todo.id), 0);
    nextID = maxID + 1;
  } catch {
    todos = [];
  }
}
export function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function getTodos() {
  return todos;
}

export function createTodo(text, due = null, category = 'Inbox') {
  const todo = { id: nextID, text, done: false, due, category };
  todos.push(todo);
  nextID += 1;
  saveTodos();
  return todo;
}

export function deleteTodo(id) {
  const index = todos.findIndex((todoItem) => todoItem.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  saveTodos();
  return true;
}

export function toggleTodo(id) {
  const todo = todos.find((todoItem) => todoItem.id === id);
  if (!todo) return null;
  todo.done = !todo.done;
  saveTodos();
  return todo;
}
