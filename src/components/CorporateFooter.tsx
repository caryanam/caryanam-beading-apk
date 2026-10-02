import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { X, Shield, Scale } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CorporateFooter: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <View
      style={[
        styles.footerSection,
        {
          backgroundColor: isDark ? '#090B10' : '#0D0E12',
          borderTopColor: isDark ? 'rgba(255, 199, 0, 0.2)' : 'rgba(255, 199, 0, 0.25)',
        },
      ]}
    >
      {/* Privacy Policy & Terms and Conditions */}
      <View style={styles.footerLegalRow}>
        <TouchableOpacity
          onPress={() => setActiveModal('privacy')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.footerLegalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.footerLegalDivider}>|</Text>
        <TouchableOpacity
          onPress={() => setActiveModal('terms')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.footerLegalLink}>Terms & Conditions</Text>
        </TouchableOpacity>
      </View>

      {/* Developer Credit & Copyright */}
      <Text style={styles.devByText}>Developed by Caryanamindia Pvt Ltd</Text>
      <Text style={styles.copyrightText}>© 2026 Caryanam Live. All rights reserved.</Text>

      {/* Interactive Legal Modal (Theme-Aware) */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(0, 0, 0, 0.58)' }]}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#0F121A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 199, 0, 0.35)' : '#E2E8F0',
                shadowColor: isDark ? '#FFC700' : '#000000',
              },
            ]}
          >
            {/* Drag Handle Indicator */}
            <View
              style={[
                styles.modalHandle,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)' },
              ]}
            />

            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
              ]}
            >
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[
                    styles.modalBadgeIconWrap,
                    {
                      backgroundColor: isDark ? 'rgba(255, 199, 0, 0.15)' : '#FEF3C7',
                      borderColor: isDark ? 'rgba(255, 199, 0, 0.4)' : '#FDE68A',
                    },
                  ]}
                >
                  {activeModal === 'privacy' ? (
                    <Shield size={18} color={isDark ? '#FFC700' : '#D97706'} strokeWidth={2.2} />
                  ) : (
                    <Scale size={18} color={isDark ? '#FFC700' : '#D97706'} strokeWidth={2.2} />
                  )}
                </View>
                <View style={styles.modalHeaderTextWrap}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
                  </Text>
                  <Text style={[styles.modalSubTitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Caryanam India Pvt. Ltd. • Last Updated: Aug 2026
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={closeModal}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F1F5F9' },
                ]}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Legal Content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {activeModal === 'privacy' ? (
                <>
                  <View
                    style={[
                      styles.narrativeCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 199, 0, 0.08)' : '#FFFBEB',
                        borderColor: isDark ? 'rgba(255, 199, 0, 0.25)' : '#FDE68A',
                      },
                    ]}
                  >
                    <Text style={[styles.narrativeText, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      Caryanam India Pvt. Ltd. ("Caryanam", "we", "our") operates the Caryanam Live App. This Privacy Policy explains how we collect, store, and use information when you use our platform.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      1. Information We Collect
                    </Text>
                    <Text style={[styles.sectionSubHeading, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      We may collect:
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Name, mobile number and business email address
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Dealership/company registration and KYC documents
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Vehicle details, photos and 140+ point inspection records
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Real-time bidding logs and auction activity telemetry
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Device identifiers, network parameters and IP telemetry
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Security logs, login timestamps and audit trails
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      2. How We Use Information
                    </Text>
                    <Text style={[styles.sectionSubHeading, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      Information is utilized to:
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Authenticate, verify and manage authorized dealer accounts
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Host live vehicle bidding rooms and enforce bid contracts
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Record tamper-proof bid logs and auction telemetry
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Dispatch one-time passwords (OTPs), SMS and push notifications
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Prevent collusive bidding, fraud and unauthorized market activity
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Provide 24/7 technical assistance and dispute resolution
                    </Text>
                    <Text style={[styles.bulletItem, { color: isDark ? '#9CA3AF' : '#475569' }]}>
                      • Comply with statutory legal and regulatory obligations
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      3. Data Sharing & Protection
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      We share information solely with authorized service providers, verified business auction participants, secure cloud infrastructure partners, and statutory authorities where mandated by law.
                    </Text>
                    <Text
                      style={[
                        styles.sectionBodyText,
                        { marginTop: 8, color: isDark ? '#FFC700' : '#B45309', fontWeight: '700' },
                      ]}
                    >
                      We strictly never sell or trade your proprietary commercial data.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      4. Data Security Standards
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      We deploy industry-grade TLS encryption, salted hashing, and multi-factor authorization controls to safeguard dealer data and auction telemetries.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      5. Retention & User Rights
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Data is retained to preserve immutable audit trails, satisfy taxation compliance, and resolve transaction disputes. Users can request data updates or account deletion by contacting support.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      6. Helpline & Legal Contact
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Email: support@caryanamlive.com{'\n'}
                      Mobile Helpline: +91 7755994123{'\n'}
                      Address: Pune, Maharashtra 411014
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={[
                      styles.narrativeCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 199, 0, 0.08)' : '#FFFBEB',
                        borderColor: isDark ? 'rgba(255, 199, 0, 0.25)' : '#FDE68A',
                      },
                    ]}
                  >
                    <Text style={[styles.narrativeText, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      Caryanam India Pvt. Ltd. operates the Caryanam Live B2B Vehicle Bidding Platform. By accessing or participating in live auctions, you expressly agree to these Terms & Conditions.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      1. Authorized Dealer Eligibility
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Access is restricted to verified automotive dealers, enterprise fleets, certified inspectors, and registered freelancers. Users must maintain credential confidentiality.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      2. Irrevocable & Binding Bids
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      All bids placed during live auction countdowns represent legally binding purchase commitments. Once submitted, bids cannot be retracted, edited, or cancelled.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      3. Auction Integrity & Zero Collusion
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Bid manipulation, artificial price inflation (shill bidding), proxy accounts, and dealer collusion are strictly prohibited and result in permanent platform ban and legal remedies.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      4. Offline Payment & Physical Settlement
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      The Caryanam Live App functions as an auction matching and bidding telemetry portal. The platform does not process digital vehicle payments. All vehicle fund settlements, RTO paperwork, and physical delivery transfers take place offline directly between the parties.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      5. Inspection Telemetry & Due Diligence
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Certified 140+ point digital inspection reports provide evaluative guidance. Dealers are encouraged to review inspection sheets, OBD diagnostics, and condition photos prior to bidding.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      6. Account Default & Suspension
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Failure to honor winning bids within the stipulated offline settlement period will lead to immediate account suspension, security deposit forfeiture, and network blacklist.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.legalSectionCard,
                      {
                        backgroundColor: isDark ? '#161B26' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={[styles.sectionHeading, { color: isDark ? '#FFC700' : '#D97706' }]}>
                      7. Direct Inquiries & Arbitration
                    </Text>
                    <Text style={[styles.sectionBodyText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                      Email: support@caryanamlive.com{'\n'}
                      Mobile Helpline: +91 7755994123{'\n'}
                      Jurisdiction: Pune, Maharashtra
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Bottom Sticky Button */}
            <View
              style={[
                styles.modalBottomBar,
                {
                  backgroundColor: isDark ? '#0F121A' : '#FFFFFF',
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={closeModal}
                activeOpacity={0.85}
              >
                <Text style={styles.modalActionBtnText}>I Understand & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  footerSection: {
    borderTopWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 12,
  },
  footerLegalLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D1D5DB',
    letterSpacing: 0.2,
  },
  footerLegalDivider: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
  },
  devByText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  copyrightText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  /* Modal Base Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    maxHeight: Math.round(SCREEN_HEIGHT * 0.86),
    paddingTop: 10,
    paddingBottom: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  modalBadgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  modalSubTitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  narrativeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  narrativeText: {
    fontSize: 12.5,
    lineHeight: 18.5,
    fontWeight: '500',
  },
  legalSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sectionSubHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionBodyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  bulletItem: {
    fontSize: 11.8,
    lineHeight: 17.5,
    fontWeight: '400',
    marginBottom: 3,
  },
  modalBottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  modalActionBtnText: {
    color: '#0D0E12',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
