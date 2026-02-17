
export const getTenantSettings = async (tenantId: string) => {
  return {
    name: 'St. Jude Academy',
    branding: { primary_color: '#1e3b8a' },
    allowed_roles: ['teacher', 'principal']
  };
};
