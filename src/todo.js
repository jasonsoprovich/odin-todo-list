const STORAGE_KEY = 'todos-app';
const todos = [];
let nextID = 1;

export function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function createTodo(text) {
  const todo = { id: nextID, text, done: false };
  todos.push(todo);
  nextID += 1;
  saveTodos();
  return todo;
}
