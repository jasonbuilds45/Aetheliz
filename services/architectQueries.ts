
export const getConceptGraph = async () => {
  return {
    nodes: [
      { id: 'n1', label: 'Arithmetic', type: 'foundation' },
      { id: 'n2', label: 'Algebra', type: 'core' },
    ],
    edges: [
      { from: 'n1', to: 'n2', type: 'prerequisite' }
    ]
  };
};
