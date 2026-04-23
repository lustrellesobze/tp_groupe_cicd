// Module Task & Kanban — Membre C
// Ré-export des composants/pages existants + API dédiée

export { ProjectPage } from '../../pages/ProjectPage';
export { TaskBoard } from '../../components/TaskBoard';
export { TaskEditModal } from '../../components/TaskEditModal';
export { tasksApi } from './api';
export type { TaskCreateBody } from './api';
