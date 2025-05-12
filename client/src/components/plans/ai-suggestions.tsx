import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, CheckCircle, WandSparkles } from "lucide-react";

interface AISuggestionsProps {
  suggestions: string | null;
  isLoading: boolean;
  onAccept: (suggestions: string) => void;
  onClose: () => void;
}

export function AISuggestions({
  suggestions,
  isLoading,
  onAccept,
  onClose,
}: AISuggestionsProps) {
  const [selectedText, setSelectedText] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (suggestions) {
      setSelectedText(suggestions);
    }
  };

  const handleAccept = () => {
    if (selectedText) {
      onAccept(selectedText);
    } else if (suggestions) {
      onAccept(suggestions);
    }
  };

  return (
    <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-purple-800 flex items-center">
          <WandSparkles className="h-4 w-4 mr-1" />
          DeepSeek AI Suggestions
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      <div className="text-sm text-gray-700">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-2" />
            <p className="text-gray-500">Generating creative teaching activities...</p>
          </div>
        ) : !suggestions ? (
          <p className="py-4 text-center text-gray-500">No suggestions available.</p>
        ) : (
          <>
            <div
              className={`mb-3 max-h-[200px] overflow-y-auto p-3 rounded-md ${
                selectedText ? "bg-purple-100 border border-purple-200" : "bg-white border border-gray-200"
              }`}
              onClick={handleSelectAll}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                {suggestions}
              </pre>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-purple-700 italic">
                  Click anywhere in the text to select all suggestions
                </p>
              </div>
              <Button
                size="sm"
                className="flex items-center"
                onClick={handleAccept}
                disabled={!suggestions}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {selectedText ? "Add Selected" : "Add All to Plan"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
