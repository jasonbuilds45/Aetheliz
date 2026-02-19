export interface RepairLog {
  id: string
  concept_name: string
  status: 'resolved' | 'ongoing'
  last_activity: string
}

export const getRepairHistory = async (): Promise<RepairLog[]> => {
  return [
    { id: 'r1', concept_name: 'Vector Calculus',   status: 'resolved', last_activity: '2023-11-01' },
    { id: 'r2', concept_name: 'Linear Equations',  status: 'ongoing',  last_activity: '2023-11-05' },
  ]
}

export const submitClarification = async (
  _conceptId: string,
  _text: string
): Promise<{ success: boolean }> => {
  return { success: true }
}
