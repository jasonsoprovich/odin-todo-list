export const qs = (selector) => document.querySelector(selector);
export function renderTodos(todos, container) {
  container.innerHTML = '';
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    li.setAttribute('data-id', todo.id);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.classList.add('remove');
    removeBtn.setAttribute('data-id', todo.id);

    li.appendChild(removeBtn);

    container.appendChild(li);
  });
}
