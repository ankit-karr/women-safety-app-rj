// Function to create a simple local unique ID.
export const createLocalId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};
