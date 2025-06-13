import { Alert } from 'react-native';
import { Note } from '../types/Note';
import { SubNoteUtils, HIERARCHY_CONFIG, CanCreateResult } from '../utils/subNoteUtils';

export interface HierarchyWarningOptions {
  showDepthWarnings: boolean;
  showPerformanceWarnings: boolean;
  showCircularReferenceWarnings: boolean;
  autoShowWarnings: boolean;
}

export interface HierarchyWarningResult {
  canProceed: boolean;
  userConfirmed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Comprehensive hierarchy warning system for multi-level sub-notes
 */
export class HierarchyWarningSystem {
  /**
   * Show depth warning when approaching or exceeding warning depth
   */
  static showDepthWarning(
    validation: CanCreateResult,
    parentNote: Note,
    onProceed: () => void,
    onCancel: () => void
  ): void {
    const currentDepth = validation.currentDepth;
    const newDepth = currentDepth + 1;
    
    let title = 'Derin Hiyerarşi Uyarısı';
    let message = `Bu not ${newDepth}. seviyede oluşturulacak.`;
    
    if (newDepth >= HIERARCHY_CONFIG.MAX_DEPTH) {
      title = 'Maksimum Derinlik Aşıldı';
      message = `Maksimum ${HIERARCHY_CONFIG.MAX_DEPTH} seviye derinliğe ulaştınız. Bu not oluşturulamaz.`;
      
      Alert.alert(title, message, [
        { text: 'Tamam', style: 'cancel', onPress: onCancel }
      ]);
      return;
    }

    if (newDepth >= HIERARCHY_CONFIG.WARNING_DEPTH) {
      message += `\n\nÇok derin hiyerarşiler navigasyonu zorlaştırabilir.`;
      message += `\n\nMevcut yol: ${this.buildHierarchyPath(parentNote)}`;
      
      const buttons = [
        { text: 'Detayları Gör', onPress: () => this.showHierarchyDetails(validation, parentNote) },
        { text: 'İptal', style: 'cancel' as const, onPress: onCancel },
        { text: 'Devam Et', onPress: onProceed }
      ];
      Alert.alert(title, message, buttons);
    } else {
      // No warning needed, proceed directly
      onProceed();
    }
  }

  /**
   * Show performance warning when approaching child limits
   */
  static showPerformanceWarning(
    validation: CanCreateResult,
    parentNote: Note,
    onProceed: () => void,
    onCancel: () => void
  ): void {
    const childrenCount = validation.childrenCount;
    
    if (childrenCount >= HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE) {
      Alert.alert(
        'Maksimum Alt Not Sayısı',
        `Bu not altında maksimum ${HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE} alt not bulunabilir. Yeni alt not oluşturulamaz.`,
        [{ text: 'Tamam', style: 'cancel', onPress: onCancel }]
      );
      return;
    }

    const warningThreshold = HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE * 0.8;
    if (childrenCount >= warningThreshold) {
      const message = `Bu not altında ${childrenCount} alt not var.\n\nÖneri: Alt notları kategorilere ayırın.`;
      
      Alert.alert(
        'Performans Uyarısı',
        message,
        [
          { text: 'Kategori Oluştur', onPress: () => this.showCategoryCreationSuggestion(parentNote) },
          { text: 'İptal', style: 'cancel', onPress: onCancel },
          { text: 'Yine de Ekle', onPress: onProceed }
        ]
      );
    } else {
      // No warning needed, proceed directly
      onProceed();
    }
  }

  /**
   * Show circular reference prevention warning
   */
  static showCircularReferenceWarning(
    noteId: string,
    parentId: string,
    allNotes: Note[],
    onCancel: () => void
  ): void {
    const circularRefs = SubNoteUtils.findCircularReferences(allNotes);
    const affectedNote = allNotes.find(n => n.id === noteId);
    const parentNote = allNotes.find(n => n.id === parentId);
    
    const message = `Bu işlem döngüsel referans oluşturacak.\n\n` +
      `"${affectedNote?.title || 'Başlıksız Not'}" notunu ` +
      `"${parentNote?.title || 'Başlıksız Not'}" notunun altına taşıyamazsınız.`;

    Alert.alert(
      'Döngüsel Referans Önlendi',
      message,
      [
        { text: 'Detayları Gör', onPress: () => this.showCircularReferenceDetails(circularRefs) },
        { text: 'Tamam', style: 'cancel', onPress: onCancel }
      ]
    );
  }

  /**
   * Comprehensive validation with all warnings
   */
  static async validateAndWarn(
    parentId: string,
    allNotes: Note[],
    options: HierarchyWarningOptions = {
      showDepthWarnings: true,
      showPerformanceWarnings: true,
      showCircularReferenceWarnings: true,
      autoShowWarnings: true
    }
  ): Promise<HierarchyWarningResult> {
    return new Promise((resolve) => {
      const validation = SubNoteUtils.canCreateSubNote(parentId, allNotes);
      const parentNote = allNotes.find(n => n.id === parentId);
      
      if (!parentNote) {
        resolve({
          canProceed: false,
          userConfirmed: false,
          warnings: [],
          errors: ['Parent note not found']
        });
        return;
      }

      // Check for hard errors first
      if (!validation.isValid) {
        const errors = [validation.reason || 'Unknown validation error'];
        
        if (options.autoShowWarnings) {
          Alert.alert(
            'Alt Not Oluşturulamıyor',
            validation.reason || 'Bu not için alt not oluşturulamıyor.',
            [{ text: 'Tamam', onPress: () => resolve({
              canProceed: false,
              userConfirmed: false,
              warnings: [],
              errors
            })}]
          );
        } else {
          resolve({
            canProceed: false,
            userConfirmed: false,
            warnings: [],
            errors
          });
        }
        return;
      }

      // Check for warnings
      const warnings = validation.warnings || [];
      
      if (warnings.length === 0 || !options.autoShowWarnings) {
        // No warnings or auto-warnings disabled
        resolve({
          canProceed: true,
          userConfirmed: true,
          warnings,
          errors: []
        });
        return;
      }

      // Show warnings dialog
      const message = warnings.join('\n\n') + '\n\nDevam etmek istiyor musunuz?';
      
      Alert.alert(
        'Hiyerarşi Uyarısı',
        message,
        [
          { 
            text: 'Detayları Gör',
            onPress: () => {
              this.showHierarchyDetails(validation, parentNote);
              resolve({
                canProceed: false,
                userConfirmed: false,
                warnings,
                errors: []
              });
            }
          },
          { 
            text: 'İptal',
            style: 'cancel',
            onPress: () => resolve({
              canProceed: false,
              userConfirmed: false,
              warnings,
              errors: []
            })
          },
          { 
            text: 'Devam Et',
            onPress: () => resolve({
              canProceed: true,
              userConfirmed: true,
              warnings,
              errors: []
            })
          }
        ]
      );
    });
  }

  /**
   * Show detailed hierarchy information
   */
  private static showHierarchyDetails(validation: CanCreateResult, parentNote: Note): void {
    const details = [
      `Mevcut Derinlik: ${validation.currentDepth}`,
      `Yeni Derinlik: ${validation.currentDepth + 1}`,
      `Maksimum Derinlik: ${validation.maxDepthAllowed}`,
      `Alt Not Sayısı: ${validation.childrenCount}`,
      `Performans: ${validation.wouldExceedDepth ? 'Kritik' : validation.wouldExceedChildren ? 'Uyarı' : 'İyi'}`,
    ];

    if (validation.suggestions && validation.suggestions.length > 0) {
      details.push('', 'Öneriler:');
      details.push(...validation.suggestions.map(s => `• ${s}`));
    }

    Alert.alert(
      'Hiyerarşi Detayları',
      details.join('\n'),
      [{ text: 'Tamam' }]
    );
  }

  /**
   * Show circular reference details
   */
  private static showCircularReferenceDetails(circularRefs: any[]): void {
    const details = circularRefs.length > 0 
      ? `${circularRefs.length} döngüsel referans tespit edildi.`
      : 'Döngüsel referans riski bulundu.';

    Alert.alert(
      'Döngüsel Referans Detayları',
      details,
      [{ text: 'Tamam' }]
    );
  }

  /**
   * Show category creation suggestion
   */
  private static showCategoryCreationSuggestion(parentNote: Note): void {
    const suggestions = [
      '1. Ana kategoriler oluşturun (ör: "Toplantılar", "Görevler")',
      '2. İlgili alt notları bu kategorilere taşıyın',
      '3. Yeni alt notları uygun kategoriler altında oluşturun'
    ];

    Alert.alert(
      'Kategori Oluşturma Önerisi',
      `"${parentNote.title || 'Bu not'}" için kategori düzenleme önerileri:\n\n${suggestions.join('\n\n')}`,
      [{ text: 'Anladım' }]
    );
  }

  /**
   * Build hierarchy path string for display
   */
  private static buildHierarchyPath(note: Note): string {
    // This would need access to allNotes to build the full path
    // For now, just return the note title
    return note.title || 'Başlıksız Not';
  }

  /**
   * Check hierarchy health and show issues if any
   */
  static checkHierarchyHealth(allNotes: Note[]): void {
    const health = SubNoteUtils.validateHierarchyHealth(allNotes);
    
    if (!health.isHealthy || health.warnings.length > 0) {
      const issues = [
        ...health.issues.map(issue => `❌ ${issue}`),
        ...health.warnings.map(warning => `⚠️ ${warning}`)
      ];

      const stats = [
        `📊 İstatistikler:`,
        `• Toplam not: ${health.stats.totalNotes}`,
        `• Ana not: ${health.stats.rootNotes}`,
        `• Maksimum derinlik: ${health.stats.maxDepth}`,
        `• Ortalama derinlik: ${health.stats.avgDepth}`,
      ];

      if (health.stats.circularReferences > 0) {
        stats.push(`• Döngüsel referans: ${health.stats.circularReferences}`);
      }

      const message = [...issues, '', ...stats].join('\n');

      Alert.alert(
        health.isHealthy ? 'Hiyerarşi Uyarıları' : 'Hiyerarşi Sorunları',
        message,
        [{ text: 'Tamam' }]
      );
    } else {
      Alert.alert(
        'Hiyerarşi Sağlıklı',
        '✅ Not hiyerarşiniz sağlıklı durumda.',
        [{ text: 'Tamam' }]
      );
    }
  }
}

export default HierarchyWarningSystem;