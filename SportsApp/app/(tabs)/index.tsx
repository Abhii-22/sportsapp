import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSports, SportEvent } from '../../context/SportsContext';

const STAGE_FILTER_OPTIONS = [
  { label: 'All Stages', value: 'ALL' },
  { label: 'League 1', value: 'LEAGUE_1' },
  { label: 'League 2', value: 'LEAGUE_2' },
  { label: 'Group Stages', value: 'LEAGUE_STAGE' },
  { label: 'Semi-Final', value: 'SEMI_FINAL' },
  { label: 'Final Match', value: 'FINAL' },
];

export default function HomeScreen() {
  const { events } = useSports();
  const [activeTab, setActiveTab] = useState<'live' | 'completed'>('live');
  const [selectedTournament, setSelectedTournament] = useState<SportEvent | null>(null);
  const [tournamentModalVisible, setTournamentModalVisible] = useState(false);

  // Stage Filter inside Tournament Modal
  const [selectedModalStage, setSelectedModalStage] = useState<string>('ALL');

  // Over-by-Over Breakdown Modal states
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any | null>(null);
  const [selectedInningsTeam, setSelectedInningsTeam] = useState<'A' | 'B'>('A');

  // Filter and prioritize newly added/activated live tournaments at the top
  const liveTournaments = events
    .filter((e) => e.isLive === true && !e.isCompleted)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const finishedTournaments = events
    .filter((e) => e.isCompleted === true || !e.isLive)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const displayedTournaments = activeTab === 'live' ? liveTournaments : finishedTournaments;

  const handleOpenTournament = (eventItem: SportEvent) => {
    const fresh = events.find((e) => e.id === eventItem.id) || eventItem;
    setSelectedTournament(fresh);
    setSelectedModalStage('ALL');
    setTournamentModalVisible(true);
  };

  const handleOpenBreakdown = (matchItem: any) => {
    if (selectedTournament?.sportType === 'CRICKET') {
      setSelectedFinishedMatch(matchItem);
      setSelectedInningsTeam('A');
      setBreakdownModalVisible(true);
    }
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
    ? (selectedFinishedMatch?.inningsABalls || selectedFinishedMatch?.ballHistory || [])
    : (selectedFinishedMatch?.inningsBBalls || []);

  const tournamentMatches = selectedTournament?.matches || [];
  const isTournamentFinished = selectedTournament?.isCompleted === true;
  const activeOngoingMatch = !isTournamentFinished ? tournamentMatches.find((m: any) => m.isLive === true) : null;

  const allUpcoming = tournamentMatches.filter((m: any) => 
    !m.isLive && 
    !m.status?.includes('won') && 
    !m.status?.includes('Tied') && 
    !m.status?.includes('Drawn') && 
    m.status !== 'Match Completed'
  );

  const allFinished = tournamentMatches.filter((m: any) => 
    m.status?.includes('won') || 
    m.status?.includes('Tied') || 
    m.status?.includes('Drawn') || 
    m.status === 'Match Completed' || 
    (!m.isLive && !m.status?.includes('Scheduled'))
  );

  const filteredUpcoming = selectedModalStage === 'ALL'
    ? allUpcoming
    : allUpcoming.filter((m: any) => (m.stage || 'LEAGUE_1').toUpperCase() === selectedModalStage.toUpperCase());

  const filteredFinished = selectedModalStage === 'ALL'
    ? allFinished
    : allFinished.filter((m: any) => (m.stage || 'LEAGUE_1').toUpperCase() === selectedModalStage.toUpperCase());

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AK SPORTS</Text>
          <Text style={styles.headerSubtitle}>Real-time live tournament boards</Text>
        </View>
      </View>

      {/* Main Tabs */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'live' && styles.activeLiveTab]}
          onPress={() => setActiveTab('live')}
          activeOpacity={0.88}
        >
          <View style={styles.tabContentRow}>
            <Ionicons name="radio-button-on-outline" size={16} color={activeTab === 'live' ? '#059669' : '#64748B'} />
            <Text style={[styles.tabButtonText, activeTab === 'live' && styles.activeLiveTabText]}>
              Live Tournaments ({liveTournaments.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' && styles.activeCompletedTab]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.88}
        >
          <View style={styles.tabContentRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={activeTab === 'completed' ? '#0F172A' : '#64748B'} />
            <Text style={[styles.tabButtonText, activeTab === 'completed' && styles.activeCompletedTabText]}>
              Finished Events ({finishedTournaments.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tournament Cards List */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayedTournaments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'live' ? "radio-outline" : "trophy-outline"} size={42} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {activeTab === 'live'
                ? "No tournaments streaming live right now.\nTap 'Add to Live' on your tournament in Profile."
                : "No completed tournaments logged yet."}
            </Text>
          </View>
        ) : (
          displayedTournaments.map((tournament) => {
            const matches = tournament.matches || [];
            const activeMatch = matches.find((m: any) => m.isLive === true);

            return (
              <TouchableOpacity
                key={tournament.id}
                style={[styles.tournamentCard, activeTab === 'live' ? styles.liveBorder : styles.finishedBorder]}
                activeOpacity={0.9}
                onPress={() => handleOpenTournament(tournament)}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.sportBadge}>
                    <Text style={styles.sportBadgeText}>{tournament.sportCategory}</Text>
                  </View>
                  <View style={[styles.statusBadge, activeTab === 'live' ? styles.statusLive : styles.statusFinished]}>
                    <Text style={[styles.statusBadgeText, activeTab === 'live' ? styles.statusLiveText : styles.statusFinishedText]}>
                      {activeTab === 'live' ? 'STREAMING LIVE' : 'EVENT FINISHED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.tourneyBodyRow}>
                  <Image source={{ uri: tournament.poster }} style={styles.tourneyPoster} />
                  <View style={styles.tourneyInfo}>
                    <Text style={styles.tournamentName} numberOfLines={1}>{tournament.name}</Text>
                    <Text style={styles.tournamentMeta}>📍 {tournament.location}</Text>
                    <Text style={styles.tournamentMeta}>📅 {tournament.date}</Text>
                    <Text style={styles.matchesCountBadge}>📋 {matches.length} Total Matches</Text>
                  </View>
                </View>

                {/* Real-time Match Banner */}
                {activeMatch && (
                  <View style={styles.activeMatchBanner}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeMatchText} numberOfLines={1}>
                      Ongoing: {activeMatch.teamAName} ({activeMatch.scoreA}) vs {activeMatch.teamBName} ({activeMatch.scoreB})
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooterRow}>
                  <Text style={styles.footerCTAText}>Tap to view matches & scorecards</Text>
                  <Ionicons name="chevron-forward" size={14} color="#059669" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FULL TOURNAMENT DETAIL MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={tournamentModalVisible}
        onRequestClose={() => setTournamentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 0.85 }}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>{selectedTournament?.name}</Text>
                <Text style={styles.modalSheetSubtitle}>{selectedTournament?.sportCategory} • {selectedTournament?.location}</Text>
              </View>
              <TouchableOpacity onPress={() => setTournamentModalVisible(false)} style={styles.closeSheetIcon}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 35 }}>
              {/* 1. BIG HERO LIVE CARD (IF LIVE) */}
              {activeOngoingMatch && (
                <View style={styles.bigHeroLiveCard}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroTournamentTagRow}>
                      <Text style={styles.heroStageBadge}>
                        {activeOngoingMatch.stage ? activeOngoingMatch.stage.replace('_', ' ') : 'LIVE MATCH'}
                      </Text>
                    </View>
                    <View style={styles.heroLivePulseBadge}>
                      <View style={styles.heroPulseGreenDot} />
                      <Text style={styles.heroLivePulseText}>LIVE ONGOING</Text>
                    </View>
                  </View>

                  <View style={styles.heroScoreCluster}>
                    <View style={styles.heroTeamBlock}>
                      <Text style={styles.heroTeamName} numberOfLines={2}>{activeOngoingMatch.teamAName}</Text>
                      <View style={styles.heroScoreRow}>
                        <Text style={styles.heroScoreNumber}>{activeOngoingMatch.scoreA}</Text>
                        {selectedTournament?.sportType === 'CRICKET' ? (
                          <Text style={styles.heroWicketNumber}>/{activeOngoingMatch.wicketsA || '0'}</Text>
                        ) : (
                          <Text style={styles.heroPtsLabel}> pts</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.heroVsDivider}>
                      <Text style={styles.heroVsText}>VS</Text>
                      {selectedTournament?.sportType === 'CRICKET' && (
                        <Text style={styles.heroOversBadge}>{activeOngoingMatch.overs || '0.0'}/{activeOngoingMatch.totalOvers || '20'} ov</Text>
                      )}
                    </View>

                    <View style={[styles.heroTeamBlock, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.heroTeamName, { textAlign: 'right' }]} numberOfLines={2}>{activeOngoingMatch.teamBName}</Text>
                      <View style={styles.heroScoreRow}>
                        <Text style={styles.heroScoreNumber}>{activeOngoingMatch.scoreB}</Text>
                        {selectedTournament?.sportType === 'CRICKET' ? (
                          <Text style={styles.heroWicketNumber}>/{activeOngoingMatch.wicketsB || '0'}</Text>
                        ) : (
                          <Text style={styles.heroPtsLabel}> pts</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {selectedTournament?.sportType === 'CRICKET' && activeOngoingMatch.ballHistory && activeOngoingMatch.ballHistory.length > 0 && (
                    <View style={styles.heroRecentBallsWrapper}>
                      <Text style={styles.heroRecentTag}>THIS OVER:</Text>
                      <View style={styles.heroBallDotsRow}>
                        {activeOngoingMatch.ballHistory.slice(-6).map((b: string, bIdx: number) => (
                          <View
                            key={bIdx}
                            style={[
                              styles.heroBallDot,
                              b === '4' ? styles.ballFour : b === '6' ? styles.ballSix : b === 'W' ? styles.ballWicket : (b === 'WD' || b === 'NB') ? styles.ballExtra : styles.ballNormal
                            ]}
                          >
                            <Text style={[styles.heroBallText, (b === '4' || b === '6' || b === 'W' || b === 'WD' || b === 'NB') && styles.cardBallTextWhite]}>
                              {b}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.heroTimelineBanner}>
                    <Ionicons name="flash" size={14} color="#059669" />
                    <Text style={styles.heroTimelineText} numberOfLines={2}>
                      {activeOngoingMatch.status}
                    </Text>
                  </View>
                </View>
              )}

              {/* 2. STAGE FILTER BAR */}
              <Text style={styles.stageFilterHeaderLabel}>FILTER BY STAGE:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageFilterContainer}>
                {STAGE_FILTER_OPTIONS.map((stageItem) => {
                  const isSelected = selectedModalStage === stageItem.value;
                  return (
                    <TouchableOpacity
                      key={stageItem.value}
                      style={[styles.stageFilterChip, isSelected && styles.stageFilterChipActive]}
                      onPress={() => setSelectedModalStage(stageItem.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.stageFilterChipText, isSelected && styles.stageFilterChipTextActive]}>
                        {stageItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3. UPCOMING MATCHES SECTION */}
              {!isTournamentFinished && (
                <>
                  <Text style={styles.sectionHeaderTitle}>
                    UPCOMING FIXTURES ({filteredUpcoming.length})
                  </Text>

                  {filteredUpcoming.length === 0 ? (
                    <View style={styles.emptySubSectionBlock}>
                      <Ionicons name="calendar-outline" size={26} color="#94A3B8" />
                      <Text style={styles.emptySubSectionText}>
                        {selectedModalStage === 'ALL'
                          ? 'No upcoming matches scheduled in this event.'
                          : `No upcoming matches in ${selectedModalStage.replace('_', ' ')}.`}
                      </Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalStripContainer}>
                      {filteredUpcoming.map((match: any, idx: number) => (
                        <View key={match._id || `up-m-${idx}`} style={styles.horizontalFixtureCard}>
                          <View style={styles.fixtureHeaderRow}>
                            <Text style={styles.fixtureStagePill}>{match.stage ? match.stage.replace('_', ' ') : 'LEAGUE MATCH'}</Text>
                            {match.matchTime ? (
                              <Text style={styles.fixtureTimeText}>⏰ {match.matchTime}</Text>
                            ) : null}
                          </View>

                          <View style={styles.fixtureTeamsBlock}>
                            <Text style={styles.fixtureTeamTitle} numberOfLines={1}>{match.teamAName}</Text>
                            <View style={styles.fixtureVsCircle}>
                              <Text style={styles.fixtureVsText}>VS</Text>
                            </View>
                            <Text style={[styles.fixtureTeamTitle, { textAlign: 'right' }]} numberOfLines={1}>{match.teamBName}</Text>
                          </View>

                          <Text style={styles.fixtureStatusLabel} numberOfLines={1}>📌 {match.status || 'Match Scheduled'}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* 4. FINISHED MATCHES SECTION */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: isTournamentFinished ? 4 : 18 }]}>
                FINISHED MATCHES ({filteredFinished.length})
              </Text>

              {filteredFinished.length === 0 ? (
                <View style={styles.emptySubSectionBlock}>
                  <Ionicons name="trophy-outline" size={26} color="#94A3B8" />
                  <Text style={styles.emptySubSectionText}>
                    {selectedModalStage === 'ALL'
                      ? 'No matches completed yet.'
                      : `No finished matches in ${selectedModalStage.replace('_', ' ')}.`}
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalStripContainer}>
                  {filteredFinished.map((match: any, idx: number) => {
                    const isCricket = selectedTournament?.sportType === 'CRICKET';
                    return (
                      <TouchableOpacity
                        key={match._id || `fin-m-${idx}`}
                        style={styles.horizontalFinishedCard}
                        activeOpacity={isCricket ? 0.88 : 1}
                        onPress={() => handleOpenBreakdown(match)}
                      >
                        <View style={styles.finishedCardHeader}>
                          <Text style={styles.finishedStageTag}>{match.stage ? match.stage.replace('_', ' ') : 'MATCH'}</Text>
                          <View style={styles.finishedPillBadge}>
                            <Text style={styles.finishedPillBadgeText}>FINISHED</Text>
                          </View>
                        </View>

                        <View style={styles.finishedScoreRowCluster}>
                          <View style={styles.teamScoreLine}>
                            <Text style={styles.finishedTeamName} numberOfLines={1}>{match.teamAName}</Text>
                            <Text style={styles.finishedScoreVal}>
                              {match.scoreA}{isCricket ? `/${match.wicketsA || '0'}` : ' pts'}
                            </Text>
                          </View>
                          <View style={styles.teamScoreLine}>
                            <Text style={styles.finishedTeamName} numberOfLines={1}>{match.teamBName}</Text>
                            <Text style={styles.finishedScoreVal}>
                              {match.scoreB}{isCricket ? `/${match.wicketsB || '0'}` : ' pts'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardDividerLine} />

                        <View style={styles.finishedFooterRow}>
                          <Ionicons name="trophy" size={13} color="#059669" />
                          <Text style={styles.finishedVerdictText} numberOfLines={1}>{match.status}</Text>
                          {isCricket && <Text style={styles.viewOversCTATag}>• Overs ➔</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OVER-BY-OVER BREAKDOWN MODAL */}
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
                    {selectedFinishedMatch?.teamAName} (1st Inn)
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
                    {selectedFinishedMatch?.teamBName} (2nd Inn)
                  </Text>
                  <Text style={[styles.teamSelectScore, selectedInningsTeam === 'B' && styles.teamSelectScoreActive]}>
                    {selectedFinishedMatch?.scoreB}/{selectedFinishedMatch?.wicketsB || '0'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.oversSectionTitle}>
                {selectedInningsTeam === 'A' ? selectedFinishedMatch?.teamAName : selectedFinishedMatch?.teamBName} DELIVERIES
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
                            b === '4' ? styles.ballFour : b === '6' ? styles.ballSix : b === 'W' ? styles.ballWicket : (b === 'WD' || b === 'NB') ? styles.ballExtra : styles.ballNormal
                          ]}
                        >
                          <Text style={[styles.breakdownBallText, (b === '4' || b === '6' || b === 'W' || b === 'WD' || b === 'NB') && styles.cardBallTextWhite]}>
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
                    No deliveries recorded for {selectedInningsTeam === 'A' ? selectedFinishedMatch?.teamAName : selectedFinishedMatch?.teamBName}.
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
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 54 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  headerTitle: { color: '#0F172A', fontWeight: '900', fontSize: 24 },
  headerSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  tabBarContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', marginHorizontal: 16, padding: 4, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabContentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabButtonText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  activeLiveTab: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BBF7D0' },
  activeLiveTabText: { color: '#059669', fontWeight: '800' },
  activeCompletedTab: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  activeCompletedTabText: { color: '#0F172A', fontWeight: '800' },

  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { color: '#64748B', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  tournamentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  liveBorder: { borderLeftWidth: 5, borderLeftColor: '#059669', borderColor: '#BBF7D0' },
  finishedBorder: { borderLeftWidth: 5, borderLeftColor: '#CBD5E1' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sportBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sportBadgeText: { fontSize: 10, fontWeight: '900', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusLive: { backgroundColor: '#ECFDF5' },
  statusFinished: { backgroundColor: '#F8FAFC' },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },
  statusLiveText: { color: '#059669' },
  statusFinishedText: { color: '#64748B' },

  tourneyBodyRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  tourneyPoster: { width: 70, height: 80, borderRadius: 8, backgroundColor: '#F8FAFC' },
  tourneyInfo: { flex: 1, justifyContent: 'center' },
  tournamentName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  tournamentMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  matchesCountBadge: { fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 4 },

  activeMatchBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  activeMatchText: { fontSize: 11, fontWeight: '700', color: '#065F46', flex: 1 },

  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  footerCTAText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 20, maxHeight: '92%' },
  dragIndicator: { width: 36, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalSheetTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSheetSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeSheetIcon: { backgroundColor: '#F1F5F9', padding: 6, borderRadius: 20 },

  bigHeroLiveCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 2, borderColor: '#059669', elevation: 2 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroTournamentTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStageBadge: { fontSize: 10, fontWeight: '900', color: '#059669', backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  heroLivePulseBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FECACA' },
  heroPulseGreenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E11D48' },
  heroLivePulseText: { fontSize: 9, fontWeight: '900', color: '#E11D48', letterSpacing: 0.5 },

  heroScoreCluster: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  heroTeamBlock: { flex: 0.42 },
  heroTeamName: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroScoreNumber: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  heroWicketNumber: { fontSize: 16, fontWeight: '800', color: '#64748B' },
  heroPtsLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  heroVsDivider: { alignItems: 'center', flex: 0.16 },
  heroVsText: { fontSize: 11, fontWeight: '900', color: '#94A3B8' },
  heroOversBadge: { fontSize: 9, fontWeight: '800', color: '#059669', marginTop: 2, textAlign: 'center' },

  heroRecentBallsWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroRecentTag: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  heroBallDotsRow: { flexDirection: 'row', gap: 4 },
  heroBallDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heroBallText: { fontSize: 10, fontWeight: '900', color: '#0F172A' },

  heroTimelineBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  heroTimelineText: { fontSize: 11, fontWeight: '800', color: '#065F46', flex: 1 },

  stageFilterHeaderLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, marginBottom: 6 },
  stageFilterContainer: { gap: 6, paddingVertical: 2, marginBottom: 14 },
  stageFilterChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  stageFilterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  stageFilterChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  stageFilterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  sectionHeaderTitle: { fontSize: 11, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5, marginBottom: 8 },
  emptySubSectionBlock: { alignItems: 'center', paddingVertical: 18, gap: 4, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  emptySubSectionText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  horizontalStripContainer: { gap: 10, paddingVertical: 4, marginBottom: 10 },

  horizontalFixtureCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, width: 240, borderWidth: 1, borderColor: '#E2E8F0' },
  fixtureHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fixtureStagePill: { backgroundColor: '#EFF6FF', color: '#1D4ED8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '800' },
  fixtureTimeText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  fixtureTeamsBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  fixtureTeamTitle: { flex: 0.42, fontSize: 12, fontWeight: '900', color: '#0F172A' },
  fixtureVsCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  fixtureVsText: { fontSize: 8, fontWeight: '900', color: '#475569' },
  fixtureStatusLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  horizontalFinishedCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, width: 240, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: '#CBD5E1' },
  finishedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  finishedStageTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '800', color: '#0F172A' },
  finishedPillBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  finishedPillBadgeText: { fontSize: 8, fontWeight: '900', color: '#64748B' },
  finishedScoreRowCluster: { gap: 4, marginBottom: 8 },
  teamScoreLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finishedTeamName: { fontSize: 12, fontWeight: '800', color: '#0F172A', flex: 0.7 },
  finishedScoreVal: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  cardDividerLine: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 6 },
  finishedFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  finishedVerdictText: { fontSize: 10, fontWeight: '800', color: '#0F172A', flex: 1 },
  viewOversCTATag: { fontSize: 9, fontWeight: '800', color: '#059669' },

  ballNormal: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  ballFour: { backgroundColor: '#059669', borderColor: '#047857' },
  ballSix: { backgroundColor: '#0F172A', borderColor: '#020617' },
  ballWicket: { backgroundColor: '#E11D48', borderColor: '#BE123C' },
  ballExtra: { backgroundColor: '#D97706', borderColor: '#B45309' },
  cardBallTextWhite: { color: '#FFFFFF' },

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