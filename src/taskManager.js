import Events from './pubsub';
import Task from './task';

const TASKS_STORAGE_KEY = 'todos-app-tasks';

class TaskManager {
  #tasks = [];

  #nextId = 1;

  constructor() {
    this.#loadTasks();
  }

  #loadTasks() {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        this.#tasks = parsedTasks.map(
          (t) =>
            new Task(
              t.id,
              t.text || '',
              Boolean(t.done),
              t.due || null,
              t.category || 'Inbox',
              typeof t.note === 'string' ? t.note : '',
              Array.isArray(t.subtasks) ? t.subtasks : [],
              t.priority || 'Medium'
            )
        );
        this.#nextId =
          this.#tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading tasks from localStorage:', error);
        this.#tasks = [];
        this.#nextId = 1;
      }
    }
    Events.emit('tasksUpdated', this.#tasks);
  }

  #saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.#tasks));
    Events.emit('tasksUpdated', this.#tasks);
  }

  get list() {
    return [...this.#tasks];
  }

  createTask(text, due = null, category = 'Inbox', priority = 'Medium') {
    const newTask = new Task(
      this.#nextId,
      text,
      false,
      due,
      category,
      '',
      [],
      priority
    );
    this.#tasks.push(newTask);
    this.#nextId += 1;
    this.#saveTasks();
    return newTask;
  }

  updateTask(id, updatedProperties) {
    const taskIndex = this.#tasks.findIndex((task) => task.id === id);
    if (taskIndex > -1) {
      this.#tasks[taskIndex] = {
        ...this.#tasks[taskIndex],
        ...updatedProperties,
      };
      this.#saveTasks();
      return this.#tasks[taskIndex];
    }
    return null;
  }

  deleteTask(id) {
    const initialLength = this.#tasks.length;
    this.#tasks = this.#tasks.filter((task) => task.id !== id);
    if (this.#tasks.length < initialLength) {
      this.#saveTasks();
      return true;
    }
    return false;
  }

  toggleTaskComplete(id) {
    const task = this.#tasks.find((t) => t.id === id);
    if (task) {
      task.toggleComplete();
      this.#saveTasks();
      return task;
    }
    return null;
  }

  addSubtask(taskId, text) {
    const task = this.#tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const nextSubId =
      (task.subtasks.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
    const newSubtask = { id: nextSubId, text, done: false };
    task.subtasks.push(newSubtask);
    this.#saveTasks();
    return newSubtask;
  }

  toggleSubtask(taskId, subId) {
    const task = this.#tasks.find((t) => t.id === taskId);
    if (!task) return false;
    const subtask = task.subtasks.find((s) => s.id === subId);
    if (!subtask) return false;
    subtask.done = !subtask.done;
    this.#saveTasks();
    return true;
  }

  deleteSubtask(taskId, subId) {
    const task = this.#tasks.find((t) => t.id === taskId);
    if (!task) return false;
    const initialLength = task.subtasks.length;
    task.subtasks = task.subtasks.filter((s) => s.id !== subId);
    if (task.subtasks.length < initialLength) {
      this.#saveTasks();
      return true;
    }
    return false;
  }

  updateTaskPriority(id, newPriority) {
    const task = this.#tasks.find((t) => t.id === id);
    if (task && ['Low', 'Medium', 'High'].includes(newPriority)) {
      task.priority = newPriority;
      this.#saveTasks();
      return task;
    }
    return null;
  }
}

const tasksManager = new TaskManager();
export default tasksManager;
