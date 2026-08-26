import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../app/_layout';

const API_BASE_URL = 'https://sportsapp-2c1m.onrender.com';
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

export interface Match {
  id: string;
  _id?: string;
  teamAName: string;
  teamBName: string;
  scoreA: string;
  scoreB: string;
  wicketsA?: string;
  wicketsB?: string;
  overs?: string;
  totalOvers?: string;
  status: string;
  isLive?: boolean;
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
  organizer?: string;
  isVerifiedOrganizer: boolean;
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
    inningsBBalls?: string[]
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
    inningsBBalls?: string[]
  ) => Promise<void>;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export function SportsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<SportEvent[]>([]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        headers: {
          Accept: 'application/json',
        },
      });

      const rawText = await response.text();

      // Guard against empty responses or HTML error pages (e.g., Render 502/504)
      if (!rawText || rawText.trim() === '' || rawText.trim().startsWith('<')) {
        console.warn('Backend returned non-JSON / server warming up on Render.');
        return;
      }

      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        console.warn('Unable to parse server output as JSON:', rawText);
        return;
      }

      if (result.success && Array.isArray(result.data)) {
        const mappedData: SportEvent[] = result.data.map((item: any) => ({
          id: item._id,
          name: item.name,
          sportCategory: item.sportCategory,
          sportType: item.sportType || 'OTHER',
          date: item.date,
          location: item.location,
          poster: item.poster,
          organizer: item.organizer ? (typeof item.organizer === 'object' ? item.organizer._id : item.organizer) : undefined,
          isVerifiedOrganizer: item.isVerifiedOrganizer ?? true,
          matches: (item.matches || []).map((m: any) => ({
            ...m,
            id: m._id || m.id,
            isLive: m.isLive,
            recentBalls: m.ballHistory || m.recentBalls || [],
            ballHistory: m.ballHistory || m.recentBalls || [],
            inningsABalls: m.inningsABalls || m.ballHistory || [],
            inningsBBalls: m.inningsBBalls || [],
            totalOvers: m.totalOvers || '20',
          })),
        }));
        setEvents(mappedData);
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
    inningsBBalls: string[] = []
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
        }),
      });
      await fetchEvents();
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
    inningsBBalls: string[] = []
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

    socket.on('score_updated', () => {
      fetchEvents();
    });

    return () => {
      socket.off('score_updated');
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