import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from 'react-native';
import { SportEvent, useSports } from '../../context/SportsContext';

const { width, height } = Dimensions.get('window');

const FILTER_CATEGORIES = [
  { label: 'All Sports', value: 'All' },
  { label: 'Cricket', value: 'Cricket' },
  { label: 'Kabaddi', value: 'Kabaddi' },
  { label: 'Volleyball', value: 'Volleyball' },
  { label: 'Badminton', value: 'Badminton' },
  { label: 'Shuttle', value: 'Shuttle' },
  { label: 'Others', value: 'Others' },
];

export default function SportsScreen() {
  const { events } = useSports();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenDetails = (event: SportEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const openMapsDirections = (locationAddress: string) => {
    if (!locationAddress) {
      Alert.alert('Location Unavailable', 'No address was provided for this event.');
      return;
    }

    const encodedLocation = encodeURIComponent(locationAddress);
    const mapUrl = Platform.select({
      ios: `maps://app?daddr=${encodedLocation}`,
      android: `google.navigation:q=${encodedLocation}`,
    }) || `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;

    Linking.canOpenURL(mapUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapUrl);
        } else {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`);
      });
  };

  const getNormalizedTimestamp = (dateString: string): number => {
    if (!dateString) return Infinity;

    const cleanStr = dateString.replace(/e\.g\.,/gi, '').trim();
    const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      return new Date(year, month, day).getTime();
    }

    let parsed = Date.parse(cleanStr);
    if (isNaN(parsed)) {
      const currentYear = new Date().getFullYear();
      parsed = Date.parse(`${cleanStr} ${currentYear}`);
    }

    return isNaN(parsed) ? Infinity : parsed;
  };

  const getCountdownLabel = (dateString: string): { text: string; isToday: boolean; isTomorrow: boolean; isPast: boolean } => {
    const eventTime = getNormalizedTimestamp(dateString);
    if (eventTime === Infinity) return { text: 'SCHEDULED', isToday: false, isTomorrow: false, isPast: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(eventTime);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'TODAY MATCH', isToday: true, isTomorrow: false, isPast: false };
    } else if (diffDays === 1) {
      return { text: 'TOMORROW', isToday: false, isTomorrow: true, isPast: false };
    } else if (diffDays > 1) {
      return { text: `${diffDays} DAYS LEFT`, isToday: false, isTomorrow: false, isPast: false };
    } else {
      return { text: 'FINISHED', isToday: false, isTomorrow: false, isPast: true };
    }
  };

  const filteredEvents = events.filter((event) => {
    if (selectedCategory === 'All') return true;
    return event.sportCategory?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const sortedUpcomingEvents = [...filteredEvents].sort((a, b) => {
    const timeA = getNormalizedTimestamp(a.date);
    const timeB = getNormalizedTimestamp(b.date);
    return timeA - timeB;
  });

  // Filter Today's Matches
  const todayMatches = events.filter(e => {
    const label = getCountdownLabel(e.date);
    return label.isToday;
  });

  return (
    <View style={styles.mainContainer}>
      {/* 🏷️ Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TOURNAMENTS</Text>
          <Text style={styles.headerSubtitle}>Official Fixtures & Field Schedules</Text>
        </View>
        <View style={styles.verifiedOrganizerBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.verifiedOrganizerBadgeText}>Verified</Text>
        </View>
      </View>

      {/* 🌟 TODAY'S MATCHES SPOTLIGHT SECTION */}
      {todayMatches.length > 0 && (
        <View style={styles.todaySectionContainer}>
          <View style={styles.todaySectionHeader}>
            <View style={styles.livePulseDot} />
            <Text style={styles.todaySectionTitle}>TODAY'S MATCHES ({todayMatches.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.todayCardsScroll}>
            {todayMatches.map((tEvent) => (
              <TouchableOpacity
                key={`today-${tEvent.id}`}
                style={styles.todayFeaturedCard}
                activeOpacity={0.9}
                onPress={() => handleOpenDetails(tEvent)}
              >
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
                <Text style={styles.todayMatchName} numberOfLines={1}>{tEvent.name}</Text>
                <View style={styles.todayLocationRow}>
                  <Ionicons name="location" size={12} color="#059669" />
                  <Text style={styles.todayLocationText} numberOfLines={1}>{tEvent.location}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 🎚️ Categorical Filter Bar */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
          {FILTER_CATEGORIES.map((item) => {
            const isSelected = selectedCategory === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCategory(item.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 📋 Timeline Fixture Cards */}
      {sortedUpcomingEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={32} color="#0F172A" />
          </View>
          <Text style={styles.emptyText}>No fixtures listed under "{selectedCategory}"</Text>
          <Text style={styles.emptySubtext}>Select another category or host a tournament from your profile.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedUpcomingEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const countdown = getCountdownLabel(item.date);

            return (
              <TouchableOpacity
                style={[
                  styles.premiumCard,
                  countdown.isToday && styles.todayCardBorder,
                  countdown.isPast && styles.pastCardOpacity,
                ]}
                activeOpacity={0.92}
                onPress={() => handleOpenDetails(item)}
              >
                {/* Upper Ribbon */}
                <View style={styles.cardTopStrip}>
                  <View style={styles.sportBadge}>
                    <Ionicons name="trophy-outline" size={13} color="#0F172A" />
                    <Text style={styles.sportBadgeText}>{item.sportCategory?.toUpperCase() || 'SPORTS'}</Text>
                  </View>

                  <View
                    style={[
                      styles.timelineBadge,
                      countdown.isToday
                        ? styles.badgeTodayBg
                        : countdown.isTomorrow
                        ? styles.badgeTomorrowBg
                        : styles.badgeNormalBg,
                    ]}
                  >
                    <Ionicons
                      name={countdown.isToday ? 'flash' : 'time-outline'}
                      size={11}
                      color={countdown.isToday ? '#FFFFFF' : '#0F172A'}
                    />
                    <Text
                      style={[
                        styles.timelineBadgeText,
                        countdown.isToday ? styles.textWhite : styles.textDark,
                      ]}
                    >
                      {countdown.text}
                    </Text>
                  </View>
                </View>

                {/* Main Content */}
                <View style={styles.cardBody}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.tournamentName} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <View style={styles.metaContainer}>
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={15} color="#475569" />
                        <Text style={[styles.metaText, countdown.isToday && styles.todayDateText]}>
                          {item.date}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.locationLinkButton}
                        activeOpacity={0.7}
                        onPress={() => openMapsDirections(item.location)}
                      >
                        <Ionicons name="navigate-circle" size={16} color="#059669" />
                        <Text style={styles.locationLinkText} numberOfLines={1}>
                          {item.location}
                        </Text>
                        <View style={styles.mapPill}>
                          <Text style={styles.mapPillText}>MAP</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Thumbnail Cover */}
                  <View style={styles.thumbnailWrapper}>
                    <Image source={{ uri: item.poster }} style={styles.miniThumbnail} />
                  </View>
                </View>

                <View style={styles.cardDividerLine} />

                {/* Footer CTA */}
                <View style={styles.cardFooter}>
                  <View style={styles.matchCountTag}>
                    <Ionicons name="football-outline" size={12} color="#64748B" />
                    <Text style={styles.matchCountTagText}>
                      {item.matches?.length || 0} Matches Registered
                    </Text>
                  </View>
                  <View style={styles.viewBrochureCTA}>
                    <Text style={styles.viewBrochureCTAText}>View Invitation</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0F172A" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 🖼️ High-Res Event Brochure Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleCluster}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>
                  {selectedEvent?.name}
                </Text>
                <Text style={styles.modalSheetSubtitle}>Official Entry & Fixture Details</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeSheetIcon}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {selectedEvent?.poster && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedEvent.poster }} style={styles.premiumPreviewImage} />
                </View>
              )}

              <Text style={styles.deckLabelTitle}>Tournament Specifications</Text>

              <View style={styles.infoSummaryGrid}>
                <View style={styles.gridCell}>
                  <View style={styles.cellIconFrame}>
                    <Ionicons name="calendar" size={16} color="#0F172A" />
                  </View>
                  <View style={styles.cellTextStack}>
                    <Text style={styles.cellLabel}>SCHEDULE DATE</Text>
                    <Text style={styles.cellValue}>{selectedEvent?.date}</Text>
                  </View>
                </View>

                <View style={styles.gridCell}>
                  <View style={styles.cellIconFrame}>
                    <Ionicons name="trophy" size={16} color="#0F172A" />
                  </View>
                  <View style={styles.cellTextStack}>
                    <Text style={styles.cellLabel}>CATEGORY</Text>
                    <Text style={styles.cellValue}>{selectedEvent?.sportCategory}</Text>
                  </View>
                </View>

                {/* 📍 Direct Map Navigation Block */}
                <TouchableOpacity
                  style={[styles.gridCell, styles.mapNavigationGridCell]}
                  activeOpacity={0.85}
                  onPress={() => selectedEvent?.location && openMapsDirections(selectedEvent.location)}
                >
                  <View style={[styles.cellIconFrame, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="navigate" size={18} color="#059669" />
                  </View>
                  <View style={styles.cellTextStack}>
                    <View style={styles.mapPromptHeader}>
                      <Text style={[styles.cellLabel, { color: '#059669' }]}>VENUE LOCATION</Text>
                      <Text style={styles.openGpsTag}>TAP TO NAVIGATE</Text>
                    </View>
                    <Text style={styles.cellValue} numberOfLines={2}>
                      {selectedEvent?.location}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.routeActionBtn}
                activeOpacity={0.88}
                onPress={() => selectedEvent?.location && openMapsDirections(selectedEvent.location)}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <Text style={styles.routeActionBtnText}>Get Turn-by-Turn Route</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 54 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  headerTitle: { color: '#0F172A', fontWeight: '900', letterSpacing: 0.5, fontSize: 24 },
  headerSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500', marginTop: 1 },
  verifiedOrganizerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#A7F3D0' },
  verifiedOrganizerBadgeText: { color: '#059669', fontSize: 11, fontWeight: '800' },

  /* 🌟 Today's Section Styling */
  todaySectionContainer: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  todaySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  livePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  todaySectionTitle: { fontSize: 11, fontWeight: '900', color: '#059669', letterSpacing: 0.5 },
  todayCardsScroll: { gap: 10 },
  todayFeaturedCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC', minWidth: 160, maxWidth: 200 },
  todayBadge: { backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  todayBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  todayMatchName: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  todayLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayLocationText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  filterWrapper: { marginBottom: 12 },
  filterScrollContainer: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterChipText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  scrollContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  todayCardBorder: { borderLeftWidth: 5, borderLeftColor: '#059669', borderColor: '#BBF7D0' },
  pastCardOpacity: { opacity: 0.75 },

  cardTopStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sportBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sportBadgeText: { color: '#0F172A', fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },

  timelineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTodayBg: { backgroundColor: '#059669' },
  badgeTomorrowBg: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  badgeNormalBg: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  timelineBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  textWhite: { color: '#FFFFFF' },
  textDark: { color: '#0F172A' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  infoColumn: { flex: 1, justifyContent: 'space-between' },
  tournamentName: { color: '#0F172A', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  metaContainer: { gap: 8, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#475569', fontSize: 13, fontWeight: '600', flex: 1 },
  todayDateText: { color: '#059669', fontWeight: '800' },

  locationLinkButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', maxWidth: '100%' },
  locationLinkText: { color: '#059669', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  mapPill: { backgroundColor: '#A7F3D0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  mapPillText: { fontSize: 8, fontWeight: '900', color: '#065F46' },

  thumbnailWrapper: { width: 78, height: 96, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  miniThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },

  cardDividerLine: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchCountTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchCountTagText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  viewBrochureCTA: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBrochureCTAText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 70, paddingHorizontal: 32, gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#0F172A', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptySubtext: { color: '#64748B', fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 28, maxHeight: '92%', width: '100%' },
  dragIndicator: { width: 36, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitleCluster: { flex: 0.85 },
  modalSheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSheetSubtitle: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 1 },
  closeSheetIcon: { backgroundColor: '#F1F5F9', padding: 6, borderRadius: 20 },
  modalScrollContent: { paddingBottom: 20 },
  previewContainer: { width: '100%', height: height * 0.48, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  premiumPreviewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  deckLabelTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  infoSummaryGrid: { gap: 10, marginBottom: 16 },
  gridCell: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  mapNavigationGridCell: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  cellIconFrame: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cellTextStack: { flex: 1, gap: 2 },
  cellLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.4 },
  cellValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 17 },
  mapPromptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  openGpsTag: { fontSize: 9, fontWeight: '900', color: '#059669' },
  routeActionBtn: { backgroundColor: '#0F172A', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  routeActionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});