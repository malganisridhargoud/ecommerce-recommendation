import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiClient from "../api/axiosConfig";
import { setTokenGetter } from "../api/axiosConfig";

/**
 * Hook that provides authentication utilities.
 * Must be used inside <ClerkProvider>.
 * Wires up the Clerk getToken function to the axios interceptor.
 */
export default function useAuthToken() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Helper method for authenticated POST requests using axios
  const authPost = async (url, data) => {
    return apiClient.post(url, data);
  };

  // Helper method for authenticated GET requests using axios
  const authGet = async (url, params = {}) => {
    return apiClient.get(url, { params });
  };

  return { getToken, isSignedIn, userId, authPost, authGet };
}

// Keep AuthTokenProvider for backward compatibility
export function AuthTokenProvider({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return children;
}

