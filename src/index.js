import './styles.css';
import { qs, renderTodos } from './dom';
import createTodo from './todo';

const form = qs('#todo-form');
const input = qs('#todo-input');
const listElement = qs('#todo-list');
const todos = [];

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push(createTodo(text));
  renderTodos(todos, listElement);
  input.value = '';
  input.focus();
});

listElement.addEventListener('click', (e) => {
  if (!e.target.matches('button.remove')) return;
  const id = Number(e.target.getAttribute('data-id'));
  const index = todos.findIndex((todo) => todo.id === id);
  if (index > -1) {
    todos.splice(index, 1);
    renderTodos(todos, listElement);
  }
});
