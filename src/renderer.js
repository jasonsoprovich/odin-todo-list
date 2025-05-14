import {
  isToday,
  isFuture,
  isPast,
  format,
  parseISO,
  isValid as isValidDate,
} from 'date-fns';
import Events from './pubsub';
import tasksManager from './taskManager';
import projectsManager from './projectManager';

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

class Renderer {
  #todoListElement;

  #categoryListElement;

  #projectTitleElement;

  #categorySelectInForm;

  #editingId = null;

  constructor() {
    this.#todoListElement = qs('#todo-list');
    this.#categoryListElement = qs('#category-list');
    // review title name
    this.#projectTitleElement = qs('#app h1.text-center');
    this.#categorySelectInForm = qs('#todo-cat');

    Events.on('tasksUpdated', (tasks) => this.renderTasks(tasks));
    Events.on('projectsUpdated', (data) => this.#handleProjectsUpdate(data));
    Events.on('tasksFilterChanged', () => this.renderTasks(tasksManager.list));

    this.#handleProjectsUpdate({
      projects: projectsManager.list,
      current: projectsManager.currentProjectName,
    });
    this.renderTasks(tasksManager.list);
  }

  #handleProjectsUpdate(data) {
    this.renderCategories(data.projects, data.current);
    this.renderCategoryOptionsInForm(
      data.projects.filter(
        (p) => !['All', 'Today', 'Upcoming', 'Overdue'].includes(p.name)
      )
    );
    if (this.#projectTitleElement) {
      this.#projectTitleElement.textContent = data.current || 'Todo List';
    }
    this.renderTasks(tasksManager.list);
  }

  renderCategories(categories, activeCategoryName) {
    if (!this.#categoryListElement) return;
    this.#categoryListElement.innerHTML = '';

    const allLi = document.createElement('li');
    allLi.textContent = 'All';
    allLi.classList.add('project-item');
    allLi.dataset.projectName = 'All';
    if (activeCategoryName === 'All') {
      allLi.classList.add('active');
    }
    allLi.addEventListener('click', () => {
      projectsManager.setCurrentProject('All');
    });
    this.#categoryListElement.appendChild(allLi);

    categories.forEach((project) => {
      if (project.name === 'All') return;

      const projectLi = document.createElement('li');
      projectLi.classList.add('project-item');
      projectLi.dataset.projectName = project.name;

      const projectNameSpan = document.createElement('span');
      projectNameSpan.textContent = project.name;
      projectNameSpan.classList.add('project-name');
      projectNameSpan.addEventListener('click', () => {
        projectsManager.setCurrentProject(project.name);
      });

      if (project.name === activeCategoryName) {
        projectLi.classList.add('active');
      }
      projectLi.appendChild(projectNameSpan);

      const SYSTEM_PROJECT_NAMES = [
        'Inbox',
        'Today',
        'Upcoming',
        'All',
        'Overdue',
      ];
      if (!SYSTEM_PROJECT_NAMES.includes(project.name)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-category-btn');
        deleteBtn.textContent = '✕';
        deleteBtn.setAttribute('aria-label', `Delete category ${project.name}`);
        deleteBtn.dataset.categoryName = project.name;
        projectLi.appendChild(deleteBtn);
      }

      this.#categoryListElement.appendChild(projectLi);
    });
  }

  renderCategoryOptionsInForm(projects) {
    if (!this.#categorySelectInForm) return;
    this.#categorySelectInForm.innerHTML = '';
    projects.forEach((project) => {
      const option = document.createElement('option');
      option.value = project.name;
      option.textContent = project.name;

      if (project.name === 'Inbox') {
        option.selected = true;
      }
      this.#categorySelectInForm.appendChild(option);
    });

    if (
      this.#categorySelectInForm.options.length > 0 &&
      this.#categorySelectInForm.selectedIndex === -1
    ) {
      const inboxOption = Array.from(this.#categorySelectInForm.options).find(
        (opt) => opt.value === 'Inbox'
      );
      if (inboxOption) {
        inboxOption.selected = true;
      } else {
        this.#categorySelectInForm.options[0].selected = true;
      }
    }
  }

  setEditingId(id) {
    this.#editingId = id;
    this.renderTasks(tasksManager.list);
  }

  getCurrentEditingId() {
    return this.#editingId;
  }

  renderTasks(tasksToDisplay) {
    if (!this.#todoListElement) return;
    this.#todoListElement.innerHTML = '';

    const { currentProjectName } = projectsManager;
    let filteredTasks = [];

    if (!currentProjectName || currentProjectName === 'All') {
      filteredTasks = tasksToDisplay;
    } else if (currentProjectName === 'Today') {
      filteredTasks = tasksToDisplay.filter((task) => {
        if (!task.due) return false;
        try {
          const dueDate = parseISO(task.due);
          return isValidDate(dueDate) && isToday(dueDate);
        } catch (e) {
          return false;
        }
      });
    } else if (currentProjectName === 'Upcoming') {
      filteredTasks = tasksToDisplay.filter((task) => {
        if (!task.due) return false;
        try {
          const dueDate = parseISO(task.due);
          return isValidDate(dueDate) && isFuture(dueDate) && !isToday(dueDate);
        } catch (e) {
          return false;
        }
      });
    } else if (currentProjectName === 'Overdue') {
      filteredTasks = tasksToDisplay.filter((task) => {
        if (!task.due || task.done) return false;
        try {
          const dueDate = parseISO(task.due);
          return isValidDate(dueDate) && isPast(dueDate) && !isToday(dueDate);
        } catch (e) {
          return false;
        }
      });
    } else {
      filteredTasks = tasksToDisplay.filter(
        (task) => task.category === currentProjectName
      );
    }

    filteredTasks.forEach((task) => {
      const li = document.createElement('li');
      li.dataset.id = task.id;
      if (task.done) li.classList.add('done');

      if (task.priority && task.priority !== null) {
        const prioritySpan = document.createElement('span');
        prioritySpan.classList.add(
          'todo-priority',
          task.priority.toLowerCase()
        );
        prioritySpan.textContent =
          { High: '🔥', Medium: '⚡', Low: '🛌' }[task.priority] ||
          ` ${task.priority}`;
        li.appendChild(prioritySpan);
      }

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.classList.add('edit-btn');
      editBtn.dataset.id = task.id;
      editBtn.setAttribute('aria-label', 'Edit todo');
      editBtn.textContent = task.id === this.#editingId ? '✖️' : '✏️';
      li.appendChild(editBtn);

      if (task.id === this.#editingId) {
        const editForm = document.createElement('form');
        editForm.classList.add('edit-task-form');
        editForm.addEventListener('submit', (e) => e.preventDefault());

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.classList.add('edit-input', 'edit-task-text');
        textInput.value = task.text;
        editForm.appendChild(textInput);

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.classList.add('edit-input', 'edit-task-due');
        dateInput.value = task.due || '';
        editForm.appendChild(dateInput);

        const priorityEditSelect = document.createElement('select');
        priorityEditSelect.classList.add('edit-input', 'edit-task-priority');

        const priorityOptions = [
          { value: '', text: '⚪ None' }, // value="" represents null
          { value: 'Low', text: '🛌 Low' },
          { value: 'Medium', text: '⚡ Medium' },
          { value: 'High', text: '🔥 High' },
        ];

        priorityOptions.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          if (opt.value === (task.priority || '')) {
            option.selected = true;
          }
          priorityEditSelect.appendChild(option);
        });
        editForm.appendChild(priorityEditSelect);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.classList.add('save-edit-btn');
        saveBtn.dataset.id = task.id;
        saveBtn.textContent = 'Save';
        editForm.appendChild(saveBtn);

        li.appendChild(editForm);
      } else {
        const textSpan = document.createElement('span');
        textSpan.classList.add('todo-text');
        textSpan.textContent = task.text;
        li.appendChild(textSpan);
      }

      if (task.due) {
        const dueSpan = document.createElement('span');
        dueSpan.classList.add('todo-due');
        try {
          const dateObject = parseISO(task.due);
          if (isValidDate(dateObject)) {
            dueSpan.textContent = `📅 ${format(dateObject, 'MMM d')}`;
          } else {
            dueSpan.textContent = `📅 ${task.due}`;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Error parsing due date:', task.due, e);
          dueSpan.textContent = `📅 ${task.due}`;
        }
        li.appendChild(dueSpan);
      }

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.classList.add('toggle');
      toggleBtn.dataset.id = task.id;
      toggleBtn.textContent = task.done ? '↺' : '✓';
      li.appendChild(toggleBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.classList.add('remove');
      removeBtn.dataset.id = task.id;
      removeBtn.textContent = '✕';
      li.appendChild(removeBtn);

      const noteBtn = document.createElement('button');
      noteBtn.type = 'button';
      noteBtn.classList.add('note-btn');
      noteBtn.dataset.id = task.id;
      noteBtn.textContent = '📝';
      noteBtn.setAttribute('aria-label', 'Edit notes');
      li.appendChild(noteBtn);

      const noteArea = document.createElement('div');
      noteArea.classList.add('note-area', 'hidden');

      const textArea = document.createElement('textarea');
      textArea.classList.add('note-text');
      textArea.value = task.note || '';
      textArea.rows = 3;
      textArea.placeholder = 'Notes';
      noteArea.appendChild(textArea);

      const saveNoteBtn = document.createElement('button');
      saveNoteBtn.type = 'button';
      saveNoteBtn.classList.add('save-note-btn');
      saveNoteBtn.dataset.id = task.id;
      saveNoteBtn.textContent = 'Save';
      saveNoteBtn.setAttribute('aria-label', 'Save note');
      noteArea.appendChild(saveNoteBtn);
      li.appendChild(noteArea);

      const listBtn = document.createElement('button');
      listBtn.type = 'button';
      listBtn.classList.add('list-btn');
      listBtn.dataset.id = task.id;
      listBtn.textContent = '🗒️';
      listBtn.setAttribute('aria-label', 'Toggle checklist');
      li.appendChild(listBtn);

      const listArea = document.createElement('div');
      listArea.classList.add('list-area', 'hidden');

      const subForm = document.createElement('form');
      subForm.classList.add('sub-form');
      subForm.dataset.id = task.id;

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
      if (Array.isArray(task.subtasks)) {
        task.subtasks.forEach((subItem) => {
          const subLi = document.createElement('li');
          subLi.classList.toggle('done', subItem.done);
          subLi.dataset.subId = subItem.id;

          const subChk = document.createElement('button');
          subChk.type = 'button';
          subChk.classList.add('sub-toggle');
          subChk.dataset.id = task.id;
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
          subDel.dataset.id = task.id;
          subDel.dataset.subId = subItem.id;
          subDel.textContent = '✕';
          subLi.appendChild(subDel);
          subUl.appendChild(subLi);
        });
      }

      listArea.appendChild(subUl);
      li.appendChild(listArea);

      this.#todoListElement.appendChild(li);
    });
  }
}

const appRenderer = new Renderer();
export default appRenderer;
