let nextID = 1;
export function createTodo(text) {
  return { id: nextID++, text, done: false };
}
