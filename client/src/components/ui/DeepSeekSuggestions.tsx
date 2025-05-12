import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeepSeekSuggestionsProps {
  classType: string;
  onAddSuggestions: (suggestions: string) => void;
}

export default function DeepSeekSuggestions({
  classType,
  onAddSuggestions
}: DeepSeekSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [promptText, setPromptText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    setShowSuggestions(true);
    
    try {
      // Create the prompt based on the class type
      const prompt = promptText || `Suggest 3 ${classType} appropriate activities for teaching plans`;
      
      // Call the API
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ prompt, class: classType }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again."
      });
      setSuggestions([
        "Connection error: Try checking your internet connection",
        "You can also add activities manually",
        "Or try again later when service is available"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToActivities = () => {
    onAddSuggestions(suggestions.join("\n\n"));
    toast({
      title: "Added to plan",
      description: "AI suggestions have been added to your activities"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
            Prompt for AI Suggestions
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            variant="ghost"
          >
            {showSuggestions ? "Hide" : "Show"} Suggestions
          </Button>
        </div>
        <div className="flex gap-2">
          <Textarea
            id="prompt"
            placeholder={`Suggest 3 ${classType} appropriate activities for teaching plans`}
            className="flex-1"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
          <Button
            type="button"
            onClick={generateSuggestions}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">DeepSeek AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-purple-600">Generating suggestions...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                {suggestions.length > 0 ? (
                  <>
                    <p className="mb-2">Here are some suggested activities for {classType} students:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ol>
                    
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        onClick={handleAddToActivities}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add these to my plan
                      </Button>
                    </div>
                  </>
                ) : (
                  <p>Generate suggestions to see AI ideas for teaching activities</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
