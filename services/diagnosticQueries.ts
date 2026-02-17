
import { Diagnostic, Concept } from '../types';

export const getRecentDiagnostics = async (limit: number = 5): Promise<Diagnostic[]> => {
  return [
    { id: '1', title: 'Algebraic Reasoning', status: 'completed', mastery_score: 85, created_at: '2023-10-24' },
    { id: '2', title: 'Geometric Proofs', status: 'completed', mastery_score: 42, created_at: '2023-10-23' },
    { id: '3', title: 'Data Interpretation', status: 'completed', mastery_score: 94, created_at: '2023-10-22' },
  ];
};

export const getConceptStability = async (): Promise<Concept[]> => {
  return [
    { name: 'Algebraic Reasoning', stability: 74, fragility: 18, reinforce: 8 },
    { name: 'Geometric Proofs', stability: 62, fragility: 24, reinforce: 14 },
    { name: 'Calculus Basics', stability: 45, fragility: 35, reinforce: 20 },
  ];
};
