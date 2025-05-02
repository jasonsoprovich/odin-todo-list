Webpack Starter Template
A minimal yet powerful Webpack boilerplate configured with:

Babel (ES6+ support)
ESLint (Airbnb style guide)
Prettier (automatic code formatting)
CSS loading
HTML template generation
Development & production builds (via webpack.dev.js & webpack.prod.js)
GitHub Template-ready structure
——————————————————————————
Features
Webpack 5
Babel (@babel/preset-env) for modern JavaScript
ESLint with eslint-config-airbnb-base + eslint-plugin-import
Prettier for consistent formatting
Dev Server with HMR (webpack-dev-server)
CSS Loader & Style Loader
HTML Webpack Plugin for HTML templating
Config split

config/webpack.common.js
config/webpack.dev.js
config/webpack.prod.js


——————————————————————————

Quick Start


Clone this repo as a template:
git clone https://github.com/<your-user>/webpack-starter.git
cd webpack-starter

Install dependencies:
npm install

Start the development server (with hot reload):
npm run start

Build for production:
npm run build

Lint your code (ESLint + Airbnb rules):
npm run lint

Format code (Prettier):
npm run format