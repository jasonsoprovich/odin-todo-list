import Events from './pubsub';
import Project from './project';

const PROJECTS_STORAGE_KEY = 'todos-app-projects';
const DEFAULT_PROJECTS = ['All', 'Inbox', 'Today', 'Upcoming'];
const [defaultInboxProjectName] = DEFAULT_PROJECTS;

class ProjectManager {
  #projects = [];

  #currentProjectName = defaultInboxProjectName;

  constructor() {
    this.#loadProjects();
    // eslint-disable-next-line no-underscore-dangle
    Project.prototype._projectManager = this;
  }

  #loadProjects() {
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (storedProjects) {
      try {
        const parsedProjectNames = JSON.parse(storedProjects);
        const uniqueProjectNames = [
          ...DEFAULT_PROJECTS,
          ...parsedProjectNames.filter(
            (name) => !DEFAULT_PROJECTS.includes(name)
          ),
        ];
        this.#projects = uniqueProjectNames.map((name) => new Project(name));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading projects from localStorage:', error);
        this.#projects = DEFAULT_PROJECTS.map((name) => new Project(name));
      }
    } else {
      this.#projects = DEFAULT_PROJECTS.map((name) => new Project(name));
    }

    if (!this.#projects.some((p) => p.name === this.#currentProjectName)) {
      this.#currentProjectName = defaultInboxProjectName;
    }

    Events.emit('projectsUpdated', {
      projects: this.list,
      current: this.#currentProjectName,
    });
  }

  #saveProjects() {
    const projectNames = this.#projects.map((p) => p.name);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectNames));
    Events.emit('projectsUpdated', {
      projects: this.list,
      current: this.#currentProjectName,
    });
  }

  get list() {
    return [...this.#projects];
  }

  get currentProjectName() {
    return this.#currentProjectName;
  }

  setCurrentProject(projectName) {
    if (this.#projects.some((p) => p.name === projectName)) {
      this.#currentProjectName = projectName;
      Events.emit('projectsUpdated', {
        projects: this.list,
        current: this.#currentProjectName,
      });
      Events.emit('tasksFilterChanged', this.#currentProjectName);
      return true;
    }
    return false;
  }

  addProject(name) {
    if (
      name &&
      name.trim() !== '' &&
      !this.#projects.some((p) => p.name === name)
    ) {
      if (name === 'All') return false;
      const newProject = new Project(name);
      this.#projects.push(newProject);
      this.#saveProjects();
      return newProject;
    }
    return null;
  }

  deleteProject(projectName) {
    if (DEFAULT_PROJECTS.includes(projectName)) {
      // eslint-disable-next-line no-console
      console.warn(`Cannot delete default project: ${projectName}`);
      return false;
    }

    const initialLength = this.#projects.length;
    this.#projects = this.#projects.filter((p) => p.name !== projectName);

    if (this.#projects.length < initialLength) {
      if (this.#currentProjectName === projectName) {
        this.setCurrentProject(defaultInboxProjectName);
      }
      this.#saveProjects();
      return true;
    }
    return false;
  }
}

Project.prototype.setAsCurrent = function setAsCurrent() {
  // eslint-disable-next-line no-underscore-dangle
  if (this._projectManager) {
    // eslint-disable-next-line no-underscore-dangle
    this._projectManager.setCurrentProject(this.name);
  } else {
    // eslint-disable-next-line no-console
    console.error(
      'ProjectManager not linked to Project instances for setAsCurrent'
    );
  }
};

const projectsManager = new ProjectManager();
export default projectsManager;
