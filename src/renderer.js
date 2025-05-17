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
        deleteBtn.innerHTML =
          '<i class="material-icons-outlined" title="Delete category">delete</i>';
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
        let iconName = '';
        switch (task.priority) {
          case 'High':
            iconName = 'star';
            break;
          case 'Medium':
            iconName = 'bolt';
            break;
          case 'Low':
            iconName = 'king_bed';
            break;
          default:
            break;
        }
        if (iconName) {
          prioritySpan.innerHTML = `<i class="material-icons-outlined" title="${task.priority} priority">${iconName}</i>`;
        } else {
          prioritySpan.textContent = task.priority; // Fallback if no icon defined
        }
        li.appendChild(prioritySpan);
      }

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.classList.add('edit-btn', 'action-icon-btn');
      editBtn.dataset.id = task.id;
      editBtn.setAttribute('aria-label', 'Edit task');
      const editIconName = task.id === this.#editingId ? 'close' : 'edit';
      editBtn.innerHTML = `<i class="material-icons-outlined" title="${
        editIconName === 'close' ? 'Cancel edit' : 'Edit task'
      }">${editIconName}</i>`;
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
          { value: '', text: 'None' },
          { value: 'Low', text: 'Low' },
          { value: 'Medium', text: 'Medium' },
          { value: 'High', text: 'High' },
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

        const editFormActions = document.createElement('div');
        editFormActions.classList.add('edit-form-actions');

        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.classList.add('save-edit-btn');
        saveBtn.dataset.id = task.id;
        saveBtn.innerHTML = `<i class="material-icons-outlined" title="Save changes">save</i> Save`;
        editFormActions.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.classList.add('cancel-edit-btn');
        cancelBtn.dataset.id = task.id;
        cancelBtn.innerHTML = `<i class="material-icons-outlined" title="Cancel">cancel</i> Cancel`;
        editFormActions.appendChild(cancelBtn);

        editForm.appendChild(editFormActions);
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
        li.appendChild(dueSpan);
      }

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.classList.add('toggle');
      toggleBtn.dataset.id = task.id;
      const toggleIconName = task.done ? 'replay' : 'check_circle_outline';
      const toggleIconTitle = task.done ? 'Mark as not done' : 'Mark as done';
      toggleBtn.innerHTML = `<i class="material-icons-outlined" title="${toggleIconTitle}">${toggleIconName}</i>`;
      li.appendChild(toggleBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.classList.add('remove');
      removeBtn.dataset.id = task.id;
      removeBtn.innerHTML = `<i class="material-icons-outlined" title="Remove task">delete</i>`;
      li.appendChild(removeBtn);

      const noteBtn = document.createElement('button');
      noteBtn.type = 'button';
      noteBtn.classList.add('note-btn');
      noteBtn.dataset.id = task.id;
      noteBtn.innerHTML = `<i class="material-icons-outlined" title="Edit notes">description</i>`;
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

      const noteAreaActions = document.createElement('div');
      noteAreaActions.classList.add('note-area-actions');

      const saveNoteBtn = document.createElement('button');
      saveNoteBtn.type = 'button';
      saveNoteBtn.classList.add('save-note-btn');
      saveNoteBtn.dataset.id = task.id;
      saveNoteBtn.textContent = 'Save';
      saveNoteBtn.setAttribute('aria-label', 'Save note');
      noteAreaActions.appendChild(saveNoteBtn);

      const cancelNoteBtn = document.createElement('button');
      cancelNoteBtn.type = 'button';
      cancelNoteBtn.classList.add('cancel-note-btn');
      cancelNoteBtn.textContent = 'Cancel';
      noteAreaActions.appendChild(cancelNoteBtn);

      noteArea.appendChild(noteAreaActions);
      li.appendChild(noteArea);

      const listBtn = document.createElement('button');
      listBtn.type = 'button';
      listBtn.classList.add('list-btn');
      listBtn.dataset.id = task.id;
      listBtn.innerHTML = `<i class="material-icons-outlined" title="Toggle checklist">checklist</i>`;
      listBtn.setAttribute('aria-label', 'Toggle checklist');
      li.appendChild(listBtn);

      const listArea = document.createElement('div');
      listArea.classList.add('list-area');
      // unhide if subtasks exist
      if (!task.subtasks || task.subtasks.length === 0) {
        listArea.classList.add('hidden');
      }

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
      subAddBtn.textContent = 'Add';
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
          subChk.classList.add('sub-toggle');
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
          subDel.classList.add('sub-remove');
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
