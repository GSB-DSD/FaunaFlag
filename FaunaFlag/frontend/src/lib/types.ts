// Mirrors backend/models/film.py and backend/models/quiz.py — keep in sync by hand.
export type Flag = "red" | "amber" | "green";

export interface FilmInput {
  title: string;
  year: number;
  director: string;
  genre: string;
  species: string[];
  description: string;
  flag: Flag;
  poster_url: string;
}

export interface PosterLookup {
  poster_url: string;
}

export interface Film extends FilmInput {
  id: string;
}

export interface FilmCommunity {
  film_id: string;
  red: number;
  amber: number;
  green: number;
  total: number;
}

export interface AdminStatus {
  authenticated: boolean;
}

export interface ReseedResult {
  films_total: number;
}

// Mirrors backend/models/suggestion.py
export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface SuggestionInput {
  title: string;
  year: number;
  director: string;
  species: string[];
  description: string;
  suggested_flag: Flag;
  submitter_name: string;
}

export interface Suggestion extends SuggestionInput {
  id: string;
  status: SuggestionStatus;
  created_at: string;
  film_id: string | null;
}

export interface QuizAnswer {
  film_id: string;
  flag: Flag;
}

export interface SubmitResponse {
  id: string;
}

export interface FlagSplit {
  red: number;
  amber: number;
  green: number;
}

export interface BreakdownRow {
  film_id: string;
  title: string;
  year: number;
  poster_url: string;
  your_flag: Flag;
  official_flag: Flag;
  community: FlagSplit;
  community_total: number;
}

export interface QuizResult {
  id: string;
  created_at: string;
  total: number;
  counts: FlagSplit;
  percentages: FlagSplit;
  agreement_pct: number;
  strictness: number;
  strictness_percentile: number;
  tolerance_label: string;
  community_avg: FlagSplit;
  community_avg_agreement: number;
  community_match_pct: number;
  submissions_total: number;
  breakdown: BreakdownRow[];
}

export interface CommunityStats {
  submissions_total: number;
  films_total: number;
  avg_percentages: FlagSplit;
  avg_agreement: number;
  official_split: FlagSplit;
}
