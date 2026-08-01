export const TokensService = {
  setToken: ({ property, value }: { property: string; value: string }) => {
    localStorage.setItem(property, value);
  },

  getToken: (property: string) => {
    return localStorage.getItem(property);
  },

  removeToken: (property: string) => {
    localStorage.removeItem(property);
  },
};
