// Mock database module
export const mockQuery = jest.fn();

export const query = mockQuery;

export const initDb = jest.fn().mockResolvedValue(undefined);

export const resetMocks = () => {
  mockQuery.mockReset();
};

export default {
  query: mockQuery
};
