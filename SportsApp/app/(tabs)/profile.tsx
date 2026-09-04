import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Image, ScrollView, Alert, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSports, SportEvent } from '../../context/SportsContext';
import { useAuth } from '../_layout';

// const API_BASE_URL = 'http://192.168.1.13:5000';

const API_BASE_URL = 'https://sportsapp-2c1m.onrender.com';

const AVAILABLE_SPORTS = ['Kabaddi', 'Cricket', 'Volleyball', 'Badminton', 'Shuttle', 'Others'];
const STAGE_OPTIONS = [
  { label: 'League 1', value: 'LEAGUE_1' },
  { label: 'League 2', value: 'LEAGUE_2' },
  { label: 'Group Stages', value: 'LEAGUE_STAGE' },
  { label: 'Semi-Final', value: 'SEMI_FINAL' },
  { label: 'Final Match', value: 'FINAL' },
];

const STAGE_FILTER_OPTIONS = [
  { label: 'All Stages', value: 'ALL' },
  { label: 'League 1', value: 'LEAGUE_1' },
  { label: 'League 2', value: 'LEAGUE_2' },
  { label: 'Group Stages', value: 'LEAGUE_STAGE' },
  { label: 'Semi-Final', value: 'SEMI_FINAL' },
  { label: 'Final Match', value: 'FINAL' },
];

export default function ProfileScreen() {
  const { user, logoutUser } = useAuth();
  const { events, addEvent, fetchEvents, updateCurrentLiveMatch, finalizeAndSaveMatch } = useSports();
  const [modalVisible, setModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const [activeTournamentMatches, setActiveTournamentMatches] = useState<{ [eventId: string]: any }>({});

  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleEvent, setScheduleEvent] = useState<SportEvent | null>(null);
  const [hubActiveTab, setHubActiveTab] = useState<'upcoming' | 'add' | 'finished'>('upcoming');
  const [selectedUpcomingStageFilter, setSelectedUpcomingStageFilter] = useState<string>('ALL');
  const [selectedFinishedStageFilter, setSelectedFinishedStageFilter] = useState<string>('ALL');

  const [schedStage, setSchedStage] = useState('LEAGUE_1');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedOvers, setSchedOvers] = useState('20');

  // 💰 Walk-in Team Registration & Fee Tracking States
  const [walkinTeamName, setWalkinTeamName] = useState('');
  const [walkinTotalFee, setWalkinTotalFee] = useState('');
  const [walkinPaidFee, setWalkinPaidFee] = useState('');
  const [walkinRegistrations, setWalkinRegistrations] = useState<{ id: string; name: string; total: number; paid: number; scheduled: boolean }[]>([]);

  // ⚔️ Match pairing selections from registered pool
  const [selectedTeamA, setSelectedTeamA] = useState<string | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<string | null>(null);

  const [selectedProfileTab, setSelectedProfileTab] = useState<'tournaments' | 'finished'>('tournaments');

  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any | null>(null);
  const [selectedInningsTeam, setSelectedInningsTeam] = useState<'A' | 'B'>('A');

  // Umpire Desk Lock / Modify State
  const [isUmpireDeskLocked, setIsUmpireDeskLocked] = useState(false);

  // QR Code & Scanner States
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedEventForQr, setSelectedEventForQr] = useState<SportEvent | null>(null);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const myEvents = events.filter((e) => {
    if (!user?.id) return false;
    const orgId = typeof e.organizer === 'object' && e.organizer !== null ? (e.organizer as any)._id || (e.organizer as any).id : e.organizer;
    return orgId === user.id;
  });
  
  const [sportsName, setSportsName] = useState('Kabaddi');
  const [sportType, setSportType] = useState<'CRICKET' | 'OTHER'>('OTHER');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [poster, setPoster] = useState('');

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Umpire Board States
  const [liveTeamA, setLiveTeamA] = useState('');
  const [liveTeamB, setLiveTeamB] = useState('');
  const [liveStage, setLiveStage] = useState('LEAGUE_1');
  const [liveScoreA, setLiveScoreA] = useState('0');
  const [liveScoreB, setLiveScoreB] = useState('0');
  const [liveWicketsA, setLiveWicketsA] = useState('0');
  const [liveWicketsB, setLiveWicketsB] = useState('0');
  const [liveOvers, setLiveOvers] = useState('0.0');
  const [maxMatchOvers, setMaxMatchOvers] = useState('20');
  const [liveStatusText, setLiveStatusText] = useState('');
  const [recentBalls, setRecentBalls] = useState<string[]>([]);
  
  const [teamABalls, setTeamABalls] = useState<string[]>([]);
  const [teamBBalls, setTeamBBalls] = useState<string[]>([]);
  const [activeBattingTeam, setActiveBattingTeam] = useState<'A' | 'B'>('A');

  const handleOpenQrCodeModal = (eventItem: SportEvent) => {
    setSelectedEventForQr(eventItem);
    setQrModalVisible(true);
  };

  const handleOpenScanner = async () => {
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan umpire QR codes.');
        return;
      }
    }
    setScannedLock(false);
    setScannerModalVisible(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scannedLock) return;
    setScannedLock(true);
    setScannerModalVisible(false);

    try {
      let eventId = data.trim();
      if (data.includes('AKSPORTS_EVENT:')) {
        eventId = data.split('AKSPORTS_EVENT:')[1];
      }

      const targetEvent = events.find((e) => e.id === eventId || (e as any)._id === eventId);
      if (targetEvent) {
        Alert.alert('Access Granted!', `Successfully linked to tournament: ${targetEvent.name}`);
        handleManageScores(targetEvent);
      } else {
        Alert.alert('Invalid QR Code', 'The scanned tournament ID was not found in your active list.');
      }
    } catch (error) {
      Alert.alert('Scanning Error', 'Could not parse the scanned QR code payload.');
    }
  };

  const handleToggleLive = async (eventItem: any) => {
    const targetId = eventItem._id || eventItem.id;
    if (!targetId) {
      Alert.alert('Error', 'Tournament ID is missing.');
      return;
    }

    setLoadingActionId(targetId);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/events/${targetId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          isLive: !eventItem.isLive, 
          isCompleted: false 
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchEvents();
        Alert.alert(
          'Status Updated', 
          !eventItem.isLive 
            ? 'Tournament is now streaming LIVE on Home Screen!' 
            : 'Tournament removed from Live stream.'
        );
      } else {
        Alert.alert('Unable to Update', data.message || 'Error updating status.');
      }
    } catch (e: any) {
      console.error('Toggle Live Error:', e);
      Alert.alert('Network Error', 'Could not reach backend server at ' + API_BASE_URL);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCompleteTournament = async (eventItem: any) => {
    const targetId = eventItem._id || eventItem.id;
    Alert.alert(
      'Complete Tournament',
      'Are all league and final matches completed? This moves the tournament to Finished section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Event',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingActionId(targetId);
              const headers: any = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              };
              if (user?.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
              }

              const res = await fetch(`${API_BASE_URL}/api/events/${targetId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ isLive: false, isCompleted: true }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                await fetchEvents();
                Alert.alert('Tournament Finished', 'Tournament moved to Finished tab on Home screen.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setLoadingActionId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenScheduleModal = async (eventItem: SportEvent) => {
    const fresh = events.find(e => e.id === eventItem.id) || eventItem;
    setScheduleEvent(fresh);
    setSchedStage('LEAGUE_1');
    setSchedDate(fresh.date || '');
    setSchedTime('');
    setSchedOvers('20');
    setWalkinTeamName('');
    setWalkinTotalFee('');
    setWalkinPaidFee('');
    setSelectedTeamA(null);
    setSelectedTeamB(null);
    setHubActiveTab('upcoming');
    setSelectedUpcomingStageFilter('ALL');
    setSelectedFinishedStageFilter('ALL');
    setWalkinRegistrations([]);

    try {
      const targetEventId = fresh.id || (fresh as any)._id;
      const res = await fetch(`${API_BASE_URL}/api/teams/${targetEventId}`);
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const loadedTeams = json.data.map((t: any) => ({
          id: t._id,
          name: t.name,
          total: t.totalFee || 0,
          paid: t.paidFee || 0,
          scheduled: t.isScheduled || false,
        }));
        setWalkinRegistrations(loadedTeams);
      }
    } catch (e) {
      console.error('Error fetching registered teams from MongoDB:', e);
    }

    setScheduleModalVisible(true);
  };

  const handleSaveWalkinRegistration = async () => {
    if (!walkinTeamName.trim()) {
      Alert.alert('Required Field', 'Please enter the walk-in team name.');
      return;
    }
    if (!scheduleEvent) return;

    const total = parseFloat(walkinTotalFee) || 0;
    const paid = parseFloat(walkinPaidFee) || 0;

    try {
      const res = await fetch(`${API_BASE_URL}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          eventId: scheduleEvent.id,
          name: walkinTeamName.trim(),
          totalFee: total,
          paidFee: paid,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWalkinRegistrations(prev => [
          {
            id: data.data._id,
            name: data.data.name,
            total: data.data.totalFee,
            paid: data.data.paidFee,
            scheduled: false,
          },
          ...prev,
        ]);
        setWalkinTeamName('');
        setWalkinTotalFee('');
        setWalkinPaidFee('');
        Alert.alert('Registered & Saved!', 'Walk-in team saved securely in MongoDB.');
      } else {
        Alert.alert('Error', data.message || 'Could not save team.');
      }
    } catch (error) {
      console.error('Network error saving team:', error);
      Alert.alert('Network Error', 'Could not reach backend server.');
    }
  };

  const handleTeamSelection = (team: { name: string; scheduled: boolean }) => {
    if (team.scheduled) {
      Alert.alert('Team Locked', 'This team has already been scheduled for a match in this stage and cannot be selected again.');
      return;
    }

    if (selectedTeamA === team.name) {
      setSelectedTeamA(null);
    } else if (selectedTeamB === team.name) {
      setSelectedTeamB(null);
    } else if (!selectedTeamA) {
      setSelectedTeamA(team.name);
    } else if (!selectedTeamB) {
      setSelectedTeamB(team.name);
    } else {
      Alert.alert('Selection Full', 'Team A and Team B are already selected. Tap a selected team to deselect.');
    }
  };

  const handleScheduleSelectedPair = async () => {
    if (!selectedTeamA || !selectedTeamB) {
      Alert.alert('Select Two Teams', 'Please select Team A and Team B from your pool.');
      return;
    }
    if (!scheduleEvent) return;

    const newMatchPayload = {
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`,
      eventId: scheduleEvent.id,
      teamAName: selectedTeamA,
      teamBName: selectedTeamB,
      stage: schedStage,
      matchDate: schedDate.trim() || scheduleEvent.date,
      matchTime: schedTime.trim(),
      totalOvers: schedOvers.trim() || '20',
      status: `Scheduled • ${schedStage.replace('_', ' ')}`,
      scoreA: '0',
      scoreB: '0',
      wicketsA: '0',
      wicketsB: '0',
      overs: '0.0',
      isLive: false,
      ballHistory: [],
      inningsABalls: [],
      inningsBBalls: [],
    };

    setScheduleEvent((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: [newMatchPayload, ...(prev.matches || [])],
      };
    });

    setWalkinRegistrations(prev =>
      prev.map(reg =>
        reg.name === selectedTeamA || reg.name === selectedTeamB ? { ...reg, scheduled: true } : reg
      )
    );

    const savedTeamA = selectedTeamA;
    const savedTeamB = selectedTeamB;
    setSelectedTeamA(null);
    setSelectedTeamB(null);
    setHubActiveTab('upcoming');

    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          eventId: scheduleEvent.id,
          teamAName: savedTeamA,
          teamBName: savedTeamB,
          stage: schedStage,
          matchDate: schedDate.trim() || scheduleEvent.date,
          matchTime: schedTime.trim(),
          totalOvers: schedOvers.trim() || '20',
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchEvents();
        Alert.alert('Match Scheduled!', `${savedTeamA} vs ${savedTeamB} added to upcoming fixtures and locked from duplicate scheduling.`);
      }
    } catch (e: any) {
      console.error('Match schedule background error:', e);
    }
  };

  const handleSetNextMatch = (event: SportEvent, matchItem: any) => {
    setActiveTournamentMatches((prev) => ({
      ...prev,
      [event.id]: matchItem,
    }));

    setScheduleModalVisible(false);

    if (event.isLive) {
      handleManageScores(event, matchItem);
    } else {
      Alert.alert(
        'Next Match Selected!',
        `${matchItem.teamAName} vs ${matchItem.teamBName} is set as the active fixture on your tournament card.\n\nTap "Add to Live" to start scoring.`
      );
    }
  };

  const handleManageScores = (event: SportEvent, targetMatch?: any) => {
    if (!event.isLive) {
      Alert.alert(
        'Tournament Not Live',
        'Please tap "Add to Live" first to activate this tournament before opening the Umpire Score Card.'
      );
      return;
    }

    const activeUnfinishedMatch = targetMatch || activeTournamentMatches[event.id] || event.matches?.find((m: any) => {
      const isFinished = 
        m.isLive === false || 
        m.status === 'Match Completed' || 
        (typeof m.status === 'string' && (
          m.status.includes('won by') || 
          m.status.includes('Tied') || 
          m.status.includes('Drawn')
        ));
      return !isFinished && m.status !== 'Match Scheduled';
    }) || event.matches?.[0];

    const isSameMatchSession = selectedEvent?.id === event.id && liveTeamA === (activeUnfinishedMatch?.teamAName || liveTeamA);

    setSelectedEvent(event);

    if (!isSameMatchSession && activeUnfinishedMatch) {
      setLiveTeamA(activeUnfinishedMatch.teamAName || 'TEAM A'); 
      setLiveTeamB(activeUnfinishedMatch.teamBName || 'TEAM B');
      setLiveStage(activeUnfinishedMatch.stage || 'LEAGUE_1');
      setLiveScoreA(activeUnfinishedMatch.scoreA?.toString() || '0');
      setLiveScoreB(activeUnfinishedMatch.scoreB?.toString() || '0');
      setLiveWicketsA(activeUnfinishedMatch.wicketsA?.toString() || '0');
      setLiveWicketsB(activeUnfinishedMatch.wicketsB?.toString() || '0');
      setLiveOvers(activeUnfinishedMatch.overs || '0.0');
      setMaxMatchOvers(activeUnfinishedMatch.totalOvers || '20');
      setLiveStatusText(activeUnfinishedMatch.status || 'Live');
      setRecentBalls(activeUnfinishedMatch.ballHistory || activeUnfinishedMatch.recentBalls || []);
      setTeamABalls(activeUnfinishedMatch.inningsABalls || activeUnfinishedMatch.ballHistory || []);
      setTeamBBalls(activeUnfinishedMatch.inningsBBalls || []);
      setActiveBattingTeam(activeUnfinishedMatch.activeBattingTeam || 'A');

      const isFinished = activeUnfinishedMatch.status?.includes('won by') || activeUnfinishedMatch.status === 'Match Completed' || activeUnfinishedMatch.status?.includes('Tied');
      setIsUmpireDeskLocked(isFinished);
    }
    setScoreModalVisible(true);
  };

  const handleToggleUnlockDesk = () => {
    Alert.alert(
      'Unlock Umpire Desk',
      'Unlocking allows you to modify scores or ball deliveries for this fixture. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock & Modify', 
          style: 'destructive', 
          onPress: () => setIsUmpireDeskLocked(false) 
        }
      ]
    );
  };

  const calculateNextOver = (currentOversStr: string, isLegalBall: boolean): string => {
    let [completedOvers, balls] = currentOversStr.split('.').map((num) => parseInt(num, 10) || 0);
    if (isLegalBall) {
      balls += 1;
      if (balls >= 6) {
        completedOvers += 1;
        balls = 0;
      }
    }
    return `${completedOvers}.${balls}`;
  };

  const decrementOver = (currentOversStr: string): string => {
    let [completedOvers, balls] = currentOversStr.split('.').map((num) => parseInt(num, 10) || 0);
    if (balls > 0) {
      balls -= 1;
    } else if (completedOvers > 0) {
      completedOvers -= 1;
      balls = 5;
    }
    return `${completedOvers}.${balls}`;
  };

  const getLiveCricketTicker = (
    teamAName: string, teamBName: string,
    sA: number, sB: number,
    oversUsedStr: string, maxOversStr: string,
    battingTeam: 'A' | 'B'
  ) => {
    const totalMaxOvers = parseFloat(maxOversStr) || 20;
    const totalMaxBalls = totalMaxOvers * 6;

    const [compOvers, compBalls] = oversUsedStr.split('.').map(num => parseInt(num, 10) || 0);
    const ballsBowled = compOvers * 6 + compBalls;
    const ballsRemaining = Math.max(0, totalMaxBalls - ballsBowled);

    if (battingTeam === 'A') {
      return `🏏 1st Innings: ${teamAName} batting (${oversUsedStr}/${maxOversStr} ov)`;
    } else {
      const target = sA + 1;
      const runsNeeded = target - sB;

      if (runsNeeded > 0) {
        return `🎯 ${teamBName} need ${runsNeeded} run${runsNeeded > 1 ? 's' : ''} in ${ballsRemaining} ball${ballsRemaining > 1 ? 's' : ''} (${oversUsedStr}/${maxOversStr} ov)`;
      } else {
        return `⚡ Target reached by ${teamBName}! Ready to finalize.`;
      }
    }
  };

  const handleBallDeliveryAction = (actionType: 'SINGLE' | 'DOUBLE' | 'THREE' | 'FOUR' | 'SIX' | 'WIDE' | 'NO_BALL' | 'OUT' | 'CORRECTION' | 'INNING_BREAK') => {
    if (isUmpireDeskLocked) return;

    let currentRuns = parseInt(activeBattingTeam === 'A' ? liveScoreA : liveScoreB, 10) || 0;
    let currentWickets = parseInt(activeBattingTeam === 'A' ? liveWicketsA : liveWicketsB, 10) || 0;
    
    let ballLabel = '';
    let isLegalBall = true;

    if (actionType === 'INNING_BREAK') {
      isLegalBall = false;
      setActiveBattingTeam('B');
      setLiveOvers('0.0');
      setRecentBalls([]);

      const target = (parseInt(liveScoreA, 10) || 0) + 1;
      const totalMaxBalls = (parseFloat(maxMatchOvers) || 20) * 6;
      const ticker = `☕ Innings Break • Target: ${target} runs (${totalMaxBalls} balls)`;
      setLiveStatusText(ticker);

      if (selectedEvent) {
        updateCurrentLiveMatch(
          selectedEvent.id,
          liveTeamA.trim() || 'TEAM A',
          liveTeamB.trim() || 'TEAM B',
          liveScoreA,
          liveScoreB,
          ticker,
          liveWicketsA,
          liveWicketsB,
          '0.0',
          [],
          maxMatchOvers,
          teamABalls,
          teamBBalls,
          liveStage,
          'B'
        );
      }
      return;
    }

    switch (actionType) {
      case 'SINGLE': currentRuns += 1; ballLabel = '1'; break;
      case 'DOUBLE': currentRuns += 2; ballLabel = '2'; break;
      case 'THREE': currentRuns += 3; ballLabel = '3'; break;
      case 'FOUR': currentRuns += 4; ballLabel = '4'; break;
      case 'SIX': currentRuns += 6; ballLabel = '6'; break;
      case 'WIDE': currentRuns += 1; ballLabel = 'WD'; isLegalBall = false; break;
      case 'NO_BALL': currentRuns += 1; ballLabel = 'NB'; isLegalBall = false; break;
      case 'OUT': currentWickets = Math.min(10, currentWickets + 1); ballLabel = 'W'; break;
      case 'CORRECTION': currentRuns = Math.max(0, currentRuns - 1); isLegalBall = false; break;
    }

    const updatedOvers = calculateNextOver(liveOvers, isLegalBall);
    setLiveOvers(updatedOvers);

    const sA = activeBattingTeam === 'A' ? currentRuns : parseInt(liveScoreA, 10) || 0;
    const sB = activeBattingTeam === 'B' ? currentRuns : parseInt(liveScoreB, 10) || 0;
    const wA = activeBattingTeam === 'A' ? currentWickets : parseInt(liveWicketsA, 10) || 0;
    const wB = activeBattingTeam === 'B' ? currentWickets : parseInt(liveWicketsB, 10) || 0;

    if (activeBattingTeam === 'A') {
      setLiveScoreA(currentRuns.toString());
      setLiveWicketsA(currentWickets.toString());
    } else {
      setLiveScoreB(currentRuns.toString());
      setLiveWicketsB(currentWickets.toString());
    }

    let updatedRecentBalls = [...recentBalls];
    let updatedTeamABalls = [...teamABalls];
    let updatedTeamBBalls = [...teamBBalls];

    if (ballLabel) {
      updatedRecentBalls.push(ballLabel);
      if (updatedRecentBalls.length > 6) updatedRecentBalls.shift();
      setRecentBalls(updatedRecentBalls);

      if (activeBattingTeam === 'A') {
        updatedTeamABalls.push(ballLabel);
        setTeamABalls(updatedTeamABalls);
      } else {
        updatedTeamBBalls.push(ballLabel);
        setTeamBBalls(updatedTeamBBalls);
      }
    }

    const nextStatus = getLiveCricketTicker(
      liveTeamA || 'TEAM A',
      liveTeamB || 'TEAM B',
      sA, sB,
      updatedOvers,
      maxMatchOvers,
      activeBattingTeam
    );

    setLiveStatusText(nextStatus);
    
    if (selectedEvent) {
      updateCurrentLiveMatch(
        selectedEvent.id, 
        liveTeamA.trim() || 'TEAM A', 
        liveTeamB.trim() || 'TEAM B', 
        sA.toString(),
        sB.toString(),
        nextStatus, 
        wA.toString(),
        wB.toString(),
        updatedOvers,
        updatedRecentBalls,
        maxMatchOvers,
        updatedTeamABalls,
        updatedTeamBBalls,
        liveStage,
        activeBattingTeam
      );
    }
  };

  const handleUndoLastBall = () => {
    if (isUmpireDeskLocked) return;

    const currentList = activeBattingTeam === 'A' ? teamABalls : teamBBalls;
    if (currentList.length === 0) {
      Alert.alert('No Balls to Undo', 'No deliveries recorded for this innings.');
      return;
    }

    const updatedBalls = [...currentList];
    const lastBall = updatedBalls.pop();

    if (activeBattingTeam === 'A') {
      setTeamABalls(updatedBalls);
    } else {
      setTeamBBalls(updatedBalls);
    }

    const updatedRecentBalls = [...recentBalls];
    if (updatedRecentBalls.length > 0) {
      updatedRecentBalls.pop();
      setRecentBalls(updatedRecentBalls);
    }

    const wasLegalDelivery = lastBall !== 'WD' && lastBall !== 'NB';
    const updatedOvers = wasLegalDelivery ? decrementOver(liveOvers) : liveOvers;
    setLiveOvers(updatedOvers);

    let currentRuns = parseInt(activeBattingTeam === 'A' ? liveScoreA : liveScoreB, 10) || 0;
    let currentWickets = parseInt(activeBattingTeam === 'A' ? liveWicketsA : liveWicketsB, 10) || 0;

    if (lastBall === '1' || lastBall === 'WD' || lastBall === 'NB') currentRuns = Math.max(0, currentRuns - 1);
    if (lastBall === '2') currentRuns = Math.max(0, currentRuns - 2);
    if (lastBall === '3') currentRuns = Math.max(0, currentRuns - 3);
    if (lastBall === '4') currentRuns = Math.max(0, currentRuns - 4);
    if (lastBall === '6') currentRuns = Math.max(0, currentRuns - 6);
    if (lastBall === 'W') currentWickets = Math.max(0, currentWickets - 1);

    const newScoreA = activeBattingTeam === 'A' ? currentRuns.toString() : liveScoreA;
    const newScoreB = activeBattingTeam === 'B' ? currentRuns.toString() : liveScoreB;
    const newWicketsA = activeBattingTeam === 'A' ? currentWickets.toString() : liveWicketsA;
    const newWicketsB = activeBattingTeam === 'B' ? currentWickets.toString() : liveWicketsB;

    if (activeBattingTeam === 'A') {
      setLiveScoreA(newScoreA);
      setLiveWicketsA(newWicketsA);
    } else {
      setLiveScoreB(newScoreB);
      setLiveWicketsB(newWicketsB);
    }

    const nextStatus = getLiveCricketTicker(
      liveTeamA || 'TEAM A',
      liveTeamB || 'TEAM B',
      parseInt(newScoreA, 10),
      parseInt(newScoreB, 10),
      updatedOvers,
      maxMatchOvers,
      activeBattingTeam
    );

    setLiveStatusText(nextStatus);

    if (selectedEvent) {
      updateCurrentLiveMatch(
        selectedEvent.id,
        liveTeamA.trim() || 'TEAM A',
        liveTeamB.trim() || 'TEAM B',
        newScoreA,
        newScoreB,
        nextStatus,
        newWicketsA,
        newWicketsB,
        updatedOvers,
        updatedRecentBalls,
        maxMatchOvers,
        activeBattingTeam === 'A' ? updatedBalls : teamABalls,
        activeBattingTeam === 'B' ? updatedBalls : teamBBalls,
        liveStage,
        activeBattingTeam
      );
    }
  };

  const handleSportSpecificPoint = (points: number, actionLabel: string) => {
    if (isUmpireDeskLocked) return;

    let currentScore = parseInt(activeBattingTeam === 'A' ? liveScoreA : liveScoreB, 10) || 0;
    currentScore = Math.max(0, currentScore + points);

    const newScoreA = activeBattingTeam === 'A' ? currentScore.toString() : liveScoreA;
    const newScoreB = activeBattingTeam === 'B' ? currentScore.toString() : liveScoreB;

    if (activeBattingTeam === 'A') {
      setLiveScoreA(newScoreA);
    } else {
      setLiveScoreB(newScoreB);
    }

    const activeTeamName = activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B');
    const autoStatus = `${activeTeamName}: ${actionLabel} • Live (${newScoreA} - ${newScoreB})`;
    setLiveStatusText(autoStatus);

    if (selectedEvent) {
      updateCurrentLiveMatch(
        selectedEvent.id,
        liveTeamA.trim() || 'TEAM A',
        liveTeamB.trim() || 'TEAM B',
        newScoreA,
        newScoreB,
        autoStatus,
        '0',
        '0',
        '0.0',
        [],
        '20',
        [],
        [],
        liveStage,
        activeBattingTeam
      );
    }
  };

  const handleManualLiveBroadcast = () => {
    if (!selectedEvent || isUmpireDeskLocked) return;
    if (!liveTeamA.trim() || !liveTeamB.trim()) {
      Alert.alert('Missing Entry', 'Please enter names for both teams before broadcasting live!');
      return;
    }
    
    const initialStatus = selectedEvent.sportType === 'CRICKET'
      ? getLiveCricketTicker(
          liveTeamA.trim(), liveTeamB.trim(),
          parseInt(liveScoreA, 10) || 0,
          parseInt(liveScoreB, 10) || 0,
          liveOvers, maxMatchOvers, activeBattingTeam
        )
      : liveStatusText || `Live Match (${liveScoreA} - ${liveScoreB})`;

    setLiveStatusText(initialStatus);
    updateCurrentLiveMatch(
      selectedEvent.id, 
      liveTeamA.trim(), 
      liveTeamB.trim(), 
      liveScoreA, 
      liveScoreB, 
      initialStatus, 
      liveWicketsA, 
      liveWicketsB, 
      liveOvers, 
      recentBalls as any, 
      maxMatchOvers, 
      teamABalls as any, 
      teamBBalls as any,
      liveStage,
      activeBattingTeam
    );
    Alert.alert('Live Broadcasted!', 'Scoreboard stream synced to Home live feed.');
  };

  const handleSaveAndEndMatch = async () => {
    if (!selectedEvent) return;

    if (!liveTeamA.trim() && !liveTeamB.trim()) {
      Alert.alert('No Active Match', 'Please enter teams and record score before saving.');
      return;
    }

    const sA = parseInt(liveScoreA, 10) || 0;
    const sB = parseInt(liveScoreB, 10) || 0;
    const wB = parseInt(liveWicketsB, 10) || 0;

    const totalMaxBalls = (parseFloat(maxMatchOvers) || 20) * 6;
    const [compOvers, compBalls] = liveOvers.split('.').map(num => parseInt(num, 10) || 0);
    const ballsBowled = compOvers * 6 + compBalls;
    const ballsRemaining = Math.max(0, totalMaxBalls - ballsBowled);

    let finalVerdict = '';
    
    if (selectedEvent.sportType === 'CRICKET') {
      if (sB > sA) {
        const wicketsLeft = 10 - wB;
        finalVerdict = `🏆 ${liveTeamB || 'TEAM B'} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''} (${ballsRemaining} balls left)`;
      } else if (sA > sB) {
        const runDiff = sA - sB;
        finalVerdict = `🏆 ${liveTeamA || 'TEAM A'} won by ${runDiff} run${runDiff > 1 ? 's' : ''}`;
      } else {
        finalVerdict = `🤝 Match Tied (${sA} - ${sB})`;
      }
    } else {
      if (sA > sB) {
        finalVerdict = `🏆 ${liveTeamA || 'TEAM A'} won by ${sA - sB} point${(sA - sB) > 1 ? 's' : ''}`;
      } else if (sB > sA) {
        finalVerdict = `🏆 ${liveTeamB || 'TEAM B'} won by ${sB - sA} point${(sB - sA) > 1 ? 's' : ''}`;
      } else {
        finalVerdict = `🤝 Match Drawn (${sA} - ${sB})`;
      }
    }

    const allBalls = [...teamABalls, ...teamBBalls];

    await finalizeAndSaveMatch(
      selectedEvent.id,
      liveTeamA || 'TEAM A',
      liveTeamB || 'TEAM B',
      liveScoreA,
      liveScoreB,
      liveWicketsA,
      liveWicketsB,
      liveOvers,
      finalVerdict,
      maxMatchOvers,
      allBalls,
      teamABalls,
      teamBBalls,
      liveStage
    );

    setIsUmpireDeskLocked(true);

    setScheduleEvent((prev: any) => {
      if (!prev) return prev;
      const updatedMatches = (prev.matches || []).map((m: any) => {
        if ((m.teamAName === liveTeamA && m.teamBName === liveTeamB) || m.isLive) {
          return {
            ...m,
            scoreA: liveScoreA,
            scoreB: liveScoreB,
            wicketsA: liveWicketsA,
            wicketsB: liveWicketsB,
            overs: liveOvers,
            status: finalVerdict,
            stage: liveStage,
            isLive: false,
          };
        }
        return m;
      });
      return { ...prev, matches: updatedMatches };
    });

    Alert.alert('Match Completed & Saved', `${finalVerdict}\n\nUmpire desk is now LOCKED. Tap 'Unlock (Modify)' if changes are needed.`);
  };

  const handleLogoutConfirmation = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logoutUser() }
      ]
    );
  };

  const allMyFinishedMatches = myEvents.flatMap((event, eventIdx) =>
    (event.matches || [])
      .filter((m) => {
        return (
          m.isLive === false ||
          m.status === 'Match Completed' ||
          (typeof m.status === 'string' &&
            (m.status.includes('won by') || m.status.includes('Tied') || m.status.includes('Drawn')))
        );
      })
      .map((m: any, matchIdx: number) => ({
        id: m._id || m.id || `my-fin-${event.id || eventIdx}-${matchIdx}`,
        sport: event.sportCategory ? event.sportCategory.toUpperCase() : event.name.toUpperCase(),
        sportType: event.sportType,
        teamA: m.teamAName || 'TEAM A',
        teamB: m.teamBName || 'TEAM B',
        stage: m.stage || 'LEAGUE_1',
        scoreA: m.scoreA || '0',
        scoreB: m.scoreB || '0',
        wicketsA: m.wicketsA || '0',
        wicketsB: m.wicketsB || '0',
        overs: m.overs || '0.0',
        totalOvers: m.totalOvers || '20',
        status: m.status || 'Match Completed',
        isLive: false,
        isFinished: true,
        isVerified: event.isVerifiedOrganizer,
        recentBalls: m.recentBalls || m.ballHistory || [],
        ballHistory: m.ballHistory || m.recentBalls || [],
        inningsABalls: m.inningsABalls || m.ballHistory || [],
        inningsBBalls: m.inningsBBalls || [],
      }))
  );

  const uniqueFinishedMatches = Array.from(
    new Map(
      allMyFinishedMatches.map((m) => [
        `${m.teamA.toLowerCase()}_vs_${m.teamB.toLowerCase()}_${m.scoreA}_${m.scoreB}`,
        m,
      ])
    ).values()
  );

  const handleOpenBreakdown = (matchItem: any) => {
    setSelectedFinishedMatch(matchItem);
    setSelectedInningsTeam('A');
    setBreakdownModalVisible(true);
  };

  const chunkOvers = (balls: string[]) => {
    const overs: { overNumber: number; deliveries: string[]; runs: number; wickets: number }[] = [];
    if (!balls || balls.length === 0) return overs;

    for (let i = 0; i < balls.length; i += 6) {
      const deliveries = balls.slice(i, i + 6);
      let runs = 0;
      let wickets = 0;

      deliveries.forEach((b) => {
        if (b === 'W') wickets += 1;
        else if (b === 'WD' || b === 'NB') runs += 1;
        else runs += parseInt(b, 10) || 0;
      });

      overs.push({
        overNumber: Math.floor(i / 6) + 1,
        deliveries,
        runs,
        wickets,
      });
    }
    return overs;
  };

  const displayedBalls = selectedInningsTeam === 'A' 
    ? (selectedFinishedMatch?.inningsABalls || []) 
    : (selectedFinishedMatch?.inningsBBalls || []);

  const displayName = user?.fullName || 'Abhishek';
  const currentSportCategory = selectedEvent?.sportCategory || 'Others';

  const onDateChange = (event: DateTimePickerEvent, chosenDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && chosenDate) {
      setSelectedCalendarDate(chosenDate);
      const day = String(chosenDate.getDate()).padStart(2, '0');
      const month = String(chosenDate.getMonth() + 1).padStart(2, '0');
      const year = chosenDate.getFullYear();
      setDate(`${day}/${month}/${year}`);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });
    if (!result.canceled) {
      if (result.assets[0].base64) {
        setPoster(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setPoster(result.assets[0].uri);
      }
    }
  };

  const handleSportSelect = (sport: string) => {
    setSportsName(sport);
    setSportType(sport === 'Cricket' ? 'CRICKET' : 'OTHER');
  };

  const handleSubmit = async () => {
    if (!date || !location || !poster) {
      Alert.alert('Missing Details', 'Please pick a schedule date, enter venue location, and upload poster.');
      return;
    }

    const displayTournamentName = customEventTitle.trim() 
      ? customEventTitle.trim() 
      : `${sportsName} Tournament`;
    
    const wasCreated = await addEvent({ 
      name: displayTournamentName, 
      sportCategory: sportsName, 
      sportType, 
      date, 
      location, 
      poster,
      organizer: user?.id,
      organizerName: user?.fullName || 'Abhishek',
      organizerDetails: {
        id: user?.id,
        fullName: user?.fullName || 'Abhishek',
        email: user?.email,
        phone: user?.phone,
      }
    });
    
    if (wasCreated) {
      Alert.alert('Success', 'Official Tournament initialized and saved in MongoDB!');
      setSportsName('Kabaddi'); setSportType('OTHER'); setCustomEventTitle(''); setDate(''); setLocation(''); setPoster('');
      setModalVisible(false);
    } else {
      Alert.alert('Error', 'Unable to create tournament in database.');
    }
  };

  const allUnfinishedMatches = scheduleEvent?.matches?.filter((m: any) => 
    !m.status?.includes('won') && !m.status?.includes('Tied') && !m.status?.includes('Drawn')
  ) || [];

  const allFinishedMatches = scheduleEvent?.matches?.filter((m: any) => 
    m.status?.includes('won') || m.status?.includes('Tied') || m.status?.includes('Drawn') || m.status === 'Match Completed' || (m.isLive === false && !m.status?.includes('Scheduled'))
  ) || [];

  const getWinnersForPreviousStage = (currentStage: string) => {
    let prevStage = 'LEAGUE_1';
    if (currentStage === 'LEAGUE_2') prevStage = 'LEAGUE_1';
    else if (currentStage === 'LEAGUE_STAGE') prevStage = 'LEAGUE_2';
    else if (currentStage === 'SEMI_FINAL') prevStage = 'LEAGUE_STAGE';
    else if (currentStage === 'FINAL') prevStage = 'SEMI_FINAL';

    return allFinishedMatches
      .filter((m: any) => (m.stage || 'LEAGUE_1') === prevStage)
      .map((m: any) => {
        const statusStr = m.status || '';
        if (statusStr.includes('won by')) {
          const matchName = statusStr.match(/🏆\s+(.*?)\s+won by/);
          return matchName && matchName[1] ? matchName[1].trim() : null;
        }
        return null;
      })
      .filter(Boolean);
  };

  const getDynamicTeamsPool = () => {
    if (schedStage === 'LEAGUE_1') {
      const scheduledInL1 = new Set<string>();
      (scheduleEvent?.matches || []).forEach((m: any) => {
        if ((m.stage || 'LEAGUE_1') === 'LEAGUE_1') {
          if (m.teamAName) scheduledInL1.add(m.teamAName.trim().toLowerCase());
          if (m.teamBName) scheduledInL1.add(m.teamBName.trim().toLowerCase());
        }
      });

      return walkinRegistrations.map(reg => ({
        ...reg,
        scheduled: reg.scheduled || scheduledInL1.has(reg.name.trim().toLowerCase()),
      }));
    } else {
      const prevStageWinners = getWinnersForPreviousStage(schedStage);
      if (prevStageWinners.length === 0) {
        return [];
      }

      const scheduledInCurrent = new Set<string>();
      (scheduleEvent?.matches || []).forEach((m: any) => {
        if ((m.stage || 'LEAGUE_1') === schedStage) {
          if (m.teamAName) scheduledInCurrent.add(m.teamAName.trim().toLowerCase());
          if (m.teamBName) scheduledInCurrent.add(m.teamBName.trim().toLowerCase());
        }
      });

      return walkinRegistrations
        .filter(reg => prevStageWinners.includes(reg.name))
        .map(reg => ({
          ...reg,
          scheduled: scheduledInCurrent.has(reg.name.trim().toLowerCase()),
        }));
    }
  };

  const dynamicTeamsPool = getDynamicTeamsPool();

  const modalUpcomingMatches = selectedUpcomingStageFilter === 'ALL'
    ? allUnfinishedMatches
    : allUnfinishedMatches.filter((m: any) => {
        const itemStage = (m.stage || 'LEAGUE_1').toUpperCase();
        return itemStage === selectedUpcomingStageFilter.toUpperCase();
      });

  const modalFinishedMatches = selectedFinishedStageFilter === 'ALL'
    ? allFinishedMatches
    : allFinishedMatches.filter((m: any) => {
        const itemStage = (m.stage || 'LEAGUE_1').toUpperCase();
        return itemStage === selectedFinishedStageFilter.toUpperCase();
      });

  const eventPayloadString = `AKSPORTS_EVENT:${selectedEventForQr?.id || (selectedEventForQr as any)?._id || ''}`;
  const qrImageUri = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(eventPayloadString)}`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.logoutTopActionButton} activeOpacity={0.7} onPress={handleLogoutConfirmation}>
            <Ionicons name="log-out-outline" size={18} color="#000000" />
            <Text style={styles.logoutTopActionText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.avatarCircleFrame}>
            <Text style={styles.avatarInitialText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userBio}>{user?.email || 'email@domain.com'} • {user?.phone || '+91'}</Text>
        </View>

        <TouchableOpacity style={styles.scanUmpireQrHeaderBtn} activeOpacity={0.85} onPress={handleOpenScanner}>
          <Ionicons name="qr-code-outline" size={16} color="#059669" />
          <Text style={styles.scanUmpireQrHeaderBtnText}>Scan Umpire QR Access</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statBox, selectedProfileTab === 'tournaments' && styles.activeStatBox]} 
            activeOpacity={0.8}
            onPress={() => setSelectedProfileTab('tournaments')}
          >
            <Text style={[styles.statNumber, selectedProfileTab === 'tournaments' && styles.activeStatNumber]}>{myEvents.length}</Text>
            <Text style={[styles.statLabel, selectedProfileTab === 'tournaments' && styles.activeStatLabel]}>My Tournaments</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={[styles.statBox, selectedProfileTab === 'finished' && styles.activeStatBox]} 
            activeOpacity={0.8}
            onPress={() => setSelectedProfileTab('finished')}
          >
            <Text style={[styles.statNumber, selectedProfileTab === 'finished' && styles.activeStatNumber]}>
              {uniqueFinishedMatches.length}
            </Text>
            <Text style={[styles.statLabel, selectedProfileTab === 'finished' && styles.activeStatLabel]}>Finished Matches</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.hostCard} onPress={() => setModalVisible(true)}>
            <View style={styles.hostCardLeft}>
              <View style={styles.iconCircle}><Ionicons name="trophy-outline" size={22} color="#000000" /></View>
              <View>
                <Text style={styles.hostCardTitle}>Host New Tournament</Text>
                <Text style={styles.hostCardSub}>Set category, date, and venue details</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.feedTabHeader}>
          <View style={styles.activeTabIndicator}>
            <Ionicons name={selectedProfileTab === 'tournaments' ? "construct-outline" : "checkmark-circle-outline"} size={18} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.feedTabText}>
              {selectedProfileTab === 'tournaments' ? 'MY TOURNAMENTS & UMPIRE DESK' : 'COMPLETED MATCH SCORECARDS'}
            </Text>
          </View>
        </View>

        {selectedProfileTab === 'tournaments' ? (
          <View style={styles.tournamentsListContainer}>
            {myEvents.length === 0 ? (
              <View style={styles.emptyGridContainer}>
                <Ionicons name="pulse-outline" size={44} color="#000000" />
                <Text style={styles.emptyGridText}>No Tournaments Created Yet</Text>
                <Text style={styles.emptyGridSubtext}>Host a tournament above to begin live score updates.</Text>
              </View>
            ) : (
              myEvents.map((item: any) => {
                const isLive = item.isLive;
                const isCompleted = item.isCompleted;
                const matches = item.matches || [];
                const currentActiveFixture = activeTournamentMatches[item.id] || matches[0];

                return (
                  <View key={item.id} style={[styles.tourneyManageCard, isLive && styles.tourneyManageCardLive]}>
                    <View style={styles.tourneyCardTopRow}>
                      <Image source={{ uri: item.poster }} style={styles.tourneyCardPoster} />
                      <View style={styles.tourneyCardDetails}>
                        <View style={styles.tourneyBadgeRow}>
                          <Text style={styles.tourneyCategoryText}>{item.sportCategory}</Text>
                          {isLive && (
                            <View style={styles.liveStreamBadge}>
                              <View style={styles.pulseDotGreen} />
                              <Text style={styles.liveStreamBadgeText}>LIVE ON HOME</Text>
                            </View>
                          )}
                          {isCompleted && (
                            <View style={styles.completedBadgePill}>
                              <Text style={styles.completedBadgePillText}>FINISHED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.tourneyCardTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.tourneyCardSub}>{item.date} • {item.location}</Text>
                        <Text style={styles.matchesLoggedTag}>📋 {matches.length} Matches Scheduled</Text>
                      </View>
                    </View>

                    {currentActiveFixture && (
                      <View style={styles.organizerNextMatchCard}>
                        <View style={styles.nextMatchHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.nextMatchBadge}>ACTIVE / NEXT MATCH</Text>
                            <Text style={styles.nextMatchStage}>
                              {currentActiveFixture.stage ? currentActiveFixture.stage.replace('_', ' ') : 'LEAGUE MATCH'}
                            </Text>
                          </View>
                          {currentActiveFixture.matchTime ? (
                            <Text style={styles.fixtureTimeText}>⏰ {currentActiveFixture.matchTime}</Text>
                          ) : null}
                        </View>
                        
                        <Text style={styles.nextMatchTeamsText}>
                          {currentActiveFixture.teamAName} vs {currentActiveFixture.teamBName}
                        </Text>

                        <TouchableOpacity
                          style={[styles.startNextMatchQuickBtn, !isLive && { backgroundColor: '#E2E8F0' }]}
                          onPress={() => handleManageScores(item, currentActiveFixture)}
                        >
                          <Ionicons name="play" size={13} color={isLive ? "#FFFFFF" : "#64748B"} />
                          <Text style={[styles.startNextMatchQuickBtnText, !isLive && { color: '#64748B' }]}>
                            {isLive ? 'Start Scoring This Fixture' : 'Add to Live to Score'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.tourneyActionsButtonGroup}>
                      <TouchableOpacity
                        style={[styles.tourneyBtn, isLive ? styles.btnRemoveLive : styles.btnAddLive]}
                        onPress={() => handleToggleLive(item)}
                        disabled={loadingActionId === item.id}
                      >
                        {loadingActionId === item.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name={isLive ? "radio" : "flash"} size={13} color="#FFFFFF" />
                            <Text style={styles.tourneyBtnTextWhite}>{isLive ? 'Live' : 'Add to Live'}</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.tourneyBtn, styles.btnScheduleMatch]}
                        onPress={() => handleOpenScheduleModal(item)}
                      >
                        <Ionicons name="calendar" size={13} color="#059669" />
                        <Text style={[styles.tourneyBtnTextDark, { color: '#059669' }]}>Schedule</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.tourneyBtn, styles.btnQrCodeAccess]}
                        onPress={() => handleOpenQrCodeModal(item)}
                      >
                        <Ionicons name="qr-code" size={13} color="#0F172A" />
                        <Text style={styles.tourneyBtnTextDark}>QR Code</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.tourneyBtn, 
                          styles.btnScoreDesk,
                          !isLive && { opacity: 0.45, backgroundColor: '#F1F5F9' }
                        ]}
                        onPress={() => handleManageScores(item, currentActiveFixture)}
                        activeOpacity={isLive ? 0.7 : 1}
                      >
                        <Ionicons name="construct-outline" size={13} color={isLive ? "#0F172A" : "#94A3B8"} />
                        <Text style={[styles.tourneyBtnTextDark, !isLive && { color: '#94A3B8' }]}>
                          Desk
                        </Text>
                      </TouchableOpacity>

                      {!isCompleted && (
                        <TouchableOpacity
                          style={[styles.tourneyBtn, styles.btnCompleteEvent]}
                          onPress={() => handleCompleteTournament(item)}
                        >
                          <Ionicons name="checkmark-done" size={13} color="#0F172A" />
                          <Text style={styles.tourneyBtnTextDark}>End</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            {uniqueFinishedMatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconFrame}>
                  <Ionicons name="trophy-outline" size={36} color="#0F172A" />
                </View>
                <Text style={styles.emptyText}>No completed match records found for your tournaments.</Text>
              </View>
            ) : (
              uniqueFinishedMatches.map((item, index) => {
                const isCricket = item.sportType === 'CRICKET';
                return (
                  <TouchableOpacity
                    key={item.id || `finished-card-${index}`}
                    style={styles.matchCardVertical}
                    activeOpacity={0.88}
                    onPress={() => handleOpenBreakdown(item)}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.titleWithBadgeRow}>
                        <View style={styles.finishedSportLabelTagBg}>
                          <Text style={styles.finishedSportLabelTagText}>{item.sport}</Text>
                        </View>
                        {item.isVerified && <Ionicons name="shield-checkmark" size={16} color="#059669" />}
                      </View>

                      <View style={styles.finishedBadge}>
                        <View style={styles.finishedPulseDot} />
                        <Text style={styles.finishedStatusBadgeText}>FINISHED</Text>
                      </View>
                    </View>

                    <View style={styles.teamsScoreboardContainer}>
                      <View style={styles.teamRowItem}>
                        <Text style={styles.teamNameText} numberOfLines={1}>{item.teamA}</Text>
                        <View style={styles.scoreTextCluster}>
                          <Text style={styles.teamScoreValue}>{item.scoreA}</Text>
                          {isCricket && <Text style={styles.cricketWicketsValue}>/{item.wicketsA}</Text>}
                        </View>
                      </View>

                      <View style={styles.teamRowItem}>
                        <Text style={styles.teamNameText} numberOfLines={1}>{item.teamB}</Text>
                        <View style={styles.scoreTextCluster}>
                          <Text style={styles.teamScoreValue}>{item.scoreB}</Text>
                          {isCricket && <Text style={styles.cricketWicketsValue}>/{item.wicketsB}</Text>}
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardDividerLine} />

                    <View style={styles.cardFooterRowFinished}>
                      <Ionicons name="trophy" size={15} color="#0F172A" />
                      <Text style={styles.matchStatusFinishedText} numberOfLines={2}>
                        {item.status}
                      </Text>
                      {isCricket && <Text style={styles.tapToViewScorecardTag}>• View Overs ➔</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* 🪪 ORGANIZER EVENT QR CODE MODAL */}
      <Modal animationType="slide" transparent={true} visible={qrModalVisible} onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { alignItems: 'center', paddingVertical: 30 }]}>
            <View style={styles.dragIndicator} />
            <View style={[styles.modalHeaderRow, { width: '100%' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>{selectedEventForQr?.name}</Text>
                <Text style={styles.modalSheetSubtitle}>Umpire Desk Quick-Access QR</Text>
              </View>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeSheetIcon}>
                <Ionicons name="close" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeCardContainer}>
              <Image source={{ uri: qrImageUri }} style={{ width: 200, height: 200, resizeMode: 'contain' }} />
              <Text style={styles.qrPayloadCodeText} selectable={true}>
                {eventPayloadString}
              </Text>
            </View>

            <Text style={styles.qrInstructionSubtext}>
              Have your tournament umpire scan this true QR code image using their profile scanner to instantly open the live umpire score-updating desk.
            </Text>

            <TouchableOpacity 
              style={[styles.publishActionBtn, { backgroundColor: '#0F172A', marginTop: 10 }]} 
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={[styles.publishBtnText, { color: '#FFFFFF' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📷 UMPIRE CAMERA QR SCANNER MODAL */}
      <Modal animationType="slide" transparent={true} visible={scannerModalVisible} onRequestClose={() => setScannerModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scannedLock ? undefined : handleBarCodeScanned}
          >
            <View style={styles.scannerOverlayTopHeader}>
              <TouchableOpacity onPress={() => setScannerModalVisible(false)} style={styles.scannerCloseIconCircle}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.scannerHeaderTitle}>Scan Organizer QR Code</Text>
            </View>

            <View style={styles.scannerTargetFrameBox}>
              <View style={styles.scannerCornerTL} />
              <View style={styles.scannerCornerTR} />
              <View style={styles.scannerCornerBL} />
              <View style={styles.scannerCornerBR} />
            </View>
          </CameraView>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={scheduleModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.modalSheetFixed]}>
            <View style={styles.dragIndicator} />
            
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 0.85 }}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>{scheduleEvent?.name}</Text>
                <Text style={styles.modalSheetSubtitle}>Fixture Planner & Walk-in Registration</Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)} style={styles.closeSheetIcon}>
                <Ionicons name="close" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.segmentedTabBar}>
              <TouchableOpacity
                style={[styles.segmentedTabBtn, hubActiveTab === 'upcoming' && styles.segmentedTabBtnActive]}
                onPress={() => setHubActiveTab('upcoming')}
                activeOpacity={0.88}
              >
                <Ionicons name="calendar-outline" size={14} color={hubActiveTab === 'upcoming' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.segmentedTabText, hubActiveTab === 'upcoming' && styles.segmentedTabTextActive]}>
                  Upcoming ({allUnfinishedMatches.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentedTabBtn, hubActiveTab === 'add' && styles.segmentedTabBtnActive]}
                onPress={() => setHubActiveTab('add')}
                activeOpacity={0.88}
              >
                <Ionicons name="add-circle-outline" size={14} color={hubActiveTab === 'add' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.segmentedTabText, hubActiveTab === 'add' && styles.segmentedTabTextActive]}>
                  ➕ Register & Add
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentedTabBtn, hubActiveTab === 'finished' && styles.segmentedTabBtnActive]}
                onPress={() => setHubActiveTab('finished')}
                activeOpacity={0.88}
              >
                <Ionicons name="trophy-outline" size={14} color={hubActiveTab === 'finished' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.segmentedTabText, hubActiveTab === 'finished' && styles.segmentedTabTextActive]}>
                  Finished ({allFinishedMatches.length})
                </Text>
              </TouchableOpacity>
            </View>

            {hubActiveTab === 'upcoming' && (
              <View style={styles.stageFilterScrollWrapper}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.stageFilterContainer}
                >
                  {STAGE_FILTER_OPTIONS.map((stageItem) => {
                    const isSelected = selectedUpcomingStageFilter === stageItem.value;
                    return (
                      <TouchableOpacity
                        key={stageItem.value}
                        style={[styles.stageFilterChip, isSelected && styles.stageFilterChipActive]}
                        onPress={() => setSelectedUpcomingStageFilter(stageItem.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.stageFilterChipText, isSelected && styles.stageFilterChipTextActive]}>
                          {stageItem.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {hubActiveTab === 'finished' && (
              <View style={styles.stageFilterScrollWrapper}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.stageFilterContainer}
                >
                  {STAGE_FILTER_OPTIONS.map((stageItem) => {
                    const isSelected = selectedFinishedStageFilter === stageItem.value;
                    return (
                      <TouchableOpacity
                        key={stageItem.value}
                        style={[styles.stageFilterChip, isSelected && styles.stageFilterChipActive]}
                        onPress={() => setSelectedFinishedStageFilter(stageItem.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.stageFilterChipText, isSelected && styles.stageFilterChipTextActive]}>
                          {stageItem.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.tabContentFixedWrapper}>
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {hubActiveTab === 'upcoming' && (
                  <View>
                    {modalUpcomingMatches.length === 0 ? (
                      <View style={styles.emptyTabBlock}>
                        <Ionicons name="calendar-outline" size={38} color="#94A3B8" />
                        <Text style={styles.emptyTabTitle}>
                          {selectedUpcomingStageFilter === 'ALL' 
                            ? "No Upcoming Fixtures" 
                            : `No Matches in ${selectedUpcomingStageFilter.replace('_', ' ')}`}
                        </Text>
                        <Text style={styles.emptyTabSub}>
                          {selectedUpcomingStageFilter === 'ALL'
                            ? 'Tap "➕ Register & Add" above to schedule League 1, 2, or Finals.'
                            : 'Switch filter or add a match in this stage.'}
                        </Text>
                        <TouchableOpacity style={styles.emptyTabCtaBtn} onPress={() => setHubActiveTab('add')}>
                          <Text style={styles.emptyTabCtaBtnText}>+ Register Team & Schedule</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      modalUpcomingMatches.map((m: any, idx: number) => {
                        const isMatchLive = m.isLive === true;
                        const isSelectedAsNext = activeTournamentMatches[scheduleEvent?.id || '']?._id === m._id || activeTournamentMatches[scheduleEvent?.id || '']?.id === m.id;

                        return (
                          <View key={m._id || `hub-m-${idx}`} style={[styles.cleanFixtureCard, (isMatchLive || isSelectedAsNext) && styles.cleanFixtureCardActive]}>
                            <View style={styles.cleanFixtureTopRow}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.cleanStageBadge}>{m.stage ? m.stage.replace('_', ' ') : 'LEAGUE MATCH'}</Text>
                                {isSelectedAsNext && <Text style={styles.cleanSelectedPill}>READY ON DESK</Text>}
                                {isMatchLive && (
                                  <View style={styles.hubLivePill}>
                                    <View style={styles.pulseDotGreen} />
                                    <Text style={styles.hubLivePillText}>LIVE NOW</Text>
                                  </View>
                                )}
                              </View>
                              {m.matchTime ? <Text style={styles.cleanTimeText}>⏰ {m.matchTime}</Text> : null}
                            </View>

                            <Text style={styles.cleanFixtureTeams}>{m.teamAName} vs {m.teamBName}</Text>
                            <Text style={styles.cleanFixtureStatus}>📌 {m.status}</Text>

                            <TouchableOpacity
                              style={styles.setNextCleanBtn}
                              onPress={() => scheduleEvent && handleSetNextMatch(scheduleEvent, m)}
                            >
                              <Ionicons name="play-circle" size={16} color="#FFFFFF" />
                              <Text style={styles.setNextCleanBtnText}>
                                {isSelectedAsNext ? 'Active Fixture • Start Scoring' : 'Set as Next Match (Load into Desk)'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {hubActiveTab === 'add' && (
                  <View style={styles.cleanAddFormBox}>
                    <Text style={styles.cleanFormHeading}>PRE-SCHEDULE FIXTURE</Text>
                    
                    <Text style={styles.inputLabel}>Stage / Tournament Round</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsChipContainer}>
                      {STAGE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.sportChip, schedStage === opt.value && styles.sportChipActive]}
                          onPress={() => {
                            setSchedStage(opt.value);
                            setSelectedTeamA(null);
                            setSelectedTeamB(null);
                          }}
                        >
                          <Text style={[styles.sportChipText, schedStage === opt.value && styles.sportChipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* ⚔️ SELECTED TEAMS PAIRING DISPLAYER */}
                    <View style={styles.pairingPreviewBox}>
                      <Text style={styles.pairingPreviewTitle}>SELECTED MATCH CONTENDERS:</Text>
                      <View style={styles.pairingTeamsRow}>
                        <View style={[styles.pairingTeamPill, selectedTeamA ? styles.pairingPillActive : {}]}>
                          <Text style={[styles.pairingPillText, selectedTeamA ? styles.pairingPillTextActive : {}]} numberOfLines={1}>
                            {selectedTeamA || 'Select Team A Below'}
                          </Text>
                        </View>
                        <Text style={styles.pairingVsText}>VS</Text>
                        <View style={[styles.pairingTeamPill, selectedTeamB ? styles.pairingPillActive : {}]}>
                          <Text style={[styles.pairingPillText, selectedTeamB ? styles.pairingPillTextActive : {}]} numberOfLines={1}>
                            {selectedTeamB || 'Select Team B Below'}
                          </Text>
                        </View>
                      </View>

                      {selectedTeamA && selectedTeamB && (
                        <TouchableOpacity
                          style={styles.schedulePairedMatchBtn}
                          onPress={handleScheduleSelectedPair}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.schedulePairedMatchBtnText}>Schedule This Match</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Date</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.sheetInput}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#888888"
                            value={schedDate}
                            onChangeText={setSchedDate}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Time</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.sheetInput}
                            placeholder="e.g., 04:30 PM"
                            placeholderTextColor="#888888"
                            value={schedTime}
                            onChangeText={setSchedTime}
                          />
                        </View>
                      </View>
                    </View>

                    {scheduleEvent?.sportType === 'CRICKET' && (
                      <View>
                        <Text style={styles.inputLabel}>Overs Limit</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.sheetInput}
                            keyboardType="numeric"
                            placeholder="20"
                            placeholderTextColor="#888888"
                            value={schedOvers}
                            onChangeText={setSchedOvers}
                          />
                        </View>
                      </View>
                    )}

                    {schedStage !== 'LEAGUE_1' && (
                      <View style={styles.advancingNoticeBox}>
                        <Ionicons name="information-circle" size={16} color="#059669" />
                        <Text style={styles.advancingNoticeText}>
                          {schedStage.replace('_', ' ')} active: Only winners from the previous completed stage are unlocked for selection.
                        </Text>
                      </View>
                    )}

                    {/* 💰 WALK-IN TEAM ENTRY FEE TRACKER & POOL SELECTOR */}
                    <View style={styles.walkinNoteBoxContainer}>
                      <Text style={[styles.cleanFormHeading, { marginTop: 14 }]}>
                        💰 {schedStage === 'LEAGUE_1' ? 'WALK-IN REGISTRATION POOL' : `${schedStage.replace('_', ' ')} ADVANCING POOL`}
                      </Text>
                      
                      {schedStage === 'LEAGUE_1' && (
                        <>
                          <Text style={styles.inputLabel}>Walk-up Team Name</Text>
                          <View style={styles.inputWrapper}>
                            <Ionicons name="person-add-outline" size={18} color="#000000" style={styles.inputIcon} />
                            <TextInput
                              style={styles.sheetInput}
                              placeholder="e.g., Royal Strikers CC"
                              placeholderTextColor="#888888"
                              value={walkinTeamName}
                              onChangeText={setWalkinTeamName}
                            />
                          </View>

                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Total Entry Fee (₹)</Text>
                              <View style={styles.inputWrapper}>
                                <Ionicons name="cash-outline" size={18} color="#000000" style={styles.inputIcon} />
                                <TextInput
                                  style={styles.sheetInput}
                                  keyboardType="numeric"
                                  placeholder="e.g., 500"
                                  placeholderTextColor="#888888"
                                  value={walkinTotalFee}
                                  onChangeText={setWalkinTotalFee}
                                />
                              </View>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>Paid Amount (₹)</Text>
                              <View style={styles.inputWrapper}>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#000000" style={styles.inputIcon} />
                                <TextInput
                                  style={styles.sheetInput}
                                  keyboardType="numeric"
                                  placeholder="e.g., 500"
                                  placeholderTextColor="#888888"
                                  value={walkinPaidFee}
                                  onChangeText={setWalkinPaidFee}
                                />
                              </View>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[styles.publishActionBtn, { backgroundColor: '#0F172A', marginTop: 2, height: 44, marginBottom: 12 }]}
                            onPress={handleSaveWalkinRegistration}
                          >
                            <Text style={[styles.publishBtnText, { color: '#FFFFFF', fontSize: 13 }]}>Register Walk-in Team</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {dynamicTeamsPool.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', textAlign: 'center' }}>
                            {schedStage !== 'LEAGUE_1'
                              ? `No winners declared for the previous stage yet. Complete matches in the previous stage to unlock winning teams here!`
                              : 'No teams registered in the pool yet.'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ gap: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#64748B' }}>UNLOCKED TEAMS (TAP TO SELECT FOR MATCH):</Text>
                          {dynamicTeamsPool.map((reg) => {
                            const pending = reg.total - reg.paid;
                            const isFullyPaid = pending <= 0;
                            const isSelectedA = selectedTeamA === reg.name;
                            const isSelectedB = selectedTeamB === reg.name;

                            return (
                              <TouchableOpacity 
                                key={reg.id} 
                                style={[
                                  styles.walkinNoteItemRow, 
                                  reg.scheduled && styles.walkinItemRowScheduled,
                                  (isSelectedA || isSelectedB) && styles.walkinItemRowSelected
                                ]}
                                activeOpacity={reg.scheduled ? 1 : 0.8}
                                onPress={() => handleTeamSelection(reg)}
                              >
                                <Ionicons 
                                  name={reg.scheduled ? "lock-closed" : (isSelectedA ? "radio-button-on" : isSelectedB ? "radio-button-on" : "shield-outline")} 
                                  size={16} 
                                  color={reg.scheduled ? "#94A3B8" : ((isSelectedA || isSelectedB) ? "#059669" : (isFullyPaid ? "#059669" : "#D97706"))} 
                                />
                                <Text style={[styles.walkinNoteTextItem, reg.scheduled && { color: '#94A3B8', textDecorationLine: 'line-through' }]} numberOfLines={1}>
                                  {reg.name} {reg.scheduled ? '(Scheduled / Locked)' : (isSelectedA || isSelectedB ? `(${isSelectedA ? 'Team A' : 'Team B'})` : '')}
                                </Text>
                                <View style={[styles.feePillTag, { backgroundColor: reg.scheduled ? '#F1F5F9' : (isFullyPaid ? '#ECFDF5' : '#FEF3C7') }]}>
                                  <Text style={[styles.feePillTagText, { color: reg.scheduled ? '#64748B' : (isFullyPaid ? '#059669' : '#B45309') }]}>
                                    {reg.scheduled ? 'SCHEDULED' : (isFullyPaid ? 'PAID' : `Pending: ₹${pending}`)}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {hubActiveTab === 'finished' && (
                  <View>
                    {modalFinishedMatches.length === 0 ? (
                      <View style={styles.emptyTabBlock}>
                        <Ionicons name="trophy-outline" size={38} color="#94A3B8" />
                        <Text style={styles.emptyTabTitle}>
                          {selectedFinishedStageFilter === 'ALL'
                            ? 'No Matches Finished Yet'
                            : `No Finished Matches in ${selectedFinishedStageFilter.replace('_', ' ')}`}
                        </Text>
                        <Text style={styles.emptyTabSub}>Completed match results in this stage will appear here.</Text>
                      </View>
                    ) : (
                      modalFinishedMatches.map((m: any, idx: number) => (
                        <View key={m._id || `fin-m-${idx}`} style={styles.cleanFinishedCard}>
                          <View style={styles.cleanFixtureTopRow}>
                            <Text style={styles.cleanStageBadge}>{m.stage ? m.stage.replace('_', ' ') : 'MATCH'}</Text>
                            <Text style={styles.hubFinishedTag}>FINISHED</Text>
                          </View>

                          <View style={styles.hubTeamsScoreRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.hubTeamName}>{m.teamAName}</Text>
                              <Text style={styles.hubTeamName}>{m.teamBName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.hubScoreText}>{m.scoreA}{scheduleEvent?.sportType === 'CRICKET' ? `/${m.wicketsA || '0'}` : ''}</Text>
                              <Text style={styles.hubScoreText}>{m.scoreB}{scheduleEvent?.sportType === 'CRICKET' ? `/${m.wicketsB || '0'}` : ''}</Text>
                            </View>
                          </View>

                          <Text style={styles.finishedVerdictSummaryText}>🏆 {m.status}</Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Host Tournament</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeSheetIcon}><Ionicons name="close" size={22} color="#000000" /></TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Sports Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsChipContainer}>
                {AVAILABLE_SPORTS.map((sport) => {
                  const isSelected = sportsName === sport;
                  return (
                    <TouchableOpacity key={sport} style={[styles.sportChip, isSelected && styles.sportChipActive]} onPress={() => handleSportSelect(sport)}>
                      <Text style={[styles.sportChipText, isSelected && styles.sportChipTextActive]}>{sport}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Custom Tournament Title (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="create-outline" size={20} color="#000000" style={styles.inputIcon} />
                <TextInput style={styles.sheetInput} placeholder="e.g., Summer Premier League" placeholderTextColor="#888888" value={customEventTitle} onChangeText={setCustomEventTitle} />
              </View>

              <Text style={styles.inputLabel}>Schedule Date</Text>
              <TouchableOpacity 
                style={styles.inputWrapper} 
                activeOpacity={0.8}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#000000" style={styles.inputIcon} />
                <Text style={[styles.sheetInput, { lineHeight: 46 }, !date && { color: '#888888' }]}>
                  {date || 'Tap to select tournament date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedCalendarDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
              
              <Text style={styles.inputLabel}>Venue / Location</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#000000" style={styles.inputIcon} />
                <TextInput style={styles.sheetInput} placeholder="e.g., Kanteerava Stadium" placeholderTextColor="#888888" value={location} onChangeText={setLocation} />
              </View>
              
              {poster ? (
                <View style={styles.previewContainer}><Image source={{ uri: poster }} style={styles.premiumPreviewImage} /></View>
              ) : (
                <TouchableOpacity style={styles.dashedUploadBox} onPress={pickImage}>
                  <Ionicons name="cloud-upload-outline" size={28} color="#000000" />
                  <Text style={styles.uploadBoxTitle}>Select Full A4 Poster File</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.publishActionBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#000000', marginTop: 10 }]} onPress={handleSubmit}>
                <Text style={styles.publishBtnText}>Create Tournament Post</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: UMPIRE DESK WITH SAFE BACK / X CLOSE (NO AUTO-RESET) */}
      <Modal animationType="slide" transparent={true} visible={scoreModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeaderRow}>
              
              {/* BACK BUTTON & TITLE CLUSTER */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 0.75 }}>
                <TouchableOpacity 
                  onPress={() => setScoreModalVisible(false)} 
                  style={styles.backButtonIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color="#000000" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSheetTitle} numberOfLines={1}>{currentSportCategory.toUpperCase()} UMPIRE DESK</Text>
                  <Text style={styles.modalSheetSubtitle} numberOfLines={1}>{selectedEvent?.name}</Text>
                </View>
              </View>

              {/* LOCK / UNLOCK MODIFY HEADER TOGGLE OR SAFE CLOSE */}
              {isUmpireDeskLocked ? (
                <TouchableOpacity onPress={handleToggleUnlockDesk} style={styles.unlockHeaderBtn}>
                  <Ionicons name="lock-closed" size={14} color="#E11D48" />
                  <Text style={styles.unlockHeaderText}>Locked (Modify)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setScoreModalVisible(false)} style={styles.closeSheetIcon}>
                  <Ionicons name="close" size={20} color="#000000" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchHeadingText} numberOfLines={1}>📍 {selectedEvent?.name}</Text>

              {isUmpireDeskLocked && (
                <View style={styles.lockedWarningBanner}>
                  <Ionicons name="lock-closed" size={16} color="#E11D48" />
                  <Text style={styles.lockedWarningText}>Desk is locked after finalization. Tap 'Locked (Modify)' above to make changes.</Text>
                </View>
              )}

              {liveStatusText ? (
                <View style={styles.equationPromptBanner}>
                  <Ionicons name="information-circle" size={18} color="#2563EB" />
                  <Text style={styles.equationPromptText}>{liveStatusText}</Text>
                </View>
              ) : null}

              <View pointerEvents={isUmpireDeskLocked ? 'none' : 'auto'} style={isUmpireDeskLocked ? { opacity: 0.6 } : {}}>
                {selectedEvent?.sportType === 'CRICKET' && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.inputLabel}>Match Overs Limit</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="time-outline" size={18} color="#000000" style={styles.inputIcon} />
                      <TextInput 
                        style={styles.sheetInput} 
                        keyboardType="numeric" 
                        placeholder="e.g., 20 or 10" 
                        placeholderTextColor="#888888" 
                        value={maxMatchOvers} 
                        onChangeText={setMaxMatchOvers} 
                      />
                    </View>
                  </View>
                )}

                <View style={styles.scoreRowContainer}>
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.scoreControlCard, activeBattingTeam === 'A' && styles.battingTeamStrikeActive]}
                    onPress={() => setActiveBattingTeam('A')}
                  >
                    <TextInput style={styles.teamNameEditInput} value={liveTeamA} onChangeText={setLiveTeamA} placeholder="TEAM A" placeholderTextColor="#888888" />
                    <View style={styles.numericInputInlineRow}>
                      <Text style={styles.liveDashboardDisplayScoreNumber}>{liveScoreA}</Text>
                      {selectedEvent?.sportType === 'CRICKET' && (
                        <>
                          <Text style={styles.slashSeparator}>/</Text>
                          <Text style={[styles.liveDashboardDisplayScoreNumber, { color: '#000000' }]}>{liveWicketsA}</Text>
                        </>
                      )}
                    </View>
                    {activeBattingTeam === 'A' && (
                      <View style={styles.battingDotIndicatorBadge}>
                        <Text style={styles.battingDotIndicatorBadgeText}>
                          {selectedEvent?.sportType === 'CRICKET' ? '1ST INNINGS (ON STRIKE)' : 'ACTIVE SCORING TEAM'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.scoreControlCard, activeBattingTeam === 'B' && styles.battingTeamStrikeActive]}
                    onPress={() => setActiveBattingTeam('B')}
                  >
                    <TextInput style={styles.teamNameEditInput} value={liveTeamB} onChangeText={setLiveTeamB} placeholder="TEAM B" placeholderTextColor="#888888" />
                    <View style={styles.numericInputInlineRow}>
                      <Text style={styles.liveDashboardDisplayScoreNumber}>{liveScoreB}</Text>
                      {selectedEvent?.sportType === 'CRICKET' && (
                        <>
                          <Text style={styles.slashSeparator}>/</Text>
                          <Text style={[styles.liveDashboardDisplayScoreNumber, { color: '#000000' }]}>{liveWicketsB}</Text>
                        </>
                      )}
                    </View>
                    {activeBattingTeam === 'B' && (
                      <View style={styles.battingDotIndicatorBadge}>
                        <Text style={styles.battingDotIndicatorBadgeText}>
                          {selectedEvent?.sportType === 'CRICKET' ? '2ND INNINGS (CHASING)' : 'ACTIVE SCORING TEAM'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {selectedEvent?.sportType === 'CRICKET' ? (
                  <View style={styles.cricbuzzDashboardWrapper}>
                    <Text style={styles.sectionHeaderInnerLabelTitle}>Cricbuzz Rapid Score Input</Text>
                    <Text style={styles.strikeInstructionHelperSubtext}>
                      Overs Bowled: <Text style={{ fontWeight: '900' }}>{liveOvers} / {maxMatchOvers}</Text>
                    </Text>

                    {recentBalls.length > 0 && (
                      <View style={styles.ballsContainerRow}>
                        <Text style={styles.thisOverLabel}>THIS OVER:</Text>
                        {recentBalls.map((ball, idx) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.ballCircle, 
                              ball === '4' ? styles.ballFour : ball === '6' ? styles.ballSix : ball === 'W' ? styles.ballWicket : (ball === 'WD' || ball === 'NB') ? styles.ballExtra : styles.ballNormal
                            ]}
                          >
                            <Text style={[styles.ballText, (ball === '4' || ball === '6' || ball === 'W' || ball === 'WD' || ball === 'NB') && styles.ballTextWhite]}>
                              {ball}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.cricbuzzButtonMatrixRowGrid}>
                      <TouchableOpacity style={styles.cricbuzzBtn} onPress={() => handleBallDeliveryAction('SINGLE')}>
                        <Text style={styles.cricbuzzBtnVal}>+1</Text>
                        <Text style={styles.cricbuzzBtnLbl}>Single</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cricbuzzBtn} onPress={() => handleBallDeliveryAction('DOUBLE')}>
                        <Text style={styles.cricbuzzBtnVal}>+2</Text>
                        <Text style={styles.cricbuzzBtnLbl}>Double</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cricbuzzBtn} onPress={() => handleBallDeliveryAction('THREE')}>
                        <Text style={styles.cricbuzzBtnVal}>+3</Text>
                        <Text style={styles.cricbuzzBtnLbl}>Triple</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cricbuzzBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => handleBallDeliveryAction('FOUR')}>
                        <Text style={[styles.cricbuzzBtnVal, { color: '#000000' }]}>4</Text>
                        <Text style={[styles.cricbuzzBtnLbl, { color: '#000000' }]}>Boundary</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cricbuzzBtn, { backgroundColor: '#E2E8F0' }]} onPress={() => handleBallDeliveryAction('SIX')}>
                        <Text style={[styles.cricbuzzBtnVal, { color: '#000000' }]}>6</Text>
                        <Text style={[styles.cricbuzzBtnLbl, { color: '#000000' }]}>Maximum</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cricbuzzButtonMatrixRowGrid}>
                      <TouchableOpacity style={[styles.cricbuzzWideActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]} onPress={() => handleBallDeliveryAction('WIDE')}>
                        <Ionicons name="swap-horizontal" size={15} color="#15803D" />
                        <Text style={[styles.wideBtnText, { color: '#15803D' }]}>WIDE (WD +1)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cricbuzzWideActionBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]} onPress={() => handleBallDeliveryAction('NO_BALL')}>
                        <Ionicons name="alert-circle-outline" size={15} color="#B45309" />
                        <Text style={[styles.wideBtnText, { color: '#B45309' }]}>NO BALL (NB +1)</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cricbuzzButtonMatrixRowGrid}>
                      <TouchableOpacity style={[styles.cricbuzzWideActionBtn, { backgroundColor: '#FFFFFF', borderColor: '#000000' }]} onPress={() => handleBallDeliveryAction('INNING_BREAK')}>
                        <Ionicons name="cafe-outline" size={15} color="#000000" />
                        <Text style={[styles.wideBtnText, { color: '#000000' }]}>INNINGS BREAK</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cricbuzzWideActionBtn, { backgroundColor: '#000000', borderColor: '#000000' }]} onPress={() => handleBallDeliveryAction('OUT')}>
                        <Ionicons name="skull-outline" size={15} color="#FFFFFF" />
                        <Text style={[styles.wideBtnText, { color: '#FFFFFF' }]}>WICKET</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cricbuzzWideActionBtn, { backgroundColor: '#E2E8F0', borderColor: '#000000' }]} onPress={handleUndoLastBall}>
                        <Ionicons name="arrow-undo-outline" size={15} color="#000000" />
                        <Text style={[styles.wideBtnText, { color: '#000000' }]}>UNDO BALL</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : currentSportCategory === 'Kabaddi' ? (
                  <View style={styles.sportDeskWrapper}>
                    <Text style={styles.sectionHeaderInnerLabelTitle}>PRO KABADDI RAID & TACKLE CONSOLE</Text>
                    <Text style={styles.strikeInstructionHelperSubtext}>
                      Scoring For: <Text style={{ fontWeight: '900' }}>{activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B')}</Text>
                    </Text>

                    <Text style={styles.deskSubCategoryLabel}>⚡ RAID SCORING</Text>
                    <View style={styles.sportGridRow}>
                      <TouchableOpacity style={styles.sportScoreBtn} onPress={() => handleSportSpecificPoint(1, 'Touch Point (+1)')}>
                        <Text style={styles.sportScoreBtnVal}>+1</Text>
                        <Text style={styles.sportScoreBtnLbl}>Touch Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => handleSportSpecificPoint(1, 'Bonus Point (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#059669' }]}>+1</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#059669' }]}>Bonus Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} onPress={() => handleSportSpecificPoint(3, 'Super Raid (+3)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#2563EB' }]}>+3</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#2563EB' }]}>Super Raid</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.deskSubCategoryLabel}>🛡️ DEFENSE & ALL-OUT</Text>
                    <View style={styles.sportGridRow}>
                      <TouchableOpacity style={styles.sportScoreBtn} onPress={() => handleSportSpecificPoint(1, 'Tackle Point (+1)')}>
                        <Text style={styles.sportScoreBtnVal}>+1</Text>
                        <Text style={styles.sportScoreBtnLbl}>Tackle Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]} onPress={() => handleSportSpecificPoint(2, 'Super Tackle (+2)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#D97706' }]}>+2</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#D97706' }]}>Super Tackle</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#0F172A', borderColor: '#0F172A' }]} onPress={() => handleSportSpecificPoint(2, 'All Out (+2)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#FFFFFF' }]}>+2</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#FFFFFF' }]}>All-Out</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sportActionRow}>
                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(1, 'Technical Point (+1)')}>
                        <Ionicons name="flag-outline" size={15} color="#0F172A" />
                        <Text style={styles.secondaryDeskBtnText}>Technical (+1)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(-1, 'Point Correction (-1)')}>
                        <Ionicons name="arrow-undo-outline" size={15} color="#E11D48" />
                        <Text style={[styles.secondaryDeskBtnText, { color: '#E11D48' }]}>-1 Correction</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : currentSportCategory === 'Volleyball' ? (
                  <View style={styles.sportDeskWrapper}>
                    <Text style={styles.sectionHeaderInnerLabelTitle}>VOLLEYBALL RALLY POINT DESK</Text>
                    <Text style={styles.strikeInstructionHelperSubtext}>
                      Scoring For: <Text style={{ fontWeight: '900' }}>{activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B')}</Text>
                    </Text>

                    <View style={styles.sportGridRow}>
                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#0F172A', borderColor: '#0F172A' }]} onPress={() => handleSportSpecificPoint(1, 'Rally Point Won (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#FFFFFF' }]}>+1</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#FFFFFF' }]}>Rally Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => handleSportSpecificPoint(1, 'Ace Serve (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#059669' }]}>ACE</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#059669' }]}>Ace Serve (+1)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} onPress={() => handleSportSpecificPoint(1, 'Block Point (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#2563EB' }]}>BLK</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#2563EB' }]}>Block (+1)</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sportActionRow}>
                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(1, 'Opponent Error (+1)')}>
                        <Ionicons name="alert-circle-outline" size={15} color="#0F172A" />
                        <Text style={styles.secondaryDeskBtnText}>Opp Error (+1)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(-1, 'Correction (-1)')}>
                        <Ionicons name="arrow-undo-outline" size={15} color="#E11D48" />
                        <Text style={[styles.secondaryDeskBtnText, { color: '#E11D48' }]}>-1 Correction</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : currentSportCategory === 'Badminton' || currentSportCategory === 'Shuttle' ? (
                  <View style={styles.sportDeskWrapper}>
                    <Text style={styles.sectionHeaderInnerLabelTitle}>21-POINT RALLY BADMINTON CONSOLE</Text>
                    <Text style={styles.strikeInstructionHelperSubtext}>
                      Scoring For: <Text style={{ fontWeight: '900' }}>{activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B')}</Text>
                    </Text>

                    <View style={styles.sportGridRow}>
                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#0F172A', borderColor: '#0F172A' }]} onPress={() => handleSportSpecificPoint(1, 'Rally Point (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#FFFFFF' }]}>+1</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#FFFFFF' }]}>Rally Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => handleSportSpecificPoint(1, 'Smash / Winner (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#059669' }]}>SMASH</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#059669' }]}>Winner (+1)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} onPress={() => handleSportSpecificPoint(1, 'Opponent Error (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#2563EB' }]}>ERR</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#2563EB' }]}>Opp Error (+1)</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sportActionRow}>
                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => {
                        const activeTeamName = activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B');
                        setLiveStatusText(`🏸 Game / Set Won by ${activeTeamName}!`);
                      }}>
                        <Ionicons name="trophy-outline" size={15} color="#059669" />
                        <Text style={[styles.secondaryDeskBtnText, { color: '#059669' }]}>Set / Game Won</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(-1, 'Correction (-1)')}>
                        <Ionicons name="arrow-undo-outline" size={15} color="#E11D48" />
                        <Text style={[styles.secondaryDeskBtnText, { color: '#E11D48' }]}>-1 Correction</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.sportDeskWrapper}>
                    <Text style={styles.sectionHeaderInnerLabelTitle}>STANDARD TOURNAMENT SCORE MODIFIERS</Text>
                    <Text style={styles.strikeInstructionHelperSubtext}>
                      Scoring For: <Text style={{ fontWeight: '900' }}>{activeBattingTeam === 'A' ? (liveTeamA || 'TEAM A') : (liveTeamB || 'TEAM B')}</Text>
                    </Text>

                    <View style={styles.sportGridRow}>
                      <TouchableOpacity style={styles.sportScoreBtn} onPress={() => handleSportSpecificPoint(1, '+1 Point Scored')}>
                        <Text style={styles.sportScoreBtnVal}>+1</Text>
                        <Text style={styles.sportScoreBtnLbl}>Point</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.sportScoreBtn} onPress={() => handleSportSpecificPoint(2, '+2 Points Scored')}>
                        <Text style={styles.sportScoreBtnVal}>+2</Text>
                        <Text style={styles.sportScoreBtnLbl}>Points</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.sportScoreBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]} onPress={() => handleSportSpecificPoint(1, 'Goal Scored (+1)')}>
                        <Text style={[styles.sportScoreBtnVal, { color: '#059669' }]}>GOAL</Text>
                        <Text style={[styles.sportScoreBtnLbl, { color: '#059669' }]}>Goal (+1)</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sportActionRow}>
                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(3, '+3 Points Scored')}>
                        <Ionicons name="add-circle-outline" size={15} color="#0F172A" />
                        <Text style={styles.secondaryDeskBtnText}>+3 Points</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryDeskBtn} onPress={() => handleSportSpecificPoint(-1, 'Correction (-1)')}>
                        <Ionicons name="arrow-undo-outline" size={15} color="#E11D48" />
                        <Text style={[styles.secondaryDeskBtnText, { color: '#E11D48' }]}>-1 Correction</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity style={[styles.publishActionBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#000000', marginBottom: 12 }]} onPress={handleManualLiveBroadcast}>
                <Text style={styles.publishBtnText}>Sync Broadcast to Live Center</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.publishActionBtn, { backgroundColor: '#000000' }]} onPress={handleSaveAndEndMatch}>
                <Text style={[styles.publishBtnText, { color: '#FFFFFF' }]}>Finalize & Save Finished Result</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={breakdownModalVisible}
        onRequestClose={() => setBreakdownModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 0.85 }}>
                <Text style={styles.modalSheetTitle}>Over-by-Over Scorecard</Text>
                <Text style={styles.modalSheetSubtitle}>Select a team below to view deliveries</Text>
              </View>
              <TouchableOpacity onPress={() => setBreakdownModalVisible(false)} style={styles.closeSheetIcon}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.breakdownScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalVerdictBanner}>
                <Ionicons name="trophy" size={18} color="#059669" />
                <Text style={styles.modalVerdictText}>{selectedFinishedMatch?.status}</Text>
              </View>

              <View style={styles.teamToggleRow}>
                <TouchableOpacity
                  style={[styles.teamSelectTab, selectedInningsTeam === 'A' && styles.teamSelectTabActive]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedInningsTeam('A')}
                >
                  <Text style={[styles.teamSelectTabText, selectedInningsTeam === 'A' && styles.teamSelectTabTextActive]} numberOfLines={1}>
                    {selectedFinishedMatch?.teamA} (1st Inn)
                  </Text>
                  <Text style={[styles.teamSelectScore, selectedInningsTeam === 'A' && styles.teamSelectScoreActive]}>
                    {selectedFinishedMatch?.scoreA}/{selectedFinishedMatch?.wicketsA || '0'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.teamSelectTab, selectedInningsTeam === 'B' && styles.teamSelectTabActive]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedInningsTeam('B')}
                >
                  <Text style={[styles.teamSelectTabText, selectedInningsTeam === 'B' && styles.teamSelectTabTextActive]} numberOfLines={1}>
                    {selectedFinishedMatch?.teamB} (2nd Inn)
                  </Text>
                  <Text style={[styles.teamSelectScore, selectedInningsTeam === 'B' && styles.teamSelectScoreActive]}>
                    {selectedFinishedMatch?.scoreB}/{selectedFinishedMatch?.wicketsB || '0'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.oversSectionTitle}>
                {selectedInningsTeam === 'A' ? selectedFinishedMatch?.teamA : selectedFinishedMatch?.teamB} DELIVERIES
              </Text>

              {displayedBalls && displayedBalls.length > 0 ? (
                chunkOvers(displayedBalls).map((overItem) => (
                  <View key={`over-${overItem.overNumber}`} style={styles.overCard}>
                    <View style={styles.overCardHeader}>
                      <Text style={styles.overCardTitle}>OVER {overItem.overNumber}</Text>
                      <Text style={styles.overCardSubRuns}>
                        {overItem.runs} Runs {overItem.wickets > 0 ? `• ${overItem.wickets} Wkt` : ''}
                      </Text>
                    </View>

                    <View style={styles.overBallsRow}>
                      {overItem.deliveries.map((b, bIdx) => (
                        <View 
                          key={`ball-${bIdx}`} 
                          style={[
                            styles.breakdownBallCircle,
                            b === '4' ? styles.ballFour : b === '6' ? styles.ballSix : b === 'W' ? styles.ballWicket : styles.ballNormal
                          ]}
                        >
                          <Text style={[styles.breakdownBallText, (b === '4' || b === '6' || b === 'W') && styles.ballTextWhite]}>
                            {b}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyOverLog}>
                  <Ionicons name="stats-chart-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyOverLogText}>
                    No deliveries recorded for {selectedInningsTeam === 'A' ? selectedFinishedMatch?.teamA : selectedFinishedMatch?.teamB}.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60 },
  profileHeader: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#FFFFFF', position: 'relative', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  logoutTopActionButton: { position: 'absolute', top: 12, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  logoutTopActionText: { fontSize: 12, fontWeight: '700', color: '#000000' },
  avatarCircleFrame: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#0F172A' },
  avatarInitialText: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  userName: { fontSize: 20, fontWeight: '800', color: '#000000' },
  userBio: { fontSize: 13, color: '#000000', marginTop: 4, marginBottom: 16, fontWeight: '500' },
  scanUmpireQrHeaderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', marginHorizontal: 16, marginTop: 10, paddingVertical: 10, borderRadius: 12 },
  scanUmpireQrHeaderBtnText: { fontSize: 13, fontWeight: '800', color: '#059669' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  statBox: { alignItems: 'center', flex: 1, paddingVertical: 6, borderRadius: 10 },
  activeStatBox: { backgroundColor: '#F1F5F9' },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#000000' },
  activeStatNumber: { color: '#059669' },
  statLabel: { fontSize: 12, color: '#000000', fontWeight: '500' },
  activeStatLabel: { color: '#059669', fontWeight: '800' },
  statDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },
  sectionContainer: { marginTop: 16, paddingHorizontal: 16 },
  hostCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  hostCardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  hostCardTitle: { fontSize: 15, fontWeight: '700', color: '#000000' },
  hostCardSub: { fontSize: 12, color: '#000000', marginTop: 1 },
  feedTabHeader: { flexDirection: 'row', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 24, backgroundColor: '#FFFFFF' },
  activeTabIndicator: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 2, borderTopColor: '#000000', paddingVertical: 12, paddingHorizontal: 20 },
  feedTabText: { fontSize: 11, fontWeight: '800', color: '#000000' },

  tournamentsListContainer: { padding: 14, gap: 14 },
  tourneyManageCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  tourneyManageCardLive: { borderColor: '#059669', borderWidth: 2 },
  tourneyCardTopRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tourneyCardPoster: { width: 68, height: 80, borderRadius: 10, backgroundColor: '#F8FAFC' },
  tourneyCardDetails: { flex: 1, justifyContent: 'center' },
  tourneyBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tourneyCategoryText: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900', color: '#0F172A' },
  liveStreamBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pulseDotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  liveStreamBadgeText: { fontSize: 9, fontWeight: '900', color: '#059669' },
  completedBadgePill: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  completedBadgePillText: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  tourneyCardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  tourneyCardSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  matchesLoggedTag: { fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 4 },

  organizerNextMatchCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  nextMatchHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nextMatchBadge: { backgroundColor: '#059669', color: '#FFFFFF', fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nextMatchStage: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  fixtureTimeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  nextMatchTeamsText: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  startNextMatchQuickBtn: { backgroundColor: '#0F172A', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  startNextMatchQuickBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  tourneyActionsButtonGroup: { flexDirection: 'row', gap: 5, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  tourneyBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnAddLive: { backgroundColor: '#059669' },
  btnRemoveLive: { backgroundColor: '#E11D48' },
  btnScheduleMatch: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  btnQrCodeAccess: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  btnScoreDesk: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1' },
  btnCompleteEvent: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  tourneyBtnTextWhite: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  tourneyBtnTextDark: { fontSize: 10, fontWeight: '800', color: '#0F172A' },

  qrCodeCardContainer: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', marginVertical: 16, width: '100%' },
  qrPayloadCodeText: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 12, textAlign: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  qrInstructionSubtext: { fontSize: 12, color: '#64748B', textAlign: 'center', fontWeight: '500', marginBottom: 20, paddingHorizontal: 10 },

  scannerOverlayTopHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  scannerCloseIconCircle: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  scannerHeaderTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  scannerTargetFrameBox: { position: 'absolute', top: '32%', alignSelf: 'center', width: 240, height: 240, borderWidth: 2, borderColor: '#059669', borderRadius: 16, backgroundColor: 'transparent' },
  scannerCornerTL: { position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderColor: '#FFFFFF', borderTopWidth: 4, borderLeftWidth: 4 },
  scannerCornerTR: { position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderColor: '#FFFFFF', borderTopWidth: 4, borderRightWidth: 4 },
  scannerCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderColor: '#FFFFFF', borderBottomWidth: 4, borderLeftWidth: 4 },
  scannerCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderColor: '#FFFFFF', borderBottomWidth: 4, borderRightWidth: 4 },

  modalSheetFixed: {
    height: '84%',
    maxHeight: '84%',
  },
  tabContentFixedWrapper: {
    flex: 1,
    height: '100%',
  },

  segmentedTabBar: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 4, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  segmentedTabBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  segmentedTabBtnActive: { backgroundColor: '#0F172A' },
  segmentedTabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  segmentedTabTextActive: { color: '#FFFFFF', fontWeight: '800' },

  stageFilterScrollWrapper: { marginBottom: 12 },
  stageFilterContainer: { gap: 6, paddingVertical: 2 },
  stageFilterChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  stageFilterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  stageFilterChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  stageFilterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  emptyTabBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyTabTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  emptyTabSub: { fontSize: 12, color: '#64748B', textAlign: 'center', paddingHorizontal: 20 },
  emptyTabCtaBtn: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 10 },
  emptyTabCtaBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  cleanFixtureCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cleanFixtureCardActive: { borderColor: '#86EFAC', borderLeftWidth: 4, borderLeftColor: '#059669', backgroundColor: '#F0FDF4' },
  cleanFixtureTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cleanStageBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900', color: '#0F172A' },
  cleanSelectedPill: { backgroundColor: '#DCFCE7', color: '#166534', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: '900' },
  cleanTimeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  cleanFixtureTeams: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  cleanFixtureStatus: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 10 },
  setNextCleanBtn: { backgroundColor: '#0F172A', borderRadius: 8, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  setNextCleanBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  cleanAddFormBox: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cleanFormHeading: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginBottom: 12 },

  cleanFinishedCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  hubLivePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  hubLivePillText: { fontSize: 8, fontWeight: '900', color: '#059669' },
  hubFinishedTag: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: '900', color: '#475569' },
  hubTeamsScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hubTeamName: { fontSize: 13, fontWeight: '800', color: '#0F172A', lineHeight: 18 },
  hubScoreText: { fontSize: 13, fontWeight: '900', color: '#0F172A', lineHeight: 18 },
  finishedVerdictSummaryText: { fontSize: 11, fontWeight: '800', color: '#059669', marginTop: 2 },

  emptyGridContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 24, width: '100%', gap: 8 },
  emptyGridText: { fontSize: 16, fontWeight: '800', color: '#000000' },
  emptyGridSubtext: { fontSize: 12, fontWeight: '500', color: '#64748B', textAlign: 'center' },
  
  matchCardVertical: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 5, borderLeftColor: '#CBD5E1' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleWithBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  finishedSportLabelTagBg: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  finishedSportLabelTagText: { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  finishedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  finishedPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8' },
  finishedStatusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4, color: '#64748B' },
  teamsScoreboardContainer: { gap: 12, marginBottom: 10 },
  teamRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamNameText: { color: '#0F172A', fontSize: 16, fontWeight: '800', flex: 0.72 },
  scoreTextCluster: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', flex: 0.28 },
  teamScoreValue: { color: '#0F172A', fontSize: 18, fontWeight: '900' },
  cricketWicketsValue: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  cardDividerLine: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  cardFooterRowFinished: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  matchStatusFinishedText: { fontSize: 12, fontWeight: '800', flex: 1, lineHeight: 16, color: '#0F172A' },
  tapToViewScorecardTag: { fontSize: 11, fontWeight: '800', color: '#059669' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIconFrame: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#0F172A', fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 24, width: '100%' },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalSheetTitle: { fontSize: 18, fontWeight: '800', color: '#000000' },
  modalSheetSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  closeSheetIcon: { backgroundColor: '#F8FAFC', padding: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  backButtonIcon: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  unlockHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  unlockHeaderText: { fontSize: 11, fontWeight: '800', color: '#E11D48' },
  lockedWarningBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', padding: 10, borderRadius: 10, marginBottom: 14 },
  lockedWarningText: { fontSize: 11, fontWeight: '800', color: '#B91C1C', flex: 1 },

  formScrollContent: { paddingBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#000000', marginBottom: 6, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, height: 46, position: 'relative' },
  inputIcon: { marginRight: 8 },
  sheetInput: { flex: 1, color: '#000000', fontSize: 14, height: '100%', fontWeight: '600' },
  dashedUploadBox: { backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#000000', borderRadius: 12, paddingVertical: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  uploadBoxTitle: { fontSize: 13, fontWeight: '700', color: '#000000', marginTop: 6 },
  sportsChipContainer: { gap: 8, paddingVertical: 4, marginBottom: 14 },
  sportChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  sportChipActive: { backgroundColor: '#000000', borderColor: '#000000' },
  sportChipText: { color: '#000000', fontSize: 12, fontWeight: '600' },
  sportChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  previewContainer: { width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', marginBottom: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  premiumPreviewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  publishActionBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' },
  publishBtnText: { color: '#000000', fontSize: 15, fontWeight: '800' },
  matchHeadingText: { fontSize: 14, fontWeight: '700', color: '#000000', textAlign: 'center', marginBottom: 12, backgroundColor: '#F8FAFC', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  
  equationPromptBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 10, borderRadius: 10, marginBottom: 14 },
  equationPromptText: { fontSize: 12, fontWeight: '800', color: '#1E40AF', flex: 1 },

  scoreRowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  scoreControlCard: { flex: 0.48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, alignItems: 'center', position: 'relative' },
  battingTeamStrikeActive: { borderColor: '#000000', backgroundColor: '#FFFFFF', borderWidth: 2 },
  teamNameEditInput: { fontSize: 13, fontWeight: '800', color: '#000000', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', width: '100%', textAlign: 'center', paddingBottom: 4, marginBottom: 8, textTransform: 'uppercase' },
  numericInputInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  liveDashboardDisplayScoreNumber: { fontSize: 28, fontWeight: '900', color: '#000000', textAlign: 'center' },
  slashSeparator: { fontSize: 24, fontWeight: '500', color: '#000000', marginHorizontal: 6 },
  battingDotIndicatorBadge: { backgroundColor: '#000000', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginTop: 4 },
  battingDotIndicatorBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },

  cricbuzzDashboardWrapper: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  sectionHeaderInnerLabelTitle: { fontSize: 13, fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  strikeInstructionHelperSubtext: { fontSize: 11, fontWeight: '600', color: '#000000', marginBottom: 12 },
  ballsContainerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  thisOverLabel: { fontSize: 10, fontWeight: '900', color: '#000000', marginRight: 2 },
  ballCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  ballNormal: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  ballFour: { backgroundColor: '#2563EB', borderColor: '#1D4ED8' },
  ballSix: { backgroundColor: '#16A34A', borderColor: '#15803D' },
  ballWicket: { backgroundColor: '#DC2626', borderColor: '#B91C1C' },
  ballExtra: { backgroundColor: '#D97706', borderColor: '#B45309' },
  ballText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  ballTextWhite: { color: '#FFFFFF' },
  cricbuzzButtonMatrixRowGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginVertical: 4 },
  cricbuzzBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  cricbuzzBtnVal: { fontSize: 18, fontWeight: '900', color: '#000000' },
  cricbuzzBtnLbl: { fontSize: 10, fontWeight: '800', color: '#000000', marginTop: 1 },
  cricbuzzWideActionBtn: { flex: 1, height: 44, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  wideBtnText: { fontSize: 10, fontWeight: '800' },

  sportDeskWrapper: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  deskSubCategoryLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginTop: 6, marginBottom: 8 },
  sportGridRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  sportScoreBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  sportScoreBtnVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  sportScoreBtnLbl: { fontSize: 10, fontWeight: '800', color: '#64748B', marginTop: 2, textAlign: 'center' },
  sportActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  secondaryDeskBtn: { flex: 1, height: 42, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryDeskBtnText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },

  breakdownScroll: { paddingBottom: 20 },
  modalVerdictBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', padding: 12, borderRadius: 12, marginBottom: 14 },
  modalVerdictText: { fontSize: 13, fontWeight: '800', color: '#065F46', flex: 1 },
  teamToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  teamSelectTab: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, alignItems: 'center' },
  teamSelectTabActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  teamSelectTabText: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 4 },
  teamSelectTabTextActive: { color: '#FFFFFF' },
  teamSelectScore: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  teamSelectScoreActive: { color: '#FFFFFF' },
  oversSectionTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 0.6, marginBottom: 10 },
  overCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginBottom: 10 },
  overCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  overCardTitle: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  overCardSubRuns: { fontSize: 11, fontWeight: '700', color: '#059669' },
  overBallsRow: { flexDirection: 'row', gap: 8 },
  breakdownBallCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  breakdownBallText: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  emptyOverLog: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyOverLogText: { color: '#64748B', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },

  walkinNoteBoxContainer: { marginTop: 14, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  walkinNoteItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 6 },
  walkinItemRowSelected: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  walkinItemRowScheduled: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', opacity: 0.7 },
  walkinNoteTextItem: { fontSize: 12, fontWeight: '800', color: '#0F172A', flex: 1 },
  feePillTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  feePillTagText: { fontSize: 10, fontWeight: '900' },

  pairingPreviewBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#86EFAC' },
  pairingPreviewTitle: { fontSize: 10, fontWeight: '900', color: '#065F46', marginBottom: 8, letterSpacing: 0.5 },
  pairingTeamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  pairingTeamPill: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  pairingPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  pairingPillText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  pairingPillTextActive: { color: '#FFFFFF' },
  pairingVsText: { fontSize: 11, fontWeight: '900', color: '#64748B', marginHorizontal: 8 },
  schedulePairedMatchBtn: { backgroundColor: '#0F172A', borderRadius: 8, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  schedulePairedMatchBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  advancingNoticeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 10, borderRadius: 10, marginBottom: 10 },
  advancingNoticeText: { fontSize: 11, fontWeight: '800', color: '#1E40AF', flex: 1 },
});