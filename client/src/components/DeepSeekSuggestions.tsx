import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, Check, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DeepSeekSuggestionsProps {
  classLevel: string;
  onAddSuggestions: (suggestions: string) => void;
}

export function DeepSeekSuggestions({ classLevel, onAddSuggestions }: DeepSeekSuggestionsProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate default prompt based on class level
  const getDefaultPrompt = () => {
    return `Suggest 5 age-appropriate activities for ${classLevel} students that focus on improving fine motor skills and social interaction.`;
  };

  const generateSuggestions = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for suggestions.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/suggestions', { prompt });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setError("Failed to get suggestions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefaultPrompt = () => {
    setPrompt(getDefaultPrompt());
  };

  const handleAddSuggestions = () => {
    if (suggestions) {
      onAddSuggestions(suggestions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">AI Prompt</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseDefaultPrompt}
            className="text-xs"
          >
            Use Default Prompt
          </Button>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what teaching activities you need suggestions for..."
          className="resize-none"
          rows={3}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="button"
          onClick={generateSuggestions}
          disabled={isLoading || !prompt.trim()}
          className="self-end"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </div>

      {suggestions && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <Lightbulb className="mr-2 h-4 w-4" />
              DeepSeek AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm whitespace-pre-wrap text-gray-700">
              {suggestions}
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSuggestions}
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Add these to my plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
