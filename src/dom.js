export const qs = (selector) => document.querySelector(selector);

export function renderTodos(todos, container, editingId = null) {
  container.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    if (todo.done) li.classList.add('done');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.classList.add('edit-btn');
    editBtn.dataset.id = todo.id;
    editBtn.setAttribute('aria-label', 'Edit todo');
    editBtn.textContent = todo.id === editingId ? '✖️' : '✏️';
    li.appendChild(editBtn);

    if (todo.id === editingId) {
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('edit-input');
      input.value = todo.text;
      li.appendChild(input);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.classList.add('save-edit-btn');
      saveBtn.dataset.id = todo.id;
      saveBtn.textContent = 'Save';
      li.appendChild(saveBtn);
    } else {
      const textSpan = document.createElement('span');
      textSpan.classList.add('todo-text');
      textSpan.textContent = todo.text;
      li.appendChild(textSpan);
    }

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
    toggleBtn.dataset.id = todo.id;
    toggleBtn.textContent = todo.done ? '↺' : '✓';
    li.appendChild(toggleBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.classList.add('remove');
    removeBtn.dataset.id = todo.id;
    removeBtn.textContent = '✕';
    li.appendChild(removeBtn);

    const noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.classList.add('note-btn');
    noteBtn.dataset.id = todo.id;
    noteBtn.textContent = '📝';
    noteBtn.setAttribute('aria-label', 'Edit notes');
    li.appendChild(noteBtn);

    const noteArea = document.createElement('div');
    noteArea.classList.add('note-area', 'hidden');
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
    saveNoteBtn.dataset.id = todo.id;
    saveNoteBtn.textContent = 'Save';
    saveNoteBtn.setAttribute('aria-label', 'Save note');
    noteArea.appendChild(saveNoteBtn);

    li.appendChild(noteArea);

    const listBtn = document.createElement('button');
    listBtn.type = 'button';
    listBtn.classList.add('list-btn');
    listBtn.dataset.id = todo.id;
    listBtn.textContent = '🗒️';
    listBtn.setAttribute('aria-label', 'Toggle checklist');
    li.appendChild(listBtn);

    const listArea = document.createElement('div');
    listArea.classList.add('list-area', 'hidden');

    const subForm = document.createElement('form');
    subForm.classList.add('sub-form');
    subForm.dataset.id = todo.id;

    const subInput = document.createElement('input');
    subInput.type = 'text';
    subInput.placeholder = 'New subtask';
    subInput.required = true;
    subInput.classList.add('sub-input');
    subForm.appendChild(subInput);

    const subAddBtn = document.createElement('button');
    subAddBtn.type = 'submit';
    subAddBtn.textContent = 'Add';
    subForm.appendChild(subAddBtn);

    listArea.appendChild(subForm);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');

    if (Array.isArray(todo.subtasks)) {
      todo.subtasks.forEach((subItem) => {
        const subLi = document.createElement('li');
        subLi.classList.toggle('done', subItem.done);
        subLi.dataset.subId = subItem.id;

        const subChk = document.createElement('button');
        subChk.type = 'button';
        subChk.classList.add('sub-toggle');
        subChk.dataset.id = todo.id;
        subChk.dataset.subId = subItem.id;
        subChk.textContent = subItem.done ? '☑️' : '⬜';
        subLi.appendChild(subChk);

        const subSpan = document.createElement('span');
        subSpan.classList.add('sub-text');
        subSpan.textContent = subItem.text;
        subLi.appendChild(subSpan);

        const subDel = document.createElement('button');
        subDel.type = 'button';
        subDel.classList.add('sub-remove');
        subDel.dataset.id = todo.id;
        subDel.dataset.subId = subItem.id;
        subDel.textContent = '✕';
        subLi.appendChild(subDel);

        subUl.appendChild(subLi);
      });
    }

    listArea.appendChild(subUl);
    li.appendChild(listArea);

    container.appendChild(li);
  });
}
