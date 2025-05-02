export const qs = (selector) => document.querySelector(selector);
export function renderTodos(todos, container) {
  container.innerHTML = '';
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.dataset.id = todo.id;

    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.classList.add('remove');
    btn.dataset = todo.id;

    li.appendChild(btn);

    container.appendChild(li);
  });
}
