import './styles.css';
import { qs, renderTodos } from './dom';
import { loadTodos, getTodos, createTodo, deleteTodo } from './todo';

const form = qs('#todo-form');
const input = qs('#todo-input');
const listElement = qs('#todo-list');

loadTodos();
renderTodos(getTodos(), listElement);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  createTodo(text);
  // todos.push(createTodo(text));
  renderTodos(getTodos(), listElement);
  input.value = '';
  input.focus();
});

listElement.addEventListener('click', (e) => {
  const id = Number(e.target.getAttribute('data-id'));
  if (e.target.matches('button.remove')) {
    deleteTodo(id);
  }
  renderTodos(getTodos(), listElement);
});
