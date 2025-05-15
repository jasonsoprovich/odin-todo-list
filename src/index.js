import './styles.css';
// eslint-disable-next-line no-unused-vars
import Events from './pubsub';
import tasksManager from './taskManager';
import projectsManager from './projectManager';
import appRenderer from './renderer';
import confirmationDialog from './confirmationDialog';

function qs(selector) {
  return document.querySelector(selector);
}

const mainTaskForm = qs('#todo-form');
const taskInput = qs('#todo-input');
const taskDueInput = qs('#todo-due');
const taskCategorySelect = qs('#todo-cat');
const taskPrioritySelect = qs('#todo-priority');

const categoryForm = qs('#cat-form');
const categoryInput = qs('#cat-input');
const categoryListElement = qs('#category-list');

const todoListElement = qs('#todo-list');

const sortByDueDateBtn = qs('#sort-by-due-date-btn');
const sortByPriorityBtn = qs('#sort-by-priority-btn');
const sortByNameBtn = qs('#sort-by-name-btn');

if (sortByDueDateBtn) {
  sortByDueDateBtn.addEventListener('click', () => {
    tasksManager.setSortCriteria('due');
  });
}

if (sortByPriorityBtn) {
  sortByPriorityBtn.addEventListener('click', () => {
    tasksManager.setSortCriteria('priority');
  });
}

if (sortByNameBtn) {
  sortByNameBtn.addEventListener('click', () => {
    tasksManager.setSortCriteria('text');
  });
}

if (categoryListElement) {
  categoryListElement.addEventListener('click', async (e) => {
    const { target } = e;

    if (target.matches('button.delete-category-btn')) {
      const { categoryName } = target.dataset;
      if (categoryName) {
        const confirmed = await confirmationDialog.show(
          `Are you sure you want to delete category "${categoryName}"? Tasks will not be deleted.`
        );
        // maybe delete tasks within category? or move to inbox?
        if (confirmed) {
          projectsManager.deleteProject(categoryName);
        }
      }
    }
  });
}

if (categoryForm) {
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const categoryName = categoryInput.value.trim();
    if (categoryName) {
      const added = projectsManager.addProject(categoryName);
      if (added) {
        categoryInput.value = '';
      } else {
        // eslint-disable-next-line no-alert
        alert(`Category "${categoryName}" already exists or is invalid.`);
      }
    }
  });
}

if (mainTaskForm) {
  mainTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const due = taskDueInput.value || null;
    const category = taskCategorySelect.value;

    const priorityValue = taskPrioritySelect ? taskPrioritySelect.value : '';
    const priorityForNewTask = priorityValue === '' ? null : priorityValue;

    if (text) {
      tasksManager.createTask(text, due, category, priorityForNewTask);
      taskInput.value = '';
      taskDueInput.value = '';
      if (taskPrioritySelect) taskPrioritySelect.value = '';
      taskInput.focus();
    }
  });
}

if (todoListElement) {
  todoListElement.addEventListener('click', (e) => {
    const { target } = e;
    const taskLi = target.closest('li[data-id]');
    if (!taskLi) return;

    const taskId = Number(taskLi.dataset.id);

    if (target.matches('button.toggle')) {
      tasksManager.toggleTaskComplete(taskId);
      return;
    }

    if (target.matches('button.remove')) {
      tasksManager.deleteTask(taskId);
      return;
    }

    if (target.matches('button.edit-btn')) {
      if (appRenderer.getCurrentEditingId() === taskId) {
        appRenderer.setEditingId(null);
      } else {
        appRenderer.setEditingId(taskId);
      }
      return;
    }

    if (target.matches('button.save-edit-btn')) {
      const editForm = taskLi.querySelector('form.edit-task-form');
      if (editForm) {
        const textInput = editForm.querySelector('input.edit-task-text');
        const dateInput = editForm.querySelector('input.edit-task-due');
        const priorityInput = editForm.querySelector(
          'select.edit-task-priority'
        );

        const newText = textInput ? textInput.value.trim() : null;
        const newDueDate = dateInput ? dateInput.value || null : null;

        const priorityValueFromEdit = priorityInput ? priorityInput.value : '';
        const newPriority =
          priorityValueFromEdit === '' ? null : priorityValueFromEdit;

        const updatedProperties = {};
        if (textInput && newText !== '') {
          updatedProperties.text = newText;
        }
        if (dateInput) {
          updatedProperties.due = newDueDate;
        }
        if (priorityInput) {
          updatedProperties.priority = newPriority;
        }

        if (Object.keys(updatedProperties).length > 0) {
          tasksManager.updateTask(taskId, updatedProperties);
        }
      }
      appRenderer.setEditingId(null);
      return;
    }

    if (target.matches('button.note-btn')) {
      const noteArea = taskLi.querySelector('.note-area');
      if (noteArea) noteArea.classList.toggle('hidden');
      return;
    }

    if (target.matches('button.save-note-btn')) {
      const textArea = taskLi.querySelector('.note-area textarea.note-text');
      if (textArea) {
        const noteText = textArea.value.trim();
        tasksManager.updateTaskNote(taskId, noteText);
        const noteArea = taskLi.querySelector('.note-area');
        if (noteArea && !noteText) noteArea.classList.add('hidden');
      }
      return;
    }

    if (target.matches('button.list-btn')) {
      const listArea = taskLi.querySelector('.list-area');
      if (listArea) listArea.classList.toggle('hidden');
      return;
    }

    if (target.matches('button.sub-toggle')) {
      const subTaskId = Number(target.dataset.subId);
      if (subTaskId) {
        tasksManager.toggleSubtask(taskId, subTaskId);
      }
      return;
    }

    if (target.matches('button.sub-remove')) {
      const subTaskId = Number(target.dataset.subId);
      if (subTaskId) {
        tasksManager.deleteSubtask(taskId, subTaskId);
      }
    }
  });

  todoListElement.addEventListener('submit', (e) => {
    const { target } = e;

    if (target.matches('form.sub-form')) {
      e.preventDefault();
      const taskLi = target.closest('li[data-id]');
      if (!taskLi) return;
      const taskId = Number(taskLi.dataset.id);

      const subInput = target.querySelector('input.sub-input');
      if (subInput) {
        const text = subInput.value.trim();
        if (text) {
          tasksManager.addSubtask(taskId, text);
        }
        subInput.value = '';
      }
    }
  });
}
