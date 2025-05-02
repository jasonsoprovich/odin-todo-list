import './styles.css';

function component() {
  const el = document.createElement('div');
  el.innerHTML = '<h1>Hello, Webpack!</h1>';
  return el;
}

document.getElementById('app').appendChild(component());
