export const qs = (selector) => document.querySelector(selector);
export function renderTodos(todos, container) {
  container.innerHTML = '';
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.setAttribute('data-id', todo.id);
    if (todo.done) li.classList.add('done');

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = todo.done ? '↺' : '✓';
    toggleBtn.classList.add('toggle');
    toggleBtn.setAttribute('data-id', todo.id);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.classList.add('remove');
    removeBtn.setAttribute('data-id', todo.id);

    li.appendChild(toggleBtn);
    li.appendChild(removeBtn);
    container.appendChild(li);
  });
}
