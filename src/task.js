class Task {
  constructor(
    id,
    text,
    done = false,
    due = null,
    category = 'Inbox',
    note = '',
    subtasks = [],
    priority = null
  ) {
    this.id = id;
    this.text = text;
    this.done = done;
    this.due = due;
    this.category = category;
    this.note = note;
    this.subtasks = subtasks;
    this.priority = priority;
  }

  toggleComplete() {
    this.done = !this.done;
  }
}

export default Task;
