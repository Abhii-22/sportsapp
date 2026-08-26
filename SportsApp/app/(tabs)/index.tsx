import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSports } from '../../context/SportsContext'; 

export default function HomeScreen() {
  const { events } = useSports(); 
  const [activeTab, setActiveTab] = useState<'live' | 'completed'>('live');
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any | null>(null);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedInningsTeam, setSelectedInningsTeam] = useState<'A' | 'B'>('A');

  const allMatches = events.flatMap((event, eventIdx) => 
    (event.matches || []).map((match: any, matchIdx: number) => {
      const isFinishedStatus = 
        match.isLive === false || 
        match.status === 'Match Completed' || 
        (typeof match.status === 'string' && (
          match.status.includes('won by') ||
          match.status.includes('Tied') ||
          match.status.includes('Drawn')
        ));

      const isLiveNow = !isFinishedStatus && match.isLive === true && match.status !== 'Match Scheduled';

      return {
        id: match._id || match.id || `event-${event.id || eventIdx}-match-${matchIdx}`,
        sport: event.sportCategory ? event.sportCategory.toUpperCase() : event.name.toUpperCase(),
        sportType: event.sportType, 
        teamA: match.teamAName || 'TEAM A',
        teamB: match.teamBName || 'TEAM B',
        scoreA: match.scoreA || '0',
        scoreB: match.scoreB || '0',
        wicketsA: match.wicketsA || '0',
        wicketsB: match.wicketsB || '0',
        overs: match.overs || '0.0',
        totalOvers: match.totalOvers || '20',
        status: match.status || 'Match Scheduled',
        isLive: isLiveNow,
        isFinished: isFinishedStatus,
        isVerified: event.isVerifiedOrganizer, 
        recentBalls: match.recentBalls || match.ballHistory || [],
        ballHistory: match.ballHistory || match.recentBalls || [],
        inningsABalls: match.inningsABalls || match.ballHistory || [],
        inningsBBalls: match.inningsBBalls || [],
      };
    })
  );

  const filteredMatches = allMatches.filter((match) => {
    if (activeTab === 'live') {
      return match.isLive === true;
    } else {
      return match.isFinished === true;
    }
  });

  const handleOpenBreakdown = (matchItem: any) => {
    if (matchItem.isFinished) {
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

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AK SPORTS</Text>
          <Text style={styles.headerSubtitle}>Real-time live match center</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBarContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'live' && styles.activeLiveTab]} 
          onPress={() => setActiveTab('live')}
          activeOpacity={0.9}
        >
          <View style={styles.tabContentRow}>
            <Ionicons 
              name="radio-button-on-outline" 
              size={16} 
              color={activeTab === 'live' ? '#059669' : '#64748B'} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'live' && styles.activeLiveTabText]}>Live Stream</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'completed' && styles.activeCompletedTab]} 
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.9}
        >
          <View style={styles.tabContentRow}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={16} 
              color={activeTab === 'completed' ? '#0F172A' : '#64748B'} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'completed' && styles.activeCompletedTabText]}>Finished</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {filteredMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconFrame}>
              <Ionicons name={activeTab === 'live' ? "radio-outline" : "trophy-outline"} size={36} color="#0F172A" />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === 'live' 
                ? "No live scoreboard segments streaming right now." 
                : "No archived historical matches logged yet."}
            </Text>
          </View>
        ) : (
          filteredMatches.map((item, index) => {
            const isCricket = item.sportType === 'CRICKET';
            return (
              <TouchableOpacity 
                key={item.id || `match-key-${index}`} 
                style={[
                  styles.matchCardVertical, 
                  item.isLive ? styles.liveCardBorder : styles.finishedCardSideBorder
                ]}
                activeOpacity={item.isFinished ? 0.88 : 1}
                onPress={() => handleOpenBreakdown(item)}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.titleWithBadgeRow}>
                    <View style={[styles.sportLabelTag, item.isFinished && styles.finishedSportLabelTagBg]}>
                      <Text style={[styles.cardSportTypeText, item.isFinished && styles.finishedSportLabelTagText]}>{item.sport}</Text>
                    </View>
                    {item.isVerified && (
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    )}
                  </View>
                  
                  <View style={[styles.statusBadge, item.isLive ? styles.liveBadgeBg : styles.finishedBadge]}>
                    <View style={[styles.pulseDot, item.isLive ? styles.livePulseDot : styles.finishedPulseDot]} />
                    <Text style={[styles.statusBadgeText, item.isLive ? styles.liveStatusBadgeText : styles.finishedStatusBadgeText]}>
                      {item.isLive ? 'LIVE' : 'FINISHED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.teamsScoreboardContainer}>
                  <View style={styles.teamRowItem}>
                    <Text style={styles.teamNameText} numberOfLines={1}>{item.teamA}</Text>
                    <View style={styles.scoreTextCluster}>
                      <Text style={styles.teamScoreValue}>{item.scoreA}</Text>
                      {isCricket && (
                        <Text style={styles.cricketWicketsValue}>/{item.wicketsA}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.teamRowItem}>
                    <Text style={styles.teamNameText} numberOfLines={1}>{item.teamB}</Text>
                    <View style={styles.scoreTextCluster}>
                      <Text style={styles.teamScoreValue}>{item.scoreB}</Text>
                      {isCricket && (
                        <Text style={styles.cricketWicketsValue}>/{item.wicketsB}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {isCricket && item.isLive && item.recentBalls && item.recentBalls.length > 0 && (
                  <View style={styles.cardBallsTickerRow}>
                    <Text style={styles.recentBallsTag}>RECENT:</Text>
                    <View style={styles.ballDotsWrapper}>
                      {item.recentBalls.map((ball: string, ballIdx: number) => (
                        <View 
                          key={ballIdx} 
                          style={[
                            styles.cardBallDot, 
                            ball === '4' ? styles.ballFour : ball === '6' ? styles.ballSix : ball === 'W' ? styles.ballWicket : styles.ballNormal
                          ]}
                        >
                          <Text style={[styles.cardBallText, (ball === '4' || ball === '6' || ball === 'W') && styles.cardBallTextWhite]}>
                            {ball}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.cardDividerLine} />

                <View style={[styles.cardFooterRow, item.isLive ? styles.cardFooterRowLive : styles.cardFooterRowFinished]}>
                  <Ionicons 
                    name={item.isLive ? "flash" : "trophy"} 
                    size={15} 
                    color={item.isLive ? "#059669" : "#0F172A"} 
                  />
                  <Text style={[styles.matchStatusTimelineText, item.isLive ? styles.matchStatusLiveText : styles.matchStatusFinishedText]} numberOfLines={2}>
                    {item.isLive ? (isCricket ? `(${item.overs}/${item.totalOvers} ov) • ${item.status}` : item.status) : item.status}
                  </Text>
                  {item.isFinished && isCricket && (
                    <Text style={styles.tapToViewScorecardTag}>• View Overs ➔</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
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
                          <Text style={[styles.breakdownBallText, (b === '4' || b === '6' || b === 'W') && styles.cardBallTextWhite]}>
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
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 54 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { color: '#0F172A', fontWeight: '900', letterSpacing: 0.5, fontSize: 24 },
  headerSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500', marginTop: 1 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconButton: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  
  tabBarContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', marginHorizontal: 16, padding: 4, borderRadius: 12, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabContentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabButtonText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  activeLiveTab: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BBF7D0', elevation: 1 },
  activeLiveTabText: { color: '#059669', fontWeight: '800' },
  activeCompletedTab: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', elevation: 1 },
  activeCompletedTabText: { color: '#0F172A', fontWeight: '800' },
  
  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  matchCardVertical: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  liveCardBorder: { borderLeftWidth: 5, borderLeftColor: '#059669', borderColor: '#BBF7D0' },
  finishedCardSideBorder: { borderLeftWidth: 5, borderLeftColor: '#CBD5E1' },
  
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleWithBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sportLabelTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  finishedSportLabelTagBg: { backgroundColor: '#F8FAFC' },
  cardSportTypeText: { color: '#0F172A', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  finishedSportLabelTagText: { color: '#475569' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveBadgeBg: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  finishedBadge: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  liveStatusBadgeText: { color: '#059669' },
  finishedStatusBadgeText: { color: '#64748B' },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  livePulseDot: { backgroundColor: '#059669' },
  finishedPulseDot: { backgroundColor: '#94A3B8' },
  
  teamsScoreboardContainer: { gap: 12, marginBottom: 10 },
  teamRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamNameText: { color: '#0F172A', fontSize: 16, fontWeight: '800', flex: 0.72 },
  scoreTextCluster: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', flex: 0.28 },
  teamScoreValue: { color: '#0F172A', fontSize: 18, fontWeight: '900' },
  cricketWicketsValue: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  
  cardBallsTickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 4 },
  recentBallsTag: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  ballDotsWrapper: { flexDirection: 'row', gap: 4 },
  cardBallDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  ballNormal: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  ballFour: { backgroundColor: '#059669', borderColor: '#047857' },
  ballSix: { backgroundColor: '#0F172A', borderColor: '#020617' },
  ballWicket: { backgroundColor: '#E11D48', borderColor: '#BE123C' },
  cardBallText: { fontSize: 10, fontWeight: '800', color: '#0F172A' },
  cardBallTextWhite: { color: '#FFFFFF' },
  
  cardDividerLine: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  cardFooterRowLive: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  cardFooterRowFinished: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  matchStatusTimelineText: { fontSize: 12, fontWeight: '800', flex: 1, lineHeight: 16 },
  matchStatusLiveText: { color: '#059669' },
  matchStatusFinishedText: { color: '#0F172A' },
  tapToViewScorecardTag: { fontSize: 11, fontWeight: '800', color: '#059669' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyIconFrame: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#0F172A', fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 30, maxHeight: '88%', width: '100%' },
  dragIndicator: { width: 36, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalSheetTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSheetSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  closeSheetIcon: { backgroundColor: '#F1F5F9', padding: 6, borderRadius: 20 },
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