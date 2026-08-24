import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Phone, MapPin } from 'lucide-react-native';

export const CorporateFooter: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.footerSection, { backgroundColor: '#0D0E12', borderTopColor: 'rgba(255, 199, 0, 0.25)' }]}>
      <View style={styles.footerBrandRow}>
        <View style={styles.footerLogoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.footerLogo} resizeMode="cover" />
        </View>
        <View>
          <Text style={[styles.footerBrandTitle, { color: '#FFFFFF' }]}>Caryanam Bidding</Text>
          <Text style={styles.footerBrandSub}>B2B Used Vehicle Auctions</Text>
        </View>
      </View>
      <Text style={[styles.footerDesc, { color: '#9CA3AF' }]}>
        Verifiable auto-remarketing telemetry and digital bidding platform. Dedicated to absolute auction transparency and structural inspection compliance.
      </Text>

      <View style={styles.footerLinksGrid}>
        <View style={styles.footerCol}>
          <Text style={[styles.footerColTitle, { color: '#FFC700' }]}>PAGES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={[styles.footerLink, { color: '#E5E7EB' }]}>Home</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('About')}><Text style={[styles.footerLink, { color: '#E5E7EB' }]}>About Us</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('WhyChoose')}><Text style={[styles.footerLink, { color: '#E5E7EB' }]}>Why Choose Us</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Contact')}><Text style={[styles.footerLink, { color: '#E5E7EB' }]}>Contact Support</Text></TouchableOpacity>
        </View>

        <View style={styles.footerCol}>
          <Text style={[styles.footerColTitle, { color: '#FFC700' }]}>HEADQUARTERS</Text>
          <View style={styles.contactItemRow}>
            <Mail size={14} color="#FFC700" />
            <Text style={[styles.footerContactText, { color: '#E5E7EB', marginLeft: 6 }]}>support@caryanamlive.com</Text>
          </View>
          <View style={styles.contactItemRow}>
            <Phone size={14} color="#FFC700" />
            <Text style={[styles.footerContactText, { color: '#E5E7EB', marginLeft: 6 }]}>+91 7755994123</Text>
          </View>
          <View style={styles.contactItemRow}>
            <MapPin size={14} color="#FFC700" />
            <Text style={[styles.footerContactText, { color: '#E5E7EB', marginLeft: 6 }]}>Pune, Maharashtra 411014</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footerBottomRow, { borderTopColor: 'rgba(255, 255, 255, 0.12)' }]}>
        <View style={styles.footerLegalRow}>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.footerLegalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.footerLegalDivider}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TermsConditions')}>
            <Text style={styles.footerLegalLink}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.footerLegalDivider}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DeleteAccount')}>
            <Text style={styles.footerLegalLink}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.copyrightText, { color: '#9CA3AF', marginTop: 4 }]}>Developed by Caryanamindia Pvt Ltd</Text>
        <Text style={[styles.copyrightText, { color: '#9CA3AF' }]}>© 2026 Caryanam Bidding. All rights reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerSection: {
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  footerLogoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 199, 0, 0.6)',
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  footerBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  footerBrandSub: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '700',
  },
  footerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  footerCol: {
    gap: 8,
  },
  footerColTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerContactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerBottomRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 12,
  },
  footerLegalLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  footerLegalDivider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
  },
  copyrightText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
