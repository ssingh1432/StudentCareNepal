import { useState } from "react";
import { useDeepSeekAI } from "@/lib/deepseek";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, XCircle } from "lucide-react";

interface AISuggestionsProps {
  planType: string;
  classLevel: string;
  prompt?: string;
  onAddSuggestions: (suggestions: string) => void;
  onCancel: () => void;
}

const AISuggestions = ({ 
  planType, 
  classLevel, 
  prompt, 
  onAddSuggestions, 
  onCancel 
}: AISuggestionsProps) => {
  const { generateSuggestions, loading } = useDeepSeekAI();
  const [suggestions, setSuggestions] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>(prompt || "");
  const [isCustomPrompt, setIsCustomPrompt] = useState<boolean>(!!prompt);
  
  // Generate default prompt based on class and plan type
  const getDefaultPrompt = () => {
    let ageGroup = "";
    switch (classLevel) {
      case "nursery":
        ageGroup = "3 year old";
        break;
      case "lkg":
        ageGroup = "4 year old";
        break;
      case "ukg":
        ageGroup = "5 year old";
        break;
      default:
        ageGroup = "pre-primary";
    }
    
    let timeframe = "";
    switch (planType) {
      case "annual":
        timeframe = "year-long";
        break;
      case "monthly":
        timeframe = "month-long";
        break;
      case "weekly":
        timeframe = "week-long";
        break;
      default:
        timeframe = "";
    }
    
    return `Suggest 5 educational activities for ${ageGroup} children in ${classLevel.toUpperCase()} class for a ${timeframe} teaching plan in Nepal.`;
  };
  
  const handleGenerateSuggestions = async () => {
    const result = await generateSuggestions({
      class: classLevel,
      type: planType,
      prompt: isCustomPrompt ? customPrompt : undefined,
    });
    
    if (result) {
      setSuggestions(result);
    }
  };
  
  return (
    <div className="bg-purple-50 p-4 rounded-md">
      <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
        <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
        DeepSeek AI Suggestions
      </h4>
      
      {!suggestions && !loading && (
        <>
          <div className="mb-3">
            <label className="flex items-center text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={isCustomPrompt}
                onChange={() => setIsCustomPrompt(!isCustomPrompt)}
                className="h-4 w-4 text-purple-600 mr-2 rounded"
              />
              Use custom prompt
            </label>
            
            {isCustomPrompt && (
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom prompt for AI suggestions"
                className="mb-3 resize-none bg-white"
                rows={2}
              />
            )}
            
            <Button
              onClick={handleGenerateSuggestions}
              disabled={loading || (isCustomPrompt && !customPrompt)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {isCustomPrompt ? "Custom" : "Default"} Suggestions
                </>
              )}
            </Button>
            
            {!isCustomPrompt && (
              <p className="text-xs text-gray-600 mt-2">
                Default prompt: "{getDefaultPrompt()}"
              </p>
            )}
          </div>
        </>
      )}
      
      {loading && (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm text-purple-800">Generating creative suggestions...</p>
        </div>
      )}
      
      {suggestions && !loading && (
        <>
          <div className="text-sm text-gray-700 bg-white p-3 rounded-md mb-3 max-h-60 overflow-y-auto">
            <div className="whitespace-pre-line">{suggestions}</div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-gray-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onAddSuggestions(suggestions)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Add to Plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AISuggestions;
