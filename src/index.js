import './styles.css';
import { qs, renderTodos } from './dom';
import {
  loadTodos,
  getTodos,
  createTodo,
  deleteTodo,
  toggleTodo,
} from './todo';

const form = qs('#todo-form');
const input = qs('#todo-input');
const dueInput = qs('#todo-due');
const listElement = qs('#todo-list');

loadTodos();
renderTodos(getTodos(), listElement);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const due = dueInput.value || null;
  if (!text) return;
  createTodo(text, due);
  renderTodos(getTodos(), listElement);
  input.value = '';
  dueInput.value = '';
  input.focus();
});

listElement.addEventListener('click', (e) => {
  const id = Number(e.target.getAttribute('data-id'));
  if (e.target.matches('button.toggle')) {
    toggleTodo(id);
  } else if (e.target.matches('button.remove')) {
    deleteTodo(id);
  }
  renderTodos(getTodos(), listElement);
});
