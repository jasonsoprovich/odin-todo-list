import './styles.css';
import { loadCategories, getCategories, addCategory } from './categories';
import {
  loadTodos,
  getTodos,
  createTodo,
  deleteTodo,
  toggleTodo,
  updateNote,
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
  const { target } = e;
  const li = target.closest('li');
  const id = li && Number(target.getAttribute('data-id'));
  if (!li || !id) return;

  if (target.matches('button.note-btn')) {
    li.querySelector('.note-area').classList.toggle('hidden');
    return;
  }

  if (target.matches('button.toggle')) {
    toggleTodo(id);
  } else if (target.matches('button.remove')) {
    deleteTodo(id);
  } else if (target.matches('button.save-note-btn')) {
    const text = li.querySelector('textarea.note-text').value.trim();
    updateNote(id, text);
    if (!text) {
      li.querySelector('.note-area').classList.add('hidden');
    }
  }

  renderTodosFilter();
});

renderCategoryOptions();
renderCategories();
renderTodosFilter();
