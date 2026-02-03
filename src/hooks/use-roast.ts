import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useRoastStore } from '../store/roast-store';
import { Language, RoastLevel, RoastResult } from '../types';

interface RoastRequest {
  url: string;
  level: RoastLevel;
  language: Language;
}

export const useRoast = () => {
  const { setResult, setError, setIsLoading } = useRoastStore();

  return useMutation({
    mutationFn: async (data: RoastRequest): Promise<RoastResult> => {
      const response = await axios.post('/api/roast', data);
      return response.data;
    },
    onMutate: () => {
      setIsLoading(true);
      setError(null);
      setResult(null);
    },
    onSuccess: (data) => {
      setResult(data);
      setIsLoading(false);
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      setIsLoading(false);
      const message =
        error.response?.data?.error || error.message || 'Something went wrong.';
      setError(message);
    }
  });
};
