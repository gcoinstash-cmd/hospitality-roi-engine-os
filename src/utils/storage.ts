import { HospitalityROIInput } from './formulas';

export interface HospitalityProject {
  id: string;
  name: string;
  inputs: HospitalityROIInput;
  updatedAt: string;
}

const STORAGE_KEY = 'aura_grid_hospitality_projects';

/**
 * Retrieves all saved projects from browser LocalStorage
 */
export function getSavedProjects(): HospitalityProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read projects from localStorage:', error);
    return [];
  }
}

/**
 * Saves a new project or updates an existing one
 */
export function saveProject(name: string, inputs: HospitalityROIInput): HospitalityProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const projects = getSavedProjects();
    const newProject: HospitalityProject = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: name.trim() || 'Unnamed Design Scenario',
      inputs,
      updatedAt: new Date().toISOString()
    };
    
    const updated = [newProject, ...projects];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    return getSavedProjects();
  }
}

/**
 * Deletes a project by its unique ID
 */
export function deleteProject(id: string): HospitalityProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const projects = getSavedProjects();
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to delete project from localStorage:', error);
    return getSavedProjects();
  }
}
