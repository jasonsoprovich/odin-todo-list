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

    const deleteCategoryButton = target.closest('button.delete-category-btn');
    if (deleteCategoryButton) {
      const { categoryName } = deleteCategoryButton.dataset;
      if (categoryName) {
        confirmationDialog.open(
          `Are you sure you want to delete category "${categoryName}"? This will also delete all associated tasks.`,
          () => {
            projectsManager.deleteProject(categoryName);
          }
        );
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

    const editButton = target.closest('button.edit-btn');
    if (editButton) {
      const todoId = Number(editButton.dataset.id);
      const currentEditingId = appRenderer.getCurrentEditingId();
      appRenderer.setEditingId(currentEditingId === todoId ? null : todoId);
      return;
    }

    const cancelEditButton = target.closest('button.cancel-edit-btn');
    if (cancelEditButton) {
      appRenderer.setEditingId(null);
      return;
    }

    if (target.matches('button.cancel-note-btn')) {
      const taskLi = target.closest('li[data-id]');
      if (taskLi) {
        const noteArea = taskLi.querySelector('.note-area');
        if (noteArea) {
          noteArea.classList.add('hidden');
          const textArea = noteArea.querySelector('textarea.note-text');
          const taskId = Number(taskLi.dataset.id);
          const task = tasksManager.list.find((t) => t.id === taskId);
          if (textArea && task) textArea.value = task.note || '';
        }
      }
      return;
    }

    if (target.matches('button.cancel-subtask-form-btn')) {
      const taskLi = target.closest('li[data-id]');
      if (taskLi) {
        const listArea = taskLi.querySelector('.list-area');
        if (listArea) {
          listArea.classList.add('hidden');
          const subInput = listArea.querySelector('input.sub-input');
          if (subInput) subInput.value = '';
        }
      }
      return;
    }

    const saveEditButton = target.closest('button.save-edit-btn');
    if (saveEditButton) {
      const todoId = Number(saveEditButton.dataset.id);
      const taskLi = saveEditButton.closest('li[data-id]');
      if (taskLi) {
        const textInput = taskLi.querySelector('input.edit-task-text');
        const dateInput = taskLi.querySelector('input.edit-task-due');
        const priorityInput = taskLi.querySelector('select.edit-task-priority');
        const categoryEditSelectInput = taskLi.querySelector(
          'select.edit-task-category'
        );

        const newText = textInput ? textInput.value.trim() : '';
        const newDueDate = dateInput ? dateInput.value || null : null;
        const priorityValueFromEdit = priorityInput ? priorityInput.value : '';
        const newPriority =
          priorityValueFromEdit === '' ? null : priorityValueFromEdit;
        const newCategory = categoryEditSelectInput
          ? categoryEditSelectInput.value
          : null;
        const updatedProperties = {};

        if (textInput && newText) {
          updatedProperties.text = newText;
        }
        if (dateInput) {
          updatedProperties.due = newDueDate;
        }
        if (priorityInput) {
          updatedProperties.priority = newPriority;
        }
        if (categoryEditSelectInput && typeof newCategory === 'string') {
          updatedProperties.category = newCategory;
        }
        if (newText) {
          tasksManager.updateTask(todoId, {
            text: newText,
            due: newDueDate || null,
            priority: newPriority,
          });
        }
        if (Object.keys(updatedProperties).length > 0) {
          tasksManager.updateTask(todoId, updatedProperties);
        }
      }
      appRenderer.setEditingId(null);
      return;
    }

    const toggleButton = target.closest('button.toggle');
    if (toggleButton) {
      const todoId = Number(toggleButton.dataset.id);
      tasksManager.toggleTaskComplete(todoId);
      return;
    }

    const removeButton = target.closest('button.remove');
    if (removeButton) {
      const todoId = Number(removeButton.dataset.id);
      confirmationDialog.open(
        'Are you sure you want to delete this task?',
        () => {
          tasksManager.deleteTask(todoId);
        }
      );
      return;
    }

    const noteButton = target.closest('button.note-btn');
    if (noteButton) {
      const taskLi = noteButton.closest('li[data-id]');
      if (taskLi) {
        taskLi.querySelector('.note-area').classList.toggle('hidden');
      }
      return;
    }

    const saveNoteButton = target.closest('button.save-note-btn');
    if (saveNoteButton) {
      const todoId = Number(saveNoteButton.dataset.id);
      const taskLi = saveNoteButton.closest('li[data-id]');
      if (taskLi) {
        const textArea = taskLi.querySelector('textarea.note-text');
        if (textArea) {
          tasksManager.updateTaskNote(todoId, textArea.value.trim());
          if (!textArea.value.trim()) {
            taskLi.querySelector('.note-area').classList.add('hidden');
          }
        }
      }
      return;
    }

    const listButton = target.closest('button.list-btn');
    if (listButton) {
      const taskLi = listButton.closest('li[data-id]');
      if (taskLi) {
        taskLi.querySelector('.list-area').classList.toggle('hidden');
      }
      return;
    }

    const subToggleButton = target.closest('button.sub-toggle');
    if (subToggleButton) {
      const todoId = Number(subToggleButton.dataset.id);
      const subId = Number(subToggleButton.dataset.subId);
      tasksManager.toggleSubtask(todoId, subId);
      return;
    }

    const subRemoveButton = target.closest('button.sub-remove');
    if (subRemoveButton) {
      const todoId = Number(subRemoveButton.dataset.id);
      const subId = Number(subRemoveButton.dataset.subId);
      tasksManager.deleteSubtask(todoId, subId);
    }
  });

  todoListElement.addEventListener('submit', (e) => {
    if (!e.target.matches('.sub-form')) return;
    e.preventDefault();
    const todoId = Number(e.target.dataset.id);
    const subInput = e.target.querySelector('.sub-input');
    const text = subInput.value.trim();
    if (text) {
      tasksManager.addSubtask(todoId, text);
    }
    subInput.value = '';
  });
}
