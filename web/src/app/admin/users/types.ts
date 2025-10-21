export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  providerId: string | null;
  provider: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
}

export interface Provider {
  id: string;
  name: string;
  place: string | null;
}

export interface CreateUserFormData {
  phone: string;
  name: string;
  role: string;
  providerId: string;
}
