import Events from './pubsub';
import Project from './project';
import tasksManager from './taskManager';
import { debugLog, debugError } from './logger';

const PROJECTS_STORAGE_KEY = 'todos-app-projects';
const DEFAULT_PROJECTS = ['All', 'Inbox', 'Today', 'Upcoming', 'Overdue'];
const [defaultInboxProjectName] = DEFAULT_PROJECTS;

class ProjectManager {
  #projects = [];

  #currentProjectName = defaultInboxProjectName;

  constructor() {
    this.#loadProjects();
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
        debugError('Error loading projects from localStorage:', error);
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
    debugLog('➡️ emitting projectsUpdated', {
      projects: this.list,
      current: this.#currentProjectName,
    });
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
    debugLog('🗑 deleteProject called with:', projectName);
    if (projectName === defaultInboxProjectName) return false;

    const idx = this.#projects.findIndex((p) => p.name === projectName);
    if (idx > -1) {
      tasksManager.deleteTasksByCategory(projectName);

      this.#projects.splice(idx, 1);

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
  if (this._projectManager) {
    this._projectManager.setCurrentProject(this.name);
  } else {
    debugError(
      'ProjectManager not linked to Project instances for setAsCurrent'
    );
  }
};

const projectsManager = new ProjectManager();
export default projectsManager;
