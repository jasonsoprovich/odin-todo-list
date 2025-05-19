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
  }

  renderCategories(categories, activeCategoryName) {
    if (!this.#categoryListElement) return;
    this.#categoryListElement.innerHTML = '';
    const SYSTEM_PROJECT_NAMES = [
      'Inbox',
      'Today',
      'Upcoming',
      'All',
      'Overdue',
    ];

    const createCategoryLi = (project, isAll = false) => {
      const projectLi = document.createElement('li');
      projectLi.classList.add('project-item');
      projectLi.dataset.projectName = project.name;

      const projectNameSpan = document.createElement('span');
      projectNameSpan.textContent = project.name;
      projectNameSpan.classList.add('project-name');
      projectNameSpan.addEventListener('click', () => {
        projectsManager.setCurrentProject(project.name);
      });
      projectLi.appendChild(projectNameSpan);

      if (project.name === activeCategoryName) {
        projectLi.classList.add('active');
      }

      if (!isAll && !SYSTEM_PROJECT_NAMES.includes(project.name)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add(
          'delete-category-btn',
          'action-icon-btn-sidebar'
        );
        deleteBtn.innerHTML =
          '<i class="material-icons-outlined" title="Delete category">delete</i>';
        deleteBtn.setAttribute('aria-label', `Delete category ${project.name}`);
        deleteBtn.dataset.categoryName = project.name;
        projectLi.appendChild(deleteBtn);
      }
      return projectLi;
    };

    this.#categoryListElement.appendChild(
      createCategoryLi({ name: 'All' }, true)
    );

    categories.forEach((project) => {
      if (project.name === 'All') return;
      this.#categoryListElement.appendChild(createCategoryLi(project));
    });
  }

  renderCategoryOptionsInForm(projects) {
    if (!this.#categorySelectInForm) return;
    this.#categorySelectInForm.innerHTML = '';
    let inboxSelected = false;
    projects.forEach((project) => {
      const option = document.createElement('option');
      option.value = project.name;
      option.textContent = project.name;
      if (project.name === 'Inbox') {
        option.selected = true;
        inboxSelected = true;
      }
      this.#categorySelectInForm.appendChild(option);
    });
    if (!inboxSelected && this.#categorySelectInForm.options.length > 0) {
      this.#categorySelectInForm.options[0].selected = true;
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
          const d = parseISO(task.due);
          return isValidDate(d) && isToday(d);
        } catch (e) {
          return false;
        }
      });
    } else if (currentProjectName === 'Upcoming') {
      filteredTasks = tasksToDisplay.filter((task) => {
        if (!task.due) return false;
        try {
          const d = parseISO(task.due);
          return isValidDate(d) && isFuture(d) && !isToday(d);
        } catch (e) {
          return false;
        }
      });
    } else if (currentProjectName === 'Overdue') {
      filteredTasks = tasksToDisplay.filter((task) => {
        if (!task.due || task.done) return false;
        try {
          const d = parseISO(task.due);
          return isValidDate(d) && isPast(d) && !isToday(d);
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

      const leftGroup = document.createElement('div');
      leftGroup.classList.add('task-group-left');

      const prioritySpan = document.createElement('span');
      prioritySpan.classList.add('todo-priority');

      const iconName = 'flag';
      let priorityTitle = 'No priority';

      if (task.priority && task.priority.trim() !== '') {
        const lowerCasePriority = task.priority.toLowerCase();
        prioritySpan.classList.add(lowerCasePriority);
        priorityTitle = `${task.priority} Priority`;
      }

      prioritySpan.innerHTML = `<i class="material-icons-outlined" title="${priorityTitle}">${iconName}</i>`;
      leftGroup.appendChild(prioritySpan);

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

        const categoryEditSelect = document.createElement('select');
        categoryEditSelect.classList.add('edit-input', 'edit-task-category');
        const assignableCategories = projectsManager.list.filter(
          (p) => !['All', 'Today', 'Upcoming', 'Overdue'].includes(p.name)
        );
        assignableCategories.forEach((cat) => {
          const option = document.createElement('option');
          option.value = cat.name;
          option.textContent = cat.name;
          if (cat.name === task.category) option.selected = true;
          categoryEditSelect.appendChild(option);
        });
        editForm.appendChild(categoryEditSelect);

        const priorityEditSelect = document.createElement('select');
        priorityEditSelect.classList.add('edit-input', 'edit-task-priority');
        const priorityOptions = [
          { value: '', text: '⚪ None' },
          { value: 'Low', text: '🛌 Low' },
          { value: 'Medium', text: '⚡ Medium' },
          { value: 'High', text: '🔥 High' },
        ];
        priorityOptions.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          if (opt.value === (task.priority || '')) option.selected = true;
          priorityEditSelect.appendChild(option);
        });
        editForm.appendChild(priorityEditSelect);

        const editFormActions = document.createElement('div');
        editFormActions.classList.add('edit-form-actions');
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.classList.add('save-edit-btn');
        saveBtn.dataset.id = task.id;
        saveBtn.innerHTML = '<i class="material-icons-outlined">save</i> Save';
        editFormActions.appendChild(saveBtn);
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.classList.add('cancel-edit-btn');
        cancelBtn.dataset.id = task.id;
        cancelBtn.innerHTML =
          '<i class="material-icons-outlined">cancel</i> Cancel';
        editFormActions.appendChild(cancelBtn);
        editForm.appendChild(editFormActions);
        leftGroup.appendChild(editForm);
      } else {
        const textSpan = document.createElement('span');
        textSpan.classList.add('todo-text');
        textSpan.textContent = task.text;
        leftGroup.appendChild(textSpan);
      }
      li.appendChild(leftGroup);

      const rightGroup = document.createElement('div');
      rightGroup.classList.add('task-group-right');

      if (task.id !== this.#editingId && task.due) {
        const dueSpan = document.createElement('span');
        dueSpan.classList.add('todo-due');
        try {
          const dateObject = parseISO(task.due);
          if (isValidDate(dateObject)) {
            dueSpan.innerHTML = `<i class="material-icons-outlined" title="Due date">event</i> ${format(
              dateObject,
              'MMM d'
            )}`;
          } else {
            dueSpan.innerHTML = `<i class="material-icons-outlined" title="Due date">event</i> ${task.due}`;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Error parsing due date:', task.due, e);
          dueSpan.innerHTML = `<i class="material-icons-outlined" title="Due date">event</i> ${task.due}`;
        }
        rightGroup.appendChild(dueSpan);
      }

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.classList.add('edit-btn', 'action-icon-btn');
      editBtn.dataset.id = task.id;
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.innerHTML =
        '<i class="material-icons-outlined" title="Edit task">edit</i>';
      rightGroup.appendChild(editBtn);

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.classList.add('toggle', 'action-icon-btn');
      toggleBtn.dataset.id = task.id;
      const toggleIconName = task.done ? 'replay' : 'check_circle_outline';
      const toggleIconTitle = task.done ? 'Mark as not done' : 'Mark as done';
      toggleBtn.innerHTML = `<i class="material-icons-outlined" title="${toggleIconTitle}">${toggleIconName}</i>`;
      rightGroup.appendChild(toggleBtn);

      const noteBtn = document.createElement('button');
      noteBtn.type = 'button';
      noteBtn.classList.add('note-btn', 'action-icon-btn');
      noteBtn.dataset.id = task.id;
      noteBtn.setAttribute('aria-label', 'Notes');
      if (task.note && task.note.trim() !== '') {
        noteBtn.classList.add('has-content');
        noteBtn.innerHTML =
          '<i class="material-icons-outlined" title="View/Edit Notes">description</i>';
      } else {
        noteBtn.innerHTML =
          '<i class="material-icons-outlined" title="Add Notes">description</i>';
      }
      rightGroup.appendChild(noteBtn);

      const listBtn = document.createElement('button');
      listBtn.type = 'button';
      listBtn.classList.add('list-btn', 'action-icon-btn');
      listBtn.dataset.id = task.id;
      listBtn.setAttribute('aria-label', 'Checklist');
      if (task.subtasks && task.subtasks.length > 0) {
        listBtn.classList.add('has-content');
        const doneCount = task.subtasks.filter((s) => s.done).length;
        listBtn.innerHTML = `<i class="material-icons-outlined" title="View/Edit Checklist">checklist</i> <span class="subtask-count">${doneCount}/${task.subtasks.length}</span>`;
      } else {
        listBtn.innerHTML = `<i class="material-icons-outlined" title="Add Checklist Items">playlist_add</i>`;
      }
      rightGroup.appendChild(listBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.classList.add('remove', 'action-icon-btn');
      removeBtn.dataset.id = task.id;
      removeBtn.innerHTML =
        '<i class="material-icons-outlined" title="Remove task">delete</i>';
      rightGroup.appendChild(removeBtn);
      li.appendChild(rightGroup);

      const noteArea = document.createElement('div');
      noteArea.classList.add('note-area', 'hidden');
      const textArea = document.createElement('textarea');
      textArea.classList.add('note-text');
      textArea.value = task.note || '';
      textArea.rows = 3;
      textArea.placeholder = 'Notes';
      noteArea.appendChild(textArea);
      const noteAreaActions = document.createElement('div');
      noteAreaActions.classList.add('note-area-actions');
      const saveNoteBtn = document.createElement('button');
      saveNoteBtn.type = 'button';
      saveNoteBtn.classList.add('save-note-btn');
      saveNoteBtn.dataset.id = task.id;
      saveNoteBtn.innerHTML =
        '<i class="material-icons-outlined">save</i> Save';
      saveNoteBtn.setAttribute('aria-label', 'Save note');
      noteAreaActions.appendChild(saveNoteBtn);
      const cancelNoteBtn = document.createElement('button');
      cancelNoteBtn.type = 'button';
      cancelNoteBtn.classList.add('cancel-note-btn');
      cancelNoteBtn.textContent = 'Cancel';
      noteAreaActions.appendChild(cancelNoteBtn);
      noteArea.appendChild(noteAreaActions);
      li.appendChild(noteArea);

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
      const subFormActions = document.createElement('div');
      subFormActions.classList.add('sub-form-actions');
      const subAddBtn = document.createElement('button');
      subAddBtn.type = 'submit';
      subAddBtn.innerHTML = '<i class="material-icons-outlined">add</i> Add';
      subFormActions.appendChild(subAddBtn);
      const cancelSubtaskFormBtn = document.createElement('button');
      cancelSubtaskFormBtn.type = 'button';
      cancelSubtaskFormBtn.classList.add('cancel-subtask-form-btn');
      cancelSubtaskFormBtn.textContent = 'Cancel';
      subFormActions.appendChild(cancelSubtaskFormBtn);
      subForm.appendChild(subFormActions);
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
          subChk.classList.add('sub-toggle', 'action-icon-btn');
          subChk.dataset.id = task.id;
          subChk.dataset.subId = subItem.id;
          const subToggleIconName = subItem.done
            ? 'check_box'
            : 'check_box_outline_blank';
          const subToggleIconTitle = subItem.done
            ? 'Mark as not done'
            : 'Mark as done';
          subChk.innerHTML = `<i class="material-icons-outlined" title="${subToggleIconTitle}">${subToggleIconName}</i>`;
          subLi.appendChild(subChk);
          const subSpan = document.createElement('span');
          subSpan.classList.add('sub-text');
          subSpan.textContent = subItem.text;
          subLi.appendChild(subSpan);
          const subDel = document.createElement('button');
          subDel.type = 'button';
          subDel.classList.add('sub-remove', 'action-icon-btn');
          subDel.dataset.id = task.id;
          subDel.dataset.subId = subItem.id;
          subDel.innerHTML = `<i class="material-icons-outlined" title="Remove subtask">delete</i>`;
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
