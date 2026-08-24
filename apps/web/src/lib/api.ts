import axios from 'axios';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export const fetchFields = async (
  params: Record<string, string | number | boolean | undefined | null>,
): Promise<FieldsResponse> => {
  const cleanParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = String(value);
    }
  });

  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/fields${query ? `?${query}` : ''}`,
  );

  if (!res.ok) {
    throw new Error('Failed to fetch fields');
  }

  return res.json();
};

export const fetchFieldById = async (id: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/fields/${id}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch field ${id}`);
  }

  return res.json();
};
