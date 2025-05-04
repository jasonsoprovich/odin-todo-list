import './styles.css';
import { loadCategories, getCategories, addCategory } from './categories';
import {
  loadTodos,
  getTodos,
  createTodo,
  deleteTodo,
  toggleTodo,
} from './todo';
import { qs, renderTodos } from './dom';

const form = qs('#todo-form');
const input = qs('#todo-input');
const dueInput = qs('#todo-due');
const catSelect = qs('#todo-cat');
const listElement = qs('#todo-list');
const catListElement = qs('#category-list');
const catForm = qs('#cat-form');
const catInput = qs('#cat-input');

let activeCategory = 'All';

loadCategories();
loadTodos();

function renderTodosFilter() {
  let list = getTodos();
  if (activeCategory !== 'All') {
    list = list.filter((todo) => todo.category === activeCategory);
  }
  renderTodos(list, listElement);
}

function renderCategoryOptions() {
  catSelect.innerHTML = '';
  getCategories().forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    catSelect.appendChild(option);
  });
}

function renderCategories() {
  catListElement.innerHTML = '';
  const cats = ['All', ...getCategories()];
  cats.forEach((cat) => {
    const li = document.createElement('li');
    li.textContent = cat;
    if (cat === activeCategory) li.classList.add('active');
    li.addEventListener('click', () => {
      activeCategory = cat;
      renderCategories();
      renderTodosFilter();
    });
    catListElement.appendChild(li);
  });
}

catForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = catInput.value.trim();
  if (name && addCategory(name)) {
    renderCategories();
    renderCategoryOptions();
  }
  catInput.value = '';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const due = dueInput.value || null;
  const category = catSelect.value;
  if (!text) return;
  createTodo(text, due, category);
  renderTodosFilter();
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

renderCategoryOptions();
renderCategories();
renderTodosFilter();
