import { useState } from "react";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeepSeekConfig {
  planType: string;
  planClass: string;
  prompt?: string;
}

interface UseDeepSeekAIProps {
  onSuccess?: (suggestions: string) => void;
}

export function useDeepSeekAI({ onSuccess }: UseDeepSeekAIProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async (config: DeepSeekConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      // Format the prompt based on config
      const defaultPrompt = `Suggest 3 activities for ${config.planClass} students that align with ${config.planType} teaching plan`;
      const finalPrompt = config.prompt || defaultPrompt;

      const response = await apiRequest("POST", "/api/ai/suggestions", {
        prompt: finalPrompt,
        planType: config.planType,
        planClass: config.planClass,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to generate suggestions");
      }

      const data = await response.json();
      if (onSuccess) {
        onSuccess(data.suggestions);
      }
      return data.suggestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate suggestions";
      setError(new Error(errorMessage));
      toast({
        title: "Error generating suggestions",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateSuggestions,
    isLoading,
    error,
  };
}
