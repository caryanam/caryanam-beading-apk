import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Download,
  Zap,
  Clock,
  ShieldCheck,
  TriangleAlert,
  Gauge,
  Fuel,
  Cog,
  CalendarDays,
  TrendingUp,
  Sparkles,
  User,
  Image as ImageIcon,
  Car,
  Settings2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Video as VideoIcon,
  Play,
  X,
  Pause,
  Volume2,
  CircleCheckBig,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react-native';
import Video from 'react-native-video';
import { dealerService } from '../services/dealerService';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

const timeLeft = (endsAt?: number): string => {
  if (!endsAt) return 'Ended';
  const diff = endsAt - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};

const isActualVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0].split('#')[0];
  if (clean.startsWith('data:video/')) return true;
  return /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(clean);
};

const formatMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

const getConditionColor = (condStr: string): { bg: string; fg: string; border: string } => {
  const c = (condStr || '').trim().toUpperCase();
  if (['OK', 'WORKING', 'AVAILABLE', 'YES', 'EFFECTIVE / OK'].includes(c)) {
    return { bg: 'rgba(16,185,129,0.12)', fg: '#10B981', border: 'rgba(16,185,129,0.3)' };
  }
  if (['REPAINTED', 'CHANGED', 'SCRATCH', 'LOW', 'NEED REPLACEMENT'].includes(c)) {
    return { bg: 'rgba(245,158,11,0.12)', fg: '#D97706', border: 'rgba(245,158,11,0.3)' };
  }
  if (['DENT', 'RUST', 'DAMAGED', 'NOT OK', 'NOT WORKING', 'MISSING', 'NO'].includes(c)) {
    return { bg: 'rgba(244,63,94,0.12)', fg: '#F43F5E', border: 'rgba(244,63,94,0.3)' };
  }
  return { bg: 'rgba(148,163,184,0.1)', fg: '#94A3B8', border: 'rgba(148,163,184,0.2)' };
};

interface DealerVehicleDetailScreenProps {
  navigation: any;
  route: any;
  onOpenMenu: () => void;
}

export const DealerVehicleDetailScreen: React.FC<DealerVehicleDetailScreenProps> = ({ navigation, route, onOpenMenu: _onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const vehicleId = route?.params?.vehicleId || route?.params?.id;

  const [vehicle, setVehicle] = useState<any>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState(0);
  const [remaining, setRemaining] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [playingVideoTitle, setPlayingVideoTitle] = useState<string | null>(null);
  const [isCardVideoPlaying, setIsCardVideoPlaying] = useState<boolean>(false);
  const [cardVideoProgress, setCardVideoProgress] = useState<number>(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState('car_documents');
  const [dealerReplyText, setDealerReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let interval: any = null;
    if (isCardVideoPlaying) {
      interval = setInterval(() => {
        setCardVideoProgress((prev) => (prev >= 100 ? 0 : prev + 2.5));
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCardVideoPlaying]);

  const handlePlayVideo = (url: string | null) => {
    if (!url) return;
    setPlayingVideoTitle('Inspection Video');
    setIsCardVideoPlaying(true);
    setCardVideoProgress(5);
  };



  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await authService.getStoredSession();
      setSession(s);
      await loadDetails();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const loadDetails = async () => {
    const targetId = route?.params?.vehicleId || route?.params?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }
    try {
      let res: any = null;
      try {
        res = await dealerService.getMarketplaceInspectionDetails(Number(targetId));
      } catch (e) {
        console.log('Dealer marketplace API failed, trying admin/public fallback...', e);
      }
      if (!res || !res.success || !res.data) {
        try {
          res = await adminService.getInspectionById(Number(targetId));
        } catch (e2) {
          console.log('Admin inspection API failed, trying public API fallback...', e2);
          res = await dealerService.getPublicInspectionDetails(Number(targetId));
        }
      }
      const raw = res?.data || res;
      if (raw && (raw.inspectionId || raw.vehicleDetails || raw.status)) {
        const raw = res.data;
        setRawDetails(raw);
        const v = raw.vehicleDetails || {};
        const inspectionId = raw.inspectionId || Number(vehicleId);

        const basePrice = v.suggestedPrice || 0;
        const history = raw.bidHistory || [];
        const topBidInHistory = history.length > 0 ? history[0].amount || history[0].bidAmount || 0 : 0;
        const topBidderInHistory = history.length > 0 ? history[0].dealerName || history[0].dealer || history[0].dealershipName : null;

        const highestBid = Math.max(
          v.currentHighestBid && v.currentHighestBid > 0 ? v.currentHighestBid : 0,
          topBidInHistory,
        );
        const bidCount = Math.max(v.totalBids || 0, history.length);
        const highestBidder = topBidderInHistory || (v.currentHighestBidder ? v.currentHighestBidder.dealershipName || v.currentHighestBidder : null);

        let fuelType = 'Petrol';
        const f = (v.fuelType || '').toLowerCase();
        if (f.includes('diesel')) fuelType = 'Diesel';
        else if (f.includes('cng')) fuelType = 'CNG';
        else if (f.includes('lpg')) fuelType = 'LPG';
        else if (f.includes('hybrid')) fuelType = 'Hybrid';
        else if (f.includes('electric') || f.includes('ev')) fuelType = 'Electric';
        else if (v.fuelType) fuelType = v.fuelType;

        let transmissionType = 'Manual';
        const t = (v.transmission || '').toLowerCase();
        if (t.includes('auto')) transmissionType = 'Automatic';

        const endsAtTime = v.auctionEndTime || Date.now() + 1000 * 60 * 60 * 24;

        const r = raw.ratings || {};
        const extR = r.exterior || r.exteriorRating || 0;
        const mechR = r.mechanical || r.mechanicalRating || 0;
        const tyreR = r.tyre || r.tyreRating || 0;
        const intR = r.interior || r.interiorRating || 0;
        const hasRatings = extR > 0 || mechR > 0 || tyreR > 0 || intR > 0;
        const calculatedScore = hasRatings
          ? Math.round(((extR + mechR + tyreR + intR) / 4) * 20)
          : 88 + (inspectionId % 10);

        const imageList = raw.inspectionPhotos || [];
        const validPhotos = imageList
          .filter((img: any) => img.imageUrl)
          .map((img: any) => ({
            url: formatMediaUrl(img.imageUrl),
            name: img.displayName || img.imageCategory || 'Inspection View',
            photoType: img.photoType,
            category: img.imageCategory,
          }));
        const imageOnlyPhotos = validPhotos.filter((p: any) => !isActualVideoUrl(p.url));
        const finalImages = validPhotos.length > 0 ? validPhotos : [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', name: 'Front View' }];
        const primaryImage = (imageOnlyPhotos.length > 0 ? imageOnlyPhotos[0] : finalImages[0]).url;

        const photoVideos = imageList
          .filter((p: any) => p.captured !== false && p.imageUrl && isActualVideoUrl(p.imageUrl))
          .map((p: any) => ({
            displayName: p.displayName || p.imageCategory || 'Inspection Video',
            videoUrl: p.imageUrl,
            condition: p.condition || 'NORMAL',
          }));
        const rawVideos = (raw.inspectionVideos || []).filter((vid: any) => (vid.videoUrl || vid.imageUrl) && vid.captured !== false);
        const videoList = [...photoVideos, ...rawVideos];

        let auction = 'scheduled' as string;
        if (v.vehicleStatus === 'LIVE') auction = 'live';
        else if (v.vehicleStatus === 'SOLD OUT' || v.vehicleStatus === 'SOLD_OUT' || v.vehicleStatus === 'SOLD') auction = 'sold out';
        else if (v.vehicleStatus === 'ENDED' || v.vehicleStatus === 'AUCTION ENDED' || v.vehicleStatus === 'AUCTION_ENDED') auction = 'ended';

        const rawRegYear = v.registrationYear || v.regYear || v.registrationDate || null;
        let regYearStr = 'N/A';
        if (rawRegYear && String(rawRegYear).trim() !== '' && String(rawRegYear) !== 'null' && String(rawRegYear) !== 'undefined') {
          regYearStr = String(rawRegYear).slice(0, 4);
        }

        const rawOwner = v.ownership || v.owner || v.ownerType || v.numberOfOwners || 1;
        const ownerFormatted = typeof rawOwner === 'number'
          ? `${rawOwner}${rawOwner === 1 ? 'st' : rawOwner === 2 ? 'nd' : rawOwner === 3 ? 'rd' : 'th'} Owner`
          : String(rawOwner || '1st Owner');

        const mapped = {
          id: String(inspectionId),
          brand: v.brand || 'Vehicle',
          model: v.model || 'Details',
          variant: v.variant || '',
          year: v.manufacturingYear || 2020,
          regYear: regYearStr,
          ownership: ownerFormatted,
          fuel: fuelType,
          transmission: transmissionType,
          odometer: v.odometerReading || 45000,
          insuranceStatus: v.insuranceStatus || 'Expired / N/A',
          location: v.location || 'N/A',
          rtoInformation: v.rtoInformation || v.rto || 'N/A',
          rsAvailability: v.rsAvailability || v.roadsideAssistance || 'N/A',
          duplicateKey: v.duplicateKey || 'N/A',
          rtoNocIssued: v.rtoNocIssued || v.rtoNoc || 'N/A',
          underHypothecation: v.underHypothecation || v.hypothecation || 'N/A',
          mismatchInRc: v.mismatchInRc || v.rcMismatch || 'N/A',
          roadTaxPaid: v.roadTaxPaid || v.roadTax || 'N/A',
          fitnessUpto: v.fitnessUpto || v.fitnessDate || 'N/A',
          score: calculatedScore,
          basePrice,
          highestBid,
          highestBidder,
          bids: bidCount,
          auction,
          image: primaryImage,
          images: finalImages,
          videos: videoList,
          endsAt: endsAtTime,

          vehicleStatus: v.vehicleStatus,
          sellerAgreed: v.sellerAgreed,
          sellerCounterPrice: v.sellerCounterPrice,
          sellerMessage: v.sellerMessage,
          adminDealerMessage: v.adminDealerMessage,
          dealerReplyMessage: v.dealerReplyMessage,
        };
        setVehicle(mapped);
        setBidHistory(raw.bidHistory || []);
        const startAmount = highestBid > 0 ? highestBid + 2000 : basePrice || 2000;
        setAmount(startAmount);
        setRemaining(timeLeft(endsAtTime));
      }
    } catch (err) {
      console.error('Failed to load vehicle details', err);
      showToast({ message: 'Could not retrieve vehicle details.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Timer for remaining time
  useEffect(() => {
    if (!vehicle?.endsAt) return;
    const tick = () => setRemaining(timeLeft(vehicle.endsAt));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [vehicle?.endsAt]);

  // Live WebSocket auction updates (mirrors web VehicleDetail.tsx)
  useEffect(() => {
    if (!vehicleId || loading) return;

    let socket: WebSocket | null = null;
    let manuallyClosed = false;

    const baseUrl = API_BASE_URL.replace(/\/+$/, '');
    const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    let host = 'localhost:8080';
    if (baseUrl.includes('://')) {
      host = baseUrl.split('://')[1];
    } else if (baseUrl) {
      host = baseUrl;
    }
    const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${vehicleId}`;

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (
          (data.type === 'BID_UPDATE' || data.type === 'GO_LIVE') &&
          Number(data.inspectionId) === Number(vehicleId)
        ) {
          setVehicle((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              highestBid: data.currentHighestBid,
              highestBidder: data.currentHighestBidder,
              bids: data.totalBids,
              endsAt: data.auctionEndTime,
              auction: 'live',
              vehicleStatus: 'LIVE',
            };
          });
          setBidHistory(data.bidHistory || []);
          setAmount((prev: number) => {
            const base = data.currentHighestBid && data.currentHighestBid > 0 ? data.currentHighestBid : prev;
            return Math.max(prev, base) + 2000;
          });
        } else if (
          data.type === 'AUCTION_ENDED' &&
          Number(data.inspectionId) === Number(vehicleId)
        ) {
          setVehicle((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              vehicleStatus: 'SOLD OUT',
              auction: 'completed',
              highestBidder: data.winner,
            };
          });
          showToast({ message: 'Auction has ended.', type: 'info' });
        } else if (data.type === 'SELLER_RESPONSE' && Number(data.inspectionId) === Number(vehicleId)) {
          setVehicle((prev: any) =>
            prev
              ? {
                ...prev,
                sellerAgreed: data.sellerAgreed,
                sellerCounterPrice: data.sellerCounterPrice,
                sellerMessage: data.sellerMessage,
              }
              : prev,
          );
        } else if (data.type === 'ADMIN_DEALER_MESSAGE' && Number(data.inspectionId) === Number(vehicleId)) {
          setVehicle((prev: any) =>
            prev ? { ...prev, adminDealerMessage: data.adminDealerMessage || data.message } : prev,
          );
        } else if (data.type === 'DEALER_REPLY' && Number(data.inspectionId) === Number(vehicleId)) {
          setVehicle((prev: any) =>
            prev ? { ...prev, dealerReplyMessage: data.dealerReplyMessage || data.reply } : prev,
          );
        } else if (data.type === 'VEHICLE_STATUS_UPDATE' && Number(data.inspectionId) === Number(vehicleId)) {
          setVehicle((prev: any) =>
            prev ? { ...prev, vehicleStatus: data.vehicleStatus || 'ENDED' } : prev,
          );
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };

    const connect = () => {
      if (manuallyClosed) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        socket.onmessage = handleMessage;
        socket.onerror = () => {
          try {
            if (socket) socket.close();
          } catch (e) { }
        };
        socket.onclose = () => {
          if (wsRef.current === socket) wsRef.current = null;
          if (!manuallyClosed) {
            wsReconnectRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        console.error('Failed to open websocket for auction room', e);
        if (!manuallyClosed) {
          wsReconnectRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      manuallyClosed = true;
      if (wsReconnectRef.current) {
        clearTimeout(wsReconnectRef.current);
        wsReconnectRef.current = null;
      }
      if (socket) socket.close(1000);
      if (wsRef.current === socket) wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, loading]);

  // Check wishlist status
  useEffect(() => {
    if (!vehicle?.id) return;
    const checkWishlist = async () => {
      try {
        const res = await dealerService.getWishlist();
        if (res.success && res.data) {
          setIsFavourite(res.data.some((item: any) => String(item.inspectionId || item.id) === String(vehicle.id)));
        }
      } catch (err) {
        console.error('Failed to fetch wishlist status', err);
      }
    };
    checkWishlist();
  }, [vehicle?.id]);

  const handleDownloadPdf = async () => {
    if (!vehicle?.id) return;
    setDownloadingPdf(true);
    try {
      await dealerService.downloadDealerPdf(Number(vehicle.id));
      Alert.alert('Success', 'Inspection PDF report downloaded successfully.');
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Failed to download PDF report.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!vehicle || favouriteLoading) return;
    setFavouriteLoading(true);
    try {
      if (isFavourite) {
        const res = await dealerService.removeFromWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(false);
          showToast({ message: 'Removed from watchlist.', type: 'success' });
        } else {
          showToast({ message: 'Failed to remove from watchlist.', type: 'error' });
        }
      } else {
        const res = await dealerService.addToWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(true);
          showToast({ message: 'Added to favourites watchlist!', type: 'success' });
        } else {
          showToast({ message: 'Failed to add to watchlist.', type: 'error' });
        }
      }
    } catch (err) {
      showToast({ message: 'Could not update watchlist.', type: 'error' });
    } finally {
      setFavouriteLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!vehicle || submittingBid) return;
    if (isWinner) {
      showToast({ message: 'You already hold the highest bid on this vehicle.', type: 'info' });
      return;
    }
    const currentHighest = vehicle.highestBid || 0;
    const minBidRequired = currentHighest > 0 ? currentHighest + 1000 : vehicle.basePrice || 10000;
    if (amount < minBidRequired) {
      showToast({
        message: `Bid amount must be at least ${inr(minBidRequired)} to outbid current highest bid.`,
        type: 'error',
      });
      return;
    }
    setSubmittingBid(true);
    try {
      const res = await dealerService.placeBid(Number(vehicleId), amount);
      if (res.success) {
        showToast({ message: `Bid of ${inr(amount)} submitted successfully!`, type: 'success' });
        setVehicle((prev: any) => ({
          ...prev,
          highestBid: amount,
          bids: (prev.bids || 0) + 1,
          highestBidder: session?.dealershipName || session?.name || 'You',
        }));
        setAmount(amount + 2000);
      } else {
        showToast({ message: res.message || 'Failed to place bid.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to submit bid.', type: 'error' });
    } finally {
      setSubmittingBid(false);
    }
  };

  const addQuickIncrement = (increment: number) => {
    const currentHighest = vehicle?.highestBid || 0;
    const base = currentHighest > 0 ? currentHighest : vehicle?.basePrice || 0;
    const nextAmount = Math.max(amount, base) + increment;
    setAmount(nextAmount);
  };

  const handleSendDealerReply = async () => {
    if (!vehicleId || !dealerReplyText.trim()) {
      showToast({ message: 'Please enter a reply message.', type: 'error' });
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await dealerService.submitDealerReply(Number(vehicleId), dealerReplyText);
      if (res.success) {
        showToast({ message: 'Reply sent to Admin!', type: 'success' });
        setVehicle((prev: any) => ({ ...prev, dealerReplyMessage: dealerReplyText }));
        setDealerReplyText('');
      } else {
        showToast({ message: 'Failed to send reply.', type: 'error' });
      }
    } catch (err) {
      showToast({ message: 'Error sending reply.', type: 'error' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const myName = (session?.name || '').toLowerCase().trim();
  const myEmail = (session?.email || '').toLowerCase().trim();
  const myDealership = (session?.dealershipName || '').toLowerCase().trim();
  const myId = session?.id;

  const isLive = vehicle?.auction === 'live';
  const isComingSoon = vehicle?.auction === 'scheduled' || vehicle?.auction === 'coming soon';
  const isEnded =
    vehicle &&
    (vehicle.auction === 'sold out' ||
      vehicle.auction === 'ended' ||
      vehicle.vehicleStatus === 'ENDED' ||
      vehicle.vehicleStatus === 'SOLD OUT' ||
      vehicle.vehicleStatus === 'SOLD' ||
      remaining === 'Ended');

  const noBids = vehicle && (!vehicle.highestBidder || vehicle.highestBidder === 'No bids' || vehicle.bids === 0);

  const topBid = bidHistory[0];
  const topBidderStr = (
    vehicle?.highestBidder ||
    rawDetails?.vehicleDetails?.currentHighestBidder ||
    rawDetails?.currentHighestBidder?.dealershipName ||
    rawDetails?.currentHighestBidder?.ownerName ||
    rawDetails?.currentHighestBidder?.email ||
    topBid?.dealer ||
    topBid?.dealerName ||
    topBid?.dealershipName ||
    ''
  ).toLowerCase().trim();

  const isWinner =
    vehicle &&
    !noBids &&
    Boolean(
      session &&
      ((myId && topBid?.dealerId && String(topBid.dealerId) === String(myId)) ||
        (myId && rawDetails?.vehicleDetails?.currentHighestBidderId && String(rawDetails.vehicleDetails.currentHighestBidderId) === String(myId)) ||
        (myEmail && topBid?.dealerEmail && topBid.dealerEmail.toLowerCase().trim() === myEmail) ||
        (myName && topBidderStr.length > 0 && topBidderStr.includes(myName)) ||
        (myEmail && topBidderStr.length > 0 && topBidderStr.includes(myEmail)) ||
        (myDealership && topBidderStr.length > 0 && topBidderStr.includes(myDealership))),
    );

  const participated =
    vehicle &&
    bidHistory.some((b: any) => {
      const bd = (b.dealer || b.dealerName || b.dealershipName || b.dealerEmail || '').toLowerCase().trim();
      return (
        (myName && bd.includes(myName)) ||
        (myEmail && bd.includes(myEmail)) ||
        (myDealership && bd.includes(myDealership))
      );
    });

  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : '#F2F4FA';

  const specs = useMemo(() => {
    if (!vehicle) return [];
    return [
      { label: 'Registration Year', value: vehicle.regYear && vehicle.regYear !== 'null' && vehicle.regYear !== 'undefined' ? vehicle.regYear : 'N/A', icon: CalendarDays },
      { label: 'Ownership', value: String(vehicle.ownership || '1st Owner'), icon: User },
      { label: 'Manufacturing Year', value: String(vehicle.year), icon: CalendarDays },
      { label: 'Variant & Trim', value: vehicle.variant || 'Standard', icon: Cog },
      { label: 'Fuel Type', value: vehicle.fuel, icon: Fuel },
      { label: 'Transmission', value: vehicle.transmission, icon: Cog },
      { label: 'Odometer Reading', value: `${vehicle.odometer} km`, icon: Gauge },
      { label: 'Insurance Status', value: vehicle.insuranceStatus || 'Expired / N/A', icon: ShieldCheck },
      { label: 'Location', value: vehicle.location || 'N/A', icon: ShieldCheck },
      { label: 'Base Price', value: inr(vehicle.basePrice), icon: TrendingUp },
    ];
  }, [vehicle]);

  const documentSpecs = useMemo(() => {
    if (!vehicle) return [];
    return [
      { label: 'RTO Information', value: vehicle.rtoInformation || 'N/A', icon: ShieldCheck },
      { label: 'RS Availability', value: vehicle.rsAvailability || 'N/A', icon: ShieldCheck },
      { label: 'Duplicate Key Availability', value: vehicle.duplicateKey || 'N/A', icon: Cog },
      { label: 'RTO NOC Issued', value: vehicle.rtoNocIssued || 'N/A', icon: ShieldCheck },
      { label: 'Under Hypothecation', value: vehicle.underHypothecation || 'N/A', icon: ShieldCheck },
      { label: 'Mismatch in RC', value: vehicle.mismatchInRc || 'N/A', icon: ShieldCheck },
      { label: 'Road Tax Paid Status', value: vehicle.roadTaxPaid || 'N/A', icon: TrendingUp },
      { label: 'Fitness Valid Upto Date', value: vehicle.fitnessUpto || 'N/A', icon: CalendarDays },
    ];
  }, [vehicle]);

  const ratings = rawDetails?.ratings || {};
  const mechanical = rawDetails?.mechanicalDetails || {};
  const tyre = rawDetails?.tyreDetails || {};
  const interior = rawDetails?.interiorDetails || {};
  const exteriorPanels = rawDetails?.exteriorPanelDetails || [];

  const findMatchingPhoto = (queryKeys: string[]): string | null => {
    const allMedia = [...(rawDetails?.inspectionPhotos || []), ...(rawDetails?.inspectionVideos || [])];
    const validMedia = allMedia.filter((p: any) => p && p.captured !== false && (p.imageUrl || p.videoUrl || p.url));

    let found = validMedia.find((p: any) => {
      const pt = (p.photoType || '').toUpperCase().trim();
      const ic = (p.imageCategory || p.category || '').toUpperCase().trim();
      const dn = (p.displayName || p.name || '').toUpperCase().trim();
      return queryKeys.some((q) => {
        const uq = q.toUpperCase().trim();
        return (pt && pt === uq) || (ic && ic === uq) || (dn && dn === uq);
      });
    });

    if (!found) {
      found = validMedia.find((p: any) => {
        const pType = (p.photoType || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const pCat = (p.imageCategory || p.category || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const pDisp = (p.displayName || p.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return queryKeys.some((q) => {
          const qClean = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (!qClean) return false;
          return (pType && pType === qClean) || (pCat && pCat === qClean) || (pDisp && pDisp === qClean);
        });
      });
    }

    const rawUrl = (found as any)?.imageUrl || (found as any)?.videoUrl || (found as any)?.url || null;
    return rawUrl ? formatMediaUrl(rawUrl) : null;
  };

  const openImageLightbox = (url: string) => {
    const idx = (vehicle?.images || []).findIndex((img: any) => img.url === url);
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  const renderConditionChip = (cond: string) => {
    const c = getConditionColor(cond);
    return (
      <View style={[styles.condChip, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={[styles.condChipText, { color: c.fg }]}>{cond || 'OK'}</Text>
      </View>
    );
  };

  const renderScoreBadge = (score: number) => (
    <View style={styles.scoreChip}>
      <Text style={styles.scoreChipText}>{score}/100</Text>
    </View>
  );

  // Status chip for auction state
  const statusChip = (status: string) => {
    const s = (status || '').toLowerCase();
    const isL = s === 'live';
    const isScheduled = s === 'scheduled' || s === 'coming soon';
    const bg = isL ? 'rgba(16,185,129,0.15)' : isScheduled ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.15)';
    const border = isL ? 'rgba(16,185,129,0.4)' : isScheduled ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.3)';
    const fg = isL ? '#10B981' : isScheduled ? '#818CF8' : '#94A3B8';
    return (
      <View style={[styles.statusChip, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.statusChipText, { color: fg }]}>
          {(s === 'live' ? 'LIVE' : s === 'scheduled' || s === 'coming soon' ? 'COMING SOON' : 'ENDED')}
        </Text>
      </View>
    );
  };

  const videoList = useMemo(() => {
    const photosList = rawDetails?.inspectionPhotos || [];
    const videosFromPhotos = photosList
      .filter((p: any) => p && p.captured !== false && p.imageUrl && isActualVideoUrl(p.imageUrl))
      .map((p: any) => ({
        id: p.id,
        displayName: p.displayName || p.imageCategory || 'Engine / Motor Noise',
        videoUrl: p.imageUrl,
        imageUrl: p.imageUrl,
        condition: p.condition || 'NORMAL',
      }));

    const rawVidList = (rawDetails?.inspectionVideos || [])
      .filter((vid: any) => vid && vid.captured !== false && (vid.videoUrl || vid.imageUrl))
      .map((v: any) => ({
        id: v.id,
        displayName: v.displayName || v.videoType || 'Inspection Video',
        videoUrl: v.videoUrl || v.imageUrl,
        imageUrl: v.videoUrl || v.imageUrl,
        condition: v.condition || 'NORMAL',
      }));

    const combined = [...videosFromPhotos, ...rawVidList];
    return combined.slice(0, 1);
  }, [rawDetails]);

  const detailSteps = [
    { id: 'car_documents', title: 'Car Documents & Legal', subtitle: 'RTO, NOC, Fitness, RC & Tax status' },
    { id: 'exterior', title: `Exterior Body (${exteriorPanels.length})`, subtitle: '32-Point panel condition report' },
    { id: 'mechanical', title: 'Mechanical Health', subtitle: 'Engine, transmission & fluids' },
    { id: 'tyres', title: 'Tyres & Toolkit', subtitle: 'Tread depth % & emergency tools' },
    { id: 'interior', title: 'Interior Cabin', subtitle: 'Electricals, trim & remarks' },
    { id: 'videos', title: `Videos & Sound (${videoList.length})`, subtitle: 'Engine noise & video clips' },
  ];

  const renderPhotoSlot = (
    label: string,
    url: string | null,
    height: number = 170,
    showView: boolean = true,
  ) => (
    <View style={[styles.photoSlotCell, { borderColor: colors.border }]}>
      <Text style={[styles.photoSlotLabel, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.photoSlotMedia, { height }]}>
        {url ? (
          isActualVideoUrl(url) ? (
            <TouchableOpacity style={styles.videoBox} onPress={() => handlePlayVideo(url)} activeOpacity={0.85}>
              <Play size={22} color="#FFC700" fill="#FFC700" />
              <Text style={styles.videoBoxText}>▶ Auto Play Video</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Image source={{ uri: url }} style={styles.photoSlotImage} resizeMode="cover" />
              {showView && (
                <TouchableOpacity style={styles.viewOverlay} onPress={() => openImageLightbox(url)} activeOpacity={0.9}>
                  <Eye size={13} color="#FFC700" />
                  <Text style={styles.viewOverlayText}>View Photo</Text>
                </TouchableOpacity>
              )}
            </>
          )
        ) : (
          <View style={styles.photoSlotEmpty}>
            <ImageIcon size={14} color={colors.mutedForeground} />
            <Text style={[styles.photoSlotEmptyText, { color: colors.mutedForeground }]}>No Image Attached</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderConditionCard = (label: string, val: string, photoUrl: string | null) => (
    <View key={label} style={[styles.condCard, { borderColor: colors.border }]}>
      <View style={styles.condCardHeader}>
        <Text style={[styles.condCardLabel, { color: colors.foreground }]} numberOfLines={2}>
          {label}
        </Text>
        {renderConditionChip(String(val || 'OK'))}
      </View>
      {photoUrl ? (
        isActualVideoUrl(photoUrl) ? (
          <TouchableOpacity style={styles.condCardVideo} onPress={() => handlePlayVideo(photoUrl)} activeOpacity={0.85}>
            <Play size={18} color="#FFC700" fill="#FFC700" />
            <Text style={styles.condCardVideoText}>▶ Auto Play Video</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.condCardPhotoWrap} onPress={() => openImageLightbox(photoUrl)} activeOpacity={0.9}>
            <Image source={{ uri: photoUrl }} style={styles.condCardPhoto} resizeMode="cover" />
            <View style={styles.condCardPhotoOverlay}>
              <Eye size={12} color="#FFC700" />
              <Text style={styles.condCardPhotoOverlayText}>View Photo</Text>
            </View>
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.condCardNoPhoto}>
          <Text style={[styles.condCardNoPhotoText, { color: colors.mutedForeground }]}>No photo attached</Text>
        </View>
      )}
    </View>
  );

  const renderWebVideoCard = (
    title: string,
    condition: string = 'NORMAL',
    videoUrl: string | null = null,
    thumbnailUrl: string | null = null,
  ) => {
    const formattedUrl = videoUrl ? formatMediaUrl(videoUrl) : null;
    const defaultImg = vehicle?.images && vehicle.images.length > 0
      ? vehicle.images[0].url
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
    const bgImage = thumbnailUrl || defaultImg;
    const isThisCardPlaying = playingVideoTitle === title && isCardVideoPlaying;

    return (
      <View key={title} style={[styles.panel, { backgroundColor: cardBg, borderWidth: 0, padding: 14, marginTop: 10, borderRadius: 20 }]}>
        {/* Header Row: Title & Status Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.foreground }}>
            {title}
          </Text>
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EAECEF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#94A3B8' : '#4B5563', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {condition}
            </Text>
          </View>
        </View>

        {/* Video Player Box using react-native-video */}
        <View
          style={{
            position: 'relative',
            width: '100%',
            height: 180,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {formattedUrl ? (
            <Video
              source={{ uri: formattedUrl }}
              style={{ width: '100%', height: '100%' }}
              controls={true}
              resizeMode="contain"
              paused={false}
              muted={true}
            />
          ) : (
            <>
              <Image source={{ uri: bgImage }} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: 0.45 }} resizeMode="cover" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFC700', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10 }}>
                <VideoIcon size={18} color="#0D0E12" />
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#0D0E12' }}>No Video File Attached</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const mechanicalItems = [
    { key: 'Engine / Motor Status', val: mechanical.engineStatus, photos: ['ENGINE / MOTOR STATUS', 'ENGINE_IMAGE', 'ENGINE'] },
    { key: 'Engine Oil', val: mechanical.engineOil, photos: ['ENGINE OIL'] },
    { key: 'Brakes Oil', val: mechanical.brakeOil, photos: ['BRAKES OIL', 'BRAKE OIL'] },
    { key: 'Steering Oil', val: mechanical.steeringOil, photos: ['STEERING OIL'] },
    { key: 'Coolant', val: mechanical.coolant, photos: ['COOLANT'] },
    { key: 'Brakes Booster', val: mechanical.brakeBooster, photos: ['BRAKES BOOSTER', 'BRAKE BOOSTER'] },
    { key: 'Brakes Working', val: mechanical.brakeWorking, photos: ['BRAKES WORKING', 'BRAKE WORKING'] },
    { key: 'Apron Condition', val: mechanical.apron, photos: ['APRON CONDITION', 'APRON'] },
    { key: 'Chassis Alignment', val: mechanical.chassis, photos: ['CHASSIS ALIGNMENT', 'CHASSIS'] },
    { key: 'Suspension', val: mechanical.suspension, photos: ['SUSPENSION'] },
    { key: 'Suspension Bushing', val: mechanical.bush, photos: ['SUSPENSION BUSHING', 'BUSH'] },
    { key: 'Oil Leakage', val: mechanical.leakage, photos: ['OIL LEAKAGE', 'LEAKAGE'] },
    { key: 'Exhaust Smoke Color', val: mechanical.smoke, photos: ['EXHAUST SMOKE COLOR', 'EXHAUST SMOKE', 'SMOKE'] },
    { key: 'Manual Transmission Fluid Level', val: mechanical.transmission, photos: ['MANUAL TRANSMISSION FLUID LEVEL', 'TRANSMISSION'] },
    { key: 'Differential Fluid Level', val: mechanical.differential, photos: ['DIFFERENTIAL FLUID LEVEL', 'DIFFERENTIAL'] },
    { key: 'Fluid Leakages', val: mechanical.fluidLeakage, photos: ['FLUID LEAKAGES'] },
    { key: 'Steering Gearbox & Linkage', val: mechanical.gearbox, photos: ['STEERING GEARBOX & LINKAGE', 'GEARBOX'] },
    { key: 'Driveline / Axle', val: mechanical.axle, photos: ['DRIVELINE / AXLE', 'DRIVELINE', 'AXLE'] },
    { key: 'Engine / Motor Noise', val: mechanical.engineNoise, photos: ['ENGINE / MOTOR NOISE', 'ENGINE NOISE', 'MOTOR NOISE'] },
  ];

  const tyreRows = [
    { label: 'Front Left Tyre', brand: tyre.frontLeftBrand, tread: tyre.frontLeftTread, photoKey: ['FRONT_LEFT_TYRE', 'FRONT LEFT'] },
    { label: 'Front Right Tyre', brand: tyre.frontRightBrand, tread: tyre.frontRightTread, photoKey: ['FRONT_RIGHT_TYRE', 'FRONT RIGHT'] },
    { label: 'Rear Left Tyre', brand: tyre.rearLeftBrand, tread: tyre.rearLeftTread, photoKey: ['REAR_LEFT_TYRE', 'REAR LEFT'] },
    { label: 'Rear Right Tyre', brand: tyre.rearRightBrand, tread: tyre.rearRightTread, photoKey: ['REAR_RIGHT_TYRE', 'REAR RIGHT'] },
    { label: 'Spare Wheel', brand: tyre.spareBrand, tread: tyre.spareTread, photoKey: ['SPARE_WHEEL', 'SPARE'] },
  ];

  const toolkitRows = [
    ['Jack', tyre.hasJack],
    ['Handle', tyre.hasHandle],
    ['Tool Kit', tyre.hasToolkit],
    ['First Aid Box', tyre.hasFirstAidBox],
    ['Emergency Triangle', tyre.hasTriangle],
  ];

  const interiorItems = [
    { label: 'Push Start Button', val: interior.pushButton, photos: ['PUSH START BUTTON', 'PUSH START'] },
    { label: 'Sunroof', val: interior.sunroof, photos: ['SUNROOF'] },
    { label: 'Right Side Tail Lamp', val: interior.rightTailLamp, photos: ['RIGHT SIDE TAIL LAMP', 'TAIL LAMP'] },
    { label: 'Left Side Tail Lamp', val: interior.leftTailLamp, photos: ['LEFT SIDE TAIL LAMP'] },
    { label: 'Right Side Head Light', val: interior.rightHeadLamp, photos: ['RIGHT SIDE HEAD LIGHT', 'HEAD LIGHT'] },
    { label: 'Left Side Head Light', val: interior.leftHeadLamp, photos: ['LEFT SIDE HEAD LIGHT'] },
    { label: 'Right Indicator', val: interior.indicators, photos: ['RIGHT INDICATOR'] },
    { label: 'Left Indicator', val: interior.indicators, photos: ['LEFT INDICATOR'] },
    { label: 'Boot Floor', val: interior.bootFloor, photos: ['BOOT FLOOR'] },
    { label: 'Washer Fluid', val: 'OK', photos: ['WASHER FLUID'] },
    { label: 'Dashboard', val: interior.dashboard, photos: ['DASHBOARD_IMAGE', 'DASHBOARD'] },
    { label: 'Left Side Fog Lamp', val: interior.fogLamps, photos: ['LEFT SIDE FOG LAMP', 'FOG LAMP'] },
    { label: 'Right Side Fog Lamp', val: interior.fogLamps, photos: ['RIGHT SIDE FOG LAMP', 'FOG LAMP'] },
    { label: 'Rear Stop Light', val: 'OK', photos: ['REAR STOP LIGHT'] },
    { label: 'Power Window All Buttons', val: interior.powerWindows, photos: ['POWER WINDOW ALL BUTTONS', 'POWER WINDOW'] },
    { label: 'Music System', val: interior.musicSystem, photos: ['MUSIC SYSTEM'] },
    { label: 'Adjustable Steering', val: 'OK', photos: ['ADJUSTABLE STEERING'] },
    { label: 'Steering Mounted Controls', val: interior.steeringMountedControls, photos: ['STEERING MOUNTED CONTROLS', 'STEERING MOUNTED'] },
    { label: 'Wiper Washer Front', val: interior.wiper, photos: ['WIPER WASHER FRONT', 'WIPER'] },
    { label: 'Rear Defogger', val: interior.rearDefogger, photos: ['REAR DEFOGGER'] },
    { label: 'Rear Wiper Washer', val: interior.rearWasher, photos: ['REAR WIPER WASHER', 'REAR WASHER'] },
    { label: 'Instrument Cluster', val: interior.instrumentCluster, photos: ['INSTRUMENT CLUSTER'] },
    { label: 'Infotainment System', val: interior.infotainment, photos: ['INFOTAINMENT SYSTEM', 'INFOTAINMENT'] },
    { label: 'Central Lock', val: interior.centralLock, photos: ['CENTRAL LOCK'] },
    { label: 'All Sensors', val: interior.sensors, photos: ['ALL SENSORS', 'SENSORS'] },
  ];

  const primaryPhotoSlots = [
    { keys: ['FRONT_VIEW', 'FRONT'], label: 'Front Angle Photo' },
    { keys: ['RIGHT_FRONT_VIEW', 'RIGHT'], label: 'Right Side Angle Photo' },
    { keys: ['REAR_VIEW', 'REAR'], label: 'Rear Angle Photo' },
    { keys: ['LEFT_FRONT_VIEW', 'LEFT'], label: 'Left Side Angle Photo' },
    { keys: ['ROOF_VIEW', 'ROOF'], label: 'Roof Top Photo' },
    { keys: ['ODOMETER_IMAGE', 'ODOMETER'], label: 'Odometer Cluster Photo' },
  ];

  const mandatoryExteriorSlots = [
    { keys: ['FRONT_VIEW', 'FRONT SIDE IMAGE', 'FRONT_VIEW_IMAGE'], label: 'FRONT SIDE IMAGE' },
    { keys: ['RIGHT_FRONT_VIEW', 'RIGHT SIDE IMAGE', 'RIGHT_FRONT_VIEW_IMAGE'], label: 'RIGHT SIDE IMAGE' },
    { keys: ['REAR_VIEW', 'REAR SIDE IMAGE', 'REAR_VIEW_IMAGE'], label: 'REAR SIDE IMAGE' },
    { keys: ['LEFT_FRONT_VIEW', 'LEFT SIDE IMAGE', 'LEFT_FRONT_VIEW_IMAGE'], label: 'LEFT SIDE IMAGE' },
    { keys: ['ROOF_VIEW', 'ROOF TOP IMAGE', 'ROOF_VIEW_IMAGE'], label: 'ROOF TOP IMAGE' },
  ];

  const engineRoomSlots = [
    { keys: ['ENGINE_IMAGE', 'ENGINE ROOM PHOTO', 'ENGINE'], label: 'ENGINE ROOM PHOTO' },
    { keys: ['BATTERY_IMAGE', 'BATTERY BAY PHOTO', 'BATTERY'], label: 'BATTERY BAY PHOTO' },
  ];

  const tyrePhotoSlots = [
    { keys: ['FRONT_RIGHT_TYRE', 'RIGHT SIDE FRONT TYRE IMG', 'FRONT RIGHT'], label: 'RIGHT SIDE FRONT TYRE IMG' },
    { keys: ['REAR_RIGHT_TYRE', 'RIGHT SIDE REAR TYRE IMG', 'REAR RIGHT'], label: 'RIGHT SIDE REAR TYRE IMG' },
    { keys: ['REAR_LEFT_TYRE', 'LEFT SIDE REAR TYRE IMG', 'REAR LEFT'], label: 'LEFT SIDE REAR TYRE IMG' },
    { keys: ['FRONT_LEFT_TYRE', 'LEFT SIDE FRONT TYRE IMG', 'FRONT LEFT'], label: 'LEFT SIDE FRONT TYRE IMG' },
    { keys: ['SPARE_WHEEL', 'SPARE WHEEL IMG', 'SPARE'], label: 'SPARE WHEEL IMG' },
    { keys: ['TYRES_OVERVIEW', 'TYRES OVERVIEW IMAGE', 'TYRES'], label: 'TYRES OVERVIEW IMAGE' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Fetching 200-Point Inspection & Live Auction State...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Not Found</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <TriangleAlert size={30} color="#FFC700" />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Vehicle details not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <ArrowLeft size={14} color="#0D0E12" />
            <Text style={styles.backBtnText}>Back to Marketplace</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {vehicle.brand} {vehicle.model}
            </Text>
            {statusChip(vehicle.auction)}
          </View>
          {vehicle.variant ? (
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {vehicle.variant}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={handleDownloadPdf}
            style={[styles.headerFavBtn, { backgroundColor: '#FFC700', borderColor: '#FFC700' }]}
            disabled={downloadingPdf}
            activeOpacity={0.8}
          >
            {downloadingPdf ? (
              <ActivityIndicator size="small" color="#0D0E12" />
            ) : (
              <Download size={16} color="#0D0E12" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavourite}
            style={[
              styles.headerFavBtn,
              isFavourite ? { borderColor: 'rgba(244,63,94,0.4)', backgroundColor: 'rgba(244,63,94,0.1)' } : { borderColor: colors.border },
            ]}
            disabled={favouriteLoading}
            activeOpacity={0.8}
          >
            {favouriteLoading ? (
              <ActivityIndicator size="small" color={isFavourite ? '#F43F5E' : colors.mutedForeground} />
            ) : (
              <Heart size={16} color={isFavourite ? '#F43F5E' : colors.mutedForeground} fill={isFavourite ? '#F43F5E' : 'transparent'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDetails();
            }}
            tintColor="#FFC700"
          />
        }
      >
        <View style={styles.contentBody}>
          {/* SECTION 1: TOP SIDE - Basic Information Overview & Specifications */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.panelHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Vehicle Overview & Basic Information</Text>
                <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                  {vehicle.brand} {vehicle.model} {vehicle.variant} • Certified 200-Point Inspection
                </Text>
              </View>
              {renderScoreBadge(vehicle.score || 88)}
            </View>
            <View style={styles.specsGrid}>
              {specs.map((s, idx) => {
                const IconComp = s.icon;
                return (
                  <View key={idx} style={[styles.specCell, { backgroundColor: rowBg, borderColor: colors.border }]}>
                    <IconComp size={14} color="#FFC700" />
                    <Text style={[styles.specLabelText, { color: colors.mutedForeground }]}>{s.label}</Text>
                    <Text style={[styles.specValueText, { color: colors.foreground }]} numberOfLines={1}>
                      {s.value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SECTION 2: Live Bidding Box */}
          <View
            style={[
              styles.bidBox,
              isWinner
                ? { backgroundColor: '#062419', borderColor: 'rgba(16,185,129,0.6)' }
                : participated
                  ? { backgroundColor: '#230d12', borderColor: 'rgba(244,63,94,0.5)' }
                  : { backgroundColor: '#0D0E12', borderColor: 'rgba(255,199,0,0.4)' },
            ]}
          >
            <View style={[styles.bidBoxHeader, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={[styles.auctionChip, { backgroundColor: isLive ? 'rgba(16,185,129,0.15)' : isComingSoon ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.15)', borderColor: isLive ? 'rgba(16,185,129,0.4)' : isComingSoon ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.3)' }]}>
                <Text style={[styles.auctionChipText, { color: isLive ? '#10B981' : isComingSoon ? '#818CF8' : '#94A3B8' }]}>
                  {isLive ? 'LIVE' : isComingSoon ? 'COMING SOON' : 'ENDED'}
                </Text>
              </View>
              {isWinner ? (
                <View style={styles.winnerPill}>
                  <Sparkles size={11} color="#34D399" />
                  <Text style={styles.winnerPillText}>You are Highest on Bid!</Text>
                </View>
              ) : participated ? (
                <View style={styles.outbidPill}>
                  <TriangleAlert size={11} color="#FB7185" />
                  <Text style={styles.outbidPillText}>You are Outbid</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.bidBoxPriceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bidBoxLabel, { color: isWinner ? '#34D399' : participated ? '#FB7185' : '#FFC700' }]}>HIGHEST BID</Text>
                <Text style={styles.bidBoxHighest}>
                  {isComingSoon || !vehicle.highestBid ? 'No Bids Yet' : inr(vehicle.highestBid)}
                </Text>
              </View>
              <View style={styles.bidBoxActual}>
                <Text style={styles.bidBoxActualLabel}>ACTUAL PRICE</Text>
                <Text style={styles.bidBoxActualValue}>{inr(vehicle.basePrice)}</Text>
              </View>
            </View>

            {isLive && (
              <View style={styles.closingRow}>
                <View style={styles.closingLabelWrap}>
                  <Clock size={14} color="#FFC700" />
                  <Text style={styles.closingLabel}>Closing In</Text>
                </View>
                <Text style={styles.closingValue}>{remaining}</Text>
              </View>
            )}

            {isComingSoon ? (
              <View style={styles.comingSoonBox}>
                <Clock size={26} color="#FFC700" />
                <Text style={styles.comingSoonText}>Bidding Opening Soon</Text>
              </View>
            ) : isEnded ? (
              <View style={[styles.endedBox, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                {noBids ? (
                  <>
                    <View style={styles.endedTitleRow}>
                      <TriangleAlert size={13} color="#FBBF24" />
                      <Text style={styles.endedTitleAmber}>Unsold</Text>
                    </View>
                    <Text style={styles.endedDesc}>The live bidding ended with no active bids placed.</Text>
                  </>
                ) : isWinner ? (
                  <>
                    <Text style={styles.endedTitleGreen}>🏆 Bid Winner!</Text>
                    <Text style={styles.endedDesc}>
                      Congratulations! You won the bidding for this vehicle with the highest bid of{' '}
                      <Text style={styles.endedHighlight}>{inr(vehicle.highestBid)}</Text>!
                    </Text>
                  </>
                ) : participated ? (
                  <>
                    <Text style={styles.endedTitleRed}>❌ Outbid / Lost</Text>
                    <Text style={styles.endedDesc}>
                      You participated in this room, but another dealer won with the highest bid of {inr(vehicle.highestBid)}.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.endedTitle}>🏁 Closed</Text>
                    <Text style={styles.endedDesc}>This live bidding is now closed. Sold for {inr(vehicle.highestBid)}.</Text>
                  </>
                )}

                {vehicle.adminDealerMessage && isWinner && (
                  <View style={[styles.adminMsgBox, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={styles.adminMsgHeader}>
                      <Sparkles size={12} color="#60A5FA" />
                      <Text style={styles.adminMsgHeaderText}>Admin Message to Dealer:</Text>
                    </View>
                    <Text style={styles.adminMsgBody}>"{vehicle.adminDealerMessage}"</Text>

                    <TextInput
                      style={styles.replyInput}
                      placeholder="Type reply back to Admin..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={dealerReplyText}
                      onChangeText={setDealerReplyText}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.replyBtn, submittingReply && { opacity: 0.6 }]}
                      onPress={handleSendDealerReply}
                      disabled={submittingReply}
                      activeOpacity={0.85}
                    >
                      {submittingReply ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <View style={styles.replyBtnInner}>
                          <Send size={12} color="#FFFFFF" />
                          <Text style={styles.replyBtnText}>Send Reply to Admin</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {vehicle.dealerReplyMessage && (
                      <View style={styles.replySentBox}>
                        <Text style={styles.replySentHeader}>Your Reply Sent to Admin:</Text>
                        <Text style={styles.replySentBody}>"{vehicle.dealerReplyMessage}"</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.bidForm}>
                {isWinner ? (
                  <View style={styles.topPillGreen}>
                    <Sparkles size={20} color="#34D399" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topPillTitle}>You are on Top!</Text>
                      <Text style={styles.topPillDesc}>
                        You currently hold the highest bid of {inr(vehicle.highestBid)} on this vehicle. You cannot place another bid while you are on top.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {participated ? (
                      <View style={styles.topPillRed}>
                        <TriangleAlert size={20} color="#FB7185" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.topPillTitleRed}>You are Outbid!</Text>
                          <Text style={styles.topPillDescRed}>Another dealer placed a higher bid. Place a bid to take back top position.</Text>
                        </View>
                      </View>
                    ) : null}

                    <Text style={styles.quickLabel}>Quick Bid Increment</Text>
                    <View style={styles.quickRow}>
                      <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => addQuickIncrement(2000)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.quickBtnText}>+2k</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.amountLabel}>Enter Bid Amount (₹)</Text>
                    <View style={styles.amountInputWrap}>
                      <Text style={styles.amountSymbol}>₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        keyboardType="number-pad"
                        value={String(amount)}
                        onChangeText={(t) => setAmount(Number(t.replace(/[^0-9]/g, '')) || 0)}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBidBtn, submittingBid && { opacity: 0.6 }]}
                      onPress={handlePlaceBid}
                      disabled={submittingBid}
                      activeOpacity={0.85}
                    >
                      {submittingBid ? (
                        <ActivityIndicator size="small" color="#0D0E12" />
                      ) : (
                        <View style={styles.submitBidInner}>
                          <Zap size={14} color="#0D0E12" fill="#0D0E12" />
                          <Text style={styles.submitBidText}>Submit Live Bid</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  onPress={handleDownloadPdf}
                  disabled={downloadingPdf}
                  style={{
                    backgroundColor: 'rgba(255,199,0,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,199,0,0.4)',
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 10,
                  }}
                  activeOpacity={0.85}
                >
                  {downloadingPdf ? (
                    <ActivityIndicator size="small" color="#FFC700" />
                  ) : (
                    <>
                      <Download size={16} color="#FFC700" />
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFC700' }}>Download Inspection PDF Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SECTION 3: Vehicle Single Hero Image Display */}
          <View style={[styles.galleryCard, { backgroundColor: cardBg, borderColor: colors.border, marginHorizontal: 0, marginTop: 14 }]}>
            <TouchableOpacity onPress={() => setPreviewIndex(0)} activeOpacity={0.95} style={styles.galleryHeroWrap}>
              <Image source={{ uri: vehicle.image }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroTopBadges}>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{vehicle.year} Model</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>Score {vehicle.score}/100</Text>
                </View>
              </View>
              <View style={styles.heroTopRight}>
                <View style={styles.lightboxHintBadge}>
                  <Eye size={12} color="#FFC700" />
                  <Text style={styles.lightboxHintText}>Tap for Fullscreen Lightbox</Text>
                </View>
              </View>
              <View style={styles.heroBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>
                    {vehicle.brand} {vehicle.model} {vehicle.variant}
                  </Text>
                  <Text style={styles.heroSub}>Inspected 200-Point Quality Verified</Text>
                </View>
                <View style={styles.heroPhotoCountBadge}>
                  <Text style={styles.heroPhotoCount}>📷 {vehicle.images?.length || 1} Photos</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION 4: 200-Point Detailed Inspection Report Tabs */}
          <Text style={[styles.sectionLabel, { marginTop: 16, marginBottom: 10 }]}>Detailed 200-Point Inspection Report</Text>
          <View style={{ marginBottom: 14 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {detailSteps.map((s, idx) => {
                const isActive = activeTab === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isActive ? '#FFC700' : colors.border,
                      backgroundColor: isActive ? 'rgba(255,199,0,0.15)' : cardBg,
                    }}
                    onPress={() => setActiveTab(s.id)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: isActive ? '#FFC700' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: isActive ? '#0D0E12' : colors.mutedForeground }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: isActive ? '#FFC700' : colors.foreground }}>
                      {s.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* STEP 1: Car Documents & Legal Verification */}
          {activeTab === 'car_documents' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>📄 Car Documents & Legal Verification</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      RTO registration, hypothecation, NOC, road tax & fitness certificates.
                    </Text>
                  </View>
                  <View style={[styles.scoreChip, { backgroundColor: '#10B981' }]}>
                    <Text style={[styles.scoreChipText, { color: '#FFFFFF' }]}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.specsGrid}>
                  {documentSpecs.map((s, idx) => {
                    const IconComp = s.icon;
                    return (
                      <View key={idx} style={[styles.specCell, { backgroundColor: rowBg, borderColor: colors.border }]}>
                        <IconComp size={14} color="#FFC700" />
                        <Text style={[styles.specLabelText, { color: colors.mutedForeground }]}>{s.label}</Text>
                        <Text style={[styles.specValueText, { color: colors.foreground }]} numberOfLines={1}>
                          {s.value}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Exterior Body Panels */}
          {activeTab === 'exterior' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 2: Exterior Body Inspection</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      32-point panel condition report with inline photos.
                    </Text>
                  </View>
                  {renderScoreBadge(ratings.exterior ? Number(ratings.exterior) * 20 : 85)}
                </View>
                {exteriorPanels.length === 0 ? (
                  <View style={styles.emptyPanel}>
                    <Text style={[styles.emptyPanelText, { color: colors.mutedForeground }]}>
                      No panel details recorded for this vehicle.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.condCardGrid}>
                    {exteriorPanels.map((p: any) =>
                      renderConditionCard(p.panelName || 'Panel', p.condition || 'N/A', p.imageUrl ? formatMediaUrl(p.imageUrl) : null),
                    )}
                  </View>
                )}
              </View>

              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Mandatory Exterior Images</Text>
                <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                  Upload clean, high-resolution photos of five primary panels.
                </Text>
                <View style={styles.mediaGrid}>
                  {mandatoryExteriorSlots.map((slot) =>
                    renderPhotoSlot(slot.label, findMatchingPhoto(slot.keys)),
                  )}
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Mechanical Health */}
          {activeTab === 'mechanical' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 3: Mechanical Health Diagnostics</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      Engine compartment, transmission bay and fluid assemblies.
                    </Text>
                  </View>
                  {renderScoreBadge(ratings.mechanical ? Number(ratings.mechanical) * 20 : 88)}
                </View>
                <View style={styles.condCardGrid}>
                  {mechanicalItems.map((item) =>
                    renderConditionCard(item.key, String(item.val || 'OK'), findMatchingPhoto(item.photos)),
                  )}
                </View>
              </View>

              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Under-Bonnet Engine Room Photos</Text>
                <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                  Engine compartment and battery bay photos.
                </Text>
                <View style={styles.mediaGrid}>
                  {engineRoomSlots.map((slot) =>
                    renderPhotoSlot(slot.label, findMatchingPhoto(slot.keys)),
                  )}
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: Tyres Specifications */}
          {activeTab === 'tyres' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 4: Tyres Specifications & Toolkits</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      Tread depth percentage, brand names & emergency equipment.
                    </Text>
                  </View>
                  {renderScoreBadge(ratings.tyre ? Number(ratings.tyre) * 20 : 90)}
                </View>

                <Text style={styles.sectionLabel}>Tyres Wear & Brand Details</Text>
                <View style={styles.tyreCardGrid}>
                  {tyreRows.map((t) => {
                    const tyrePhoto = findMatchingPhoto(t.photoKey);
                    return (
                      <View key={t.label} style={[styles.tyreCard, { borderColor: colors.border }]}>
                        <View style={[styles.tyreCardHeader, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.tyreCardLabel, { color: colors.foreground }]}>{t.label}</Text>
                          <View style={styles.treadChip}>
                            <Text style={styles.treadChipText}>{t.tread ? `${t.tread}% Tread` : '60% Tread'}</Text>
                          </View>
                        </View>
                        <Text style={[styles.tyreCardBrand, { color: colors.mutedForeground }]}>
                          Brand: <Text style={{ color: colors.foreground }}>{t.brand || 'Standard Tyre'}</Text>
                        </Text>
                        {tyrePhoto ? (
                          <TouchableOpacity style={styles.tyreCardPhotoWrap} onPress={() => openImageLightbox(tyrePhoto)} activeOpacity={0.9}>
                            <Image source={{ uri: tyrePhoto }} style={styles.tyreCardPhoto} resizeMode="cover" />
                            <View style={styles.condCardPhotoOverlay}>
                              <Eye size={12} color="#FFC700" />
                              <Text style={styles.condCardPhotoOverlayText}>View Photo</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>Safety & Emergency Toolkit</Text>
                <View style={styles.toolkitList}>
                  {toolkitRows.map(([label, active]) => (
                    <View key={label as string} style={[styles.toolkitRow, { backgroundColor: cardBg, borderColor: colors.border }]}>
                      <Text style={[styles.toolkitLabel, { color: colors.foreground }]}>{label as string}</Text>
                      <View
                        style={[
                          styles.toolkitChip,
                          active !== false
                            ? { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' }
                            : { backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.25)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.toolkitChipText,
                            active !== false ? { color: '#10B981' } : { color: '#F43F5E' },
                          ]}
                        >
                          {active !== false ? 'AVAILABLE' : 'MISSING'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Tyres & Spare Wheel Photos</Text>
                <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                  Individual photos of four active tyres and spare wheel in boot.
                </Text>
                <View style={styles.mediaGrid}>
                  {tyrePhotoSlots.map((slot) =>
                    renderPhotoSlot(slot.label, findMatchingPhoto(slot.keys)),
                  )}
                </View>
              </View>
            </View>
          )}

          {/* STEP 5: Interior & Electricals */}
          {/* STEP 5: Video Recordings & Engine Sound */}
          {activeTab === 'videos' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>🎥 Inspection Videos & Engine Sound</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      200-point inspection sound recordings and video clips.
                    </Text>
                  </View>
                </View>

                {videoList.length > 0 ? (
                  <View style={{ gap: 12, marginTop: 4 }}>
                    {videoList.map((vid: any, idx: number) => {
                      const vUrl = vid.videoUrl || vid.imageUrl || vid.url;
                      return renderWebVideoCard(
                        vid.displayName || vid.videoType || `Engine / Motor Noise Clip #${idx + 1}`,
                        vid.condition || 'NORMAL',
                        vUrl ? formatMediaUrl(vUrl) : null,
                        vid.thumbnailUrl ? formatMediaUrl(vid.thumbnailUrl) : null,
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 14, marginTop: 10 }}>
                    <VideoIcon size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.mutedForeground, marginTop: 8 }}>
                      No video recordings attached for this vehicle.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'interior' && (
            <View style={styles.stepContent}>
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.panelHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 5: Interior Cabin & Electrical Checklist</Text>
                    <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                      Cabin trim, battery condition, electrical buttons & evaluation remarks.
                    </Text>
                  </View>
                  {renderScoreBadge(ratings.interior ? Number(ratings.interior) * 20 : 92)}
                </View>

                <View style={styles.interiorStatsGrid}>
                  <View style={[styles.interiorStatCell, { backgroundColor: rowBg, borderColor: colors.border }]}>
                    <Text style={[styles.interiorStatLabel, { color: colors.mutedForeground }]}>Battery Company</Text>
                    <Text style={[styles.interiorStatValue, { color: colors.foreground }]} numberOfLines={1}>{interior.batteryBrand || 'N/A'}</Text>
                  </View>
                  <View style={[styles.interiorStatCell, { backgroundColor: rowBg, borderColor: colors.border }]}>
                    <Text style={[styles.interiorStatLabel, { color: colors.mutedForeground }]}>Full Battery Serial Number</Text>
                    <Text style={[styles.interiorStatValue, { color: colors.foreground }]} numberOfLines={1}>{interior.batterySerialNumber || 'N/A'}</Text>
                  </View>
                  <View style={[styles.interiorStatCell, { backgroundColor: rowBg, borderColor: colors.border }]}>
                    <Text style={[styles.interiorStatLabel, { color: colors.mutedForeground }]}>AC Cooling Performance</Text>
                    <Text style={[styles.interiorStatValue, { color: colors.foreground }]} numberOfLines={1}>{interior.acCooling || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.condCardGrid}>
                  {interiorItems.map((item) =>
                    renderConditionCard(item.label, item.val || 'OK / WORKING', findMatchingPhoto(item.photos)),
                  )}
                </View>

                <View style={styles.remarksBlock}>
                  <Text style={[styles.remarksLabel, { color: colors.foreground }]}>Evaluation Remarks & Notes</Text>
                  <View style={[styles.remarksBox, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.remarksText, { color: colors.foreground }]}>
                      {interior.remarks || 'No remarks entered.'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Lightbox Fullscreen Preview Modal with Pinch & Button Zooming */}
      <Modal
        visible={previewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPreviewIndex(null);
          setZoomScale(1.0);
        }}
      >
        <View style={styles.lightboxRoot}>
          <View style={styles.lightboxTopBar}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {vehicle?.brand} {vehicle?.model} {vehicle?.variant}
              </Text>
              <Text style={styles.lightboxSub} numberOfLines={1}>
                {vehicle?.images && vehicle.images[previewIndex ?? 0]?.name || 'Inspection Photo'}
              </Text>
            </View>

            {/* Zoom Controls Toolbar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,199,0,0.2)', borderWidth: 1, borderColor: '#FFC700', borderRadius: 10, padding: 7 }}
                onPress={() => setZoomScale((prev) => Math.min(3.5, prev + 0.4))}
                activeOpacity={0.8}
              >
                <ZoomIn size={16} color="#FFC700" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 7 }}
                onPress={() => setZoomScale((prev) => Math.max(1.0, prev - 0.4))}
                activeOpacity={0.8}
              >
                <ZoomOut size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {zoomScale > 1.05 && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFC700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 }}
                  onPress={() => setZoomScale(1.0)}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={12} color="#0D0E12" />
                  <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#0D0E12' }}>{Math.round(zoomScale * 100)}%</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => {
                setPreviewIndex(null);
                setZoomScale(1.0);
              }}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.lightboxCenter}>
            {previewIndex !== null && vehicle?.images && (
              <>
                <TouchableOpacity
                  style={styles.lightboxNav}
                  onPress={() => {
                    setZoomScale(1.0);
                    setPreviewIndex((prev) =>
                      prev !== null ? (prev - 1 + vehicle.images.length) % vehicle.images.length : null,
                    );
                  }}
                >
                  <ChevronLeft size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[styles.lightboxStage, { position: 'relative' }]}>
                  {isActualVideoUrl(vehicle.images[previewIndex]?.url) ? (
                    <Video
                      source={{ uri: formatMediaUrl(vehicle.images[previewIndex]?.url) }}
                      style={{ width: '100%', height: '100%' }}
                      controls={true}
                      resizeMode="contain"
                      paused={false}
                      muted={true}
                    />
                  ) : (
                    <>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <ScrollView
                          showsHorizontalScrollIndicator={false}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <TouchableOpacity
                            activeOpacity={0.95}
                            onPress={() => setZoomScale((prev) => (prev >= 2.5 ? 1.0 : prev + 0.75))}
                            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                          >
                            <View
                              style={{
                                width: `${Math.round(100 * zoomScale)}%`,
                                height: `${Math.round(100 * zoomScale)}%`,
                                minWidth: 300 * zoomScale,
                                minHeight: 300 * zoomScale,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Image
                                source={{ uri: formatMediaUrl(vehicle.images[previewIndex]?.url) }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                }}
                                resizeMode="contain"
                              />
                            </View>
                          </TouchableOpacity>
                        </ScrollView>
                      </ScrollView>

                      {/* Floating Interactive Zoom Bar */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          backgroundColor: 'rgba(13,14,18,0.92)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.25)',
                          borderRadius: 24,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          zIndex: 999,
                          elevation: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.4,
                          shadowRadius: 6,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => setZoomScale((prev) => Math.max(1.0, parseFloat((prev - 0.5).toFixed(1))))}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <ZoomOut size={20} color={zoomScale <= 1.0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
                        </TouchableOpacity>

                        <Text style={{ color: '#FFC700', fontSize: 13, fontWeight: '900', minWidth: 46, textAlign: 'center' }}>
                          {Math.round(zoomScale * 100)}%
                        </Text>

                        <TouchableOpacity
                          onPress={() => setZoomScale((prev) => Math.min(3.5, parseFloat((prev + 0.5).toFixed(1))))}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <ZoomIn size={20} color={zoomScale >= 3.5 ? 'rgba(255,255,255,0.3)' : '#FFC700'} />
                        </TouchableOpacity>

                        {zoomScale > 1.0 && (
                          <TouchableOpacity
                            onPress={() => setZoomScale(1.0)}
                            style={{ backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 2 }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ color: '#0D0E12', fontSize: 9.5, fontWeight: '900' }}>RESET</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.lightboxNav}
                  onPress={() => {
                    setZoomScale(1.0);
                    setPreviewIndex((prev) => (prev !== null ? (prev + 1) % vehicle.images.length : null));
                  }}
                >
                  <ChevronRight size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.lightboxBottom}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightboxThumbs}>
              {vehicle?.images && vehicle.images.map((imgObj: any, idx: number) => {
                const isActive = idx === previewIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setZoomScale(1.0);
                      setPreviewIndex(idx);
                    }}
                    activeOpacity={0.85}
                  >
                    {isActualVideoUrl(imgObj.url) ? (
                      <View style={[styles.lightboxThumb, styles.lightboxThumbVideo, isActive && styles.lightboxThumbActive]}>
                        <Play size={14} color="#FFC700" fill="#FFC700" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: imgObj.url }}
                        style={[styles.lightboxThumb, isActive && styles.lightboxThumbActive]}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.lightboxCounter}>
              <Text style={styles.lightboxCounterText}>
                Photo {previewIndex !== null ? previewIndex + 1 : 1} of {vehicle?.images?.length || 1}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCenter: { flex: 1, paddingHorizontal: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, flexShrink: 1, maxWidth: '80%' },
  headerSubtitle: { fontSize: 9.5, fontWeight: '600', marginTop: 2 },
  headerFavBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  statusChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  loadingText: { fontSize: 12, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 30 },
  notFoundTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFC700', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
  backBtnText: { fontSize: 11.5, fontWeight: '900', color: '#0D0E12' },

  quickSpecsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingTop: 14 },
  quickSpecCell: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 16, padding: 11 },
  quickSpecIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  quickSpecLabel: { fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  quickSpecValue: { fontSize: 12, fontWeight: '900', marginTop: 2 },

  galleryCard: { marginHorizontal: 14, marginTop: 14, borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  galleryHeroWrap: { position: 'relative', height: 220 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)' },
  heroTopBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  yearBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  yearBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  scoreBadge: { backgroundColor: '#FFC700', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  scoreBadgeText: { color: '#0D0E12', fontSize: 10, fontWeight: '900' },
  heroTopRight: { position: 'absolute', top: 12, right: 12 },
  lightboxHintBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  lightboxHintText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  heroBottom: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  heroTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: -0.3 },
  heroSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 2 },
  heroPhotoCountBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroPhotoCount: { fontSize: 9.5, color: '#FFFFFF', fontWeight: '800' },

  thumbsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, borderTopWidth: 1 },
  thumb: { flexBasis: '45%', flexGrow: 1, aspectRatio: 4 / 3, borderRadius: 12, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  thumbDim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  thumbLabel: { position: 'absolute', bottom: 5, left: 5, fontSize: 8.5, fontWeight: '700', color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, maxWidth: '90%' },
  thumbMoreOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  thumbMoreCount: { fontSize: 18, fontWeight: '900', color: '#FFC700' },
  thumbMoreText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  contentBody: { padding: 14, gap: 14, paddingBottom: 40 },

  bidBox: { borderRadius: 20, borderWidth: 1.2, padding: 16 },
  bidBoxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 12, gap: 8 },
  auctionChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  auctionChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  winnerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.5)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  winnerPillText: { fontSize: 9, fontWeight: '900', color: '#34D399' },
  outbidPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(244,63,94,0.2)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.5)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  outbidPillText: { fontSize: 9, fontWeight: '900', color: '#FB7185' },

  bidBoxPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, gap: 10 },
  bidBoxLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  bidBoxHighest: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 },
  bidBoxActual: { alignItems: 'flex-end' },
  bidBoxActualLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  bidBoxActualValue: { fontSize: 11.5, fontWeight: '900', color: 'rgba(255,255,255,0.85)', marginTop: 3 },

  closingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 14 },
  closingLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  closingLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  closingValue: { fontSize: 14, fontWeight: '900', color: '#FFC700', letterSpacing: 0.3 },

  comingSoonBox: { borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', backgroundColor: 'rgba(255,199,0,0.1)', borderRadius: 14, padding: 20, alignItems: 'center', gap: 6, marginTop: 14 },
  comingSoonText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  endedBox: { borderWidth: 1, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center', gap: 6, marginTop: 14 },
  endedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  endedTitleAmber: { fontSize: 13, fontWeight: '900', color: '#FBBF24' },
  endedTitleGreen: { fontSize: 14, fontWeight: '900', color: '#34D399' },
  endedTitleRed: { fontSize: 14, fontWeight: '900', color: '#FB7185' },
  endedTitle: { fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.85)' },
  endedDesc: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 16 },
  endedHighlight: { color: '#34D399', fontWeight: '900' },

  adminMsgBox: { width: '100%', borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 10 },
  adminMsgHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  adminMsgHeaderText: { fontSize: 11, fontWeight: '900', color: '#60A5FA' },
  adminMsgBody: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 12, padding: 10, lineHeight: 16 },
  replyInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 11, fontWeight: '600', color: '#FFFFFF', minHeight: 44, textAlignVertical: 'top' },
  replyBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  replyBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyBtnText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  replySentBox: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 12, padding: 10 },
  replySentHeader: { fontSize: 10, fontWeight: '900', color: '#34D399' },
  replySentBody: { fontSize: 11, fontWeight: '700', color: '#A7F3D0', marginTop: 4 },

  bidForm: { marginTop: 14, gap: 10 },
  topPillGreen: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', borderRadius: 16, padding: 14 },
  topPillRed: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(244,63,94,0.2)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.4)', borderRadius: 16, padding: 14 },
  topPillTitle: { fontSize: 12, fontWeight: '900', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: 0.4 },
  topPillDesc: { fontSize: 11, fontWeight: '600', color: 'rgba(167,243,208,0.9)', marginTop: 2 },
  topPillTitleRed: { fontSize: 12, fontWeight: '900', color: '#FDA4AF', textTransform: 'uppercase', letterSpacing: 0.4 },
  topPillDescRed: { fontSize: 11, fontWeight: '600', color: 'rgba(254,205,211,0.9)', marginTop: 2 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', backgroundColor: '#101216', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  quickBtnText: { fontSize: 12, fontWeight: '900', color: '#FFC700' },
  amountLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  amountInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,199,0,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 12 },
  amountSymbol: { fontSize: 15, fontWeight: '900', color: '#FFC700', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 16, fontWeight: '900', color: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 0 },
  submitBidBtn: { backgroundColor: '#FFC700', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#FFC700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  submitBidInner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  submitBidText: { fontSize: 12, fontWeight: '900', color: '#0D0E12' },

  stepsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepTile: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: 11, gap: 5 },
  stepTileActive: { borderColor: '#FFC700', shadowColor: '#FFC700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  stepTileHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepTileNum: { width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(148,163,184,0.15)', justifyContent: 'center', alignItems: 'center' },
  stepTileNumActive: { backgroundColor: '#FFC700' },
  stepTileNumText: { fontSize: 10.5, fontWeight: '900', color: '#94A3B8' },
  stepTileNumTextActive: { color: '#0D0E12' },
  stepTileTitle: { fontSize: 10.5, fontWeight: '900', flexShrink: 1 },
  stepTileSub: { fontSize: 9, fontWeight: '600' },

  stepContent: { gap: 14 },

  panel: { borderWidth: 1, borderRadius: 20, padding: 16 },
  panelHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: '900', letterSpacing: -0.2 },
  panelSub: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  scoreChip: { backgroundColor: '#FFC700', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  scoreChipText: { fontSize: 11, fontWeight: '900', color: '#0D0E12' },
  emptyPanel: { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(148,163,184,0.4)', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 6 },
  emptyPanelText: { fontSize: 11, fontWeight: '700' },

  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  specCell: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  specLabelText: { fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 },
  specValueText: { fontSize: 12.5, fontWeight: '900' },

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  photoSlotCell: { flexBasis: '100%', width: '100%', borderWidth: 1, borderRadius: 14, padding: 11 },
  photoSlotLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8 },
  photoSlotMedia: { borderRadius: 11, overflow: 'hidden', position: 'relative' },
  photoSlotImage: { width: '100%', height: '100%' },
  viewOverlay: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,199,0,0.95)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  viewOverlayText: { fontSize: 9.5, fontWeight: '900', color: '#0D0E12' },
  photoSlotEmpty: { flex: 1, height: 100, backgroundColor: 'rgba(148,163,184,0.08)', justifyContent: 'center', alignItems: 'center', gap: 4 },
  photoSlotEmptyText: { fontSize: 9, fontWeight: '700' },
  videoBox: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', gap: 6 },
  videoBoxText: { fontSize: 10.5, fontWeight: '800', color: '#FFC700' },

  condCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  condCard: { flexBasis: '100%', width: '100%', borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  condCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  condCardLabel: { fontSize: 11.5, fontWeight: '900', flexShrink: 1, flex: 1 },
  condChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 140 },
  condChipText: { fontSize: 9.5, fontWeight: '900', textTransform: 'uppercase' },
  condCardPhotoWrap: { height: 170, borderRadius: 11, overflow: 'hidden', position: 'relative' },
  condCardPhoto: { width: '100%', height: '100%' },
  condCardPhotoOverlay: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,199,0,0.95)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  condCardPhotoOverlayText: { fontSize: 9, fontWeight: '900', color: '#0D0E12' },
  condCardNoPhoto: { height: 56, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(148,163,184,0.4)', justifyContent: 'center', alignItems: 'center' },
  condCardNoPhotoText: { fontSize: 9.5, fontWeight: '700' },
  condCardVideo: { height: 170, borderRadius: 11, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', gap: 5 },
  condCardVideoText: { fontSize: 10, fontWeight: '800', color: '#FFC700' },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 8 },
  tyreCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  tyreCard: { flexBasis: '100%', width: '100%', borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  tyreCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 8, gap: 6 },
  tyreCardLabel: { fontSize: 11.5, fontWeight: '900', flexShrink: 1 },
  treadChip: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 7, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 8, paddingVertical: 4 },
  treadChipText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
  tyreCardBrand: { fontSize: 10.5, fontWeight: '700' },
  tyreCardPhotoWrap: { height: 160, borderRadius: 11, overflow: 'hidden', position: 'relative' },
  tyreCardPhoto: { width: '100%', height: '100%' },
  toolkitList: { gap: 8 },
  toolkitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  toolkitLabel: { fontSize: 11, fontWeight: '900' },
  toolkitChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  toolkitChipText: { fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' },

  interiorStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  interiorStatCell: { flexBasis: '30%', flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 10 },
  interiorStatLabel: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  interiorStatValue: { fontSize: 11.5, fontWeight: '900', marginTop: 4 },

  remarksBlock: { marginTop: 16, gap: 6 },
  remarksLabel: { fontSize: 11, fontWeight: '900' },
  remarksBox: { borderWidth: 1, borderRadius: 14, padding: 13, minHeight: 60 },
  remarksText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },

  lightboxRoot: { flex: 1, backgroundColor: 'rgba(2,3,6,0.97)', justifyContent: 'space-between' },
  lightboxTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  lightboxTitle: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: -0.2 },
  lightboxSub: { fontSize: 10.5, fontWeight: '700', color: '#FFC700', marginTop: 3 },
  lightboxClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  lightboxCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  lightboxNav: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  lightboxStage: { flex: 1, height: '62%', marginHorizontal: 8, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  lightboxImage: { width: '100%', height: '100%' },
  lightboxVideoPlaceholder: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', gap: 10 },
  lightboxVideoText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  lightboxBottom: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, alignItems: 'center', gap: 9 },
  lightboxThumbs: { paddingHorizontal: 16, gap: 8 },
  lightboxThumb: { width: 62, height: 44, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', opacity: 0.5 },
  lightboxThumbVideo: { backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  lightboxThumbActive: { borderColor: '#FFC700', opacity: 1 },
  lightboxCounter: { backgroundColor: 'rgba(23,25,32,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  lightboxCounterText: { fontSize: 10.5, fontWeight: '900', color: 'rgba(255,255,255,0.8)' },

  videoModalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  videoModalCard: { width: '100%', maxWidth: 460, borderRadius: 22, borderWidth: 1, padding: 18, gap: 16 },
  videoModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  videoModalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  videoModalIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFC700', justifyContent: 'center', alignItems: 'center' },
  videoModalTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.2 },
  videoModalSub: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  videoModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(148,163,184,0.15)', justifyContent: 'center', alignItems: 'center' },
  videoModalStage: { aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', gap: 10 },
  videoModalStageText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  videoModalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 12, gap: 8 },
  videoVerifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  videoVerifiedText: { fontSize: 9.5, fontWeight: '700', color: '#10B981' },
  videoOpenLink: { fontSize: 10.5, fontWeight: '900', color: '#FFC700' },
});