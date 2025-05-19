import {
  parseISO,
  compareAsc,
  compareDesc,
  isValid as isValidDate,
} from 'date-fns';
import Events from './pubsub';
import { debugLog, debugWarn, debugError } from './logger';

const TASKS_STORAGE_KEY = 'todoTasks';
const SORT_CRITERIA_KEY = 'todoSortCriteria';

class TaskManager {
  #tasks = [];

  #nextId = 1;

  #currentSortCriteria = { field: 'text', direction: 'asc' };

  constructor() {
    this.#loadSortCriteria();
    this.#loadTasks();
  }

  #loadSortCriteria() {
    const storedCriteria = localStorage.getItem(SORT_CRITERIA_KEY);
    if (storedCriteria) {
      try {
        this.#currentSortCriteria = JSON.parse(storedCriteria);
      } catch (e) {
        debugError('Error loading sort criteria from localStorage:', e);
        this.#currentSortCriteria = { field: 'text', direction: 'asc' };
      }
    }
  }

  #saveSortCriteria() {
    localStorage.setItem(
      SORT_CRITERIA_KEY,
      JSON.stringify(this.#currentSortCriteria)
    );
  }

  #loadTasks() {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      try {
        this.#tasks = JSON.parse(storedTasks);
        this.#nextId =
          this.#tasks.reduce((max, task) => Math.max(max, task.id || 0), 0) + 1;
      } catch (error) {
        debugError('Error loading tasks from localStorage:', error);
        this.#tasks = [];
        this.#nextId = 1;
      }
    }
    Events.emit('tasksUpdated', this.list);
  }

  #saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.#tasks));
    Events.emit('tasksUpdated', this.list);
  }

  createTask(
    text,
    due = null,
    category = 'Inbox',
    priority = null,
    note = '',
    subtasks = [],
    done = false
  ) {
    const newTask = {
      id: (this.#nextId += 1),
      text,
      due,
      category,
      priority,
      note,
      subtasks,
      done,
      createdAt: new Date().toISOString(),
    };
    this.#tasks.push(newTask);
    this.#saveTasks();
    return newTask;
  }

  setSortCriteria(field) {
    if (this.#currentSortCriteria.field === field) {
      this.#currentSortCriteria.direction =
        this.#currentSortCriteria.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.#currentSortCriteria.field = field;
      this.#currentSortCriteria.direction =
        field === 'priority' ? 'desc' : 'asc';
    }
    this.#saveSortCriteria();
    Events.emit('sortCriteriaChanged', this.#currentSortCriteria);
    Events.emit('tasksUpdated', this.list);
  }

  getCurrentSortCriteria() {
    return { ...this.#currentSortCriteria };
  }

  get list() {
    const sortedTasks = [...this.#tasks];

    if (this.#currentSortCriteria.field) {
      const { field, direction } = this.#currentSortCriteria;
      const priorityOrder = {
        High: 3,
        Medium: 2,
        Low: 1,
        null: 0,
        undefined: 0,
        '': 0,
      };

      sortedTasks.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field !== 'priority') {
          const aIsNull = valA === null || valA === undefined || valA === '';
          const bIsNull = valB === null || valB === undefined || valB === '';

          if (aIsNull && bIsNull) return 0;
          if (aIsNull) return direction === 'asc' ? 1 : -1;
          if (bIsNull) return direction === 'asc' ? -1 : 1;
        }

        if (field === 'due') {
          try {
            const dateA =
              typeof valA === 'string' && valA ? parseISO(valA) : null;
            const dateB =
              typeof valB === 'string' && valB ? parseISO(valB) : null;

            const aIsValid = dateA && isValidDate(dateA);
            const bIsValid = dateB && isValidDate(dateB);

            if (!aIsValid && !bIsValid) return 0;
            if (!aIsValid) return direction === 'asc' ? 1 : -1;
            if (!bIsValid) return direction === 'asc' ? -1 : 1;

            return direction === 'asc'
              ? compareAsc(dateA, dateB)
              : compareDesc(dateA, dateB);
          } catch (error) {
            debugError('Error comparing dates:', error, valA, valB);
            return 0;
          }
        } else if (field === 'priority') {
          const priorityA = priorityOrder[valA] || 0;
          const priorityB = priorityOrder[valB] || 0;

          if (priorityA === priorityB) return 0;
          return direction === 'asc'
            ? priorityA - priorityB
            : priorityB - priorityA;
        } else if (field === 'text') {
          valA = String(valA ?? '').toLowerCase();
          valB = String(valB ?? '').toLowerCase();
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        }
        return 0;
      });
    }
    return sortedTasks;
  }

  findTaskById(id) {
    return this.#tasks.find((task) => task.id === id);
  }

  updateTask(id, updates) {
    const taskIndex = this.#tasks.findIndex((task) => task.id === id);
    if (taskIndex > -1) {
      this.#tasks[taskIndex] = { ...this.#tasks[taskIndex], ...updates };
      this.#saveTasks();
      return this.#tasks[taskIndex];
    }
    debugWarn(`Task with ID ${id} not found for update.`);
    return null;
  }

  addSubtask(taskId, subtaskText) {
    const task = this.findTaskById(taskId);
    if (task) {
      if (!Array.isArray(task.subtasks)) {
        task.subtasks = [];
      }
      const newSubtask = {
        id: Date.now() + Math.random().toString(36).substring(2, 7),
        text: subtaskText,
        done: false,
      };
      task.subtasks.push(newSubtask);
      debugLog('Subtask added in TaskManager:', newSubtask, 'to task:', task);
      this.#saveTasks();
    } else {
      debugError(`Task with ID ${taskId} not found. Cannot add subtask.`);
    }
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.findTaskById(taskId);
    if (task && Array.isArray(task.subtasks)) {
      const subtask = task.subtasks.find((st) => st.id === subtaskId);
      if (subtask) {
        subtask.done = !subtask.done;
        this.#saveTasks();
      }
    }
  }

  deleteSubtask(taskId, subtaskId) {
    const task = this.findTaskById(taskId);
    if (task && Array.isArray(task.subtasks)) {
      task.subtasks = task.subtasks.filter((st) => st.id !== subtaskId);
      this.#saveTasks();
    }
  }

  deleteTasksByCategory(categoryName) {
    const before = this.#tasks.length;
    this.#tasks = this.#tasks.filter((t) => t.category !== categoryName);
    if (this.#tasks.length !== before) {
      this.#saveTasks();
    }
  }

  deleteTask(taskId) {
    const idx = this.#tasks.findIndex((t) => t.id === taskId);
    if (idx > -1) {
      this.#tasks.splice(idx, 1);
      this.#saveTasks();
    } else {
      debugWarn(`deleteTask: no task found with id ${taskId}`);
    }
  }
}

const tasksManager = new TaskManager();
export default tasksManager;
