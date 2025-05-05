export const qs = (selector) => document.querySelector(selector);

export function renderTodos(todos, container) {
  container.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');

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

    const noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.classList.add('note-btn');
    noteBtn.setAttribute('data-id', todo.id);
    noteBtn.textContent = '📝';
    li.appendChild(noteBtn);

    const noteArea = document.createElement('div');
    noteArea.classList.add('note-area');
    if (!todo.note) noteArea.classList.add('hidden');

    const textArea = document.createElement('textarea');
    textArea.classList.add('note-text');
    textArea.value = todo.note || '';
    textArea.rows = 3;
    textArea.placeholder = 'Notes';
    textArea.addEventListener('click', (e) => e.stopPropagation());
    noteArea.appendChild(textArea);

    const saveNoteBtn = document.createElement('button');
    saveNoteBtn.type = 'button';
    saveNoteBtn.classList.add('save-note-btn');
    saveNoteBtn.setAttribute('data-id', todo.id);
    saveNoteBtn.textContent = 'Save';
    noteArea.appendChild(saveNoteBtn);

    li.appendChild(noteArea);
    container.appendChild(li);
  });
}
