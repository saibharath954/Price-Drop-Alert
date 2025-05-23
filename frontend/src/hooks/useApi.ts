import { useAuth } from "./useAuth";

export const useApi = () => {
  const { user } = useAuth();

  const get = async (endpoint: string) => {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        Authorization: `Bearer ${await user?.getIdToken()}`,
      },
    });
    return response;
  };

  const post = async (endpoint: string, body: any) => {
    const response = await fetch(`/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user?.getIdToken()}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  };

  const put = async (endpoint: string, body: any) => {
    const response = await fetch(`/api${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user?.getIdToken()}`,
      },
      body: JSON.stringify(body),
    });
    return response;
  };

  const del = async (endpoint: string) => {
    const response = await fetch(`/api${endpoint}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${await user?.getIdToken()}`,
      },
    });
    return response;
  };

  return { get, post, put, delete: del };
};
