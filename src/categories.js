const CAT_KEY = 'todos-categories';
let categories = [];

export function loadCategories() {
  const jsonCategories = localStorage.getItem(CAT_KEY);
  if (jsonCategories) {
    try {
      categories = JSON.parse(jsonCategories);
    } catch {
      categories = ['Inbox'];
    }
  } else {
    categories = ['Inbox'];
  }
}

export function saveCategories() {
  localStorage.setItem(CAT_KEY, JSON.stringify(categories));
}

export function getCategories() {
  return categories;
}

export function addCategory(name) {
  if (!categories.includes(name)) {
    categories.push(name);
    saveCategories();
    return true;
  }
  return false;
}
