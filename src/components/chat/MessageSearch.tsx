import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface MessageSearchProps {
  chatId: string;
  onResultSelect: (messageId: string) => void;
  onClose: () => void;
}

export const MessageSearch = ({ chatId, onResultSelect, onClose }: MessageSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setTotalCount(0);
      setCurrentIndex(0);
      return;
    }

    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id', { count: 'exact' })
        .eq('chat_id', chatId)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setResults(data || []);
      setTotalCount(count || 0);
      setCurrentIndex(0);

      // Auto-navigate to first result
      if (data && data.length > 0) {
        onResultSelect(data[0].id);
      }
    } catch (error) {
      console.error('[MessageSearch] Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, onResultSelect]);

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Navigate to previous result
  const goToPrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    setCurrentIndex(newIndex);
    onResultSelect(results[newIndex].id);
  };

  // Navigate to next result
  const goToNext = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onResultSelect(results[newIndex].id);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-background border-b border-border animate-in slide-in-from-top-2 duration-200">
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search messages..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 h-8 bg-transparent border-0 focus-visible:ring-0 px-0"
      />

      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {!loading && results.length > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {currentIndex + 1} of {totalCount}
        </span>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          No results
        </span>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToPrevious}
          disabled={results.length === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToNext}
          disabled={results.length === 0}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
