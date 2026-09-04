import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/_layout';

// const API_BASE_URL = 'http://192.168.1.13:5000';
const API_BASE_URL = 'https://sportsapp-2c1m.onrender.com';
const CACHE_KEY = '@ak_sports_cached_events_light';

const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

export interface Match {
  id: string;
  _id?: string;
  teamAName: string;
  teamBName: string;
  stage?: string;
  matchDate?: string;
  matchTime?: string;
  scoreA: string;
  scoreB: string;
  wicketsA?: string;
  wicketsB?: string;
  overs?: string;
  totalOvers?: string;
  status: string;
  isLive?: boolean;
  activeBattingTeam?: string;
  recentBalls?: string[];
  ballHistory?: string[];
  inningsABalls?: string[];
  inningsBBalls?: string[];
}

export interface SportEvent {
  id: string;
  name: string;
  sportCategory: string;
  sportType: 'CRICKET' | 'OTHER';
  date: string;
  location: string;
  poster: string;
  organizer?: any;
  organizerName?: string;
  organizerDetails?: {
    id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  isVerifiedOrganizer: boolean;
  isLive?: boolean;
  isCompleted?: boolean;
  matches: Match[];
}

interface SportsContextType {
  events: SportEvent[];
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: Omit<SportEvent, 'id' | 'isVerifiedOrganizer' | 'matches'>) => Promise<boolean>;
  updateCurrentLiveMatch: (
    eventId: string,
    teamA: string,
    teamB: string,
    scoreA: string,
    scoreB: string,
    statusText: string,
    wicketsA?: string,
    wicketsB?: string,
    overs?: string,
    recentBalls?: string[],
    totalOvers?: string,
    inningsABalls?: string[],
    inningsBBalls?: string[],
    stage?: string,
    activeBattingTeam?: string
  ) => Promise<void>;
  finalizeAndSaveMatch: (
    eventId: string,
    teamA: string,
    teamB: string,
    scoreA: string,
    scoreB: string,
    wicketsA?: string,
    wicketsB?: string,
    overs?: string,
    resultSummary?: string,
    totalOvers?: string,
    ballHistory?: string[],
    inningsABalls?: string[],
    inningsBBalls?: string[],
    stage?: string
  ) => Promise<void>;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export function SportsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<SportEvent[]>([]);

  // 1. Load cached lightweight data immediately on app launch
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading lightweight cache:', e);
      }
    };
    loadCachedData();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        headers: { Accept: 'application/json' },
      });

      const rawText = await response.text();
      if (!rawText || rawText.trim().startsWith('<')) return;

      const result = JSON.parse(rawText);

      if (result.success && Array.isArray(result.data)) {
        const mappedData: SportEvent[] = result.data.map((item: any) => {
          const rawMatches = (item.matches || []).map((m: any) => ({
            ...m,
            id: m._id || m.id,
            stage: m.stage || 'LEAGUE_1',
            matchDate: m.matchDate || '',
            matchTime: m.matchTime || '',
            isLive: m.isLive,
            activeBattingTeam: m.activeBattingTeam || 'A',
            recentBalls: m.ballHistory || m.recentBalls || [],
            ballHistory: m.ballHistory || m.recentBalls || [],
            inningsABalls: m.inningsABalls || m.ballHistory || [],
            inningsBBalls: m.inningsBBalls || [],
            totalOvers: m.totalOvers || '20',
          }));

          const seenMatchKeys = new Set<string>();
          const deduplicatedMatches: Match[] = [];

          rawMatches.forEach((m: Match) => {
            const uniqueKey = m.id || `${m.teamAName?.trim().toLowerCase()}_vs_${m.teamBName?.trim().toLowerCase()}_${m.stage || 'LEAGUE_1'}`;
            if (!seenMatchKeys.has(uniqueKey)) {
              seenMatchKeys.add(uniqueKey);
              deduplicatedMatches.push(m);
            }
          });

          const resolvedOrganizerName =
            item.organizerName ||
            (item.organizer && typeof item.organizer === 'object' ? item.organizer.fullName : undefined) ||
            item.organizerDetails?.fullName ||
            'Abhishek';

          return {
            id: item._id,
            name: item.name,
            sportCategory: item.sportCategory,
            sportType: item.sportType || 'OTHER',
            date: item.date,
            location: item.location,
            poster: item.poster,
            organizer: item.organizer ? (typeof item.organizer === 'object' ? item.organizer._id : item.organizer) : undefined,
            organizerName: resolvedOrganizerName,
            organizerDetails: item.organizerDetails || (typeof item.organizer === 'object' ? item.organizer : undefined),
            isVerifiedOrganizer: item.isVerifiedOrganizer ?? true,
            isLive: item.isLive ?? false,
            isCompleted: item.isCompleted ?? false,
            matches: deduplicatedMatches,
          };
        });

        setEvents(mappedData);

        // ⚡ SAFE CACHING: Strip out base64 strings if any exist before storing to AsyncStorage
        try {
          const lightweightCache = mappedData.map((ev) => ({
            ...ev,
            poster: ev.poster?.startsWith('data:image') ? '' : ev.poster, // Exclude heavy base64 strings from local storage row size
          }));
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(lightweightCache));
        } catch (cacheErr) {
          console.warn('Skipping cache save due to storage size limits', cacheErr);
        }
      }
    } catch (error) {
      console.error('Error fetching backend events:', error);
    }
  };

  const addEvent = async (eventData: Omit<SportEvent, 'id' | 'isVerifiedOrganizer' | 'matches'>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData),
      });

      const rawText = await response.text();
      if (!rawText || rawText.trim().startsWith('<')) return false;

      const result = JSON.parse(rawText);
      if (result.success) {
        await fetchEvents();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding tournament:', error);
      return false;
    }
  };

  const updateCurrentLiveMatch = async (
    eventId: string,
    teamA: string,
    teamB: string,
    scoreA: string,
    scoreB: string,
    statusText: string,
    wicketsA = '0',
    wicketsB = '0',
    overs = '0.0',
    recentBalls: string[] = [],
    totalOvers = '20',
    inningsABalls: string[] = [],
    inningsBBalls: string[] = [],
    stage = 'LEAGUE_1',
    activeBattingTeam = 'A'
  ) => {
    try {
      await fetch(`${API_BASE_URL}/api/matches/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          teamAName: teamA,
          teamBName: teamB,
          stage,
          scoreA,
          scoreB,
          wicketsA,
          wicketsB,
          overs,
          totalOvers,
          status: statusText,
          ballHistory: recentBalls,
          inningsABalls,
          inningsBBalls,
          isLive: true,
          activeBattingTeam,
        }),
      });
    } catch (error) {
      console.error('Error updating live match:', error);
    }
  };

  const finalizeAndSaveMatch = async (
    eventId: string,
    teamA: string,
    teamB: string,
    scoreA: string,
    scoreB: string,
    wicketsA = '0',
    wicketsB = '0',
    overs = '0.0',
    resultSummary = 'Match Completed',
    totalOvers = '20',
    ballHistory: string[] = [],
    inningsABalls: string[] = [],
    inningsBBalls: string[] = [],
    stage = 'LEAGUE_1'
  ) => {
    try {
      await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          eventId,
          teamAName: teamA,
          teamBName: teamB,
          stage,
          scoreA,
          scoreB,
          wicketsA,
          wicketsB,
          overs,
          totalOvers,
          status: resultSummary,
          ballHistory,
          inningsABalls,
          inningsBBalls,
        }),
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error permanently saving finished match:', error);
    }
  };

  useEffect(() => {
    fetchEvents();

    socket.on('score_updated', (updatedMatch: any) => {
      if (!updatedMatch || !updatedMatch.eventId) {
        fetchEvents();
        return;
      }

      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === updatedMatch.eventId || event.id === updatedMatch.eventId?.toString()) {
            const matchId = updatedMatch._id || updatedMatch.id;
            const updatedMatches = event.matches.map((m) =>
              m.id === matchId || m._id === matchId
                ? { ...m, ...updatedMatch, id: matchId }
                : m
            );
            const matchExists = updatedMatches.some((m) => m.id === matchId || m._id === matchId);
            const finalMatches = matchExists ? updatedMatches : [{ ...updatedMatch, id: matchId }, ...updatedMatches];

            return { ...event, matches: finalMatches };
          }
          return event;
        })
      );
    });

    socket.on('event_status_updated', () => {
      fetchEvents();
    });

    return () => {
      socket.off('score_updated');
      socket.off('event_status_updated');
    };
  }, []);

  return (
    <SportsContext.Provider
      value={{
        events,
        fetchEvents,
        addEvent,
        updateCurrentLiveMatch,
        finalizeAndSaveMatch,
      }}
    >
      {children}
    </SportsContext.Provider>
  );
}

export function useSports() {
  const context = useContext(SportsContext);
  if (!context) throw new Error('useSports must be used within SportsProvider');
  return context;
}