export const qs = (selector) => document.querySelector(selector);

export function renderTodos(todos, container) {
  container.innerHTML = '';
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.setAttribute('data-id', todo.id);
    if (todo.done) li.classList.add('done');

    const textSpan = document.createElement('span');
    textSpan.classList.add('todo-text');
    textSpan.textContent = todo.text;
    li.appendChild(textSpan);

    if (todo.due) {
      const dueSpan = document.createElement('span');
      dueSpan.classList.add('todo-due');
      const date = new Date(todo.due);
      dueSpan.textContent = `📅 ${date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`;
      li.appendChild(dueSpan);
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.classList.add('toggle');
    toggleBtn.setAttribute('data-id', todo.id);
    toggleBtn.textContent = todo.done ? '↺' : '✓';
    li.appendChild(toggleBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.classList.add('remove');
    removeBtn.setAttribute('data-id', todo.id);
    removeBtn.textContent = '✕';
    li.appendChild(removeBtn);

    container.appendChild(li);
  });
}
