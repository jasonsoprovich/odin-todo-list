let nextID = 1;

export default function createTodo(text) {
  const todo = { id: nextID, text, done: false };
  nextID += 1;
  return todo;
}
