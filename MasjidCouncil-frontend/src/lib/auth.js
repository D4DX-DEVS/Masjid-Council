// Bearer header for whichever console is logged in. Empty object when logged out,
// so it can be spread into any request without a null check.
export const authHeaders = () => {
  const token = localStorage.getItem("superAdminToken") || localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
