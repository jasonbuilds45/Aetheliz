const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle()

return (
  <pre>
    {JSON.stringify({ profile, error }, null, 2)}
  </pre>
)