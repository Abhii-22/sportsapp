import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Image, ScrollView, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSports, SportEvent } from '../../context/SportsContext';
import { useAuth } from '../_layout';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 46) / 3;

const AVAILABLE_SPORTS = ['Kabaddi', 'Cricket', 'Volleyball', 'Badminton', 'Shuttle', 'Others'];

export default function ProfileScreen() {
  const { user, logoutUser } = useAuth();
  const { events, addEvent, updateCurrentLiveMatch, finalizeAndSaveMatch } = useSports();
  const [modalVisible, setModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);

  const [selectedProfileTab, setSelectedProfileTab] = useState<'tournaments' | 'finished'>('tournaments');

  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any | null>(null);
  const [selectedInningsTeam, setSelectedInningsTeam] = useState<'A' | 'B'>('A');

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

  const [liveTeamA, setLiveTeamA] = useState('');
  const [liveTeamB, setLiveTeamB] = useState('');
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

  const handleManageScores = (event: SportEvent) => {
    setSelectedEvent(event);
    
    const activeUnfinishedMatch = event.matches?.find(m => {
      const isFinished = 
        m.isLive === false || 
        m.status === 'Match Completed' || 
        (typeof m.status === 'string' && (
          m.status.includes('won by') || 
          m.status.includes('Tied') || 
          m.status.includes('Drawn')
        ));
      return m.isLive === true && !isFinished && m.status !== 'Match Scheduled';
    });

    if (!activeUnfinishedMatch) {
      setLiveTeamA(''); 
      setLiveTeamB(''); 
      setLiveScoreA('0'); 
      setLiveScoreB('0');
      setLiveWicketsA('0'); 
      setLiveWicketsB('0'); 
      setLiveOvers('0.0'); 
      setMaxMatchOvers('20');
      setLiveStatusText(''); 
      setActiveBattingTeam('A');
      setRecentBalls([]); 
      setTeamABalls([]); 
      setTeamBBalls([]);
    } else {
      setLiveTeamA(activeUnfinishedMatch.teamAName || 'TEAM A'); 
      setLiveTeamB(activeUnfinishedMatch.teamBName || 'TEAM B');
      setLiveScoreA(activeUnfinishedMatch.scoreA || '0');
      setLiveScoreB(activeUnfinishedMatch.scoreB || '0');
      setLiveWicketsA(activeUnfinishedMatch.wicketsA || '0');
      setLiveWicketsB(activeUnfinishedMatch.wicketsB || '0');
      setLiveOvers(activeUnfinishedMatch.overs || '0.0');
      setMaxMatchOvers(activeUnfinishedMatch.totalOvers || '20');
      setLiveStatusText(activeUnfinishedMatch.status || 'Live');
      setRecentBalls(activeUnfinishedMatch.recentBalls || []);
      setTeamABalls(activeUnfinishedMatch.inningsABalls || []);
      setTeamBBalls(activeUnfinishedMatch.inningsBBalls || []);
      setActiveBattingTeam(parseInt(activeUnfinishedMatch.scoreA, 10) > 0 && activeUnfinishedMatch.overs === '0.0' ? 'B' : 'A');
    }
    setScoreModalVisible(true);
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
          teamBBalls
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
        updatedTeamBBalls
      );
    }
  };

  const handleUndoLastBall = () => {
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
        activeBattingTeam === 'B' ? updatedBalls : teamBBalls
      );
    }
  };

  const handleManualLiveBroadcast = () => {
    if (!selectedEvent) return;
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
      : liveStatusText || 'Live Match Stream';

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
      recentBalls, 
      maxMatchOvers, 
      teamABalls, 
      teamBBalls
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
      teamBBalls
    );

    setLiveTeamA(''); 
    setLiveTeamB(''); 
    setLiveScoreA('0'); 
    setLiveScoreB('0');
    setLiveWicketsA('0'); 
    setLiveWicketsB('0'); 
    setLiveOvers('0.0'); 
    setMaxMatchOvers('20');
    setLiveStatusText(''); 
    setActiveBattingTeam('A'); 
    setRecentBalls([]); 
    setTeamABalls([]); 
    setTeamBBalls([]);

    Alert.alert('Match Completed & Saved', `${finalVerdict}\n\nUmpire desk reset to zero for the next match.`);
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
          <View style={styles.gridContainer}>
            {myEvents.length === 0 ? (
              <View style={styles.emptyGridContainer}>
                <Ionicons name="pulse-outline" size={44} color="#000000" />
                <Text style={styles.emptyGridText}>No Tournaments Created Yet</Text>
                <Text style={styles.emptyGridSubtext}>Host a tournament above to begin live score updates.</Text>
              </View>
            ) : (
              <View style={styles.imageGrid}>
                {myEvents.map((item) => {
                  const activeMatch = item.matches?.find(m => m.isLive !== false && !m.status?.includes('won by') && !m.status?.includes('Tied'));
                  return (
                    <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => handleManageScores(item)}>
                      <Image source={{ uri: item.poster }} style={styles.gridImage} />
                      <View style={styles.scoreOverlayLabel}>
                        <Text style={styles.overlayLabelText} numberOfLines={1}>
                          {!activeMatch ? 'Setup Match' : `${activeMatch?.teamAName} v ${activeMatch?.teamBName}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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

      {/* OVER-BY-OVER DELIVERIES BREAKDOWN MODAL */}
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

      {/* MODAL 1: HOST TOURNAMENT */}
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

      {/* MODAL 2: UMPIRE DESK */}
      <Modal animationType="slide" transparent={true} visible={scoreModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalSheetTitle}>Match Umpire Desk</Text>
                <Text style={styles.modalSheetSubtitle}>{selectedEvent?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setScoreModalVisible(false)} style={styles.closeSheetIcon}><Ionicons name="close" size={22} color="#000000" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchHeadingText} numberOfLines={1}>📍 {selectedEvent?.name}</Text>

              {liveStatusText ? (
                <View style={styles.equationPromptBanner}>
                  <Ionicons name="information-circle" size={18} color="#2563EB" />
                  <Text style={styles.equationPromptText}>{liveStatusText}</Text>
                </View>
              ) : null}

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
                    <View style={styles.battingDotIndicatorBadge}><Text style={styles.battingDotIndicatorBadgeText}>1ST INNINGS (ON STRIKE)</Text></View>
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
                    <View style={styles.battingDotIndicatorBadge}><Text style={styles.battingDotIndicatorBadgeText}>2ND INNINGS (CHASING)</Text></View>
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
              ) : (
                <View style={styles.genericPointsCardContainer}>
                  <Text style={styles.inputLabel}>Standard Score Modifiers</Text>
                  <View style={styles.genericPointsButtonInlineFlexRow}>
                    <TouchableOpacity style={styles.standardIncrementBtnAction} onPress={() => {
                      if (activeBattingTeam === 'A') setLiveScoreA((parseInt(liveScoreA, 10) + 1).toString());
                      else setLiveScoreB((parseInt(liveScoreB, 10) + 1).toString());
                    }}>
                      <Text style={styles.standardIncrementBtnActionText}>+1 Point</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.standardIncrementBtnAction, { backgroundColor: '#F1F5F9' }]} onPress={() => {
                      if (activeBattingTeam === 'A') setLiveScoreA(Math.max(0, parseInt(liveScoreA, 10) - 1).toString());
                      else setLiveScoreB(Math.max(0, parseInt(liveScoreB, 10) - 1).toString());
                    }}>
                      <Text style={[styles.standardIncrementBtnActionText, { color: '#000000' }]}>-1 Point Correction</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
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
  gridContainer: { padding: 10, backgroundColor: '#FFFFFF', flex: 1 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridImage: { width: GRID_SIZE, height: GRID_SIZE, resizeMode: 'cover', borderRadius: 6 },
  scoreOverlayLabel: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0, 0, 0, 0.85)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  overlayLabelText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textAlign: 'center' },
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
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 24, maxHeight: '92%', width: '100%' },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalSheetTitle: { fontSize: 18, fontWeight: '800', color: '#000000' },
  modalSheetSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  closeSheetIcon: { backgroundColor: '#F8FAFC', padding: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  formScrollContent: { paddingBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#000000', marginBottom: 6, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 18, height: 48, position: 'relative' },
  inputIcon: { marginRight: 8 },
  sheetInput: { flex: 1, color: '#000000', fontSize: 14, height: '100%', fontWeight: '600' },
  dashedUploadBox: { backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#000000', borderRadius: 12, paddingVertical: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  uploadBoxTitle: { fontSize: 13, fontWeight: '700', color: '#000000', marginTop: 6 },
  sportsChipContainer: { gap: 8, paddingVertical: 4, marginBottom: 16 },
  sportChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  sportChipActive: { backgroundColor: '#000000', borderColor: '#000000' },
  sportChipText: { color: '#000000', fontSize: 13, fontWeight: '600' },
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
  genericPointsCardContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 12, marginBottom: 16 },
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
  genericPointsButtonInlineFlexRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  standardIncrementBtnAction: { flex: 1, height: 40, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#000000', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  standardIncrementBtnActionText: { color: '#000000', fontSize: 13, fontWeight: '800' },

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
});