export interface RequestWithUser {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

