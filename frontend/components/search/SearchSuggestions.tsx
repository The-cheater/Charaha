import React from 'react';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (!suggestions.length) return null;
  return (
    <ul className="bg-white border rounded shadow-md mt-2">
      {suggestions.map((s, i) => (
        <li
          key={i}
          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
          onClick={() => onSelect(s)}
        >
          {s}
        </li>
      ))}
    </ul>
  );
};

export default SearchSuggestions;

