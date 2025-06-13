import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHierarchyPerformance } from '../utils/hierarchyPerformanceOptimizer';
import { Colors, Typography, Layout } from '../theme';
import { logger } from '../utils/logger';

interface HierarchyPerformanceMonitorProps {
  visible: boolean;
  onClose: () => void;
  noteId?: string;
  allNotes?: any[];
}

export const HierarchyPerformanceMonitor: React.FC<HierarchyPerformanceMonitorProps> = ({
  visible,
  onClose,
  noteId,
  allNotes = [],
}) => {
  const performance = useHierarchyPerformance();
  const [metrics, setMetrics] = useState(performance.getMetrics());
  const [memoryUsage, setMemoryUsage] = useState(performance.getMemoryUsage());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      refreshMetrics();
    }
  }, [visible]);

  const refreshMetrics = async () => {
    setRefreshing(true);
    try {
      // Refresh metrics
      const newMetrics = performance.getMetrics();
      const newMemoryUsage = performance.getMemoryUsage();
      
      setMetrics(newMetrics);
      setMemoryUsage(newMemoryUsage);
      
      logger.dev('[HierarchyPerformanceMonitor] Metrics refreshed');
    } catch (error) {
      logger.error('[HierarchyPerformanceMonitor] Failed to refresh metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Cache Temizle',
      'Tüm önbellek verileri silinecek. Bu işlem performansı geçici olarak etkileyebilir. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: () => {
            performance.clearCache();
            refreshMetrics();
            Alert.alert('Başarılı', 'Cache temizlendi.');
          },
        },
      ]
    );
  };

  const getPerformanceStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return Colors.success;
    if (value <= thresholds.warning) return Colors.warning;
    return Colors.error;
  };

  const getPerformanceStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'checkmark-circle';
    if (value <= thresholds.warning) return 'warning';
    return 'alert-circle';
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatTime = (value: number) => `${value.toFixed(2)}ms`;
  const formatMemory = (value: number) => `${value.toFixed(1)}KB`;

  const renderMetricCard = (
    title: string,
    value: string,
    icon: string,
    color: string,
    description?: string
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {description && (
        <Text style={styles.metricDescription}>{description}</Text>
      )}
    </View>
  );

  const renderRecommendations = () => {
    if (memoryUsage.recommendations.length === 0) {
      return (
        <View style={styles.noRecommendations}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.noRecommendationsText}>
            Performans optimal durumda
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Öneriler</Text>
        {memoryUsage.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons name="bulb" size={16} color={Colors.warning} />
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHierarchyInfo = () => {
    if (!noteId || !allNotes.length) return null;

    const stats = performance.getCachedStats(noteId, allNotes);
    const collapseRecommendations = performance.getCollapseRecommendations(noteId, allNotes);

    return (
      <View style={styles.hierarchyInfoContainer}>
        <Text style={styles.sectionTitle}>Mevcut Hiyerarşi</Text>
        
        <View style={styles.hierarchyStatsGrid}>
          <View style={styles.hierarchyStatItem}>
            <Text style={styles.hierarchyStatLabel}>Toplam Not</Text>
            <Text style={styles.hierarchyStatValue}>{stats.totalSize}</Text>
          </View>
          <View style={styles.hierarchyStatItem}>
            <Text style={styles.hierarchyStatLabel}>Derinlik</Text>
            <Text style={styles.hierarchyStatValue}>{stats.depth}</Text>
          </View>
          <View style={styles.hierarchyStatItem}>
            <Text style={styles.hierarchyStatLabel}>Alt Notlar</Text>
            <Text style={styles.hierarchyStatValue}>{stats.descendantCount}</Text>
          </View>
          <View style={styles.hierarchyStatItem}>
            <Text style={styles.hierarchyStatLabel}>Performans</Text>
            <Text style={[
              styles.hierarchyStatValue,
              { color: stats.performance === 'good' ? Colors.success : 
                        stats.performance === 'warning' ? Colors.warning : Colors.error }
            ]}>
              {stats.performance === 'good' ? 'İyi' :
               stats.performance === 'warning' ? 'Orta' : 'Kritik'}
            </Text>
          </View>
        </View>

        {collapseRecommendations.shouldAutoCollapse && (
          <View style={styles.collapseRecommendation}>
            <Ionicons name="information-circle" size={16} color={Colors.accent.darkBlue} />
            <Text style={styles.collapseRecommendationText}>
              Otomatik katlanma önerisi: {collapseRecommendations.recommendedCollapseDepth}. seviye sonrası
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performans İzleme</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshMetrics}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? Colors.textGray : Colors.accent.darkBlue} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.neutral.darkGray} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Performance Metrics */}
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Cache Hit Rate',
              formatPercentage(metrics.cacheHitRate),
              getPerformanceStatusIcon(1 - metrics.cacheHitRate, { good: 0.2, warning: 0.5 }),
              getPerformanceStatusColor(1 - metrics.cacheHitRate, { good: 0.2, warning: 0.5 }),
              'Önbellek isabet oranı'
            )}

            {renderMetricCard(
              'Hesaplama Süresi',
              formatTime(metrics.averageCalculationTime),
              getPerformanceStatusIcon(metrics.averageCalculationTime, { good: 10, warning: 50 }),
              getPerformanceStatusColor(metrics.averageCalculationTime, { good: 10, warning: 50 }),
              'Ortalama işlem süresi'
            )}

            {renderMetricCard(
              'Bellek Kullanımı',
              formatMemory(memoryUsage.memoryUsage / 1024),
              getPerformanceStatusIcon(memoryUsage.memoryUsage / 1024, { good: 500, warning: 1000 }),
              getPerformanceStatusColor(memoryUsage.memoryUsage / 1024, { good: 500, warning: 1000 }),
              'Tahmini RAM kullanımı'
            )}

            {renderMetricCard(
              'Cache Boyutu',
              `${Math.floor(memoryUsage.memoryUsage / 1024)} KB`,
              'archive',
              memoryUsage.memoryUsage > 500 * 1024 ? Colors.warning : Colors.success,
              'Önbellekteki toplam kayıt'
            )}
          </View>

          {/* Hierarchy Information */}
          {renderHierarchyInfo()}

          {/* Recommendations */}
          {renderRecommendations()}

          {/* Cache Management */}
          <View style={styles.cacheManagementContainer}>
            <Text style={styles.sectionTitle}>Cache Yönetimi</Text>
            <TouchableOpacity style={styles.clearCacheButton} onPress={clearCache}>
              <Ionicons name="trash" size={18} color={Colors.error} />
              <Text style={styles.clearCacheText}>Cache Temizle</Text>
            </TouchableOpacity>
            
            <Text style={styles.cacheInfo}>
              Son temizlik: {new Date(metrics.lastCleanup || Date.now()).toLocaleString('tr-TR')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.neutral.darkGray,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginLeft: 8,
  },
  metricValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricDescription: {
    ...Typography.caption,
    color: Colors.textGray,
  },
  hierarchyInfoContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral.darkGray,
    marginBottom: 12,
  },
  hierarchyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hierarchyStatItem: {
    width: '48%',
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  hierarchyStatLabel: {
    ...Typography.caption,
    color: Colors.textGray,
    marginBottom: 4,
  },
  hierarchyStatValue: {
    ...Typography.h3,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
  },
  collapseRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.darkBlue + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  collapseRecommendationText: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    marginLeft: 8,
    flex: 1,
  },
  recommendationsContainer: {
    marginVertical: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationText: {
    ...Typography.caption,
    color: Colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  noRecommendations: {
    alignItems: 'center',
    padding: 24,
  },
  noRecommendationsText: {
    ...Typography.body,
    color: Colors.success,
    marginTop: 8,
    textAlign: 'center',
  },
  cacheManagementContainer: {
    marginVertical: 16,
    paddingBottom: 32,
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  clearCacheText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  cacheInfo: {
    ...Typography.caption,
    color: Colors.textGray,
    textAlign: 'center',
  },
});
