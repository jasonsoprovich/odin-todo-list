const STORAGE_KEY = 'todos-app';
let todos = [];
let nextID = 1;

export function loadTodos() {
  const jsonItem = localStorage.getItem(STORAGE_KEY);
  if (!jsonItem) return;
  try {
    todos = JSON.parse(jsonItem).map((t) => ({
      id: t.id,
      text: t.text || '',
      done: !!t.done,
      due: t.due || null,
      category: t.category || 'Inbox',
      note: typeof t.note === 'string' ? t.note : '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [], // Default to empty array
    }));
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
  const todo = {
    id: nextID,
    text,
    done: false,
    due,
    category,
    note: '',
    subtasks: [],
  };
  todos.push(todo);
  nextID += 1;
  saveTodos();
  return todo;
}

export function addSubtask(id, text) {
  const todo = todos.find((todoItem) => todoItem.id === id);
  if (!todo) return null;

  if (!Array.isArray(todo.subtasks)) {
    todo.subtasks = [];
  }

  const nextSubId =
    todo.subtasks.reduce((max, subItem) => Math.max(max, subItem.id), 0) + 1;
  const sub = { id: nextSubId, text, done: false };
  todo.subtasks.push(sub);
  saveTodos();
  return sub;
}

export function toggleSubtask(todoId, subId) {
  const todo = todos.find((todoItem) => todoItem.id === todoId);
  if (!todo) return null;
  const sub = todo.subtasks.find((subItem) => subItem.id === subId);
  if (!sub) return null;
  sub.done = !sub.done;
  saveTodos();
  return sub;
}

export function deleteSubtask(todoId, subId) {
  const todo = todos.find((todoItem) => todoItem.id === todoId);
  if (!todo) return false;
  const index = todo.subtasks.findIndex((subItem) => subItem.id === subId);
  if (index === -1) return false;
  todo.subtasks.splice(index, 1);
  saveTodos();
  return true;
}

export function updateNote(id, noteText) {
  const todoItem = todos.find((item) => item.id === id);
  if (!todoItem) return null;
  todoItem.note = noteText;
  saveTodos();
  return todoItem;
}

export function updateTodo(id, newText) {
  const todoItem = todos.find((item) => item.id === id);
  if (!todoItem) return null;
  todoItem.text = newText;
  saveTodos();
  return todoItem;
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
