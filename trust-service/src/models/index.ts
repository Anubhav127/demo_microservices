// Export all models for Trust Service
export { Evaluation, EvaluationStatus, EvaluationAttributes, EvaluationCreationAttributes } from './Evaluation';
export { AIModel, AIModelAttributes, AIModelCreationAttributes } from './AIModel';
export { Project, ProjectAttributes, ProjectCreationAttributes } from './Project';
export { ProjectModel, ProjectModelAttributes } from './ProjectModel';

// Import for associations
import { AIModel } from './AIModel';
import { Evaluation } from './Evaluation';
import { Project } from './Project';
import { ProjectModel } from './ProjectModel';

/**
 * Initialize model associations
 */
export const initializeAssociations = (): void => {
    // Project has many Evaluations
    Project.hasMany(Evaluation, { foreignKey: 'projectId', as: 'evaluations' });
    Evaluation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

    // AIModel has many Evaluations
    AIModel.hasMany(Evaluation, { foreignKey: 'modelId', as: 'evaluations' });
    Evaluation.belongsTo(AIModel, { foreignKey: 'modelId', as: 'model' });

    // Many-to-Many: Project <-> AIModel
    Project.belongsToMany(AIModel, {
        through: ProjectModel,
        foreignKey: 'projectId',
        otherKey: 'modelId',
        as: 'models',
    });
    AIModel.belongsToMany(Project, {
        through: ProjectModel,
        foreignKey: 'modelId',
        otherKey: 'projectId',
        as: 'projects',
    });
};
