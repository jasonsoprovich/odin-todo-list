import './styles.css';
import Events from './pubsub';
import tasksManager from './taskManager';
import projectsManager from './projectManager';
import appRenderer from './renderer';
import confirmationDialog from './confirmationDialog';
import { debugLog, debugWarn, debugError } from './logger';

function qs(selector) {
  return document.querySelector(selector);
}

const mainTaskForm = qs('#todo-form');
const taskInput = qs('#todo-input');
const taskDueInput = qs('#todo-due');
const taskProjectSelect = qs('#todo-project');
const taskPrioritySelect = qs('#todo-priority');

const projectForm = qs('#proj-form');
const projectInput = qs('#proj-input');
const projectListElement = qs('#project-list');

const todoListElement = qs('#todo-list');

const sortByDueDateBtn = qs('#sort-by-due-date-btn');
const sortByPriorityBtn = qs('#sort-by-priority-btn');
const sortByNameBtn = qs('#sort-by-name-btn');

const allSortButtons = [
  { button: sortByNameBtn, field: 'text', name: 'Name' },
  { button: sortByDueDateBtn, field: 'due', name: 'Due Date' },
  { button: sortByPriorityBtn, field: 'priority', name: 'Priority' },
];

function autoSelectProjectInForm(projectName) {
  if (!taskProjectSelect) return;
  const FILTER_VIEWS = ['All', 'Today', 'Upcoming', 'Overdue'];
  let target = projectName;
  if (FILTER_VIEWS.includes(projectName) && projectName !== 'Inbox') {
    target = 'Inbox';
  }
  const hasOption = Array.from(taskProjectSelect.options).some(
    (opt) => opt.value === target
  );
  if (!hasOption) target = 'Inbox';
  taskProjectSelect.value = target;
}

Events.on('projectsUpdated', ({ current }) => {
  autoSelectProjectInForm(current);
});

Events.on('tasksFilterChanged', (projectName) => {
  autoSelectProjectInForm(projectName);
});

function updateSortButtonActiveStates() {
  const currentCriteria = tasksManager.getCurrentSortCriteria();

  allSortButtons.forEach(({ button, field }) => {
    if (button) {
      button.classList.remove('active-sort');
      const existingArrow = button.querySelector('.sort-arrow');
      if (existingArrow) {
        existingArrow.remove();
      }

      if (currentCriteria.field === field) {
        button.classList.add('active-sort');
        const arrow = document.createElement('span');
        arrow.classList.add('sort-arrow');
        arrow.innerHTML =
          currentCriteria.direction === 'asc' ? ' &uarr;' : ' &darr;';
        button.appendChild(arrow);
      }
    }
  });
}

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

if (projectListElement) {
  projectListElement.addEventListener('click', (e) => {
    const deleteProjectButton = e.target.closest('button.delete-project-btn');
    if (deleteProjectButton) {
      const { projectName } = deleteProjectButton.dataset;
      confirmationDialog.open(
        `Are you sure you want to delete project "${projectName}"? ` +
          `This will permanently remove the project and all its tasks.`,
        () => {
          projectsManager.deleteProject(projectName);
        }
      );
    }
  });
}

if (projectForm) {
  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectName = projectInput.value.trim();
    if (projectName) {
      const added = projectsManager.addProject(projectName);
      if (added) {
        projectInput.value = '';
      } else {
        debugWarn(`Project "${projectName}" already exists or is invalid.`);
      }
    }
  });
}

if (mainTaskForm) {
  mainTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const due = taskDueInput.value || null;
    const category = taskProjectSelect.value;

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

    const toggleButton = target.closest('.toggle');
    if (toggleButton) {
      const taskId = toggleButton.dataset.id;
      if (!taskId) {
        debugError(
          'Toggle button clicked, but data-id is missing!',
          toggleButton
        );
        return;
      }
      try {
        const numericTaskId = parseInt(taskId, 10);
        const task = tasksManager.findTaskById(numericTaskId);
        if (!task) {
          debugError(`Task with ID ${numericTaskId} not found for toggle.`);
          return;
        }
        tasksManager.updateTask(numericTaskId, { done: !task.done });
      } catch (t) {
        debugError('Error processing task toggle:', e, 'Task ID:', taskId);
      }
      return;
    }

    const removeButton = target.closest('button.remove');
    if (removeButton) {
      const taskId = Number(removeButton.dataset.id);
      confirmationDialog.open('Delete task?', () => {
        tasksManager.deleteTask(taskId);
      });
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
      const taskId = saveNoteButton.dataset.id;
      const listItem = saveNoteButton.closest('li');
      if (!listItem) {
        debugError('Could not find parent <li> for save note button.');
        return;
      }
      const noteTextArea = listItem.querySelector('.note-area .note-text');
      if (!taskId) {
        debugWarn('Task ID is missing. Unable to save note.');
        return;
      }
      if (!noteTextArea) {
        debugError(
          'Note textarea not found for task ID:',
          taskId,
          'within LI:',
          listItem
        );
        return;
      }
      try {
        const noteText = noteTextArea.value;
        tasksManager.updateTask(parseInt(taskId, 10), { note: noteText });
      } catch (t) {
        debugError('Error processing save note:', e, 'Task ID:', taskId);
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

    const subToggleBtn = e.target.closest('.sub-toggle');
    if (subToggleBtn) {
      const taskId = subToggleBtn.dataset.id;
      const subtaskId = subToggleBtn.dataset.subId;
      debugLog(
        'Subtask toggle clicked. TaskID:',
        taskId,
        'SubtaskID:',
        subtaskId
      );

      if (taskId && subtaskId) {
        try {
          tasksManager.toggleSubtask(parseInt(taskId, 10), subtaskId);
          debugLog('tasksManager.toggleSubtask called for', subtaskId);
        } catch (err) {
          debugError('Error toggling subtask:', err);
        }
      } else {
        debugError(
          'Missing taskId or subtaskId for subtask toggle.',
          subToggleBtn
        );
      }
      return;
    }

    const subRemoveBtn = e.target.closest('.sub-remove');
    if (subRemoveBtn) {
      const taskId = subRemoveBtn.dataset.id;
      const subtaskId = subRemoveBtn.dataset.subId;
      debugLog(
        'Subtask remove clicked. TaskID:',
        taskId,
        'SubtaskID:',
        subtaskId
      );

      if (taskId && subtaskId) {
        try {
          tasksManager.deleteSubtask(parseInt(taskId, 10), subtaskId);
          debugLog('tasksManager.deleteSubtask called for', subtaskId);
        } catch (err) {
          debugError('Error deleting subtask:', err);
        }
      } else {
        debugError(
          'Missing taskId or subtaskId for subtask removal.',
          subRemoveBtn
        );
      }
    }
  });

  todoListElement.addEventListener('submit', (e) => {
    if (!e.target.matches('.sub-form')) return;
    e.preventDefault();
    debugLog('Sub-form submitted. Target:', e.target);

    const form = e.target;
    const taskId = form.dataset.id;
    const subtaskInput = form.querySelector('.sub-input');

    debugLog('Task ID for subtask:', taskId, 'Input element:', subtaskInput);

    if (!taskId) {
      debugError('Task ID is missing. Cannot add subtask.');
      return;
    }
    if (!subtaskInput) {
      debugError(
        'Subtask input not found for task ID:',
        taskId,
        'within form:',
        form
      );
      return;
    }
    try {
      const subtaskText = subtaskInput.value.trim();
      debugLog('Subtask text to add:', subtaskText);

      if (subtaskText) {
        debugLog(
          'Attempting to call tasksManager.addSubtask with taskId:',
          parseInt(taskId, 10),
          'and text:',
          subtaskText
        );
        tasksManager.addSubtask(parseInt(taskId, 10), subtaskText);
        debugLog('tasksManager.addSubtask called.');
        subtaskInput.value = '';
      } else {
        debugLog('Subtask text is empty. Not adding.');
      }
    } catch (t) {
      debugError(
        'Error processing add subtask in index.js:',
        t,
        'Task ID:',
        taskId
      );
    }
  });
}

Events.on('sortCriteriaChanged', updateSortButtonActiveStates);

document.addEventListener('DOMContentLoaded', () => {
  updateSortButtonActiveStates();
});
