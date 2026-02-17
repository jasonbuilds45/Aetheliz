
export const getSubscriptionStatus = async (orgId: string) => {
  return {
    plan: 'enterprise',
    status: 'active',
    expires_at: '2024-12-31'
  };
};
